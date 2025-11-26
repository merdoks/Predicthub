import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import MarketCard, { type Market } from "@/components/MarketCard";
import MarketCardSkeleton from "@/components/MarketCardSkeleton";
import WalletConnectModal from "@/components/WalletConnectModal";
import JoinMarketDialog from "@/components/JoinMarketDialog";
import OnboardingTutorial, { shouldShowOnboarding } from "@/components/OnboardingTutorial";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useWallet } from "@/contexts/WalletContext";

type SortOption = 'newest' | 'volume' | 'ending-soon';

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { walletAddress, connectWallet, disconnectWallet } = useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [joinMarketDialog, setJoinMarketDialog] = useState<{
    open: boolean;
    market?: Market;
  }>({ open: false });

  useEffect(() => {
    if (shouldShowOnboarding()) {
      const timer = setTimeout(() => setShowOnboarding(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const { data: markets = [], isLoading } = useQuery<Market[]>({
    queryKey: ['/api/markets']
  });

  const handleWalletConnect = () => {
    if (walletAddress) {
      disconnectWallet();
      console.log('Wallet disconnected');
    } else {
      setShowWalletModal(true);
    }
  };

  const handleWalletConnected = async () => {
    try {
      await connectWallet();
      console.log('Wallet connected');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleJoinMarket = (marketId: string) => {
    if (!walletAddress) {
      setShowWalletModal(true);
      return;
    }
    const market = markets.find(m => m.id === marketId);
    if (market) {
      setJoinMarketDialog({ open: true, market });
    }
  };

  const handleJoinConfirm = async (optionId: string, amount: number) => {
    if (!walletAddress) return;
    
    try {
      await apiRequest('POST', '/api/predictions', {
        marketId: joinMarketDialog.market?.id,
        userWallet: walletAddress,
        optionId,
        amount: amount.toString()
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/markets'] });
      
      toast({
        title: "Prediction Placed!",
        description: `You've staked ${amount} BNB on your prediction.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to place prediction. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Sort markets based on selected option
  const sortMarkets = (marketsToSort: Market[]) => {
    return [...marketsToSort].sort((a, b) => {
      switch (sortBy) {
        case 'volume':
          // Volume is already in display units (no scaling needed)
          return b.totalVolume - a.totalVolume;
        case 'ending-soon':
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        case 'newest':
        default:
          // Sort by creation date, newest first
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          // Fallback to endDate if createdAt not available
          return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
      }
    });
  };

  const activeMarkets = useMemo(() => {
    const filtered = markets.filter(m => m.status === 'active');
    return sortMarkets(filtered);
  }, [markets, sortBy]);

  const resolvedMarkets = useMemo(() => {
    const filtered = markets.filter(m => m.status === 'resolved');
    return sortMarkets(filtered);
  }, [markets, sortBy]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          onWalletConnect={handleWalletConnect}
          walletAddress={walletAddress}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Markets</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <MarketCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onWalletConnect={handleWalletConnect}
        walletAddress={walletAddress}
      />

      <HeroSection 
        onCreateMarket={() => setLocation('/create')}
        onAICreateMarket={() => setLocation('/ai-create')}
        onBrowseMarkets={() => {
          document.getElementById('markets')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      <div id="markets" className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h2 className="text-3xl font-bold">Markets</h2>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-[160px]" data-testid="select-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="volume">Highest Volume</SelectItem>
                  <SelectItem value="ending-soon">Ending Soon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {walletAddress && (
              <Button 
                onClick={() => setLocation('/profile')}
                variant="outline"
                data-testid="button-view-profile"
                className="min-h-12"
              >
                View Profile
              </Button>
            )}
            <Button 
              onClick={() => setLocation('/leaderboard')}
              variant="outline"
              data-testid="button-view-leaderboard"
              className="min-h-12"
            >
              View Leaderboard
            </Button>
          </div>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="active" data-testid="tab-active-markets" className="whitespace-nowrap">
              Active ({activeMarkets.length})
            </TabsTrigger>
            <TabsTrigger value="resolved" data-testid="tab-resolved-markets" className="whitespace-nowrap">
              Resolved ({resolvedMarkets.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            {activeMarkets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No active markets yet. Be the first to create one!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeMarkets.map((market) => (
                  <MarketCard
                    key={market.id}
                    market={market}
                    onViewDetails={(id) => setLocation(`/market/${id}`)}
                    onJoinMarket={handleJoinMarket}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resolved" className="space-y-6">
            {resolvedMarkets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No resolved markets yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resolvedMarkets.map((market) => (
                  <MarketCard
                    key={market.id}
                    market={market}
                    onViewDetails={(id) => setLocation(`/market/${id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <WalletConnectModal
        open={showWalletModal}
        onOpenChange={setShowWalletModal}
        onConnect={handleWalletConnected}
      />

      {joinMarketDialog.market && (
        <JoinMarketDialog
          open={joinMarketDialog.open}
          onOpenChange={(open) => setJoinMarketDialog({ open, market: joinMarketDialog.market })}
          marketTitle={joinMarketDialog.market.title}
          options={joinMarketDialog.market.options}
          onJoin={handleJoinConfirm}
        />
      )}

      <OnboardingTutorial
        run={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />
    </div>
  );
}
