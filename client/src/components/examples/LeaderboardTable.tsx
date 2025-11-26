import LeaderboardTable from '../LeaderboardTable';

export default function LeaderboardTableExample() {
  const mockEntries = [
    {
      rank: 1,
      wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      marketsJoined: 45,
      winRate: 78,
      totalEarnings: 12450,
      accuracy: 82
    },
    {
      rank: 2,
      wallet: '0x8Ba1f109551bD432803012645Ac136ddd64DBA72',
      marketsJoined: 38,
      winRate: 71,
      totalEarnings: 9820,
      accuracy: 75
    },
    {
      rank: 3,
      wallet: '0x1aD91ee08f21bE3dE0BA2ba6918E714dA6B45836',
      marketsJoined: 52,
      winRate: 65,
      totalEarnings: 8340,
      accuracy: 71
    }
  ];

  return (
    <div className="max-w-4xl p-6">
      <LeaderboardTable entries={mockEntries} />
    </div>
  );
}
