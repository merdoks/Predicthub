import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider, useWallet } from "@/contexts/WalletContext";
import WelcomeModal from "@/components/WelcomeModal";
import Home from "@/pages/Home";
import CreateMarket from "@/pages/CreateMarket";
import AICreateMarket from "@/pages/AICreateMarket";
import Leaderboard from "@/pages/Leaderboard";
import Profile from "@/pages/Profile";
import Oracle from "@/pages/Oracle";
import Polymarket from "@/pages/Polymarket";
import CommunityIdeas from "@/pages/CommunityIdeas";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/create" component={CreateMarket} />
      <Route path="/ai-create" component={AICreateMarket} />
      <Route path="/community" component={CommunityIdeas} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/oracle" component={Oracle} />
      <Route path="/polymarket" component={Polymarket} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { walletAddress } = useWallet();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    // Check if user just connected and hasn't been welcomed yet
    if (walletAddress) {
      const hasBeenWelcomed = localStorage.getItem('predictHubWelcomed');
      if (!hasBeenWelcomed) {
        setShowWelcomeModal(true);
        localStorage.setItem('predictHubWelcomed', 'true');
      }
    }
  }, [walletAddress]);

  return (
    <>
      <Router />
      {walletAddress && (
        <WelcomeModal
          open={showWelcomeModal}
          onOpenChange={setShowWelcomeModal}
          walletAddress={walletAddress}
        />
      )}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;
