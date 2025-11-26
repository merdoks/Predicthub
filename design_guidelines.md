# PredictHub - Design Guidelines

## Design Approach

**Reference-Based Strategy**: Drawing inspiration from modern Web3 platforms (Polymarket, Manifold Markets) combined with crypto dashboard aesthetics (Coinbase, Uniswap). The design emphasizes trust, transparency, and gamification through bold data visualization and crypto-native visual language.

**Core Principles**:
- Crypto-native dark theme with neon accents
- Data-first layouts highlighting market statistics
- Trust indicators (wallet addresses, market volume, participation counts)
- Gamification through leaderboards and achievement displays

## Color Palette

**Dark Mode Foundation** (primary theme):
- Background: 222 47% 11% (deep charcoal)
- Surface: 222 47% 15% (elevated cards)
- Surface Elevated: 222 47% 18% (modals, dropdowns)

**Primary Colors**:
- Primary: 168 76% 42% (vibrant teal - trust, blockchain)
- Primary Hover: 168 76% 48%
- Primary Text: 168 76% 98%

**Accent Colors**:
- Success/Win: 142 76% 45% (green for winning predictions)
- Warning/Active: 38 92% 50% (amber for active markets)
- Danger/Loss: 0 84% 60% (red for losing predictions)

**Text Hierarchy**:
- Primary Text: 0 0% 98%
- Secondary Text: 0 0% 71%
- Muted Text: 0 0% 45%

**Borders & Dividers**: 0 0% 25%

## Typography

**Font Families**:
- Headlines: 'Inter', system-ui, sans-serif (700-800 weight)
- Body: 'Inter', system-ui, sans-serif (400-600 weight)
- Mono (wallet addresses, stats): 'JetBrains Mono', monospace (500 weight)

**Scale**:
- Hero: text-5xl to text-6xl (bold)
- Page Title: text-3xl to text-4xl (bold)
- Section Header: text-xl to text-2xl (semibold)
- Card Title: text-lg (semibold)
- Body: text-base (regular)
- Caption/Meta: text-sm (medium)
- Micro: text-xs (medium)

## Layout System

**Spacing Units**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 20 for consistent rhythm
- Micro spacing: p-2, gap-2 (8px)
- Component padding: p-4, p-6 (16-24px)
- Section spacing: py-12, py-16, py-20 (48-80px)
- Container gaps: gap-6, gap-8 (24-32px)

**Container Widths**:
- Full layouts: max-w-7xl mx-auto px-4
- Content cards: max-w-4xl
- Form containers: max-w-2xl

**Grid Patterns**:
- Market cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Stat displays: grid-cols-2 md:grid-cols-4 gap-4
- Leaderboard: Single column with max-w-4xl

## Component Library

### Navigation
**Header**: Fixed top navigation (h-16) with glass morphism effect, wallet connect button (primary), logo left, nav links center, wallet status right with truncated address display

### Hero Section
**Homepage Hero**: Full-width gradient background (teal to purple radial), centered content with:
- Large headline emphasizing "Predict. Bet. Win."
- Subtitle explaining real-life prediction markets
- Dual CTA: "Create Market" (primary) + "Browse Markets" (outline with backdrop-blur)
- Background: Abstract geometric pattern or blockchain network visualization
- Stats bar below hero: Total Markets, Active Users, Total Volume (grid-cols-3)

### Market Cards
**Design**: Elevated surface with rounded-xl borders, p-6 spacing
- Header: Market title (text-lg semibold) + status badge (active/resolved)
- Body: Description excerpt (2 lines max, text-muted)
- Stats row: End date, participants count, total volume (grid-cols-3, text-sm)
- Prediction options: Horizontal pill buttons showing current distribution
- Action: "Join Market" button or "View Details" for resolved markets
- Hover: Subtle lift effect (translate-y-1) + border color change to primary

### Market Detail Page
**Layout**: 2-column on desktop (60/40 split)
- Left: Market info card, description, resolution criteria, timeline
- Right: Betting interface (sticky), current predictions chart, recent activity feed
- Below: Participants list table with wallet addresses (truncated), amounts, predictions

### Create Market Form
**Multi-step wizard** with progress indicator:
- Step 1: Title + Description (textarea)
- Step 2: Prediction options (dynamic input fields, min 2, max 4)
- Step 3: Market settings (end date, entry fee, resolution authority)
- Step 4: Review + Submit
- Form styling: Clean inputs with focus rings (primary color), helpful hints below fields

### Leaderboard
**Table design**: Striped rows, hover highlights
- Columns: Rank (#), User (wallet with ENS support), Markets Joined, Win Rate (%), Total Earnings, Accuracy Score
- Top 3 highlighted with gold/silver/bronze accent borders
- Filters: Timeframe (All Time, Month, Week), Sort by metric

### Profile Page
**Sections**:
- Header: Wallet address (large mono font), total stats cards (4-col grid)
- Tabs: Active Markets, Resolved Markets, Created Markets
- Market history: Cards showing outcome, profit/loss with color coding
- Achievement badges: Row of unlockable achievements

### Wallet Connect Modal
**Centered overlay** with backdrop blur:
- Title: "Connect Your Wallet"
- MetaMask button with logo (primary, large)
- "Why connect?" help text below
- Network indicator: Ethereum Mainnet/Testnet

### Buttons
- Primary: bg-primary hover:bg-primary-hover, rounded-lg, px-6 py-3
- Outline: border-2 border-primary text-primary hover:bg-primary/10
- Ghost: hover:bg-surface-elevated
- Sizes: sm (px-3 py-1.5), md (px-4 py-2), lg (px-6 py-3)

### Data Visualization
**Prediction Distribution**: Horizontal stacked bar or donut chart using Chart.js/Recharts
- Color code each option consistently
- Show percentages and absolute counts
- Animated on load

## Images

**Hero Section**: Abstract blockchain/network visualization (nodes, connections) with gradient overlay - full-width, min-h-96
**Empty States**: Illustrative graphics for "No markets yet", "Connect wallet to continue"
**Placeholder**: Use crypto-themed iconography throughout (wallet icons, trophy for leaderboard, chart icons)

## Animations

**Minimal, purposeful only**:
- Page transitions: Fade in content (300ms)
- Card hovers: Subtle lift (200ms ease)
- Success states: Checkmark animation on market join/resolve
- Wallet connection: Pulsing indicator while pending

## Accessibility

- Maintain WCAG AA contrast ratios
- Focus indicators on all interactive elements (ring-2 ring-primary)
- Wallet addresses: Copy to clipboard on click with toast confirmation
- Loading states: Skeleton screens for data fetching
- Error states: Clear messaging with retry actions