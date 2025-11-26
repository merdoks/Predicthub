import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, DollarSign, Sparkles } from "lucide-react";
import heroBackground from "@assets/generated_images/Blockchain_network_hero_background_387bf270.png";

interface HeroSectionProps {
  onCreateMarket: () => void;
  onAICreateMarket: () => void;
  onBrowseMarkets: () => void;
}

export default function HeroSection({ onCreateMarket, onAICreateMarket, onBrowseMarkets }: HeroSectionProps) {
  return (
    <div className="relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/80 to-background"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-32">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge variant="outline" className="backdrop-blur-sm">
              Built on BNB Chain
            </Badge>
            <Badge variant="secondary" className="backdrop-blur-sm">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered
            </Badge>
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
            Predict. Bet. Win.
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            AI-powered prediction markets on BNB Chain. Turn any event into a verifiable market in seconds.
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              onClick={onAICreateMarket}
              data-testid="button-hero-ai-create"
              className="gap-2 btn-shadow min-h-12"
            >
              <Sparkles className="w-4 h-4" />
              AI Create Market
            </Button>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={onCreateMarket}
              data-testid="button-hero-create"
              className="min-h-12"
            >
              Manual Create
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={onBrowseMarkets}
              data-testid="button-hero-browse"
              className="backdrop-blur-sm min-h-12"
            >
              Browse Markets
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-card-border">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4 mx-auto">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div className="text-3xl font-bold mb-2" data-testid="text-stat-markets">247</div>
              <div className="text-sm text-muted-foreground">Total Markets</div>
            </div>

            <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-card-border">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-chart-2/10 mb-4 mx-auto">
                <Users className="w-6 h-6 text-chart-2" />
              </div>
              <div className="text-3xl font-bold mb-2" data-testid="text-stat-users">12.4K</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>

            <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-card-border">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-chart-3/10 mb-4 mx-auto">
                <DollarSign className="w-6 h-6 text-chart-3" />
              </div>
              <div className="text-3xl font-bold mb-2" data-testid="text-stat-volume">$2.8M</div>
              <div className="text-sm text-muted-foreground">Total Volume</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
