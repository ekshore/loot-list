"use server";
import { listDetailsSchema } from "~/server/validators";
import { lists, listItems, users } from "~/server/db/schema";
import { db } from "~/server/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

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

const fetchListItems = async (listId: string) => {
  return await db.select().from(listItems).where(eq(listItems.listId, listId));
};

export { fetchListDetailsAction, updateListDetailsAction, deleteListAction, fetchListItems };
