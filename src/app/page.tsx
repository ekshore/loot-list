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
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  const session = await auth();

  const lists = [
    {
      id: "someId-1",
      userId: "someUserId",
      name: "Test List",
      summary: "This is a list for testing",
      createdAt: "2025-02-09 22:45:26.191893+00",
      updatedAt: "2025-02-09 22:45:26.191893+00",
    },
    {
      id: "someId-2",
      userId: "someUserId",
      name: "Test List",
      summary: "This is a list for testing",
      createdAt: "2025-02-09 22:45:26.191893+00",
      updatedAt: "2025-02-09 22:45:26.191893+00",
    },
    {
      id: "someId-3",
      userId: "someUserId",
      name: "Test List",
      summary: "This is a list for testing",
      createdAt: "2025-02-09 22:45:26.191893+00",
      updatedAt: "2025-02-09 22:45:26.191893+00",
    },
  ];

  const listCards = lists.map((list) => {
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
              {formatDate(list.createdAt)}
            </span>
          </CardFooter>
        </Card>
      </Link>
    );
  });

  listCards.push(
    <Link key="create-list" href="/" className="m-5">
      <Card className="flex items-center justify-center h-60 w-72">
        <CardContent className="p-0 flex items-center justify-center">
          <SquarePlus className="size-20 text-border"/>
        </CardContent>
      </Card>
    </Link>,
  );

  return (
    <HydrateClient>
      <main className="container m-auto min-h-screen border-x border-x-border">
        <div className="flex flex-col items-center">
          <h1 className="py-5 text-5xl font-bold">Ekstrand Family Lists</h1>
          <div className="grid grid-cols-3">{listCards}</div>
        </div>
      </main>
    </HydrateClient>
  );
}

const formatDate = (ts: String) => {
  const date = ts.substring(0, 10);
  const [year, month, day] = date.split("-");
  return `${month}/${day}/${year}`;
};
