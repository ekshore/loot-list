"use server";
import { auth } from "../auth";
import { listDetailsSchema, newItemSchema } from "~/server/validators";
import { lists, listItems, users } from "~/server/db/schema";
import { db } from "~/server/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

type ServerActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: ServerActionError };

type ServerActionError = { code: number; message: string };

const fetchListDetailsAction = async (listId: string) => {
  const listDetails = (
    await db
      .select({
        name: lists.name,
        description: lists.summary,
        updated: lists.updatedAt,
        owner: users.name,
        userId: users.id,
      })
      .from(lists)
      .innerJoin(users, eq(users.id, lists.userId))
      .where(eq(lists.id, listId))
  ).pop();
  return listDetails;
};

const updateListDetailsAction = async (
  listId: string,
  values: z.infer<typeof listDetailsSchema>,
) => {
  console.log(
    `Updating list id: ${listId} with the following info: { name: ${values.name}, desc: ${values.description} }`,
  );
  await db
    .update(lists)
    .set({ name: values.name, summary: values.description })
    .where(eq(lists.id, listId));
};

const deleteListAction = async (listId: string) => {
  await db.delete(lists).where(eq(lists.id, listId));
  await db.delete(listItems).where(eq(listItems.listId, listId));
};

const fetchListItemsAction = async (listId: string) => {
  return await db.select().from(listItems).where(eq(listItems.listId, listId));
};

const saveListItemAction = async (
  listId: string,
  values: z.infer<typeof newItemSchema>,
): Promise<ServerActionResult<null>> => {
  const session = await auth();
  if (!session || !hasListAccess(listId, session.user.id)) {
      return Promise.reject({ code: 403, message: "Forbidden"});
  }
  await db.insert(listItems).values({
    listId: listId,
    name: values.name,
    description: values.description,
  });
  return { success: true, data: null };
};

export {
  fetchListDetailsAction,
  updateListDetailsAction,
  deleteListAction,
  fetchListItemsAction,
  saveListItemAction,
};

const hasListAccess = async (listId: string, userId: string) => {
  const list = (
    await db
      .select({ id: lists.id, userId: lists.userId })
      .from(lists)
      .where(eq(lists.id, userId))
  ).pop();
  if (list && list.userId === userId) {
    return true;
  } else {
    return false;
  }
};
