import { Badge } from "@/components/ui/badge";
import { Sparkles, Twitter, Trophy, TrendingUp, Zap } from "lucide-react";
import { SiX } from "react-icons/si";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type BadgeType = 'early_adopter' | 'x_verified' | 'market_creator' | 'top_predictor' | 'volume_trader';

interface BadgeConfig {
  icon: React.ReactNode;
  label: string;
  description: string;
  variant: "default" | "secondary" | "outline" | "destructive";
}

const BADGE_CONFIGS: Record<BadgeType, BadgeConfig> = {
  early_adopter: {
    icon: <Sparkles className="w-3 h-3" />,
    label: "Early Adopter",
    description: "One of the first users on PredictHub",
    variant: "default",
  },
  x_verified: {
    icon: <SiX className="w-3 h-3" />,
    label: "X Verified",
    description: "Connected Twitter/X account",
    variant: "default",
  },
  market_creator: {
    icon: <Zap className="w-3 h-3" />,
    label: "Market Creator",
    description: "Created prediction markets",
    variant: "secondary",
  },
  top_predictor: {
    icon: <Trophy className="w-3 h-3" />,
    label: "Top Predictor",
    description: "Achieved high win rate",
    variant: "default",
  },
  volume_trader: {
    icon: <TrendingUp className="w-3 h-3" />,
    label: "Volume Trader",
    description: "High trading volume",
    variant: "secondary",
  },
};

interface UserBadgeProps {
  badgeType: BadgeType;
  metadata?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export default function UserBadge({ badgeType, metadata, size = 'md' }: UserBadgeProps) {
  const config = BADGE_CONFIGS[badgeType];
  
  if (!config) {
    return null;
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  let displayLabel = config.label;
  let description = config.description;
  
  // Customize label/description with metadata if available
  if (badgeType === 'x_verified' && metadata) {
    try {
      const data = JSON.parse(metadata);
      if (data.username) {
        displayLabel = `@${data.username}`;
        description = `Verified Twitter/X account: @${data.username}`;
      }
    } catch (e) {
      // Fallback to default if JSON parsing fails
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant={config.variant}
          className={`inline-flex items-center gap-1 ${sizeClasses[size]}`}
          data-testid={`badge-${badgeType}`}
        >
          {config.icon}
          <span>{displayLabel}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>{description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface UserBadgesListProps {
  badges: { badgeType: BadgeType; metadata?: string | null }[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserBadgesList({ badges, size = 'md', className = "" }: UserBadgesListProps) {
  if (badges.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`} data-testid="badges-list">
      {badges.map((badge, index) => (
        <UserBadge
          key={`${badge.badgeType}-${index}`}
          badgeType={badge.badgeType}
          metadata={badge.metadata}
          size={size}
        />
      ))}
    </div>
  );
}
