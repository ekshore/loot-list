import { OwnerActions } from "./list-owner-actions";
import { auth } from "~/server/auth";
import { fetchListDetailsAction } from "~/server/actions";

const ListDetails = async ({ listId }: { listId: string }) => {
  const listDetails = await fetchListDetailsAction(listId);

  if (!listDetails) {
    return (
      <div className="my-4 text-4xl font-bold text-destructive-foreground">
        Error fetching list details
      </div>
    );
  }
  const session = await auth();

  return (
    <div className="my-4 h-40">
      <p className="my-4 text-4xl font-bold">{listDetails.name}</p>
      <p className="my-2 text-xl">{listDetails.description}</p>
      <p className="font-light italic">List owner: {listDetails.owner}</p>
      {listDetails.updated ? (
        <p className="font-light italic">
          Last updated: {listDetails.updated.toLocaleDateString()}
        </p>
      ) : (
        <></>
      )}
      {session && session.user.id === listDetails.userId ? (
        <OwnerActions
          listId={listId}
          name={listDetails.name}
          desc={listDetails.description}
          isPublic={listDetails.public}
        />
      ) : (
        <></>
      )}
    </div>
  );
};

export { ListDetails };
