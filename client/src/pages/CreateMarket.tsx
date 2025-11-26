import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import CreateMarketForm from "@/components/CreateMarketForm";
import WalletConnectModal from "@/components/WalletConnectModal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useWallet } from "@/contexts/WalletContext";

export default function CreateMarket() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { walletAddress, connectWallet, disconnectWallet } = useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);

  const handleWalletConnect = () => {
    if (walletAddress) {
      disconnectWallet();
    } else {
      setShowWalletModal(true);
    }
  };

  const handleWalletConnected = () => {
    connectWallet();
  };

  const handleSubmit = async (market: {
    title: string;
    description: string;
    endDate: string;
    options: string[];
  }) => {
    if (!walletAddress) {
      setShowWalletModal(true);
      return;
    }

    try {
      await apiRequest('POST', '/api/markets', {
        creatorWallet: walletAddress,
        title: market.title,
        description: market.description,
        endDate: new Date(market.endDate).toISOString(),
        options: market.options
      });
      
      toast({
        title: "Market Created!",
        description: "Your market has been created successfully.",
      });
      
      setTimeout(() => setLocation('/'), 1500);
    } catch (error) {
      console.error("Error creating market:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create market. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onWalletConnect={handleWalletConnect}
        walletAddress={walletAddress}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <CreateMarketForm
          onSubmit={handleSubmit}
          onCancel={() => setLocation('/')}
        />
      </div>

      <WalletConnectModal
        open={showWalletModal}
        onOpenChange={setShowWalletModal}
        onConnect={handleWalletConnected}
      />
    </div>
  );
}
