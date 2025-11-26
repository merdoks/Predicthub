import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TrendingUp, AlertCircle } from "lucide-react";
import { useState } from "react";

interface JoinMarketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marketTitle: string;
  options: Array<{ id: string; label: string; percentage?: number }>;
  onJoin: (optionId: string, amount: number) => void;
}

export default function JoinMarketDialog({
  open,
  onOpenChange,
  marketTitle,
  options,
  onJoin,
}: JoinMarketDialogProps) {
  const [selectedOption, setSelectedOption] = useState("");
  const [amount, setAmount] = useState("0.01");

  const selectedOptionData = options.find(o => o.id === selectedOption);
  
  // Calculate potential payout (conservative estimate)
  const calculatePayout = () => {
    if (selectedOptionData?.percentage === undefined || !amount) return 0;
    const betAmount = parseFloat(amount);
    if (isNaN(betAmount) || betAmount <= 0) return 0;
    
    const prob = selectedOptionData.percentage;
    
    // Conservative estimate: if this outcome wins, you get back approximately:
    // your stake + (your stake * (100-prob) / prob)
    // Example: 30% chance means roughly 2.33x return (1 + 70/30)
    if (prob > 0) {
      const multiplier = 1 + ((100 - prob) / prob);
      return betAmount * Math.min(multiplier, 10); // Cap at 10x to avoid crazy numbers
    }
    
    // If 0% (fresh market with no liquidity), return stake as base
    return betAmount;
  };

  const potentialPayout = calculatePayout();
  const potentialProfit = potentialPayout - parseFloat(amount || "0");

  const handleJoin = () => {
    if (selectedOption && amount) {
      onJoin(selectedOption, parseFloat(amount));
      onOpenChange(false);
      setSelectedOption("");
      setAmount("0.01");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-join-market">
        <DialogHeader>
          <DialogTitle>Join Market</DialogTitle>
          <DialogDescription className="line-clamp-2">{marketTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Select Your Prediction</Label>
            <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
              {options.map((option) => (
                <div 
                  key={option.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${
                    selectedOption === option.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover-elevate'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem 
                      value={option.id} 
                      id={option.id}
                      data-testid={`radio-option-${option.id}`}
                    />
                    <Label htmlFor={option.id} className="font-medium cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                  {option.percentage !== undefined && (
                    <span className="text-sm font-bold font-mono text-muted-foreground">
                      {option.percentage}%
                    </span>
                  )}
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-base font-semibold">Stake Amount</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                data-testid="input-bet-amount"
                className="text-lg font-mono pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                BNB
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Minimum: 0.01 BNB
            </p>
          </div>

          {selectedOption && amount && parseFloat(amount) >= 0.01 && (
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-chart-2/10 border border-primary/20 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <TrendingUp className="w-4 h-4" />
                <span>Payout Calculator</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Your prediction:</span>
                  <span className="font-medium">
                    {selectedOptionData?.label}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Stake amount:</span>
                  <span className="font-mono font-medium">{amount} BNB</span>
                </div>
                
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Potential payout if correct:</span>
                    <span className="font-bold font-mono text-chart-2">
                      {potentialPayout.toFixed(4)} BNB
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Potential profit:</span>
                    <span className="font-mono text-chart-2">
                      +{potentialProfit.toFixed(4)} BNB
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            data-testid="button-join-cancel"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleJoin}
            disabled={!selectedOption || !amount}
            data-testid="button-join-confirm"
          >
            Confirm Prediction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
