import { db } from "@/db";
import { decks } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const p = await params;
    const { title } = await req.json();

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const [updatedDeck] = await db
      .update(decks)
      .set({ title: title.trim() })
      .where(and(eq(decks.id, p.deckId), eq(decks.userId, userId)))
      .returning();

    if (!updatedDeck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    return NextResponse.json(updatedDeck);
  } catch (error) {
    console.error("Error updating deck:", error);
    return NextResponse.json({ error: "Failed to update deck" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const p = await params;

    const [deletedDeck] = await db
      .delete(decks)
      .where(and(eq(decks.id, p.deckId), eq(decks.userId, userId)))
      .returning();

    if (!deletedDeck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting deck:", error);
    return NextResponse.json({ error: "Failed to delete deck" }, { status: 500 });
  }
}
