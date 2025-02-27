import { Pencil, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { auth } from "~/server/auth";
import { fetchListDetailsAction } from "~/server/actions";
import { ListDetailsEditForm } from "./list-details-form";

const ListDetails = async ({ listId }: { listId: string }) => {
  const listDetails = await fetchListDetailsAction(listId);

  if (!listDetails) {
    return (
      <div className="text-4xl font-bold text-destructive-foreground">
        Error fetching list details
      </div>
    );
  }
  const session = await auth();

  return (
    <div className="h-40">
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
        <div className="my-2 flex flex-row gap-4">
          <EditListDetails
            listId={listId}
            name={listDetails.name}
            desc={listDetails.description}
          />
          <Button variant="destructive">
            Delete <Trash2 />
          </Button>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

const EditListDetails = ({
  listId,
  name,
  desc,
}: {
  listId: string;
  name: string;
  desc: string;
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary">
          Edit <Pencil />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex flex-col">
          Edit List Details.
          <ListDetailsEditForm
            listId={listId}
            name={name}
            desc={desc}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};

export { ListDetails };
