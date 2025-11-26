import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Download, Search } from "lucide-react";
import Header from "@/components/Header";
import { useWallet } from "@/contexts/WalletContext";
import { useLocation } from "wouter";

interface PolymarketMarket {
  id: string;
  question: string;
  volume: number;
  category: string;
  outcomes: string[];
  probabilities: number[];
}

export default function Polymarket() {
  const { toast } = useToast();
  const { walletAddress, connectWallet, disconnectWallet } = useWallet();
  const [, setLocation] = useLocation();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: markets = [], isLoading } = useQuery<PolymarketMarket[]>({
    queryKey: ['/api/polymarket/markets'],
  });

  const handleWalletConnect = () => {
    if (walletAddress) {
      disconnectWallet();
    } else {
      setShowWalletModal(true);
    }
  };

  const handleRemixMarket = (market: PolymarketMarket) => {
    localStorage.setItem('remix_market', JSON.stringify({
      title: market.question,
      category: market.category,
      options: market.outcomes,
    }));
    
    toast({
      title: "Market Imported!",
      description: "Redirecting to AI Market Creator...",
    });
    
    setTimeout(() => {
      setLocation('/ai-create');
    }, 1000);
  };

  const filteredMarkets = markets.filter(market =>
    market.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    market.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onWalletConnect={handleWalletConnect}
        walletAddress={walletAddress}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Polymarket Explorer</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Discover trending prediction markets from Polymarket and remix them on BNB Chain.
          </p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search markets by title or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-markets"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading Polymarket data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredMarkets.slice(0, 10).map((market, index) => (
              <Card key={market.id} className="hover-elevate overflow-visible" data-testid={`polymarket-${index}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{market.question}</CardTitle>
                      <Badge variant="secondary">{market.category}</Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Volume</div>
                      <div className="text-xl font-bold">
                        ${(market.volume / 1000).toFixed(1)}K
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {market.outcomes.map((outcome, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-muted">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{outcome}</span>
                            <span className="text-sm font-bold text-primary">
                              {(market.probabilities[idx] * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${market.probabilities[idx] * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={() => handleRemixMarket(market)}
                      variant="outline"
                      className="w-full gap-2"
                      data-testid={`button-remix-${index}`}
                    >
                      <Download className="w-4 h-4" />
                      Remix on PredictHub
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredMarkets.length === 0 && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            No markets found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
