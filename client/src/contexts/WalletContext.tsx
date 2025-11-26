import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { connectWallet as connectWeb3Wallet, getCurrentAccount } from '@/lib/web3';

interface WalletContextType {
  walletAddress: string | undefined;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isConnecting: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | undefined>();
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('walletAddress');
    if (stored) {
      setWalletAddress(stored);
    }

    // Check if already connected to MetaMask
    getCurrentAccount().then(account => {
      if (account) {
        setWalletAddress(account);
        localStorage.setItem('walletAddress', account);
      }
    });

    // Listen for account changes
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setWalletAddress(accounts[0]);
          localStorage.setItem('walletAddress', accounts[0]);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const address = await connectWeb3Wallet();
      if (address) {
        setWalletAddress(address);
        localStorage.setItem('walletAddress', address);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(undefined);
    localStorage.removeItem('walletAddress');
  };

  return (
    <WalletContext.Provider value={{ walletAddress, connectWallet, disconnectWallet, isConnecting }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
