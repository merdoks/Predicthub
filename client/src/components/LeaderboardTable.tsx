import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  wallet: string;
  marketsJoined: number;
  winRate: number;
  totalEarnings: number;
  accuracy: number;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export default function LeaderboardTable({ entries }: LeaderboardTableProps) {
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-chart-3" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-muted-foreground" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-chart-3" />;
    return null;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'border-l-4 border-l-chart-3';
    if (rank === 2) return 'border-l-4 border-l-muted-foreground';
    if (rank === 3) return 'border-l-4 border-l-chart-3/60';
    return '';
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Rank</TableHead>
            <TableHead>User</TableHead>
            <TableHead className="text-right">Markets</TableHead>
            <TableHead className="text-right">Win Rate</TableHead>
            <TableHead className="text-right">Earnings</TableHead>
            <TableHead className="text-right">Accuracy</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow 
              key={entry.wallet} 
              className={getRankColor(entry.rank)}
              data-testid={`row-leaderboard-${entry.rank}`}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {getRankIcon(entry.rank)}
                  <span>#{entry.rank}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">
                      {entry.wallet.slice(2, 4).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-mono text-sm" data-testid={`text-wallet-${entry.rank}`}>
                    {truncateAddress(entry.wallet)}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right" data-testid={`text-markets-${entry.rank}`}>
                {entry.marketsJoined}
              </TableCell>
              <TableCell className="text-right">
                <span className={entry.winRate >= 60 ? 'text-chart-2 font-medium' : ''}>
                  {entry.winRate}%
                </span>
              </TableCell>
              <TableCell className="text-right font-mono" data-testid={`text-earnings-${entry.rank}`}>
                ${entry.totalEarnings.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                <span className={entry.accuracy >= 70 ? 'text-chart-2 font-medium' : ''}>
                  {entry.accuracy}%
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
