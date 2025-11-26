import JoinMarketDialog from '../JoinMarketDialog';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function JoinMarketDialogExample() {
  const [open, setOpen] = useState(false);

  const mockOptions = [
    { id: 'yes', label: 'Yes' },
    { id: 'no', label: 'No' }
  ];

  return (
    <div className="p-4">
      <Button onClick={() => setOpen(true)}>Open Join Dialog</Button>
      <JoinMarketDialog 
        open={open}
        onOpenChange={setOpen}
        marketTitle="Will Bitcoin reach $100k by end of 2025?"
        options={mockOptions}
        onJoin={(optionId, amount) => console.log('Joined:', optionId, amount)}
      />
    </div>
  );
}
