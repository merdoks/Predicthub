import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, TrendingUp } from "lucide-react";
import { ShareButton } from "@/components/ShareButton";

export interface Market {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'resolved';
  endDate: string;
  createdAt?: string;
  participants: number;
  totalVolume: number;
  options: Array<{
    id: string;
    label: string;
    percentage: number;
  }>;
  winner?: string;
}

interface MarketCardProps {
  market: Market;
  onViewDetails: (marketId: string) => void;
  onJoinMarket?: (marketId: string) => void;
}

export default function MarketCard({ market, onViewDetails, onJoinMarket }: MarketCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) {
      return 'Ended';
    } else if (daysUntil === 0) {
      return 'Ends today';
    } else if (daysUntil === 1) {
      return 'Ends tomorrow';
    } else if (daysUntil < 7) {
      return `Ends in ${daysUntil} days`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  // Check if market is closing within 24 hours
  const isClosingSoon = () => {
    const date = new Date(market.endDate);
    const now = new Date();
    const hoursUntil = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntil > 0 && hoursUntil <= 24 && market.status === 'active';
  };

  const formatVolume = (amount: number) => {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toLocaleString();
  };

  return (
    <Card 
      className={`card-hover-lift overflow-visible ${isClosingSoon() ? 'closing-soon' : ''}`} 
      data-testid={`card-market-${market.id}`}
    >
      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge 
              variant={market.status === 'active' ? 'default' : 'secondary'}
              data-testid={`badge-status-${market.id}`}
              className="shrink-0"
            >
              {market.status === 'active' ? 'ACTIVE' : 'RESOLVED'}
            </Badge>
            <ShareButton
              title={market.title}
              text={`${market.description} - Vote now on PredictHub!`}
              url={`${window.location.origin}/market/${market.id}`}
              testId={`button-share-${market.id}`}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(market.endDate)}</span>
          </div>
        </div>
        
        <h3 className="text-xl font-bold leading-tight" data-testid={`text-market-title-${market.id}`}>
          {market.title}
        </h3>
        
        <p className="text-sm text-muted-foreground leading-relaxed">
          {market.description}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Probability Visualization */}
        <div className="space-y-3">
          {market.options.map((option, index) => (
            <div key={option.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${
                  market.winner === option.id 
                    ? 'text-chart-2' 
                    : ''
                }`}>
                  {option.label}
                </span>
                <span className="text-sm font-bold font-mono">
                  {option.percentage}%
                </span>
              </div>
              <div className="relative w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    market.winner === option.id 
                      ? 'bg-chart-2' 
                      : index === 0 
                        ? 'bg-primary' 
                        : 'bg-primary/70'
                  }`}
                  style={{ width: `${Math.max(option.percentage, 2)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Market Stats */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span data-testid={`text-participants-${market.id}`}>
                {market.participants}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium" data-testid={`text-volume-${market.id}`}>
                {formatVolume(market.totalVolume)} BNB
              </span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-4">
        {market.status === 'active' && onJoinMarket && (
          <Button 
            className="flex-1 min-h-12"
            size="lg"
            onClick={() => onJoinMarket(market.id)}
            data-testid={`button-join-${market.id}`}
          >
            Join Market
          </Button>
        )}
        <Button 
          variant="outline"
          size="lg"
          className="flex-1 min-h-12"
          onClick={() => onViewDetails(market.id)}
          data-testid={`button-view-${market.id}`}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
