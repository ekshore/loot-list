import { ListDetails } from "~/app/_components/list-details";
import { fetchListItemsAction } from "~/server/actions";
import { auth } from "~/server/auth";
import { EditItemForm } from "~/app/_components/list-item-form";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

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
    const formData = {
      name: item.name,
      description: item.description ?? "",
    };
    return (
      <Card key={item.id}>
        <CardHeader>
          <CardTitle>{item.name}</CardTitle>
        </CardHeader>
        <CardContent className="h-52">{item.description}</CardContent>
        <CardFooter>
          {session && session.user ? (
            <EditItemForm itemId={item.id} item={formData} />
          ) : (
            <></>
          )}
        </CardFooter>
      </Card>
    );
  });

  return <div className="my-16 grid grid-cols-3 gap-6">{itemCards}</div>;
};

const ListSplashPage = () => {
  return (
    <div className="flex items-center justify-center">
      <h1 className="text-6xl font-bold">This is where your lists will live</h1>
    </div>
  );
};

export default ListPage;
