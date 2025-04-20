"use client";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { deleteListAction } from "~/server/actions";
import { ListDetailsEditForm } from "./list-details-form";
import { NewItemDialog } from "./list-item-form";
import { useRouter } from "next/navigation";

const OwnerActions = ({
  listId,
  name,
  desc,
  isPublic,
}: {
  listId: string;
  name: string;
  desc: string;
  isPublic: boolean;
}) => {
  const router = useRouter();
  const handleDeleteList = async () => {
    await deleteListAction(listId);
    router.replace("/lists/mylists");
  };
  return (
    <div className="my-2 flex flex-row gap-4">
      <EditListDetails listId={listId} name={name} desc={desc} isPublic={isPublic}/>
      <Button type="button" variant="destructive" onClick={handleDeleteList}>
        Delete <Trash2 />
      </Button>
      <div className="flex flex-1 justify-end">
        <NewItemDialog listId={listId} />
      </div>
    </div>
  );
};

const EditListDetails = ({
  listId,
  name,
  desc,
  isPublic,
}: {
  listId: string;
  name: string;
  desc: string;
  isPublic: boolean;
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
          <ListDetailsEditForm listId={listId} name={name} desc={desc} isPublic={isPublic}/>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export { OwnerActions };
