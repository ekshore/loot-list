"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PopoverClose } from "@radix-ui/react-popover";
import { useForm } from "react-hook-form";
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
import { updateListDetailsAction } from "~/server/actions";

const ListDetailsEditForm = ({
  listId,
  name,
  desc,
}: {
  listId: string;
  name: string;
  desc: string;
}) => {
  const form = useForm<z.infer<typeof listDetailsSchema>>({
    resolver: zodResolver(listDetailsSchema),
    defaultValues: {
      name: name,
      description: desc,
    },
  });

  const router = useRouter();

  const onSubmit = async (values: z.infer<typeof listDetailsSchema>) => {
    console.log(values);
    await updateListDetailsAction(listId, {
      name: values.name,
      description: values.description,
    });
    router.refresh();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
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
              <FormDescription>
                Tell people what this lists about
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <PopoverClose
          type="submit"
          className="mt-2 h-10 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Save
        </PopoverClose>
      </form>
    </Form>
  );
};

export { ListDetailsEditForm };
