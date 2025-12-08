import { pgTable, serial, text, integer, boolean } from "drizzle-orm/pg-core";

export const battles = pgTable("battles", {
  id: serial("id").primaryKey(),

  modelA: text("model_a").notNull(),
  modelB: text("model_b").notNull(),

  accuracyA: integer("accuracy_a").notNull(),
  accuracyB: integer("accuracy_b").notNull(),

  hitsA: integer("hits_a").notNull(),
  hitsB: integer("hits_b").notNull(),

  missesA: integer("misses_a").notNull(),
  missesB: integer("misses_b").notNull(),

  winner: text("winner").notNull(), 
});
