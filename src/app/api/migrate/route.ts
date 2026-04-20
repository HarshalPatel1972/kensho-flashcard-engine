import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rawUrl = process.env.DATABASE_URL!;
    const url = rawUrl.replace("-pooler", "");
    const sql = neon(url);

    await sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" text PRIMARY KEY NOT NULL,
        "email" text,
        "created_at" timestamp DEFAULT now()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "decks" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" text NOT NULL,
        "title" text NOT NULL,
        "description" text,
        "card_count" integer DEFAULT 0,
        "mastered_count" integer DEFAULT 0,
        "created_at" timestamp DEFAULT now(),
        "last_studied_at" timestamp
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "cards" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "deck_id" uuid NOT NULL,
        "front" text NOT NULL,
        "back" text NOT NULL,
        "created_at" timestamp DEFAULT now()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "card_progress" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "card_id" uuid NOT NULL,
        "user_id" text NOT NULL,
        "ease_factor" real DEFAULT 2.5,
        "interval" integer DEFAULT 1,
        "repetitions" integer DEFAULT 0,
        "due_date" timestamp DEFAULT now(),
        "last_reviewed_at" timestamp,
        "status" text DEFAULT 'new'
      );
    `;

    // Try to safely add unique constraints
    try {
      await sql`ALTER TABLE "card_progress" ADD CONSTRAINT "card_user_unique" UNIQUE("card_id","user_id");`;
    } catch (e) {
      // Ignore if exists
    }

    // Safely add foreign key constraints
    await sql`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'decks_user_id_users_id_fk') THEN
          ALTER TABLE "decks" ADD CONSTRAINT "decks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cards_deck_id_decks_id_fk') THEN
          ALTER TABLE "cards" ADD CONSTRAINT "cards_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE no action;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_progress_card_id_cards_id_fk') THEN
          ALTER TABLE "card_progress" ADD CONSTRAINT "card_progress_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_progress_user_id_users_id_fk') THEN
          ALTER TABLE "card_progress" ADD CONSTRAINT "card_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
        END IF;
      END $$;
    `;

    return NextResponse.json({ success: true, message: "Kensho Database Schema Successfully Migrated!" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
