import Link from "next/link";
import { Separator } from "~/components/ui/separator";
import React from "react";
import { auth } from "~/server/auth";

import { NewListDialog } from "~/app/_components/list-details-form";
import { PlusIcon } from "lucide-react";
import {
  fetchPublicLists,
  fetchSharedLists,
  fetchUserLists,
} from "~/server/actions";
import { List } from "~/server/db/schema";

export default async function ListsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ listId: string | undefined }>;
}) {
  "server";
  const session = await auth();
  const { myLists, sharedLists } = await fetchLists();
  const { listId } = await params;

  return (
    <div className="flex flex-row">
      <div className="min-h-screen flex-col border-r border-r-border sm:hidden md:flex md:basis-1/5">
        {myLists ? (
          <>
            <h2 className="m-4 text-xl font-bold">Your Lists</h2>
            <ul>
              {displayLists(myLists, listId)}
              {session && session.user ? <NewList /> : <></>}
            </ul>
          </>
        ) : (
          <></>
        )}
        {sharedLists && sharedLists.length > 0 ? (
          <>
            <Separator />
            <h2 className="m-4 text-xl font-bold">Shared Lists</h2>
            <ul>{displayLists(sharedLists, listId)}</ul>
          </>
        ) : (
          <></>
        )}
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
}

const fetchLists = async () => {
  const session = await auth();
  if (session) {
    const usersLists = await fetchUserLists();
    // TODO This will be replaced with lists that have been shared between users.
    const sharedLists = await fetchSharedLists();
    return { myLists: usersLists, sharedLists: sharedLists };
  } else {
    const allLists = await fetchPublicLists();
    return { myLists: null, sharedLists: allLists };
  }
};

const displayLists = (lists: List[], selectedList?: string) => {
  return lists.map((item) => {
    const listUrl = `/lists/${item.id}`;
    const itemStyle = `hover:bg-primary hover:text-primary-foreground ${item.id === selectedList ? "bg-secondary" : ""}`;
    return (
      <li className={itemStyle} key={item.id}>
        <Link href={listUrl}>
          <Separator />
          <div className="py-4">
            <span className="m-4">{item.name}</span>
          </div>
        </Link>
      </li>
    );
  });
};

const NewList = () => {
  return (
    <li
      className="bg-primary text-primary-foreground hover:bg-primary/80"
      key="NewList"
    >
      <NewListDialog>
        <Link href="">
          <Separator />
          <div className="py-4">
            <span className="m-4">
              Create List <PlusIcon className="inline pb-1" size="20px" />
            </span>
          </div>
        </Link>
      </NewListDialog>
    </li>
  );
};
