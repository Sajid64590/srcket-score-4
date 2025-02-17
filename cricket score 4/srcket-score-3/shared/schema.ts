
import { pgTable, text, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const matchData = pgTable("match_data", {
  id: serial("id").primaryKey(),
  batsman: text("batsman").notNull(),
  bowler: text("bowler").notNull(),
  isOut: boolean("is_out").notNull(),
});

export const insertMatchDataSchema = createInsertSchema(matchData).pick({
  batsman: true,
  bowler: true,
  isOut: true,
});

export type InsertMatchData = z.infer<typeof insertMatchDataSchema>;
export type MatchData = typeof matchData.$inferSelect;

export const gridDataSchema = z.object({
  batsmen: z.array(z.string()).length(5),
  bowlers: z.array(z.string()).length(5), 
  outcomes: z.array(z.array(z.union([z.literal("out"), z.literal("not out"), z.literal("")]))).length(5).transform(arr => 
    arr.map(row => row.length === 5 ? row : [...row, ...Array(5 - row.length).fill("")])
  ),
});

export type GridData = z.infer<typeof gridDataSchema>;
