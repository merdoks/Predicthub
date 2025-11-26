import { useState, useEffect } from "react";
import Header from "@/components/Header";
import ProfileStats from "@/components/ProfileStats";
import MarketCard, { type Market } from "@/components/MarketCard";
import WalletConnectModal from "@/components/WalletConnectModal";
import { XConnectionModal } from "@/components/XConnectionModal";
import { UserBadgesList } from "@/components/UserBadge";
import type { BadgeType } from "@/components/UserBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { ArrowLeft, Copy, Link2, Shield, CheckCircle2, Unlink } from "lucide-react";
import { SiX } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useWallet } from "@/contexts/WalletContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { XConnection } from "@shared/schema";

export default function Profile() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { walletAddress, connectWallet, disconnectWallet } = useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showXConnectionModal, setShowXConnectionModal] = useState(false);

  // Check for X connection success/error in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('x_connected') === 'true') {
      toast({
        title: "X account connected!",
        description: "You've earned the X Verified badge",
      });
      // Clean up URL
      window.history.replaceState({}, '', '/profile');
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/x/connection', walletAddress] });
      queryClient.invalidateQueries({ queryKey: ['/api/badges', walletAddress] });
    }
    
    const error = params.get('error');
    if (error) {
      const errorMessages: Record<string, string> = {
        oauth_failed: "OAuth authorization failed",
        invalid_state: "Invalid OAuth state",
        oauth_not_configured: "X OAuth is not configured",
        missing_verifier: "OAuth verification failed",
        state_mismatch: "Security validation failed - please try again",
        token_exchange_failed: "Failed to exchange token with X",
        user_info_failed: "Failed to fetch X user information",
        oauth_error: "An error occurred during X connection"
      };
      
      toast({
        title: "Connection failed",
        description: errorMessages[error] || "Failed to connect X account",
        variant: "destructive"
      });
      
      // Clean up URL
      window.history.replaceState({}, '', '/profile');
    }
  }, [location, toast, walletAddress]);

  const { data: stats } = useQuery<{
    marketsJoined: number;
    wins: number;
    winRate: number;
    totalEarnings: number;
  }>({
    queryKey: ['/api/stats', walletAddress],
    enabled: !!walletAddress
  });

  const { data: predictions = [] } = useQuery<Array<{
    id: string;
    marketId: string;
    optionId: string;
    amount: string;
    market: {
      id: string;
      title: string;
      status: string;
      endDate: string;
      winner?: string;
    };
    option: {
      id: string;
      label: string;
    };
  }>>({
    queryKey: ['/api/predictions', walletAddress],
    enabled: !!walletAddress
  });

  const { data: badges = [] } = useQuery<Array<{
    badgeType: BadgeType;
    metadata?: string | null;
  }>>({
    queryKey: ['/api/badges', walletAddress],
    enabled: !!walletAddress
  });

  const { data: xConnection } = useQuery<XConnection | null>({
    queryKey: ['/api/auth/x/connection', walletAddress],
    enabled: !!walletAddress
  });

  const disconnectXMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/auth/x/connection/${walletAddress}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error("Failed to disconnect");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/x/connection', walletAddress] });
      queryClient.invalidateQueries({ queryKey: ['/api/badges', walletAddress] });
      toast({
        title: "X account disconnected",
        description: "Your X account has been unlinked"
      });
    },
    onError: () => {
      toast({
        title: "Failed to disconnect",
        description: "Please try again",
        variant: "destructive"
      });
    }
  });

  const handleWalletConnect = () => {
    if (walletAddress) {
      disconnectWallet();
      setLocation('/');
    } else {
      setShowWalletModal(true);
    }
  };

  const handleWalletConnected = async () => {
    await connectWallet();
  };

  const copyAddress = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    toast({
      title: "Copied!",
      description: "Wallet address copied to clipboard",
    });
  };

  const activePredictions = predictions.filter(p => p.market.status === 'active');
  const resolvedPredictions = predictions.filter(p => p.market.status === 'resolved');

  const formatPredictionToMarket = (pred: typeof predictions[0]): Market => {
    const isWinner = pred.market.winner === pred.optionId;
    const description = `Your prediction: ${pred.option.label} (${parseFloat(pred.amount).toFixed(2)} ETH)${
      pred.market.status === 'resolved' 
        ? isWinner 
          ? ` - Won +$${Math.round(parseFloat(pred.amount) * 1.5 * 100)}` 
          : ' - Lost'
        : ''
    }`;

    return {
      id: pred.market.id,
      title: pred.market.title,
      description,
      status: pred.market.status as 'active' | 'resolved',
      endDate: pred.market.endDate,
      participants: 0,
      totalVolume: 0,
      options: [
        { id: pred.optionId, label: pred.option.label, percentage: 50 },
      ],
      winner: pred.market.winner
    };
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
          
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <h1 className="text-2xl sm:text-4xl font-bold font-mono break-all" data-testid="text-profile-address">
              {walletAddress}
            </h1>
            <Button
              variant="outline"
              size="icon"
              onClick={copyAddress}
              data-testid="button-copy-address"
              className="min-h-12 min-w-12"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          {/* Social Connections */}
          <Card className="border-dashed" data-testid="card-social-connections">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Social Connections
              </CardTitle>
              <CardDescription>
                Link your social accounts to unlock exclusive features and verify your identity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Wallet Connection - Always shown as primary */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-chart-2" />
                  <div>
                    <p className="font-medium text-sm">Wallet Connected</p>
                    <p className="text-xs text-muted-foreground">
                      Your primary identity on PredictHub
                    </p>
                  </div>
                </div>
                <Badge variant="default">Primary</Badge>
              </div>

              {/* X (Twitter) Connection - Optional */}
              {xConnection ? (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {xConnection.xProfileImage ? (
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={xConnection.xProfileImage} alt={xConnection.xUsername} />
                        <AvatarFallback>
                          <SiX className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="p-1.5 rounded bg-background">
                        <SiX className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">@{xConnection.xUsername}</p>
                        <CheckCircle2 className="h-4 w-4 text-chart-2" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {xConnection.xDisplayName || 'X Account Connected'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => disconnectXMutation.mutate()}
                    disabled={disconnectXMutation.isPending}
                    data-testid="button-disconnect-x"
                    className="gap-2"
                  >
                    <Unlink className="h-4 w-4" />
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-dashed">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded bg-background">
                      <SiX className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">X (Twitter)</p>
                      <p className="text-xs text-muted-foreground">
                        Unlock X Verified badge & future bonuses
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowXConnectionModal(true)}
                    data-testid="button-link-x-account"
                    className="gap-2"
                  >
                    <Link2 className="h-4 w-4" />
                    Link Account
                  </Button>
                </div>
              )}

              {/* Privacy notice */}
              <p className="text-xs text-muted-foreground pt-2 border-t">
                Your wallet remains your primary login. Social connections are optional and can be removed anytime.
              </p>
            </CardContent>
          </Card>

          {/* User Badges */}
          {badges.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Achievements</h2>
              <UserBadgesList badges={badges} size="md" />
            </div>
          )}
        </div>

        <div className="space-y-8">
          {stats && (
            <ProfileStats
              marketsJoined={stats.marketsJoined}
              wins={stats.wins}
              winRate={stats.winRate}
              totalEarnings={stats.totalEarnings}
            />
          )}

          <Tabs defaultValue="active" className="space-y-6">
            <TabsList>
              <TabsTrigger value="active" data-testid="tab-active">
                Active Markets ({activePredictions.length})
              </TabsTrigger>
              <TabsTrigger value="resolved" data-testid="tab-resolved">
                Resolved Markets ({resolvedPredictions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-6">
              {activePredictions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No active predictions. Join a market to get started!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activePredictions.map((pred) => (
                    <MarketCard
                      key={pred.id}
                      market={formatPredictionToMarket(pred)}
                      onViewDetails={(id) => setLocation(`/market/${id}`)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="resolved" className="space-y-6">
              {resolvedPredictions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No resolved predictions yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {resolvedPredictions.map((pred) => (
                    <MarketCard
                      key={pred.id}
                      market={formatPredictionToMarket(pred)}
                      onViewDetails={(id) => setLocation(`/market/${id}`)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <WalletConnectModal
        open={showWalletModal}
        onOpenChange={setShowWalletModal}
        onConnect={handleWalletConnected}
      />
      
      <XConnectionModal
        open={showXConnectionModal}
        onOpenChange={setShowXConnectionModal}
      />
    </div>
  );
}
