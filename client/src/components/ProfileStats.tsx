import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Trophy, Target, DollarSign } from "lucide-react";

interface ProfileStatsProps {
  marketsJoined: number;
  wins: number;
  winRate: number;
  totalEarnings: number;
}

export default function ProfileStats({
  marketsJoined,
  wins,
  winRate,
  totalEarnings,
}: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Markets Joined</div>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold" data-testid="text-stat-joined">
            {marketsJoined}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Wins</div>
            <Trophy className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold text-chart-2" data-testid="text-stat-wins">
            {wins}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Win Rate</div>
            <Target className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold" data-testid="text-stat-winrate">
            {winRate}%
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Total Earnings</div>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold font-mono" data-testid="text-stat-earnings">
            ${totalEarnings.toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
