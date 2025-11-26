import { storage } from "./storage";
import type { Market, XMarketTracking } from "@shared/schema";

// Extract @username mentions from text
export function extractXMentions(text: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_]{1,15})\b/g;
  const matches = text.matchAll(mentionRegex);
  return Array.from(matches, match => match[1]);
}

// Determine condition type from market title
export function detectConditionType(title: string): string | null {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('tweet') || lowerTitle.includes('post')) {
    return 'tweet_posted';
  }
  
  return null;
}

// Validate X username and get user ID via X API
export async function validateXUsername(username: string, clientId: string): Promise<{ userId: string; username: string } | null> {
  try {
    const url = `https://api.twitter.com/2/users/by/username/${username}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${clientId}` // Note: This requires a Bearer token, not Client ID
      }
    });

    if (!response.ok) {
      console.error(`Failed to validate X username @${username}:`, response.statusText);
      return null;
    }

    const data = await response.json() as { data?: { id: string; username: string } };
    if (data.data) {
      return {
        userId: data.data.id,
        username: data.data.username
      };
    }

    return null;
  } catch (error) {
    console.error(`Error validating X username @${username}:`, error);
    return null;
  }
}

// Parse market and register for X tracking if applicable
export async function parseAndRegisterMarket(market: Market): Promise<void> {
  const mentions = extractXMentions(market.title);
  
  if (mentions.length === 0) {
    console.log(`Market ${market.id} has no X mentions, skipping tracking`);
    return;
  }

  const conditionType = detectConditionType(market.title);
  
  if (!conditionType) {
    console.log(`Market ${market.id} doesn't match supported condition types, skipping tracking`);
    return;
  }

  // Get creator's X connection to use their OAuth token
  const creatorConnection = await storage.getXConnection(market.creatorWallet);
  if (!creatorConnection || !creatorConnection.accessToken) {
    console.log(`Market creator hasn't connected X account, tracking disabled for market ${market.id}`);
    return;
  }

  // Track ALL mentioned usernames using creator's OAuth token
  const { getXUserIdFromUsername } = await import('./xApiAuth');
  const trackedUsers: Array<{ username: string; userId: string }> = [];

  for (const username of mentions) {
    const userId = await getXUserIdFromUsername(username, creatorConnection.accessToken);
    if (userId) {
      trackedUsers.push({ username, userId });
      console.log(`Resolved @${username} to user ID: ${userId}`);
    } else {
      console.log(`Failed to resolve @${username} to user ID, skipping this user`);
    }
  }

  if (trackedUsers.length === 0) {
    console.log(`No valid X users found for market ${market.id}, tracking disabled`);
    return;
  }
  
  console.log(`Registering X tracking for market ${market.id}: ${trackedUsers.length} user(s), condition: ${conditionType}`);

  // Update market with X tracking info (use first tracked user as primary)
  const primaryUser = trackedUsers[0];
  await storage.updateMarketXFields(market.id, {
    xTargetUserId: primaryUser.userId,
    xTargetUsername: primaryUser.username,
    xConditionType: conditionType,
    xMonitoringStatus: 'active'
  });

  // Create tracking records for ALL mentioned users
  for (const { username, userId } of trackedUsers) {
    await storage.createXMarketTracking({
      marketId: market.id,
      xTargetUserId: userId,
      xTargetUsername: username,
      conditionType,
      lastCheckedTweetId: undefined
    });
    console.log(`  ✓ Tracking @${username} (ID: ${userId})`);
  }

  console.log(`✓ Market ${market.id} now tracking ${trackedUsers.length} user(s)`);
}

// Check for new tweets from a user (using user ID)
export async function checkUserTweets(
  userId: string,
  username: string,
  sinceId?: string,
  bearerToken?: string
): Promise<{ tweets: any[]; latestTweetId?: string }> {
  try {
    if (!bearerToken) {
      console.log('No bearer token available for X API, skipping tweet check');
      return { tweets: [] };
    }

    if (!userId) {
      console.log(`No user ID for @${username}, skipping tweet check`);
      return { tweets: [] };
    }

    // Build API URL - correct endpoint uses user ID
    const params = new URLSearchParams({
      'max_results': '10',
      'tweet.fields': 'created_at,author_id',
    });

    if (sinceId) {
      params.append('since_id', sinceId);
    }

    const url = `https://api.twitter.com/2/users/${userId}/tweets?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`
      }
    });

    // Handle rate limits
    if (response.status === 429) {
      const resetTime = response.headers.get('x-rate-limit-reset');
      console.log(`Rate limited. Reset at: ${resetTime}`);
      return { tweets: [] };
    }

    if (!response.ok) {
      console.error(`Failed to fetch tweets for @${username}:`, response.statusText);
      return { tweets: [] };
    }

    const data = await response.json() as { data?: any[]; meta?: { newest_id?: string } };
    
    if (!data.data || data.data.length === 0) {
      return { tweets: [] };
    }

    return {
      tweets: data.data,
      latestTweetId: data.meta?.newest_id
    };
  } catch (error) {
    console.error(`Error checking tweets for @${username}:`, error);
    return { tweets: [] };
  }
}

// Evaluate if a market condition is met based on new tweets
export function evaluateMarketCondition(
  market: Market,
  tracking: XMarketTracking,
  tweets: any[]
): { conditionMet: boolean; proof?: any } {
  if (tracking.conditionType === 'tweet_posted') {
    // Condition: User posted at least one tweet
    if (tweets.length > 0) {
      const latestTweet = tweets[0];
      return {
        conditionMet: true,
        proof: {
          tweetId: latestTweet.id,
          tweetUrl: `https://twitter.com/${tracking.xTargetUsername}/status/${latestTweet.id}`,
          timestamp: latestTweet.created_at,
          text: latestTweet.text?.substring(0, 100) || ''
        }
      };
    }
  }

  return { conditionMet: false };
}
