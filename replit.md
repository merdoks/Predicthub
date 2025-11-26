# PredictHub

## Overview

PredictHub is a BNB Chain-powered prediction market platform designed for the DoraHacks hackathon. It features AI-assisted market creation using OpenAI, real MetaMask wallet integration on BNB Smart Chain Testnet, blockchain transaction simulation with on-chain hash tracking, and community-driven market resolution. Users can describe prediction markets in natural language, which are then automatically reformulated into verifiable predictions with suggested end dates, categories, and resolution methods. The project aims to provide a professional-grade user experience with strong accessibility and a crypto-native aesthetic.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **React** with TypeScript
- **Vite** for build and development
- **Wouter** for client-side routing
- **TanStack Query** for server state management
- **Tailwind CSS** with shadcn/ui for styling

**Design System:**
- Crypto-native aesthetics with a primary dark mode theme.
- Component library based on Radix UI primitives.
- Color palette focused on trust and blockchain themes (teal primary).
- Typography uses Inter (body) and JetBrains Mono (monospaced).
- Key decisions include using shadcn/ui for rapid development and customization, prioritizing accessibility with 48px touch targets and enhanced focus indicators, and implementing micro-interactions like urgency pulse animations and shimmer loading.

**State Management:**
- Server state handled by React Query.
- Local component state managed with React hooks.

### Backend Architecture

**Technology Stack:**
- **Express.js** with TypeScript (Node.js)
- **Drizzle ORM** for type-safe database operations
- **Neon Database** (PostgreSQL-compatible serverless database)

**API Design:**
- RESTful API with JSON request/response format.

**Database Schema:**
- `markets`: Stores market metadata (creator, title, description, status, end date, volume, category, tags, txHash, resolutionMethod).
- `marketOptions`: Options for each market with staked amounts.
- `predictions`: User predictions linking wallet addresses to market options and staked amounts.
- `userBadges`: Stores achievement badges for users (userWallet, badgeType, earnedAt, metadata) with types: early_adopter, x_verified, market_creator, top_predictor, volume_trader.
- `xConnections`: Links wallet addresses to X (Twitter) accounts (userWallet, xUserId, xUsername, xDisplayName, xProfileImageUrl, connectedAt) with unique constraint on userWallet.
- `marketProposals`: Community-submitted market ideas (proposerWallet, title, description, category, tags, votes, status, marketId, createdAt) with status values: proposed, created, rejected.
- `proposalVotes`: Tracks user votes on proposals (proposalId, voterWallet, createdAt) with unique constraint on (proposalId, voterWallet) to prevent duplicate voting.

**Key Design Decisions:**
- Utilizing a serverless PostgreSQL (Neon) with Drizzle ORM for a production-grade, type-safe relational database solution.

### Application Features

**Market Management:**
- AI-powered market creation from natural language descriptions (using OpenAI GPT-4o-mini).
- Creation of markets with 2-4 options, auto-generating details like title, description, category, and resolution method.
- Browsing, filtering (Active/Resolved), and joining markets.
- Real-time volume tracking.
- Market filtering and sorting by Newest, Highest Volume, and Ending Soon.
- Payout calculator in the betting interface based on market probabilities.

**User Features:**
- Real MetaMask wallet integration with BNB Smart Chain Testnet.
- Welcome modal with confetti celebration for first-time wallet connections (tracked via localStorage).
- Profile badge system with achievement badges (Early Adopter, X Verified, Market Creator, Top Predictor, Volume Trader).
- Social sharing system with Web Share API (mobile) and clipboard fallback (desktop), Open Graph metadata for rich previews.
- **X (Twitter) OAuth 2.0 Integration**: Production-ready OAuth flow with PKCE security, server-side state validation, CSRF protection, and replay prevention. Supports connecting/disconnecting X accounts with automatic X Verified badge awarding. Maintains wallet-first architecture where X connection is completely optional. Uses consistent callback URL construction via `REPLIT_DEV_DOMAIN` environment variable for both authorization and token exchange steps.
- Onboarding tutorial system for first-time visitors.
- Celebration confetti and result modal for win/loss scenarios.
- Oracle verification mode for market resolution.
- Polymarket API integration for exploring external markets.
- Responsive design for mobile and tablet.
- Leaderboard with demo data and real user rankings.
- User profile with statistics, prediction history, earned badges, and social connections card displaying connected X account.

**Community Proposals:**
- **AI-Assisted Market Idea Submission**: Users can submit market proposals using natural language, which are automatically formatted into structured proposals with AI-generated titles, descriptions, categories, and tags.
- **Community Voting System**: Users can vote on proposed market ideas with duplicate vote protection enforced via database-level unique constraints and backend validation (returns 409 on duplicate votes).
- **Status Filtering**: Browse proposals by status (All Ideas, Open Proposals, Created Markets) with real-time client-side filtering and server-side API support.
- **Proposal-to-Market Conversion**: Approved proposals can be converted into actual prediction markets using AI to generate market options.
- **Social Sharing**: Share proposals via Web Share API (mobile) or clipboard copy (desktop) with Open Graph metadata.
- **Vote Protection**: Database unique constraint on (proposalId, voterWallet) prevents duplicate votes, with frontend UI showing loading states and error handling.
- **Loading States**: Skeleton placeholders during data fetching, disabled buttons during mutations, and error toasts for failed operations.

**Development Environment:**
- Monorepo structure with shared TypeScript types for client and server.
- Vite for frontend development and esbuild for backend bundling.
- Drizzle Kit for database migrations.

## External Dependencies

### Third-Party Services

- **Neon Database**: Serverless PostgreSQL database.
- **OpenAI**: AI-powered market creation (`GPT-4o-mini`).
- **X (Twitter) API**: OAuth 2.0 authentication for optional social account linking.

### UI Component Libraries

- **Radix UI**: Headless UI primitives for accessibility.
- **shadcn/ui**: Pre-built component implementations on top of Radix UI.
- **lucide-react** & **react-icons**: Icon libraries.

### Development Tools

- **@replit/vite-plugin-runtime-error-modal**, **@replit/vite-plugin-cartographer**, **@replit/vite-plugin-dev-banner**: Replit-specific development tools.

### Form Handling

- **React Hook Form**: Form state management and validation.
- **Zod**: Schema integration for validation.

### Additional Libraries

- **ethers.js**: Interaction with the Ethereum blockchain and MetaMask.
- **date-fns**: Date formatting and manipulation.
- **clsx** & **tailwind-merge**: Utilities for conditional class names.
- **nanoid**: Unique ID generation.
- **react-joyride**: Onboarding tutorial.
- **react-confetti**: Celebration animations.