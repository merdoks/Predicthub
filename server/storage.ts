import { 
  type Market, 
  type InsertMarket, 
  type MarketOption, 
  type InsertMarketOption,
  type Prediction,
  type InsertPrediction,
  type UserBadge,
  type InsertUserBadge,
  type XConnection,
  type InsertXConnection,
  type XMarketTracking,
  type InsertXMarketTracking,
  type MarketProposal,
  type InsertMarketProposal,
  type ProposalVote,
  type InsertProposalVote,
  markets,
  marketOptions,
  predictions,
  userBadges,
  xConnections,
  xMarketTracking,
  marketProposals,
  proposalVotes
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc, and } from "drizzle-orm";

// Custom error for duplicate votes
export class DuplicateVoteError extends Error {
  constructor(message: string = "You have already voted for this proposal") {
    super(message);
    this.name = "DuplicateVoteError";
  }
}

export interface IStorage {
  // Markets
  createMarket(market: InsertMarket, options: string[]): Promise<Market & { options: MarketOption[] }>;
  getMarkets(status?: 'active' | 'resolved'): Promise<Array<Market & { options: MarketOption[] }>>;
  getMarketById(id: string): Promise<(Market & { options: MarketOption[] }) | undefined>;
  resolveMarket(marketId: string, winnerId: string): Promise<void>;
  
  // Predictions
  createPrediction(prediction: InsertPrediction): Promise<Prediction>;
  getUserPredictions(wallet: string): Promise<Array<Prediction & { market: Market; option: MarketOption }>>;
  getMarketPredictions(marketId: string): Promise<Prediction[]>;
  
  // Stats
  getUserStats(wallet: string): Promise<{
    marketsJoined: number;
    wins: number;
    winRate: number;
    totalEarnings: number;
  }>;
  getLeaderboard(): Promise<Array<{
    wallet: string;
    marketsJoined: number;
    winRate: number;
    totalEarnings: number;
    accuracy: number;
  }>>;
  
  // Badges
  getUserBadges(wallet: string): Promise<UserBadge[]>;
  awardBadge(userWallet: string, badgeType: string, metadata?: string): Promise<UserBadge>;
  
  // X Connections
  getXConnection(wallet: string): Promise<XConnection | undefined>;
  createXConnection(connection: InsertXConnection): Promise<XConnection>;
  deleteXConnection(wallet: string): Promise<void>;

  // X Market Tracking
  createXMarketTracking(tracking: InsertXMarketTracking): Promise<XMarketTracking>;
  getActiveXMarketTrackings(): Promise<XMarketTracking[]>;
  updateXMarketTracking(marketId: string, updates: Partial<XMarketTracking>): Promise<void>;
  updateXMarketTrackingById(trackingId: string, updates: Partial<XMarketTracking>): Promise<void>;
  updateMarketXFields(marketId: string, xFields: {
    xTargetUserId?: string;
    xTargetUsername?: string;
    xConditionType?: string;
    xMonitoringStatus?: string;
  }): Promise<void>;

  // Market Proposals
  createProposal(proposal: InsertMarketProposal): Promise<MarketProposal>;
  getProposals(status?: 'proposed' | 'created' | 'rejected'): Promise<MarketProposal[]>;
  getProposalById(id: string): Promise<MarketProposal | undefined>;
  voteForProposal(proposalId: string, voterWallet: string): Promise<void>;
  unvoteForProposal(proposalId: string, voterWallet: string): Promise<void>;
  getUserProposalVote(proposalId: string, voterWallet: string): Promise<ProposalVote | undefined>;
  updateProposal(proposalId: string, updates: Partial<MarketProposal>): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createMarket(market: InsertMarket, optionLabels: string[]): Promise<Market & { options: MarketOption[] }> {
    const [newMarket] = await db.insert(markets).values(market).returning();
    
    const newOptions = await db.insert(marketOptions).values(
      optionLabels.map(label => ({
        marketId: newMarket.id,
        label,
      }))
    ).returning();
    
    return { ...newMarket, options: newOptions };
  }

  async getMarkets(status?: 'active' | 'resolved'): Promise<Array<Market & { options: MarketOption[] }>> {
    const query = status 
      ? db.select().from(markets).where(eq(markets.status, status)).orderBy(desc(markets.createdAt))
      : db.select().from(markets).orderBy(desc(markets.createdAt));
    
    const marketsList = await query;
    
    const marketsWithOptions = await Promise.all(
      marketsList.map(async (market: Market) => {
        const options = await db.select().from(marketOptions).where(eq(marketOptions.marketId, market.id));
        return { ...market, options };
      })
    );
    
    return marketsWithOptions;
  }

  async getMarketById(id: string): Promise<(Market & { options: MarketOption[] }) | undefined> {
    const [market] = await db.select().from(markets).where(eq(markets.id, id));
    if (!market) return undefined;
    
    const options = await db.select().from(marketOptions).where(eq(marketOptions.marketId, id));
    return { ...market, options };
  }

  async resolveMarket(marketId: string, winnerId: string): Promise<void> {
    await db.update(markets)
      .set({ status: 'resolved', winnerId })
      .where(eq(markets.id, marketId));
  }

  async createPrediction(prediction: InsertPrediction): Promise<Prediction> {
    const [newPrediction] = await db.insert(predictions).values(prediction).returning();
    
    await db.update(marketOptions)
      .set({ 
        totalStaked: sql`${marketOptions.totalStaked} + ${prediction.amount}` 
      })
      .where(eq(marketOptions.id, prediction.optionId));
    
    await db.update(markets)
      .set({ 
        totalVolume: sql`${markets.totalVolume} + ${prediction.amount}`,
        participants: sql`${markets.participants} + 1`
      })
      .where(eq(markets.id, prediction.marketId));
    
    return newPrediction;
  }

  async getUserPredictions(wallet: string): Promise<Array<Prediction & { market: Market; option: MarketOption }>> {
    const userPredictions = await db.select().from(predictions).where(eq(predictions.userWallet, wallet));
    
    const predictionsWithDetails = await Promise.all(
      userPredictions.map(async (pred: Prediction) => {
        const [market] = await db.select().from(markets).where(eq(markets.id, pred.marketId));
        const [option] = await db.select().from(marketOptions).where(eq(marketOptions.id, pred.optionId));
        return { ...pred, market, option };
      })
    );
    
    return predictionsWithDetails;
  }

  async getMarketPredictions(marketId: string): Promise<Prediction[]> {
    return db.select().from(predictions).where(eq(predictions.marketId, marketId));
  }

  async getUserStats(wallet: string): Promise<{
    marketsJoined: number;
    wins: number;
    winRate: number;
    totalEarnings: number;
  }> {
    const userPredictions = await this.getUserPredictions(wallet);
    const marketsJoined = userPredictions.length;
    
    const wins = userPredictions.filter(pred => 
      pred.market.winnerId === pred.optionId
    ).length;
    
    const winRate = marketsJoined > 0 ? Math.round((wins / marketsJoined) * 100) : 0;
    
    const totalEarnings = userPredictions.reduce((sum, pred) => {
      if (pred.market.winnerId === pred.optionId) {
        return sum + parseFloat(pred.amount) * 1.5;
      }
      return sum;
    }, 0);
    
    return { marketsJoined, wins, winRate, totalEarnings: Math.round(totalEarnings) };
  }

  async getLeaderboard(): Promise<Array<{
    wallet: string;
    marketsJoined: number;
    winRate: number;
    totalEarnings: number;
    accuracy: number;
  }>> {
    const allPredictions = await db.select().from(predictions);
    
    const walletMap = new Map<string, {
      predictions: Array<Prediction & { market: Market }>;
    }>();
    
    for (const pred of allPredictions) {
      const [market] = await db.select().from(markets).where(eq(markets.id, pred.marketId));
      
      if (!walletMap.has(pred.userWallet)) {
        walletMap.set(pred.userWallet, { predictions: [] });
      }
      walletMap.get(pred.userWallet)!.predictions.push({ ...pred, market });
    }
    
    const leaderboard = Array.from(walletMap.entries()).map(([wallet, data]) => {
      const marketsJoined = data.predictions.length;
      const wins = data.predictions.filter(p => p.market.winnerId === p.optionId).length;
      const winRate = marketsJoined > 0 ? Math.round((wins / marketsJoined) * 100) : 0;
      const totalEarnings = data.predictions.reduce((sum, p) => {
        if (p.market.winnerId === p.optionId) {
          return sum + parseFloat(p.amount) * 1.5;
        }
        return sum;
      }, 0);
      
      return {
        wallet,
        marketsJoined,
        winRate,
        totalEarnings: Math.round(totalEarnings),
        accuracy: winRate
      };
    });
    
    return leaderboard
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .slice(0, 10);
  }

  async getUserBadges(wallet: string): Promise<UserBadge[]> {
    return await db.select().from(userBadges).where(eq(userBadges.userWallet, wallet));
  }

  async awardBadge(userWallet: string, badgeType: string, metadata?: string): Promise<UserBadge> {
    // Check if user already has this badge
    const existing = await db.select().from(userBadges)
      .where(and(
        eq(userBadges.userWallet, userWallet),
        eq(userBadges.badgeType, badgeType)
      ));
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const [badge] = await db.insert(userBadges).values({
      userWallet,
      badgeType,
      metadata: metadata || null,
    }).returning();
    
    return badge;
  }

  async getXConnection(wallet: string): Promise<XConnection | undefined> {
    const [connection] = await db.select().from(xConnections).where(eq(xConnections.userWallet, wallet));
    return connection;
  }

  async createXConnection(connection: InsertXConnection): Promise<XConnection> {
    const [newConnection] = await db.insert(xConnections).values(connection).returning();
    return newConnection;
  }

  async deleteXConnection(wallet: string): Promise<void> {
    await db.delete(xConnections).where(eq(xConnections.userWallet, wallet));
  }

  async createXMarketTracking(tracking: InsertXMarketTracking): Promise<XMarketTracking> {
    const [newTracking] = await db.insert(xMarketTracking).values(tracking).returning();
    return newTracking;
  }

  async getActiveXMarketTrackings(): Promise<XMarketTracking[]> {
    return await db.select().from(xMarketTracking)
      .where(eq(xMarketTracking.monitoringStatus, 'active'));
  }

  async updateXMarketTracking(marketId: string, updates: Partial<XMarketTracking>): Promise<void> {
    await db.update(xMarketTracking)
      .set(updates)
      .where(eq(xMarketTracking.marketId, marketId));
  }

  async updateXMarketTrackingById(trackingId: string, updates: Partial<XMarketTracking>): Promise<void> {
    await db.update(xMarketTracking)
      .set(updates)
      .where(eq(xMarketTracking.id, trackingId));
  }

  async updateMarketXFields(marketId: string, xFields: {
    xTargetUserId?: string;
    xTargetUsername?: string;
    xConditionType?: string;
    xMonitoringStatus?: string;
  }): Promise<void> {
    await db.update(markets)
      .set(xFields)
      .where(eq(markets.id, marketId));
  }

  async createProposal(proposal: InsertMarketProposal): Promise<MarketProposal> {
    const [newProposal] = await db.insert(marketProposals).values(proposal).returning();
    return newProposal;
  }

  async getProposals(status?: 'proposed' | 'created' | 'rejected'): Promise<MarketProposal[]> {
    const query = status
      ? db.select().from(marketProposals).where(eq(marketProposals.status, status)).orderBy(desc(marketProposals.votes), desc(marketProposals.createdAt))
      : db.select().from(marketProposals).orderBy(desc(marketProposals.votes), desc(marketProposals.createdAt));
    
    return await query;
  }

  async getProposalById(id: string): Promise<MarketProposal | undefined> {
    const [proposal] = await db.select().from(marketProposals).where(eq(marketProposals.id, id));
    return proposal;
  }

  async voteForProposal(proposalId: string, voterWallet: string): Promise<void> {
    try {
      // Add vote - let the database unique constraint handle duplicate detection
      await db.insert(proposalVotes).values({
        proposalId,
        voterWallet,
      });
      
      // Increment vote count only if insert succeeded
      await db.update(marketProposals)
        .set({ votes: sql`${marketProposals.votes} + 1` })
        .where(eq(marketProposals.id, proposalId));
    } catch (error: any) {
      // Check if it's a unique constraint violation (Postgres error code 23505)
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
        throw new DuplicateVoteError();
      }
      throw error;
    }
  }

  async unvoteForProposal(proposalId: string, voterWallet: string): Promise<void> {
    // Remove vote
    const deleted = await db.delete(proposalVotes)
      .where(and(
        eq(proposalVotes.proposalId, proposalId),
        eq(proposalVotes.voterWallet, voterWallet)
      ))
      .returning();
    
    // Decrement vote count if vote was deleted
    if (deleted.length > 0) {
      await db.update(marketProposals)
        .set({ votes: sql`${marketProposals.votes} - 1` })
        .where(eq(marketProposals.id, proposalId));
    }
  }

  async getUserProposalVote(proposalId: string, voterWallet: string): Promise<ProposalVote | undefined> {
    const [vote] = await db.select().from(proposalVotes)
      .where(and(
        eq(proposalVotes.proposalId, proposalId),
        eq(proposalVotes.voterWallet, voterWallet)
      ));
    return vote;
  }

  async updateProposal(proposalId: string, updates: Partial<MarketProposal>): Promise<void> {
    await db.update(marketProposals)
      .set(updates)
      .where(eq(marketProposals.id, proposalId));
  }
}

export const storage = new DatabaseStorage();
