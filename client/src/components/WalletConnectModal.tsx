import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: () => Promise<void>;
}

export default function WalletConnectModal({ 
  open, 
  onOpenChange, 
  onConnect 
}: WalletConnectModalProps) {
  const { toast } = useToast();
  
  const handleConnect = async () => {
    try {
      await onConnect();
      onOpenChange(false);
      toast({
        title: "Wallet Connected!",
        description: "Successfully connected to BNB Smart Chain Testnet",
      });
    } catch (error) {
      console.error('Connection failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Connection Failed",
        description: errorMessage.includes('rejected') 
          ? "You rejected the connection request in MetaMask"
          : errorMessage.includes('network')
          ? "Failed to switch to BNB Testnet. Please add the network manually in MetaMask."
          : `Error: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="modal-wallet-connect">
        <DialogHeader>
          <DialogTitle className="text-2xl">Connect BNB Wallet</DialogTitle>
          <DialogDescription>
            Connect your wallet to create markets, place predictions, and track your earnings on BNB Chain.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Button 
            size="lg"
            className="w-full justify-start gap-3 h-16"
            onClick={handleConnect}
            data-testid="button-metamask-connect"
          >
            <Wallet className="w-6 h-6" />
            <div className="flex flex-col items-start">
              <span className="font-semibold">MetaMask</span>
              <span className="text-xs text-primary-foreground/80">Connect to BNB Smart Chain Testnet</span>
            </div>
          </Button>

          <div className="flex items-center gap-2 p-4 rounded-lg bg-muted">
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">B</span>
            </div>
            <div className="text-sm">
              <div className="font-medium">BNB Smart Chain Testnet</div>
              <div className="text-xs text-muted-foreground">Low fees, fast transactions</div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            <p className="font-semibold mb-1">Why connect?</p>
            <p>Your wallet allows you to participate in markets and track your predictions securely on BNB Chain.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
