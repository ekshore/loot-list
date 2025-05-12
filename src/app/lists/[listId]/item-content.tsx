"use client";

import { CheckIcon, SquareArrowOutUpRightIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { EditItemForm } from "~/app/_components/list-item-form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import { ToastAction } from "~/components/ui/toast";
import { useToast } from "~/hooks/use-toast";
import {
  markItemAsPurchasedAction,
  removePurchasedDate,
} from "~/server/actions";

const ItemAccordian = ({
  listItems,
  isListOwner,
}: {
  listItems: {
    listId: string;
    id: string;
    name: string;
    description: string | null;
    datePurchased: Date | null;
    url: string | null;
  }[];
  isListOwner: boolean;
}) => {
  const items = listItems.map((item) => (
    <ItemShell item={item} isListOwner={isListOwner} key={item.id} />
  ));

  return (
    <Accordion type="single" collapsible className="my-16 w-full">
      {items}
    </Accordion>
  );
};

const ItemShell = ({
  item,
  isListOwner,
}: {
  item: {
    listId: string;
    id: string;
    name: string;
    description: string | null;
    datePurchased: Date | null;
    url: string | null;
  };
  isListOwner: boolean;
}) => {
  const [purchasedDate, setPurchasedDate] = useState(item.datePurchased);
  const checkStyle = purchasedDate ? "" : "hidden";
  const strikethrough = purchasedDate ? "line-through" : "";
  return (
    <AccordionItem value={item.id}>
      <AccordionTrigger className="ml-4">
        <div className={`flex flex-row ${strikethrough}`}>
          <div className="w-8">
            <CheckIcon className={checkStyle} />
          </div>{" "}
          {item.name}
        </div>
      </AccordionTrigger>
      <AccordionContent className="ml-4">
        <ItemContent
          item={item}
          isListOwner={isListOwner}
          setPurchasedDate={setPurchasedDate}
        />
      </AccordionContent>
    </AccordionItem>
  );
};

const ItemContent = ({
  item,
  isListOwner,
  setPurchasedDate,
}: {
  item: {
    listId: string;
    id: string;
    name: string;
    description: string | null;
    datePurchased: Date | null;
    url: string | null;
  };
  isListOwner: boolean;
  setPurchasedDate: Dispatch<SetStateAction<Date | null>>;
}) => {
  const { toast } = useToast();
  const editFormData = {
    name: item.name,
    description: item.description ?? "",
  };

  const undoMarkedForPurchase = async (itemId: string) => {
    await removePurchasedDate(itemId)
      .then((val) => {
        if (val.success) {
          setPurchasedDate(val.data);
        }
      })
      .catch(() => {
        toast({
          title: "Uh Oh, Something went wrong!",
          description: "Failed to unmark item as purchased",
          variant: "destructive",
        });
      });
  };

  const purchaseOnClick = async (itemId: string) => {
    await markItemAsPurchasedAction(itemId)
      .then((val) => {
        if (!val.success) {
          toast({
            title: "Uh Oh, Something went wrong!",
            description: "Failed to mark item as purchased",
            variant: "destructive",
          });
          return;
        }
        setPurchasedDate(val.data);
        toast({
          title: "Item Marked as purchased",
          description: `${item.name} has been marked as purchased`,
          action: (
            <ToastAction
              onClick={() => undoMarkedForPurchase(itemId)}
              altText="Unsure"
            >
              Undo
            </ToastAction>
          ),
        });
      })
      .catch(() => {
        toast({
          title: "Uh Oh, Something went wrong!",
          description: "Failed to mark item as purchased",
          variant: "destructive",
        });
      });
  };

  const editButton = isListOwner ? (
    <EditItemForm
      itemId={item.id}
      item={editFormData}
      className="ml-[-10] mr-2"
    />
  ) : (
    <></>
  );
  return (
    <div className="mx-8 my-4">
      <div className="flex flex-col">
        <div>{item.description}</div>
      </div>
      <div className="my-4 flex flex-row">
        <div className="flex flex-row">
          {item.url ? (
            <Link href={item.url} target="_blank">
              <Button className="mr-4" variant="secondary">
                View in Store <SquareArrowOutUpRightIcon />
              </Button>
            </Link>
          ) : (
            <></>
          )}
          <Button
            onClick={() => purchaseOnClick(item.id)}
            className=""
            disabled={item.datePurchased ? true : false}
          >
            Mark as Purchased
          </Button>
        </div>
        <div className="flex w-full justify-end">{editButton}</div>
      </div>
    </div>
  );
};

export { ItemAccordian };
