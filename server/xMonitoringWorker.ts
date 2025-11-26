import { storage } from "./storage";
import { checkUserTweets, evaluateMarketCondition } from "./xMonitoringService";
import type { Market } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { markets, marketOptions } from "@shared/schema";

// Poll interval in milliseconds (5 minutes)
const POLL_INTERVAL = 5 * 60 * 1000;

// Rate limit: wait time after hitting 429 (15 minutes)
const RATE_LIMIT_WAIT = 15 * 60 * 1000;

let isRunning = false;
let rateLimitedUntil: number | null = null;

// Auto-resolve a market when condition is met
async function autoResolveMarket(
  marketId: string,
  winnerId: string,
  proof: any
): Promise<void> {
  try {
    console.log(`Auto-resolving market ${marketId}, winner: ${winnerId}`);
    
    // Update market status and winner
    await db.update(markets)
      .set({
        status: 'resolved',
        winnerId,
        xMonitoringStatus: 'resolved'
      })
      .where(eq(markets.id, marketId));

    // Update tracking record
    await storage.updateXMarketTracking(marketId, {
      monitoringStatus: 'resolved',
      resolvedAt: new Date(),
      resolutionProof: JSON.stringify(proof)
    });

    // Note: Payout distribution happens when users claim winnings
    // The market being marked as "resolved" with a winnerId allows
    // the frontend to show who won and calculate payouts
    // Actual fund transfers would happen in a claim endpoint
    
    console.log(`✓ Market ${marketId} auto-resolved successfully`);
    console.log(`  Proof: ${proof.tweetUrl}`);
    console.log(`  Winner option: ${winnerId}`);
  } catch (error) {
    console.error(`Error auto-resolving market ${marketId}:`, error);
  }
}

// Process all active X market trackings
async function processXMarketTrackings(): Promise<void> {
  // Check if we're rate limited
  if (rateLimitedUntil && Date.now() < rateLimitedUntil) {
    const waitMinutes = Math.ceil((rateLimitedUntil - Date.now()) / 60000);
    console.log(`Rate limited. Waiting ${waitMinutes} more minutes...`);
    return;
  }

  console.log('🔍 Checking X markets for auto-resolution...');
  
  const trackings = await storage.getActiveXMarketTrackings();
  
  if (trackings.length === 0) {
    console.log('No active X markets to monitor');
    return;
  }

  console.log(`Found ${trackings.length} active tracking records`);

  // Group trackings by market to get creator's OAuth token
  const trackingsByMarket = new Map<string, typeof trackings>();
  for (const tracking of trackings) {
    if (!trackingsByMarket.has(tracking.marketId)) {
      trackingsByMarket.set(tracking.marketId, []);
    }
    trackingsByMarket.get(tracking.marketId)!.push(tracking);
  }

  // Process each market's trackings
  for (const [marketId, marketTrackings] of Array.from(trackingsByMarket.entries())) {
    try {
      // Get the market to find the creator
      const [market] = await db.select().from(markets).where(eq(markets.id, marketId));
      
      if (!market || market.status !== 'active') {
        continue;
      }

      // Check if market end date has passed
      if (new Date() > new Date(market.endDate)) {
        console.log(`  Market ${market.id} expired, skipping`);
        continue;
      }

      // Get creator's X connection to use their OAuth token
      const creatorConnection = await storage.getXConnection(market.creatorWallet);
      if (!creatorConnection || !creatorConnection.accessToken) {
        console.log(`  Market ${marketId} creator hasn't connected X, skipping`);
        continue;
      }

      const bearerToken = creatorConnection.accessToken;

      // Group this market's trackings by username to batch API calls
      const trackingsByUser = new Map<string, typeof marketTrackings>();
      for (const tracking of marketTrackings) {
        const username = tracking.xTargetUsername;
        if (!trackingsByUser.has(username)) {
          trackingsByUser.set(username, []);
        }
        trackingsByUser.get(username)!.push(tracking);
      }

      // Process each tracked user for this market
      for (const [username, userTrackings] of Array.from(trackingsByUser.entries())) {
        // Get the latest tweet ID we've seen for this user
        const sinceId = userTrackings[0].lastCheckedTweetId || undefined;
        
        console.log(`  Checking @${username} for market ${marketId}...`);
        
        // Get user ID from the first tracking record
        const userId = userTrackings[0].xTargetUserId;
        
        const { tweets, latestTweetId } = await checkUserTweets(
          userId,
          username,
          sinceId,
          bearerToken
        );

        if (tweets.length > 0) {
          console.log(`    Found ${tweets.length} new tweet(s) from @${username}`);
        }

        // Evaluate each tracking for this user
        for (const tracking of userTrackings) {
          // Evaluate condition
          const evaluation = evaluateMarketCondition(market, tracking, tweets);

          if (evaluation.conditionMet) {
            console.log(`    ✓ Condition met for market ${market.id}!`);
            
            // Find the "Yes" option to mark as winner
            const options = await db.select().from(marketOptions).where(eq(marketOptions.marketId, market.id));
            const yesOption = options.find(opt => 
              opt.label.toLowerCase().includes('yes') || 
              opt.label.toLowerCase().includes('true')
            );

            if (yesOption) {
              await autoResolveMarket(market.id, yesOption.id, evaluation.proof);
            }
          }

          // Update last checked tweet ID for this specific tracking
          if (latestTweetId) {
            await storage.updateXMarketTrackingById(tracking.id, {
              lastCheckedTweetId: latestTweetId,
              lastCheckedAt: new Date()
            });
          }
        }
      }
    } catch (error: any) {
      if (error.message && error.message.includes('429')) {
        console.log('Rate limited by X API, pausing for 15 minutes');
        rateLimitedUntil = Date.now() + RATE_LIMIT_WAIT;
        break;
      }
      console.error(`Error processing market ${marketId}:`, error);
    }
  }

  console.log('✓ X market check completed');
}

// Start the monitoring worker
export function startXMonitoringWorker(): void {
  if (isRunning) {
    console.log('X monitoring worker already running');
    return;
  }

  isRunning = true;
  console.log('🚀 X monitoring worker started (polling every 5 minutes)');

  // Run immediately on start
  processXMarketTrackings().catch(console.error);

  // Then run periodically
  setInterval(() => {
    processXMarketTrackings().catch(console.error);
  }, POLL_INTERVAL);
}

// Stop the monitoring worker
export function stopXMonitoringWorker(): void {
  isRunning = false;
  console.log('X monitoring worker stopped');
}
