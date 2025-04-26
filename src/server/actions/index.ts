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
    console.log("fetchUserLists() - No user session denying request");
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
    console.log("fetchSharedLists() - No user session denying request");
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
    console.log(
      "fetchListDetailsAction() - User is not authorized for this list denying request",
    );
    return Promise.reject(UNAUTHORIZED_ERROR);
  }
  return listDetails;
};

const saveListDetailsAction = async (
  values: z.infer<typeof listDetailsSchema>,
): Promise<ServerActionResult<{ id: string }>> => {
  const session = await auth();
  if (!session) {
    console.log("saveListDetailsAction() - No user session denying request");
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
          console.log(
            "saveListAction() - Nothing returned from insert rolling back transaction",
          );
          console.log(values);
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
          console.log(
            "saveListAction() - To many returns from list insert, rolling back transaction",
          );
          console.log(values);
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
        console.log("saveListAction() - Error occured during insert");
        console.log(err);
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
    console.log(
      "updateListDetailsAction() - User is unauthorized denying reqeust",
    );
    return Promise.reject();
  }

  return await db
    .update(lists)
    .set({
      name: values.name,
      summary: values.description,
      public: values.public,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(lists.id, listId))
    .then(() => NULL_SUCCESS)
    .catch((err) => {
      console.log("updateLIstDetailsAction() - Error during update");
      console.log(err);
      return { success: false, error: { code: 500, message: err } };
    });
};

const deleteListAction = async (
  listId: string,
): Promise<ServerActionResult<null>> => {
  const session = await auth();
  if (!session || !(await hasListAccess(listId, session.user.id))) {
    console.log("deleteListAction() - User is unauthorized denying request");
    return Promise.reject(FORBIDDEN_ERROR);
  }

  return db
    .transaction(async (tx) => {
      await tx.delete(listItems).where(eq(listItems.listId, listId));
      await tx.delete(lists).where(eq(lists.id, listId));
    })
    .then(() => NULL_SUCCESS)
    .catch((err) => {
      console.log("deleteListAction() - Error during delete");
      console.log(err);
      return { success: false, error: { code: 500, message: err } };
    });
};

// TODO: Add auth on this
const fetchListItemsAction = async (listId: string) => {
  return await db.select().from(listItems).where(eq(listItems.listId, listId));
};

const saveListItemAction = async (
  listId: string,
  values: z.infer<typeof itemSchema>,
): Promise<ServerActionResult<null>> => {
  const session = await auth();
  if (!session || !(await hasListAccess(listId, session.user.id))) {
    console.log("saveListItemAction() - User is unauthorized denying reqeust");
    return Promise.reject(FORBIDDEN_ERROR);
  }

  return await db
    .transaction(async (tx) => {
      await tx.insert(listItems).values({
        listId: listId,
        name: values.name,
        description: values.description,
        url: values.url,
      });
      await tx
        .update(lists)
        .set({ updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(lists.id, listId));
    })
    .then(() => NULL_SUCCESS)
    .catch((err) => {
      console.log("saveListItemAction() - Error during insert");
      console.log(err);
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
    console.log(
      "updateListDetailsAction() - User is unauthorized denying request",
    );
    return Promise.reject(FORBIDDEN_ERROR);
  }

  return await db
    .transaction(async (tx) => {
      await tx
        .update(listItems)
        .set({
          name: values.name,
          description: values.description,
          url: values.url && values.url.length > 1 ? values.url : undefined,
        })
        .where(eq(listItems.id, itemId));
      await tx
        .update(lists)
        .set({ updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(lists.id, parentList.id));
    })
    .then(() => NULL_SUCCESS)
    .catch((err) => {
      console.log("updateListItemAction() - Error during update");
      console.log(err);
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
    console.log(
      "deleteListItemAction() - User is unauthorized denying reqeust",
    );
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
      console.log("deleteLIstItemAction() - Error during delete");
      console.log(err);
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
    console.log("Access Granted");
    return true;
  } else {
    console.log("Access Denied");
    return false;
  }
};
