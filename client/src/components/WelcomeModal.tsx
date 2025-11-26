import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Confetti from "react-confetti";
import { Sparkles, TrendingUp, Trophy, Zap } from "lucide-react";

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress: string;
}

export default function WelcomeModal({
  open,
  onOpenChange,
  walletAddress,
}: WelcomeModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1000,
    height: typeof window !== 'undefined' ? window.innerHeight : 1000,
  });

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      // Stop confetti after 5 seconds
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    } else {
      // Immediately stop confetti when modal closes
      setShowConfetti(false);
    }
  }, [open]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <>
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
        />
      )}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg" data-testid="modal-welcome">
          <DialogHeader>
            <DialogTitle className="text-3xl flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-primary" />
              Welcome to PredictHub!
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Your wallet is connected and you're ready to start predicting the future on BNB Chain.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Wallet Address Display */}
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="text-sm text-muted-foreground mb-1">Connected Wallet</div>
              <div className="font-mono text-lg font-semibold" data-testid="text-welcome-wallet">
                {truncateAddress(walletAddress)}
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">AI-Powered Markets</div>
                  <div className="text-sm text-muted-foreground">
                    Create prediction markets in seconds using natural language
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">Trade on BNB Chain</div>
                  <div className="text-sm text-muted-foreground">
                    Fast, low-cost transactions on BNB Smart Chain Testnet
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">Climb the Leaderboard</div>
                  <div className="text-sm text-muted-foreground">
                    Compete with top predictors and earn your reputation
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">Instant Predictions</div>
                  <div className="text-sm text-muted-foreground">
                    Join markets, place bets, and track outcomes in real-time
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              size="lg"
              className="w-full min-h-12"
              onClick={() => onOpenChange(false)}
              data-testid="button-start-predicting"
            >
              Start Predicting
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
