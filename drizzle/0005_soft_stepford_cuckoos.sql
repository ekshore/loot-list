ALTER TABLE "lootlist_lists" ALTER COLUMN "summary" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "lootlist_lists" ALTER COLUMN "summary" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lootlist_lists" ADD COLUMN "public" boolean DEFAULT false;