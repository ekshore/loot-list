import { ListDetails } from "~/app/_components/list-details";
import { fetchListItemsAction } from "~/server/actions";
import { auth } from "~/server/auth";
import { EditItemForm } from "~/app/_components/list-item-form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";

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
  const listItems = await fetchListItemsAction(listId);
  const session = await auth();

  if (!listItems || listItems.length < 1) {
    return <h3 className="my-10 h-3">There are no items in this list</h3>;
  }

  const itemCards = listItems.map((item) => {
    const editFormData = {
      name: item.name,
      description: item.description ?? "",
    };
    const editButton =
      session && session.user.id ? (
        <EditItemForm
          itemId={item.id}
          item={editFormData}
          className="ml-[-10] mr-2"
        />
      ) : (
        <></>
      );
    return (
      <AccordionItem value={item.id} key={item.id}>
        <AccordionTrigger className="ml-4">{item.name}</AccordionTrigger>
        <AccordionContent className="ml-4">
          <div>{item.description}</div>
          <div className="flex justify-end">{editButton}</div>
        </AccordionContent>
      </AccordionItem>
    );
  });

  return (
    <div className="flex flex-row justify-center">
      <Accordion type="single" collapsible className="my-16 w-full">
        {itemCards}
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
