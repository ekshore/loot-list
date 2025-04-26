ALTER TABLE "lootlist_lists" ALTER COLUMN "public" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lootlist_list_items" ADD COLUMN "url" varchar(2000);