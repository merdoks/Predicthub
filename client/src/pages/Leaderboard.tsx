import { useState } from "react";
import Header from "@/components/Header";
import LeaderboardTable from "@/components/LeaderboardTable";
import WalletConnectModal from "@/components/WalletConnectModal";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/contexts/WalletContext";

export default function Leaderboard() {
  const [, setLocation] = useLocation();
  const { walletAddress, connectWallet, disconnectWallet } = useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);

  const { data: rawLeaderboard = [], isLoading } = useQuery<Array<{
    rank: number;
    wallet: string;
    marketsJoined: number;
    winRate: number;
    totalEarnings: number;
    accuracy: number;
  }>>({
    queryKey: ['/api/leaderboard']
  });

  // Demo data for impressive leaderboard display
  const demoData = [
    {
      rank: 1,
      wallet: "Satoshi",
      marketsJoined: 127,
      winRate: 95,
      totalEarnings: 0.4,
      accuracy: 95
    },
    {
      rank: 2,
      wallet: "AI Prophet",
      marketsJoined: 98,
      winRate: 92,
      totalEarnings: 0.32,
      accuracy: 92
    },
    {
      rank: 3,
      wallet: "CryptoNinja",
      marketsJoined: 84,
      winRate: 88,
      totalEarnings: 0.29,
      accuracy: 88
    },
  ];

  // Merge demo data with real data, keeping demo data at top
  const leaderboard = rawLeaderboard.length > 0 
    ? [...demoData, ...rawLeaderboard.map((entry, idx) => ({
        ...entry,
        rank: idx + 4
      }))]
    : demoData;

  const handleWalletConnect = () => {
    if (walletAddress) {
      disconnectWallet();
    } else {
      setShowWalletModal(true);
    }
  };

  const handleWalletConnected = async () => {
    await connectWallet();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onWalletConnect={handleWalletConnect}
        walletAddress={walletAddress}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => setLocation('/')}
            className="mb-4"
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Markets
          </Button>
          <h1 className="text-4xl font-bold mb-2">Leaderboard</h1>
          <p className="text-muted-foreground">
            Top predictors ranked by accuracy and total earnings
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading leaderboard...
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No predictions yet. Be the first to join a market!
          </div>
        ) : (
          <LeaderboardTable entries={leaderboard} />
        )}
      </div>

      <WalletConnectModal
        open={showWalletModal}
        onOpenChange={setShowWalletModal}
        onConnect={handleWalletConnected}
      />
    </div>
  );
}
