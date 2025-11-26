import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { useWindowSize } from "@/hooks/use-window-size";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, CheckCircle } from "lucide-react";

interface CelebrationConfettiProps {
  isWinner: boolean;
  points?: number;
  onClose: () => void;
}

export default function CelebrationConfetti({ isWinner, points = 0, onClose }: CelebrationConfettiProps) {
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showConfetti && <Confetti width={width} height={height} numberOfPieces={isWinner ? 200 : 100} />}
      
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md" data-testid="modal-celebration">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              {isWinner ? (
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Trophy className="w-10 h-10 text-primary" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-chart-2/10 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-chart-2" />
                </div>
              )}
            </div>
            <DialogTitle className="text-center text-2xl">
              {isWinner ? "Congratulations!" : "Market Resolved"}
            </DialogTitle>
            <DialogDescription className="text-center text-lg">
              {isWinner 
                ? `You won ${points} PredictPoints!` 
                : "Market closed — result verified on BNB Chain!"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isWinner && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">+{points}</div>
                  <div className="text-sm text-muted-foreground">PredictPoints Earned</div>
                </div>
              </div>
            )}

            <Button 
              onClick={onClose} 
              className="w-full" 
              size="lg"
              data-testid="button-close-celebration"
            >
              {isWinner ? "View Leaderboard" : "Close"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
