CREATE TABLE IF NOT EXISTS "lootlist_list_items" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"list_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(255),
	"date_purchased" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lootlist_lists" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"summary" varchar(255),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
DROP TABLE "lootlist_post";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lootlist_list_items" ADD CONSTRAINT "lootlist_list_items_list_id_lootlist_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."lootlist_lists"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lootlist_lists" ADD CONSTRAINT "lootlist_lists_user_id_lootlist_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."lootlist_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
