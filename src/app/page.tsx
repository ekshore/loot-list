import { SquarePlus } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { lists, users } from "~/server/db/schema";
import { eq, desc, or } from "drizzle-orm";
import { NewListDialog } from "./_components/list-details-form";

export default async function Home() {
  return (
    <>
      <div className="flex flex-col items-center">
        <h1 className="py-5 text-5xl font-bold">Your Lists</h1>
        <ListDisplay />
      </div>
    </>
  );
}

const ListDisplay = async () => {
  "server";
  const session = await auth();

  const wishLists = await db
    .select({
      id: lists.id,
      name: lists.name,
      author: users.name,
      summary: lists.summary,
      lastUpdate: lists.updatedAt,
    })
    .from(lists)
    .innerJoin(users, eq(users.id, lists.userId))
    .where(or(eq(users.id, session?.user.id ?? ""), eq(lists.public, true)))
    .orderBy(desc(lists.updatedAt));

  const listCards = wishLists.map((item) => {
    const listUrl = `/lists/${item.id}`;
    return (
      <Link key={item.id} href={listUrl} className="m-5">
        <Card className="flex h-60 w-72 flex-col">
          <CardHeader className="basis-1/4">
            <CardTitle>{item.name}</CardTitle>
            <CardDescription>Created by: {item.author}</CardDescription>
          </CardHeader>
          <CardContent className="basis-2/4">{item.summary}</CardContent>
          <CardFooter className="basis-1/4">
            Last updated:&nbsp;
            <span className="text-xs text-muted-foreground">
              {item.lastUpdate?.toLocaleDateString()}
            </span>
          </CardFooter>
        </Card>
      </Link>
    );
  });

  if (session?.user) {
    listCards.push(
      <NewListDialog key="newList">
        <Link key="create-list" href="/" className="m-5">
          <Card className="flex h-60 w-72 items-center justify-center">
            <CardContent className="flex items-center justify-center p-0">
              <SquarePlus className="size-20 text-border" />
            </CardContent>
          </Card>
        </Link>
      </NewListDialog>,
    );
  }

  return <div className="grid grid-cols-3">{listCards}</div>;
};
