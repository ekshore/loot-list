import { ListDetails } from "~/app/_components/list-details";
import { fetchListItemsAction, isListOwnerAction } from "~/server/actions";
import { ItemAccordian } from "./item-content";

const MY_LISTS: string = "mylists" as const;
const ListPage = async ({
  params,
}: {
  params: Promise<{ listId: string }>;
}) => {
  const { listId } = await params;
  const isListowner = await isListOwnerAction(listId);

  return (
    <>
      {MY_LISTS !== listId ? (
        <div className="flex flex-col justify-center">
          <div className="m-10 md:mx-20">
            <ListDetails listId={listId} />
            <ListView listId={listId} isListOwner={isListowner} />
          </div>
        </div>
      ) : (
        <ListSplashPage />
      )}
    </>
  );
};

const ListView = async ({ listId, isListOwner }: { listId: string, isListOwner: boolean }) => {
  const listItems = await fetchListItemsAction(listId);

  if (!listItems || listItems.length < 1) {
    return <h3 className="my-10 h-3">There are no items in this list</h3>;
  }
  return (
    <div className="flex flex-row justify-center">
      <ItemAccordian listItems={listItems} isListOwner={isListOwner}/>
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
