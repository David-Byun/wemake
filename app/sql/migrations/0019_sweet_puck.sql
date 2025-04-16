ALTER TABLE "message_room_members" ALTER COLUMN "message_room_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "message_room_members" ALTER COLUMN "profile_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "message_room_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "sender_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "message_room_members" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;