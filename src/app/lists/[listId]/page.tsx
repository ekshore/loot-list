import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { listItems } from "~/server/db/schema";
import { ListDetails } from "~/app/_components/list-details";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { auth } from "~/server/auth";

const MY_LISTS: string = "mylists" as const;
const ListPage = async ({
  params,
}: {
  params: Promise<{ listId: string }>;
}) => {
  const { listId } = await params;

  return (
    <>
      {MY_LISTS !== listId ? (
        <div className="flex flex-col justify-center">
          <div className="m-10 md:mx-20">
            <ListDetails listId={listId} />
            <ListView listId={listId} />
          </div>
        </div>
      ) : (
        <ListSplashPage />
      )}
    </>
  );
};

const ListView = async ({ listId }: { listId: string }) => {
  const lisItems = await db
    .select()
    .from(listItems)
    .where(eq(listItems.listId, listId));

  const items = [
    {
      listId: "1",
      id: "id-1",
      name: "Item 1",
      description: "This is a really cool item",
    },
    {
      listId: "2",
      id: "id-2",
      name: "Item 2",
      description: "This is a really cool item",
    },
    {
      listId: "3",
      id: "id-3",
      name: "Item 3",
      description: "This is a really cool item",
    },
  ];

  if (!items || items.length < 1) {
    return <h3 className="h-3">There are no items in this list</h3>;
  }

  const accordionItems = items.map((item) => {
    return (
      <AccordionItem value={item.id} key={item.id}>
        <AccordionTrigger>
          {item.name}
        </AccordionTrigger>
        <AccordionContent>{item.description}</AccordionContent>
      </AccordionItem>
    );
  });

  return (
    <div className="my-10">
      <Accordion type="single" collapsible className="w-full">
        {accordionItems}
      </Accordion>
    </div>
  );
};

const ListSplashPage = () => {
  return (
    <div className="flex items-center justify-center">
      <h1 className="text-6xl font-bold">This is where your lists will live</h1>
    </div>
  );
};

export default ListPage;
