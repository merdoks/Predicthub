import WalletConnectModal from '../WalletConnectModal';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function WalletConnectModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-4">
      <Button onClick={() => setOpen(true)}>Open Wallet Modal</Button>
      <WalletConnectModal 
        open={open}
        onOpenChange={setOpen}
        onConnect={() => console.log('Wallet connected!')}
      />
    </div>
  );
}
