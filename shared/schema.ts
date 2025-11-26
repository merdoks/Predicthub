import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const markets = pgTable("markets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorWallet: text("creator_wallet").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("Community"),
  tags: text("tags").array(),
  status: text("status").notNull().default("active"),
  endDate: timestamp("end_date").notNull(),
  totalVolume: decimal("total_volume", { precision: 18, scale: 8 }).notNull().default("0"),
  participants: integer("participants").notNull().default(0),
  winnerId: text("winner_id"),
  txHash: text("tx_hash"),
  resolutionMethod: text("resolution_method").default("Community Vote"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  // X tracking fields for auto-resolution
  xTargetUserId: text("x_target_user_id"),
  xTargetUsername: text("x_target_username"),
  xConditionType: text("x_condition_type"), // 'tweet_posted', 'tweet_count', etc.
  xMonitoringStatus: text("x_monitoring_status").default("inactive"), // 'inactive', 'active', 'blocked', 'resolved'
});

export const marketOptions = pgTable("market_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  marketId: varchar("market_id").notNull().references(() => markets.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  totalStaked: decimal("total_staked", { precision: 18, scale: 8 }).notNull().default("0"),
});

export const predictions = pgTable("predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  marketId: varchar("market_id").notNull().references(() => markets.id, { onDelete: "cascade" }),
  userWallet: text("user_wallet").notNull(),
  optionId: varchar("option_id").notNull().references(() => marketOptions.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  txHash: text("tx_hash"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Valid badge types
export const badgeTypes = ['early_adopter', 'x_verified', 'market_creator', 'top_predictor', 'volume_trader'] as const;

export const userBadges = pgTable("user_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userWallet: text("user_wallet").notNull(),
  badgeType: text("badge_type").notNull(), // Will be validated via Zod schema
  earnedAt: timestamp("earned_at").notNull().default(sql`now()`),
  metadata: text("metadata"), // Optional JSON data for badge details (e.g., X username)
});

export const xConnections = pgTable("x_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userWallet: text("user_wallet").notNull().unique(),
  xUserId: text("x_user_id").notNull(),
  xUsername: text("x_username").notNull(),
  xDisplayName: text("x_display_name"),
  xProfileImage: text("x_profile_image"),
  accessToken: text("access_token"), // OAuth 2.0 access token for API access
  refreshToken: text("refresh_token"), // For token refresh
  tokenExpiresAt: timestamp("token_expires_at"), // When the access token expires
  connectedAt: timestamp("connected_at").notNull().default(sql`now()`),
});

export const xMarketTracking = pgTable("x_market_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  marketId: varchar("market_id").notNull().references(() => markets.id, { onDelete: "cascade" }),
  xTargetUserId: text("x_target_user_id").notNull(),
  xTargetUsername: text("x_target_username").notNull(),
  lastCheckedTweetId: text("last_checked_tweet_id"),
  lastCheckedAt: timestamp("last_checked_at"),
  conditionType: text("condition_type").notNull(), // 'tweet_posted'
  monitoringStatus: text("monitoring_status").notNull().default("active"), // 'active', 'paused', 'resolved'
  retryCount: integer("retry_count").notNull().default(0),
  nextCheckAt: timestamp("next_check_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  resolvedAt: timestamp("resolved_at"),
  resolutionProof: text("resolution_proof"), // JSON: { tweetId, tweetUrl, timestamp }
});

export const marketProposals = pgTable("market_proposals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proposerWallet: text("proposer_wallet").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("Community"),
  tags: text("tags").array(),
  votes: integer("votes").notNull().default(0),
  status: text("status").notNull().default("proposed"), // 'proposed', 'created', 'rejected'
  marketId: varchar("market_id").references(() => markets.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const proposalVotes = pgTable("proposal_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proposalId: varchar("proposal_id").notNull().references(() => marketProposals.id, { onDelete: "cascade" }),
  voterWallet: text("voter_wallet").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  uniqueVote: unique().on(table.proposalId, table.voterWallet),
}));

export const insertMarketSchema = createInsertSchema(markets).pick({
  creatorWallet: true,
  title: true,
  description: true,
  category: true,
  tags: true,
  endDate: true,
  txHash: true,
  resolutionMethod: true,
});

export const insertMarketOptionSchema = createInsertSchema(marketOptions).pick({
  marketId: true,
  label: true,
});

export const insertPredictionSchema = createInsertSchema(predictions).pick({
  marketId: true,
  userWallet: true,
  optionId: true,
  amount: true,
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).pick({
  userWallet: true,
  badgeType: true,
  metadata: true,
}).extend({
  badgeType: z.enum(badgeTypes), // Enforce valid badge types
});

export const insertXConnectionSchema = createInsertSchema(xConnections).pick({
  userWallet: true,
  xUserId: true,
  xUsername: true,
  xDisplayName: true,
  xProfileImage: true,
  accessToken: true,
  refreshToken: true,
  tokenExpiresAt: true,
});

export const insertXMarketTrackingSchema = createInsertSchema(xMarketTracking).pick({
  marketId: true,
  xTargetUserId: true,
  xTargetUsername: true,
  conditionType: true,
  lastCheckedTweetId: true,
});

export const insertMarketProposalSchema = createInsertSchema(marketProposals).pick({
  proposerWallet: true,
  title: true,
  description: true,
  category: true,
  tags: true,
});

export const insertProposalVoteSchema = createInsertSchema(proposalVotes).pick({
  proposalId: true,
  voterWallet: true,
});

export type InsertMarket = z.infer<typeof insertMarketSchema>;
export type Market = typeof markets.$inferSelect;
export type MarketOption = typeof marketOptions.$inferSelect;
export type Prediction = typeof predictions.$inferSelect;
export type InsertMarketOption = z.infer<typeof insertMarketOptionSchema>;
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type XConnection = typeof xConnections.$inferSelect;
export type InsertXConnection = z.infer<typeof insertXConnectionSchema>;
export type XMarketTracking = typeof xMarketTracking.$inferSelect;
export type InsertXMarketTracking = z.infer<typeof insertXMarketTrackingSchema>;
export type MarketProposal = typeof marketProposals.$inferSelect;
export type InsertMarketProposal = z.infer<typeof insertMarketProposalSchema>;
export type ProposalVote = typeof proposalVotes.$inferSelect;
export type InsertProposalVote = z.infer<typeof insertProposalVoteSchema>;
