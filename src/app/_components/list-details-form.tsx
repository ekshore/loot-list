"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, UseFormReturn } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { listDetailsSchema } from "~/server/validators";
import {
  saveListDetailsAction,
  updateListDetailsAction,
} from "~/server/actions";
import { useToast } from "~/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { ReactNode, useState } from "react";

type ListDetails = z.infer<typeof listDetailsSchema>;

const ListDetailsForm = ({
  form,
}: {
  form: UseFormReturn<ListDetails, any, ListDetails>;
}) => {
  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>List Name</FormLabel>
            <FormControl>
              <Input placeholder="Cool List" {...field} />
            </FormControl>
            <FormDescription>This is the name of the list</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Input placeholder="What's this list for?" {...field} />
            </FormControl>
            <FormDescription>Tell people what this lists about</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="public"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Public</FormLabel>
              <FormDescription>
                Do you want other people to be able to view this list
              </FormDescription>
            </div>
          </FormItem>
        )}
      />
    </>
  );
};

const NewListDialog = ({ children }: { children: ReactNode }) => {
  const form = useForm<ListDetails>({
    resolver: zodResolver(listDetailsSchema),
    defaultValues: {
      name: "",
      description: "",
      public: false,
    },
  });

  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const onSubmit = async (values: ListDetails) => {
    console.log("Form Values: ", values);
    await saveListDetailsAction(values)
      .then((res) => {
        if (!res.success) {
          toast({
            variant: "destructive",
            title: "Oops, something went wrong",
            description: "New List failed to save",
          });
          return;
        }
        setOpen(false);
        router.push(`/lists/${res.data.id}`);
      })
      .catch((err) => {
        toast({
          variant: "destructive",
          title: "Oops, something went wrong",
          description: err,
        });
      });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Create New List</DialogTitle>
              <DialogDescription>
                Create a new list to share with people
              </DialogDescription>
              <ListDetailsForm form={form} />
              <DialogFooter className="mt-4">
                <Button type="submit">Save</Button>
              </DialogFooter>
            </DialogHeader>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const ListDetailsEditForm = ({
  listId,
  name,
  desc,
  isPublic,
  children,
}: {
  listId: string;
  name: string;
  desc: string;
  isPublic: boolean;
  children: ReactNode;
}) => {
  const form = useForm<z.infer<typeof listDetailsSchema>>({
    resolver: zodResolver(listDetailsSchema),
    defaultValues: {
      name: name,
      description: desc,
      public: isPublic,
    },
  });

  const router = useRouter();
  const [open, setOpen] = useState(false);

  const onSubmit = async (values: z.infer<typeof listDetailsSchema>) => {
    console.log(values);
    await updateListDetailsAction(listId, {
      name: values.name,
      description: values.description,
      public: values.public,
    });
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Edit List</DialogTitle>
              <DialogDescription>
                Make changes to this list
              </DialogDescription>
              <ListDetailsForm form={form} />
              <DialogFooter className="mt-4">
                <Button type="submit">Save</Button>
              </DialogFooter>
            </DialogHeader>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export { ListDetailsEditForm, NewListDialog };
