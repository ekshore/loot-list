/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
"use server";
import { auth } from "../auth";
import type { listDetailsSchema, itemSchema } from "~/server/validators";
import { lists, listItems, users } from "~/server/db/schema";
import { db } from "~/server/db";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import type { z } from "zod";

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

const fetchUserListsAction = async () => {
  const session = await auth();

  if (!session || !session.user) {
    console.log("fetchUserLists() - No user session denying request");
    return Promise.reject(FORBIDDEN_ERROR);
  }

  return await db
    .select()
    .from(lists)
    .where(eq(lists.userId, session.user.id))
    .orderBy(desc(lists.updatedAt));
};

const fetchPublicListsAction = async () => {
  return await db
    .select()
    .from(lists)
    .where(eq(lists.public, true))
    .orderBy(desc(lists.updatedAt));
};

const fetchSharedListsAction = async () => {
  const session = await auth();

  if (!session || !session.user) {
    console.log("fetchSharedLists() - No user session denying request");
    return Promise.reject(FORBIDDEN_ERROR);
  }

  return await db
    .select()
    .from(lists)
    .where(and(eq(lists.public, true), ne(lists.userId, session.user.id)))
    .orderBy(desc(lists.updatedAt));
};

const isListOwnerAction = async (listId: string) => {
  const session = await auth();
  if (!session || !session.user) {
    return false;
  }
  return await db
    .select({ ownerId: lists.userId })
    .from(lists)
    .where(eq(lists.id, listId))
    .limit(1)
    .then((val) => {
      if (!val || val.length !== 1) {
        return false;
      }
      if (val.pop()?.ownerId !== session.user.id) {
        return false;
      }
      return true;
    })
    .catch(() => false);
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
    return Promise.reject(FORBIDDEN_ERROR);
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
            message: "Insert Failed",
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
    return Promise.reject(UNAUTHORIZED_ERROR);
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
      console.log("updateListDetailsAction() - Error during update");
      console.log(err);
      return { success: false, error: { code: 500, message: "updateFailed" } };
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
      return { success: false, error: { code: 500, message: "Delete Failed" } };
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
      return { success: false, error: { code: 500, message: "Insert Failed" } };
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
      return { success: false, error: { code: 500, message: "Update Failed" } };
    });
};

const markItemAsPurchasedAction = async (
  itemId: string,
): Promise<ServerActionResult<Date>> => {
  return await db
    .update(listItems)
    .set({ datePurchased: sql`CURRENT_TIMESTAMP` })
    .where(eq(listItems.id, itemId))
    .returning({ datePurchased: listItems.datePurchased })
    .then((data): ServerActionResult<Date> => {
      if (data.length < 1) {
        console.log(
          "markItemAsPurchasedAction() - no values returned from update",
        );
        return {
          success: false,
          error: {
            code: 500,
            message: "No returned updated value",
          },
        };
      }
      if (data.length > 1) {
        console.log(
          "markItemAsPurchasedAction() - to many values returned from update",
        );
        return {
          success: false,
          error: {
            code: 500,
            message: "To many values returned from update",
          },
        };
      }
      const datePurchased = data.pop()?.datePurchased;
      if (!datePurchased) {
        return {
          success: false,
          error: {
            code: 500,
            message: "markItemAsPurchasedAction() - date returned was null",
          },
        };
      }
      return {
        success: true,
        data: datePurchased,
      };
    })
    .catch((err) => {
      console.log(
        "markItemAsPurchasedAction() - failed to mark item as purchase",
        err,
      );
      return {
        success: false,
        error: { code: 500, message: "Failed to mark item as purchased" },
      };
    });
};

const removePurchasedDate = async (
  itemId: string,
): Promise<ServerActionResult<null>> => {
  return await db
    .update(listItems)
    .set({ datePurchased: null })
    .where(eq(listItems.id, itemId))
    .then(() => NULL_SUCCESS)
    .catch((err) => {
      console.log("removePurchasedDate() - Failed to remove purchased date");
      console.log(err);
      return Promise.reject({
        success: false,
        error: {
          code: 500,
          message: "Remove Purchase Date Failed",
        },
      });
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
    !(await hasListAccess(parentList.id, session.user.id))
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
      console.log("deleteListItemAction() - Error during delete");
      console.log(err);
      return { success: false, error: { code: 500, message: "Delete Failed" } };
    });

  return NULL_SUCCESS;
};

export {
  fetchListDetailsAction,
  fetchUserListsAction,
  fetchPublicListsAction,
  fetchSharedListsAction,
  isListOwnerAction,
  saveListDetailsAction,
  updateListDetailsAction,
  deleteListAction,
  fetchListItemsAction,
  saveListItemAction,
  updateListItemAction,
  markItemAsPurchasedAction,
  removePurchasedDate,
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
