import ProfileStats from '../ProfileStats';

export default function ProfileStatsExample() {
  return (
    <div className="max-w-6xl p-6">
      <ProfileStats 
        marketsJoined={24}
        wins={18}
        winRate={75}
        totalEarnings={4250}
      />
    </div>
  );
}
