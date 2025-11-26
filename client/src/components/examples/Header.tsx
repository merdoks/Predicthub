import Header from '../Header';
import { useState } from 'react';

export default function HeaderExample() {
  const [walletAddress, setWalletAddress] = useState<string>();

  const handleWalletConnect = () => {
    if (walletAddress) {
      setWalletAddress(undefined);
      console.log('Wallet disconnected');
    } else {
      setWalletAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
      console.log('Wallet connected');
    }
  };

  return (
    <Header 
      onWalletConnect={handleWalletConnect}
      walletAddress={walletAddress}
    />
  );
}
