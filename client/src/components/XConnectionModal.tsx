import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiX } from "react-icons/si";
import { Shield, Gift, Award, Info, Loader2 } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface XConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function XConnectionModal({ open, onOpenChange }: XConnectionModalProps) {
  const { walletAddress } = useWallet();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    try {
      const response = await fetch("/api/auth/x/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          walletAddress,
          redirectUri: window.location.origin
        })
      });

      if (!response.ok) {
        throw new Error("Failed to initiate OAuth");
      }

      const data = await response.json() as { authUrl: string; state: string; codeVerifier: string };

      // Store code verifier in session storage for PKCE flow
      sessionStorage.setItem('x_oauth_code_verifier', data.codeVerifier);
      sessionStorage.setItem('x_oauth_state', data.state);

      // Redirect to X OAuth
      window.location.href = data.authUrl;
    } catch (error) {
      console.error("Error initiating X OAuth:", error);
      toast({
        title: "Connection failed",
        description: "Failed to connect to X. Please try again.",
        variant: "destructive"
      });
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="modal-x-connection">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-muted">
              <SiX className="h-6 w-6" />
            </div>
            <DialogTitle>Connect X Account</DialogTitle>
          </div>
          <DialogDescription>
            Link your X (Twitter) account to unlock exclusive features and verify your identity.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Award className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Earn X Verified Badge</p>
                <p className="text-sm text-muted-foreground">
                  Get the exclusive X Verified achievement badge on your profile
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Gift className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Future Referral Bonuses</p>
                <p className="text-sm text-muted-foreground">
                  Get access to referral programs and exclusive airdrops (coming soon)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Enhanced Trust</p>
                <p className="text-sm text-muted-foreground">
                  Build credibility in the prediction markets community
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="bg-muted rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Privacy & Opt-in</p>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 ml-6">
              <li>✓ Completely optional - wallet login is always available</li>
              <li>✓ We only access your public profile information</li>
              <li>✓ You can disconnect anytime from your profile</li>
              <li>✓ Your wallet remains your primary identity</li>
            </ul>
          </div>

          {/* Coming Soon Notice */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Developer Setup Required</p>
                <p className="text-xs text-muted-foreground">
                  X OAuth integration requires developer credentials that aren't accessible in test environments. 
                  This feature will be available when the app is deployed with production X API credentials.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            data-testid="button-cancel-x-connection"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleConnect}
            className="flex-1 gap-2"
            disabled={isConnecting}
            data-testid="button-connect-x"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <SiX className="h-4 w-4" />
                Connect X
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
