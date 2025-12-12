import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  json,
  boolean,
  real,
} from "drizzle-orm/pg-core";

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

  createdAt: timestamp("created_at").defaultNow(),
});

// Track individual moves per battle for learning
export const battleMoves = pgTable("battle_moves", {
  id: serial("id").primaryKey(),
  battleId: integer("battle_id").notNull(),
  model: text("model").notNull(),
  moveNumber: integer("move_number").notNull(),
  row: integer("row").notNull(),
  col: integer("col").notNull(),
  hit: boolean("hit").notNull(),
  // Store context: previous hits that influenced this move
  previousHits: json("previous_hits").$type<{ row: number; col: number }[]>(),
  // Was this a strategic follow-up to a hit?
  wasFollowUp: boolean("was_follow_up").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Store learned strategies per model
export const modelStrategies = pgTable("model_strategies", {
  id: serial("id").primaryKey(),
  model: text("model").notNull(),
  // Pattern type: "hunt" (searching), "target" (following hits), "opening" (first moves)
  patternType: text("pattern_type").notNull(),
  // The pattern/strategy description
  pattern: json("pattern").$type<{
    description: string;
    successRate: number;
    sampleMoves: { row: number; col: number; hit: boolean }[];
  }>(),
  // How many times this pattern led to success
  successCount: integer("success_count").default(0),
  totalUses: integer("total_uses").default(0),
  // Effectiveness score (0-1)
  effectiveness: real("effectiveness").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Q-Learning values for reinforcement learning
export const modelQValues = pgTable("model_q_values", {
  id: serial("id").primaryKey(),
  model: text("model").notNull(),
  // State representation: "hunt_early:hits=0:active=0", "target_2hit_h:hits=5:active=2", etc.
  state: text("state").notNull(),
  // Action type: "center_focus", "checkerboard", "adjacent", "continue_direction"
  action: text("action").notNull(),
  // Q-value for this state-action pair
  qValue: real("q_value").default(0),
  // Number of times this state-action has been visited
  visitCount: integer("visit_count").default(0),
  // Model-specific hyperparameters
  learningRate: real("learning_rate").default(0.1),
  discountFactor: real("discount_factor").default(0.9),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Model hyperparameters configuration
export const modelHyperparameters = pgTable("model_hyperparameters", {
  id: serial("id").primaryKey(),
  model: text("model").notNull().unique(),
  learningRate: real("learning_rate").default(0.1),
  discountFactor: real("discount_factor").default(0.9),
  explorationRate: real("exploration_rate").default(0.15),
  updatedAt: timestamp("updated_at").defaultNow(),
});
