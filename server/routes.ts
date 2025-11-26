import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, DuplicateVoteError } from "./storage";
import { insertMarketSchema, insertPredictionSchema, insertUserBadgeSchema, insertXConnectionSchema, insertMarketProposalSchema } from "@shared/schema";
import { z } from "zod";
import { generatePrediction } from "./ai-service";
import crypto from "crypto";
import { parseAndRegisterMarket } from "./xMonitoringService";
import { finalPushToGitHub } from "./github-final-push";

// In-memory store for OAuth state validation (in production, use Redis)
const oauthStateStore = new Map<string, { walletAddress: string; codeVerifier: string; expiresAt: number }>();

// Clean up expired states every 5 minutes
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(oauthStateStore.entries());
  for (const [state, data] of entries) {
    if (data.expiresAt < now) {
      oauthStateStore.delete(state);
    }
  }
}, 5 * 60 * 1000);

export async function registerRoutes(app: Express): Promise<Server> {
  // AI: Generate prediction from user input
  app.post("/api/ai/generate-prediction", async (req, res) => {
    try {
      const { userInput } = req.body;
      
      if (!userInput || typeof userInput !== 'string') {
        return res.status(400).json({ error: "User input is required" });
      }
      
      const prediction = await generatePrediction(userInput);
      res.json(prediction);
    } catch (error) {
      console.error("Error generating prediction:", error);
      res.status(500).json({ error: "Failed to generate prediction" });
    }
  });

  // Get all markets or filter by status
  app.get("/api/markets", async (req, res) => {
    try {
      const status = req.query.status as 'active' | 'resolved' | undefined;
      const markets = await storage.getMarkets(status);
      
      const formattedMarkets = markets.map(market => {
        const totalVolume = parseFloat(market.totalVolume);
        
        // Calculate percentages that sum to 100%
        const options = market.options.map(opt => {
          const staked = parseFloat(opt.totalStaked);
          const exactPercentage = totalVolume > 0 ? (staked / totalVolume) * 100 : 0;
          return {
            id: opt.id,
            label: opt.label,
            staked,
            exactPercentage
          };
        });
        
        // Round percentages while ensuring they sum to 100%
        let remainingPercentage = 100;
        const roundedOptions = options.map((opt, index) => {
          const isLast = index === options.length - 1;
          const percentage = isLast 
            ? remainingPercentage  // Last option gets remainder
            : Math.round(opt.exactPercentage);
          remainingPercentage -= percentage;
          
          return {
            id: opt.id,
            label: opt.label,
            percentage: totalVolume > 0 ? Math.max(0, percentage) : 0
          };
        });
        
        return {
          id: market.id,
          title: market.title,
          description: market.description,
          status: market.status,
          endDate: market.endDate.toISOString(),
          createdAt: market.createdAt.toISOString(),
          participants: market.participants,
          totalVolume: totalVolume, // Keep as decimal, don't scale
          options: roundedOptions,
          winner: market.winnerId
        };
      });
      
      res.json(formattedMarkets);
    } catch (error) {
      console.error("Error fetching markets:", error);
      res.status(500).json({ error: "Failed to fetch markets" });
    }
  });

  // Get market by ID
  app.get("/api/markets/:id", async (req, res) => {
    try {
      const market = await storage.getMarketById(req.params.id);
      if (!market) {
        return res.status(404).json({ error: "Market not found" });
      }
      
      const totalVolume = parseFloat(market.totalVolume);
      
      // Calculate percentages that sum to 100%
      const options = market.options.map(opt => {
        const staked = parseFloat(opt.totalStaked);
        const exactPercentage = totalVolume > 0 ? (staked / totalVolume) * 100 : 0;
        return {
          id: opt.id,
          label: opt.label,
          staked,
          exactPercentage
        };
      });
      
      // Round percentages while ensuring they sum to 100%
      let remainingPercentage = 100;
      const roundedOptions = options.map((opt, index) => {
        const isLast = index === options.length - 1;
        const percentage = isLast 
          ? remainingPercentage  // Last option gets remainder
          : Math.round(opt.exactPercentage);
        remainingPercentage -= percentage;
        
        return {
          id: opt.id,
          label: opt.label,
          percentage: totalVolume > 0 ? Math.max(0, percentage) : 0
        };
      });
      
      res.json({
        id: market.id,
        title: market.title,
        description: market.description,
        status: market.status,
        endDate: market.endDate.toISOString(),
        createdAt: market.createdAt.toISOString(),
        participants: market.participants,
        totalVolume: totalVolume, // Keep as decimal, don't scale
        options: roundedOptions,
        winner: market.winnerId,
        creatorWallet: market.creatorWallet
      });
    } catch (error) {
      console.error("Error fetching market:", error);
      res.status(500).json({ error: "Failed to fetch market" });
    }
  });

  // Create new market
  app.post("/api/markets", async (req, res) => {
    try {
      const createMarketSchema = insertMarketSchema.extend({
        endDate: z.coerce.date(),
        options: z.array(z.string()).min(2).max(4),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        resolutionMethod: z.string().optional(),
        txHash: z.string().optional(),
      });
      
      const validated = createMarketSchema.parse(req.body);
      const { options, ...marketData } = validated;
      
      const market = await storage.createMarket(marketData, options);
      
      // Check if market contains X mentions and register for tracking
      parseAndRegisterMarket(market).catch(err => {
        console.error('Error registering X tracking:', err);
      });
      
      res.status(201).json({
        id: market.id,
        title: market.title,
        description: market.description,
        category: market.category,
        tags: market.tags,
        status: market.status,
        endDate: market.endDate.toISOString(),
        participants: market.participants,
        totalVolume: 0,
        txHash: market.txHash,
        resolutionMethod: market.resolutionMethod,
        options: market.options.map(opt => ({
          id: opt.id,
          label: opt.label,
          percentage: 0
        }))
      });
    } catch (error) {
      console.error("Error creating market:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create market" });
    }
  });

  // Join market (create prediction)
  app.post("/api/predictions", async (req, res) => {
    try {
      const validated = insertPredictionSchema.parse(req.body);
      const prediction = await storage.createPrediction(validated);
      
      res.status(201).json({
        id: prediction.id,
        marketId: prediction.marketId,
        optionId: prediction.optionId,
        amount: prediction.amount
      });
    } catch (error) {
      console.error("Error creating prediction:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create prediction" });
    }
  });

  // Get user predictions
  app.get("/api/predictions/:wallet", async (req, res) => {
    try {
      const predictions = await storage.getUserPredictions(req.params.wallet);
      
      const formatted = predictions.map(pred => ({
        id: pred.id,
        marketId: pred.marketId,
        optionId: pred.optionId,
        amount: pred.amount,
        market: {
          id: pred.market.id,
          title: pred.market.title,
          status: pred.market.status,
          endDate: pred.market.endDate.toISOString(),
          winner: pred.market.winnerId
        },
        option: {
          id: pred.option.id,
          label: pred.option.label
        }
      }));
      
      res.json(formatted);
    } catch (error) {
      console.error("Error fetching predictions:", error);
      res.status(500).json({ error: "Failed to fetch predictions" });
    }
  });

  // Get user stats
  app.get("/api/stats/:wallet", async (req, res) => {
    try {
      const stats = await storage.getUserStats(req.params.wallet);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Get leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const leaderboard = await storage.getLeaderboard();
      const formatted = leaderboard.map((entry, index) => ({
        rank: index + 1,
        ...entry
      }));
      res.json(formatted);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Get user badges
  app.get("/api/badges/:wallet", async (req, res) => {
    try {
      const badges = await storage.getUserBadges(req.params.wallet);
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ error: "Failed to fetch badges" });
    }
  });

  // Award badge to user
  app.post("/api/badges", async (req, res) => {
    try {
      const validatedData = insertUserBadgeSchema.parse(req.body);
      const badge = await storage.awardBadge(
        validatedData.userWallet,
        validatedData.badgeType,
        validatedData.metadata || undefined
      );
      res.json(badge);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid badge data", details: error.errors });
      }
      console.error("Error awarding badge:", error);
      res.status(500).json({ error: "Failed to award badge" });
    }
  });

  // Resolve market
  app.post("/api/markets/:id/resolve", async (req, res) => {
    try {
      const { winnerId } = req.body;
      if (!winnerId) {
        return res.status(400).json({ error: "winnerId is required" });
      }
      
      await storage.resolveMarket(req.params.id, winnerId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error resolving market:", error);
      res.status(500).json({ error: "Failed to resolve market" });
    }
  });

  // Oracle verification endpoints
  app.get("/api/oracle/verifications", async (req, res) => {
    try {
      // Mock oracle data for demo
      const mockVerifications = [
        {
          id: "1",
          eventTitle: "Bitcoin price on Dec 31, 2024",
          dataSource: "Chainlink Oracle",
          result: "$95,432.18 at 23:59 UTC",
          verificationSummary: "Price verified via Chainlink BTC/USD feed",
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: "verified"
        },
        {
          id: "2",
          eventTitle: "2024 US Presidential Election Winner",
          dataSource: "Community Vote",
          result: "Verified by AP News and official election results",
          verificationSummary: "Community consensus reached with 98% agreement",
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: "verified"
        },
        {
          id: "3",
          eventTitle: "Ethereum Shanghai Upgrade Date",
          dataSource: "Manual Verification",
          result: "April 12, 2023 - Successfully deployed",
          verificationSummary: "Verified via Etherscan block explorer",
          timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          status: "verified"
        }
      ];
      res.json(mockVerifications);
    } catch (error) {
      console.error("Error fetching oracle verifications:", error);
      res.status(500).json({ error: "Failed to fetch verifications" });
    }
  });

  app.post("/api/oracle/verify", async (req, res) => {
    try {
      const { eventTitle, dataSource, result, verifierWallet } = req.body;
      
      const verification = {
        id: `oracle_${Date.now()}`,
        eventTitle,
        dataSource,
        result,
        verificationSummary: `AI-generated verification summary for ${eventTitle}`,
        timestamp: new Date().toISOString(),
        status: "verified",
        verifierWallet
      };
      
      res.json(verification);
    } catch (error) {
      console.error("Error submitting verification:", error);
      res.status(500).json({ error: "Failed to submit verification" });
    }
  });

  // Polymarket API proxy
  app.get("/api/polymarket/markets", async (req, res) => {
    try {
      // Mock Polymarket data for demo
      const mockPolymarkets = [
        {
          id: "pm1",
          question: "Will Bitcoin reach $100,000 by end of 2025?",
          volume: 2500000,
          category: "Crypto",
          outcomes: ["Yes", "No"],
          probabilities: [0.62, 0.38]
        },
        {
          id: "pm2",
          question: "Will AI surpass human performance in all coding tasks by 2026?",
          volume: 1800000,
          category: "Technology",
          outcomes: ["Yes", "No"],
          probabilities: [0.45, 0.55]
        },
        {
          id: "pm3",
          question: "Will the US Fed cut interest rates in Q1 2025?",
          volume: 3200000,
          category: "Finance",
          outcomes: ["Yes", "No"],
          probabilities: [0.78, 0.22]
        },
        {
          id: "pm4",
          question: "Will Ethereum merge to full PoS complete successfully?",
          volume: 1500000,
          category: "Crypto",
          outcomes: ["Yes", "No"],
          probabilities: [0.92, 0.08]
        },
        {
          id: "pm5",
          question: "Will SpaceX land humans on Mars by 2030?",
          volume: 2100000,
          category: "Science",
          outcomes: ["Yes", "No", "Delayed"],
          probabilities: [0.35, 0.50, 0.15]
        }
      ];
      
      res.json(mockPolymarkets);
    } catch (error) {
      console.error("Error fetching Polymarket data:", error);
      res.status(500).json({ error: "Failed to fetch Polymarket data" });
    }
  });

  // X OAuth Integration
  // Step 1: Initiate X OAuth flow
  app.post("/api/auth/x/initiate", async (req, res) => {
    try {
      const { walletAddress, redirectUri } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ error: "Wallet address required" });
      }

      const clientId = process.env.X_CLIENT_ID;
      if (!clientId) {
        return res.status(500).json({ error: "X OAuth not configured" });
      }

      // Generate state parameter for CSRF protection
      const state = crypto.randomBytes(32).toString('hex');
      const codeVerifier = crypto.randomBytes(32).toString('base64url');
      
      // Generate code challenge (PKCE)
      const codeChallenge = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64url');

      // Store state server-side for validation (expires in 10 minutes)
      oauthStateStore.set(state, {
        walletAddress,
        codeVerifier,
        expiresAt: Date.now() + 10 * 60 * 1000
      });

      // Use REPLIT_DEV_DOMAIN if available, otherwise fall back to req.protocol/host
      const replitDomain = process.env.REPLIT_DEV_DOMAIN;
      const baseUrl = redirectUri || (replitDomain ? `https://${replitDomain}` : `${req.protocol}://${req.get('host')}`);
      const callbackUrl = `${baseUrl}/api/auth/x/callback`;

      // X OAuth 2.0 authorization URL
      const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('client_id', clientId);
      authUrl.searchParams.append('redirect_uri', callbackUrl);
      authUrl.searchParams.append('scope', 'tweet.read users.read');
      authUrl.searchParams.append('state', state);
      authUrl.searchParams.append('code_challenge', codeChallenge);
      authUrl.searchParams.append('code_challenge_method', 'S256');

      res.json({
        authUrl: authUrl.toString(),
        state,
        codeVerifier
      });
    } catch (error) {
      console.error("Error initiating X OAuth:", error);
      res.status(500).json({ error: "Failed to initiate X OAuth" });
    }
  });

  // Step 2: X OAuth callback  
  app.get("/api/auth/x/callback", async (req, res) => {
    try {
      const { code, state, error, error_description } = req.query;
      
      // Log all query parameters for debugging
      console.log('X OAuth callback received:', {
        hasCode: !!code,
        hasState: !!state,
        error,
        error_description,
        allParams: req.query
      });
      
      // Check if X returned an error
      if (error) {
        console.error('X OAuth error:', error, error_description);
        return res.redirect(`/profile?error=oauth_error&details=${error}`);
      }
      
      if (!code || !state) {
        console.error('Missing code or state in callback');
        return res.redirect('/profile?error=oauth_failed');
      }

      const clientId = process.env.X_CLIENT_ID;
      const clientSecret = process.env.X_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return res.redirect('/profile?error=oauth_not_configured');
      }

      // Serve an HTML page that extracts code verifier from session storage
      // and posts it back to complete the OAuth flow
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Connecting X Account...</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: #0a0a0a;
              color: #fff;
            }
            .loader {
              text-align: center;
            }
            .spinner {
              border: 3px solid #333;
              border-top: 3px solid #0ea5e9;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto 20px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="loader">
            <div class="spinner"></div>
            <p>Connecting your X account...</p>
          </div>
          <script>
            (async () => {
              try {
                const codeVerifier = sessionStorage.getItem('x_oauth_code_verifier');
                const savedState = sessionStorage.getItem('x_oauth_state');
                
                // Clean up session storage
                sessionStorage.removeItem('x_oauth_code_verifier');
                sessionStorage.removeItem('x_oauth_state');
                
                if (!codeVerifier) {
                  window.location.href = '/profile?error=missing_verifier';
                  return;
                }
                
                // Validate state parameter to prevent CSRF
                const returnedState = '${state}';
                if (!savedState || savedState !== returnedState) {
                  console.error('State mismatch - possible CSRF attack');
                  window.location.href = '/profile?error=state_mismatch';
                  return;
                }
                
                // POST code and verifier to complete OAuth
                const response = await fetch('/api/auth/x/complete', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    code: '${code}',
                    state: returnedState,
                    codeVerifier
                  })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                  window.location.href = '/profile?x_connected=true';
                } else {
                  window.location.href = '/profile?error=' + (result.error || 'oauth_failed');
                }
              } catch (error) {
                console.error('OAuth completion error:', error);
                window.location.href = '/profile?error=oauth_error';
              }
            })();
          </script>
        </body>
        </html>
      `);
    } catch (error) {
      console.error("Error in X OAuth callback:", error);
      res.redirect('/profile?error=oauth_error');
    }
  });

  // Step 3: Complete X OAuth (receives code + state from client)
  app.post("/api/auth/x/complete", async (req, res) => {
    try {
      const { code, state, codeVerifier: clientCodeVerifier } = req.body;
      
      if (!code || !state) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      // Validate state server-side
      const storedData = oauthStateStore.get(state);
      
      if (!storedData) {
        console.error('State not found or expired:', state);
        return res.status(400).json({ error: "Invalid or expired state" });
      }

      // Check expiration
      if (storedData.expiresAt < Date.now()) {
        oauthStateStore.delete(state);
        return res.status(400).json({ error: "State expired" });
      }

      // Extract validated wallet address and verifier from stored data
      const { walletAddress, codeVerifier } = storedData;
      
      // Delete state immediately to prevent replay attacks
      oauthStateStore.delete(state);

      const clientId = process.env.X_CLIENT_ID;
      const clientSecret = process.env.X_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return res.status(500).json({ error: "OAuth not configured" });
      }

      // Exchange code for access token with PKCE verifier
      const tokenUrl = 'https://api.twitter.com/2/oauth2/token';
      
      // Use same callback URL construction as in initiate step
      const replitDomain = process.env.REPLIT_DEV_DOMAIN;
      const baseUrl = replitDomain ? `https://${replitDomain}` : `${req.protocol}://${req.get('host')}`;
      const callbackUrl = `${baseUrl}/api/auth/x/callback`;
      
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: callbackUrl,
          client_id: clientId,
          code_verifier: codeVerifier
        })
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange failed:', errorText);
        return res.status(400).json({ error: "token_exchange_failed" });
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;
      const refreshToken = tokenData.refresh_token; // May or may not be provided
      const expiresIn = tokenData.expires_in; // Seconds until token expires

      // Calculate token expiration time
      const tokenExpiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

      // Get user info from X API
      const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error('User info fetch failed:', errorText);
        return res.status(400).json({ error: "user_info_failed" });
      }

      const userData = await userResponse.json();
      const xUser = userData.data;

      // Save X connection with OAuth tokens
      await storage.createXConnection({
        userWallet: walletAddress,
        xUserId: xUser.id,
        xUsername: xUser.username,
        xDisplayName: xUser.name || null,
        xProfileImage: xUser.profile_image_url || null,
        accessToken: accessToken,
        refreshToken: refreshToken || null,
        tokenExpiresAt: tokenExpiresAt
      });

      // Award X Verified badge
      await storage.awardBadge(walletAddress, 'x_verified', xUser.username);

      res.json({ success: true });
    } catch (error) {
      console.error("Error completing X OAuth:", error);
      res.status(500).json({ error: "oauth_error" });
    }
  });

  // Get X connection for wallet
  app.get("/api/auth/x/connection/:wallet", async (req, res) => {
    try {
      const connection = await storage.getXConnection(req.params.wallet);
      res.json(connection || null);
    } catch (error) {
      console.error("Error fetching X connection:", error);
      res.status(500).json({ error: "Failed to fetch X connection" });
    }
  });

  // Delete X connection
  app.delete("/api/auth/x/connection/:wallet", async (req, res) => {
    try {
      await storage.deleteXConnection(req.params.wallet);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting X connection:", error);
      res.status(500).json({ error: "Failed to delete X connection" });
    }
  });

  // ===== MARKET PROPOSALS ROUTES =====

  // Create a new proposal
  app.post("/api/proposals", async (req, res) => {
    try {
      const validated = insertMarketProposalSchema.parse(req.body);
      const proposal = await storage.createProposal(validated);
      res.json(proposal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating proposal:", error);
      res.status(500).json({ error: "Failed to create proposal" });
    }
  });

  // Get all proposals or filter by status
  app.get("/api/proposals", async (req, res) => {
    try {
      const statusParam = req.query.status as string | undefined;
      const validStatuses = ['proposed', 'created', 'rejected'] as const;
      
      // Validate and normalize status parameter
      let status: 'proposed' | 'created' | 'rejected' | undefined = undefined;
      if (statusParam && validStatuses.includes(statusParam as any)) {
        status = statusParam as typeof validStatuses[number];
      }
      
      const proposals = await storage.getProposals(status);
      res.json(proposals);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      res.status(500).json({ error: "Failed to fetch proposals" });
    }
  });

  // Get proposal by ID
  app.get("/api/proposals/:id", async (req, res) => {
    try {
      const proposal = await storage.getProposalById(req.params.id);
      if (!proposal) {
        return res.status(404).json({ error: "Proposal not found" });
      }
      res.json(proposal);
    } catch (error) {
      console.error("Error fetching proposal:", error);
      res.status(500).json({ error: "Failed to fetch proposal" });
    }
  });

  // Vote for a proposal
  app.post("/api/proposals/:id/vote", async (req, res) => {
    try {
      const { voterWallet } = req.body;
      
      if (!voterWallet || typeof voterWallet !== 'string') {
        return res.status(400).json({ error: "Voter wallet is required" });
      }
      
      await storage.voteForProposal(req.params.id, voterWallet);
      const updatedProposal = await storage.getProposalById(req.params.id);
      res.json(updatedProposal);
    } catch (error) {
      // Handle duplicate vote error
      if (error instanceof DuplicateVoteError) {
        return res.status(409).json({ error: error.message });
      }
      console.error("Error voting for proposal:", error);
      res.status(500).json({ error: "Failed to vote for proposal" });
    }
  });

  // Remove vote from a proposal
  app.delete("/api/proposals/:id/vote", async (req, res) => {
    try {
      const { voterWallet } = req.body;
      
      if (!voterWallet || typeof voterWallet !== 'string') {
        return res.status(400).json({ error: "Voter wallet is required" });
      }
      
      await storage.unvoteForProposal(req.params.id, voterWallet);
      const updatedProposal = await storage.getProposalById(req.params.id);
      res.json(updatedProposal);
    } catch (error) {
      console.error("Error removing vote from proposal:", error);
      res.status(500).json({ error: "Failed to remove vote from proposal" });
    }
  });

  // Check if user voted for a proposal
  app.get("/api/proposals/:id/vote/:wallet", async (req, res) => {
    try {
      const vote = await storage.getUserProposalVote(req.params.id, req.params.wallet);
      res.json({ hasVoted: !!vote });
    } catch (error) {
      console.error("Error checking vote status:", error);
      res.status(500).json({ error: "Failed to check vote status" });
    }
  });

  // Convert proposal to market
  app.post("/api/proposals/:id/convert", async (req, res) => {
    try {
      const { creatorWallet, endDate, options, txHash } = req.body;
      
      if (!creatorWallet || !endDate || !options || !Array.isArray(options)) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const proposal = await storage.getProposalById(req.params.id);
      if (!proposal) {
        return res.status(404).json({ error: "Proposal not found" });
      }
      
      // Create market from proposal
      const market = await storage.createMarket({
        creatorWallet,
        title: proposal.title,
        description: proposal.description,
        category: proposal.category,
        tags: proposal.tags,
        endDate: new Date(endDate),
        txHash: txHash || null,
        resolutionMethod: "Community Vote",
      }, options);
      
      // Update proposal status
      await storage.updateProposal(req.params.id, {
        status: 'created',
        marketId: market.id
      });
      
      res.json({ market, proposal });
    } catch (error) {
      console.error("Error converting proposal to market:", error);
      res.status(500).json({ error: "Failed to convert proposal to market" });
    }
  });

  // Push project to GitHub
  app.post("/api/github/push", async (req, res) => {
    try {
      const result = await finalPushToGitHub();
      res.json(result);
    } catch (error) {
      console.error("Error pushing to GitHub:", error);
      res.status(500).json({ error: "Failed to push to GitHub", details: (error as Error).message });
    }
  });

  // GET endpoint for browser access
  app.get("/api/github/push", async (req, res) => {
    try {
      const result = await finalPushToGitHub();
      res.json(result);
    } catch (error) {
      console.error("Error pushing to GitHub:", error);
      res.status(500).json({ error: "Failed to push to GitHub", details: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
