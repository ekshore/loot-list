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
import { lists } from "~/server/db/schema";
import { desc } from "drizzle-orm";

export default async function Home() {
  return (
    <main className="container m-auto min-h-screen border-x border-x-border">
      <div className="flex flex-col items-center">
        <h1 className="py-5 text-5xl font-bold">Ekstrand Family Lists</h1>
        <ListDisplay />
      </div>
    </main>
  );
}

const ListDisplay = async () => {
  "server";
  const wishLists = await db
    .select()
    .from(lists)
    .orderBy(desc(lists.updatedAt));

  const listCards = wishLists.map((list) => {
    const listUrl = `/mylists/${list.id}`;
    return (
      <Link key={list.id} href={listUrl} className="m-5">
        <Card className="flex h-60 w-72 flex-col">
          <CardHeader className="basis-1/4">
            <CardTitle>{list.name}</CardTitle>
          </CardHeader>
          <CardContent className="basis-2/4">
            <CardDescription>{list.summary}</CardDescription>
          </CardContent>
          <CardFooter className="basis-1/4">
            Last updated:&nbsp;
            <span className="text-xs text-muted-foreground">
              {list.createdAt.toLocaleDateString()}
            </span>
          </CardFooter>
        </Card>
      </Link>
    );
  });

  const session = await auth();
  if (session?.user) {
    listCards.push(
      <Link key="create-list" href="/" className="m-5">
        <Card className="flex h-60 w-72 items-center justify-center">
          <CardContent className="flex items-center justify-center p-0">
            <SquarePlus className="size-20 text-border" />
          </CardContent>
        </Card>
      </Link>,
    );
  }

  return <div className="grid grid-cols-3">{listCards}</div>;
};
