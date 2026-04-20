import { db } from "@/db";
import { decks } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const [deck] = await db
      .insert(decks)
      .values({
        userId,
        title,
        description,
      })
      .returning();

    return NextResponse.json(deck);
  } catch (error) {
    console.error("Error creating deck:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
