CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid DEFAULT gen_random_uuid(),
	"username" text NOT NULL,
	"avatar" text,
	"email" text,
	"tokenVersion" integer DEFAULT 1,
	"google_id" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
