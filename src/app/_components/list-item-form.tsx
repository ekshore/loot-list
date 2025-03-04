"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { newItemSchema } from "~/server/validators";
import {
  saveListItemAction,
  updateListItemAction,
  deleteListItemAction,
} from "~/server/actions";

type Item = z.infer<typeof newItemSchema>;

const ItemForm = ({
  form,
}: {
  form: UseFormReturn<Item, any, undefined>;
}) => {
  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem className="my-4">
            <FormLabel>Item Name</FormLabel>
            <FormControl>
              <Input placeholder="Name" {...field} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Item Description</FormLabel>
            <FormControl>
              <Textarea placeholder="I want this item because" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

const NewItemForm = ({ listId }: { listId: string }) => {
  const form = useForm<Item>({
    resolver: zodResolver(newItemSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const router = useRouter();
  const [open, setOpen] = useState(false);

  const onSubmit = async (values: Item) => {
    console.log(values);
    await saveListItemAction(listId, values)
      .then(() => {
        setOpen(false);
        form.reset();
        router.refresh();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          New Item <PlusIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>New List Item</DialogTitle>
              <DialogDescription>
                Enter a new item for the wishlist and click save when done.
              </DialogDescription>
            </DialogHeader>
            <ItemForm form={form} onSubmit={onSubmit} />
            <DialogFooter className="mt-4">
              <Button type="submit">
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const EditItemForm = ({ itemId, item }: { itemId: string; item: Item }) => {
  const form = useForm<Item>({
    resolver: zodResolver(newItemSchema),
    defaultValues: {
      name: item.name,
      description: item.description,
    },
  });

  const router = useRouter();
  const [open, setOpen] = useState(false);

  const onSubmit = async (values: Item) => {
    console.log(values);
    await updateListItemAction(itemId, values)
      .then(() => {
        console.log("Values updated successfully");
        setOpen(false);
        router.refresh();
      })
      .catch((error) => console.log(error));
  };

  const deleteItem = async () => {
    await deleteListItemAction(itemId)
      .then(() => {
        setOpen(false);
        router.refresh();
      })
      .catch((error) => console.log(error));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          Edit <PencilIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Edit List Item</DialogTitle>
              <DialogDescription>Update this item</DialogDescription>
            </DialogHeader>
            <ItemForm form={form} onSubmit={onSubmit} />
            <DialogFooter className="mt-4">
              <Button type="submit">Save</Button>
              <Button variant="destructive" onClick={deleteItem}>
                Delete
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
export { EditItemForm, NewItemForm };
