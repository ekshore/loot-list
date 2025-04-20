"use server";
import { auth } from "../auth";
import { listDetailsSchema, itemSchema } from "~/server/validators";
import { lists, listItems, users } from "~/server/db/schema";
import { db } from "~/server/db";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";

type ServerActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: ServerActionError };

type ServerActionError = { code: number; message: string };

const FORBIDDEN_ERROR: ServerActionError = {
  code: 403,
  message: "FORBIDDEN",
} as const;
const NULL_SUCCESS: ServerActionResult<null> = {
  success: true,
  data: null,
} as const;
const UNAUTHORIZED_ERROR: ServerActionError = {
  code: 401,
  message: "UNAUTHORIZED",
} as const;

const fetchUserLists = async () => {
  const session = await auth();

  if (!session || !session.user) {
    return Promise.reject("No User Session, FORBIDDEN");
  }

  return await db
    .select()
    .from(lists)
    .where(eq(lists.userId, session.user.id))
    .orderBy(desc(lists.updatedAt));
};

const fetchPublicLists = async () => {
  return await db
    .select()
    .from(lists)
    .where(eq(lists.public, true))
    .orderBy(desc(lists.updatedAt));
};

const fetchSharedLists = async () => {
  const session = await auth();

  if (!session || !session.user) {
    return Promise.reject("No User Session, FORBIDDEN");
  }

  return await db
    .select()
    .from(lists)
    .where(and(eq(lists.public, true), ne(lists.userId, session.user.id)))
    .orderBy(desc(lists.updatedAt));
};

const fetchListDetailsAction = async (listId: string) => {
  const session = await auth();

  const listDetails = (
    await db
      .select({
        name: lists.name,
        description: lists.summary,
        updated: lists.updatedAt,
        owner: users.name,
        userId: users.id,
        public: lists.public,
      })
      .from(lists)
      .innerJoin(users, eq(users.id, lists.userId))
      .where(eq(lists.id, listId))
  ).pop();

  if (
    !listDetails ||
    (!listDetails.public && listDetails.userId !== session?.user.id)
  ) {
    return Promise.reject(UNAUTHORIZED_ERROR);
  }
  return listDetails;
};

const saveListDetailsAction = async (
  values: z.infer<typeof listDetailsSchema>,
): Promise<ServerActionResult<{ id: string }>> => {
  const session = await auth();
  if (!session) {
    return Promise.reject();
  }

  return await db.transaction(async (tx) => {
    return await tx
      .insert(lists)
      .values({
        name: values.name,
        summary: values.description,
        userId: session.user.id,
        public: values.public,
      })
      .returning()
      .then((val): ServerActionResult<{ id: string }> => {
        if (val.length < 1) {
          tx.rollback();
          return {
            success: false,
            error: {
              code: 500,
              message: "Nothing returned from list insert",
            },
          };
        }
        if (val.length > 1) {
          tx.rollback();
          return {
            success: false,
            error: {
              code: 500,
              message: "To many returns from list insert",
            },
          };
        }

        const list = val.pop();
        return {
          success: true,
          data: { id: list!.id },
        };
      })
      .catch((err) => {
        return {
          success: false,
          error: {
            code: 500,
            message: err,
          },
        };
      });
  });
};

const updateListDetailsAction = async (
  listId: string,
  values: z.infer<typeof listDetailsSchema>,
): Promise<ServerActionResult<null>> => {
  const session = await auth();
  if (!session || !(await hasListAccess(listId, session.user.id))) {
    return Promise.reject();
  }

  return await db
    .update(lists)
    .set({
      name: values.name,
      summary: values.description,
      public: values.public,
    })
    .where(eq(lists.id, listId))
    .then(() => NULL_SUCCESS)
    .catch((err) => {
      return { success: false, error: { code: 500, message: err } };
    });
};

const deleteListAction = async (
  listId: string,
): Promise<ServerActionResult<null>> => {
  const session = await auth();
  if (!session || !(await hasListAccess(listId, session.user.id))) {
    return Promise.reject(FORBIDDEN_ERROR);
  }

  return db
    .transaction(async (tx) => {
      await tx.delete(listItems).where(eq(listItems.listId, listId));
      await tx.delete(lists).where(eq(lists.id, listId));
    })
    .then(() => NULL_SUCCESS)
    .catch((err) => {
      return { success: false, error: { code: 500, message: err } };
    });
};

const fetchListItemsAction = async (listId: string) => {
  return await db.select().from(listItems).where(eq(listItems.listId, listId));
};

const saveListItemAction = async (
  listId: string,
  values: z.infer<typeof itemSchema>,
): Promise<ServerActionResult<null>> => {
  const session = await auth();
  if (!session || !(await hasListAccess(listId, session.user.id))) {
    return Promise.reject(FORBIDDEN_ERROR);
  }

  return await db
    .transaction(async (tx) => {
      await tx.insert(listItems).values({
        listId: listId,
        name: values.name,
        description: values.description,
      });
      await tx
        .update(lists)
        .set({ updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(lists.id, listId));
    })
    .then(() => NULL_SUCCESS)
    .catch((err) => {
      return { success: false, error: { code: 500, message: err } };
    });
};

const updateListItemAction = async (
  itemId: string,
  values: z.infer<typeof itemSchema>,
): Promise<ServerActionResult<null>> => {
  const session = await auth();
  const parentList = (
    await db
      .select({ id: listItems.id })
      .from(listItems)
      .where(eq(listItems.id, itemId))
  ).pop();

  if (
    !session ||
    !parentList ||
    !(await hasListAccess(parentList.id, session.user.id))
  ) {
    return Promise.reject(FORBIDDEN_ERROR);
  }

  return await db
    .transaction(async (tx) => {
      await tx
        .update(listItems)
        .set({ name: values.name, description: values.description })
        .where(eq(listItems.id, itemId));
      await tx
        .update(lists)
        .set({ updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(lists.id, parentList.id));
    })
    .then(() => NULL_SUCCESS)
    .catch((err) => {
      return { success: false, error: { code: 500, message: err } };
    });
};

const deleteListItemAction = async (
  itemId: string,
): Promise<ServerActionResult<null>> => {
  const session = await auth();
  const parentList = (
    await db
      .select({ id: listItems.listId })
      .from(listItems)
      .where(eq(listItems.id, itemId))
  ).pop();

  if (
    !session ||
    !parentList ||
    !hasListAccess(parentList.id, session.user.id)
  ) {
    return Promise.reject(FORBIDDEN_ERROR);
  }

  db.transaction(async (tx) => {
    await tx.delete(listItems).where(eq(listItems.id, itemId));
    await tx
      .update(lists)
      .set({ updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(lists.id, parentList.id));
  })
    .then(() => NULL_SUCCESS)
    .catch((err) => {
      return { success: false, error: { code: 500, message: err } };
    });

  return NULL_SUCCESS;
};

export {
  fetchListDetailsAction,
  fetchUserLists,
  fetchPublicLists,
  fetchSharedLists,
  saveListDetailsAction,
  updateListDetailsAction,
  deleteListAction,
  fetchListItemsAction,
  saveListItemAction,
  updateListItemAction,
  deleteListItemAction,
};

const hasListAccess = async (listId: string, userId: string) => {
  const list = (
    await db
      .select({ id: lists.id, userId: lists.userId })
      .from(lists)
      .where(eq(lists.userId, userId))
  ).pop();
  console.log(
    `Checking access for list: ${listId}, userId for list is: ${list?.userId}`,
  );
  if (list && list.userId === userId) {
    return true;
  } else {
    return false;
  }
};
