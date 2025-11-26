import MarketCard from '../MarketCard';

export default function MarketCardExample() {
  const mockMarket = {
    id: '1',
    title: 'Will Bitcoin reach $100k by end of 2025?',
    description: 'Predict whether Bitcoin will hit the $100,000 milestone by December 31st, 2025.',
    status: 'active' as const,
    endDate: '2025-12-31',
    participants: 342,
    totalVolume: 45800,
    options: [
      { id: 'yes', label: 'Yes', percentage: 68 },
      { id: 'no', label: 'No', percentage: 32 }
    ]
  };

  return (
    <div className="max-w-md p-4">
      <MarketCard 
        market={mockMarket}
        onViewDetails={(id) => console.log('View details:', id)}
        onJoinMarket={(id) => console.log('Join market:', id)}
      />
    </div>
  );
}
