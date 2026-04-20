import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  real,
  unique,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const decks = pgTable("decks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  cardCount: integer("card_count").default(0),
  masteredCount: integer("mastered_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  lastStudiedAt: timestamp("last_studied_at"),
});

export const cards = pgTable("cards", {
  id: uuid("id").defaultRandom().primaryKey(),
  deckId: uuid("deck_id")
    .notNull()
    .references(() => decks.id, { onDelete: "cascade" }),
  front: text("front").notNull(),
  back: text("back").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cardProgress = pgTable(
  "card_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    easeFactor: real("ease_factor").default(2.5),
    interval: integer("interval").default(1),
    repetitions: integer("repetitions").default(0),
    dueDate: timestamp("due_date").defaultNow(),
    lastReviewedAt: timestamp("last_reviewed_at"),
    status: text("status").default("new"),
  },
  (table) => [unique("card_user_unique").on(table.cardId, table.userId)]
);
