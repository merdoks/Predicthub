import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Calendar, Tag, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useWallet } from "@/contexts/WalletContext";
import WalletConnectModal from "@/components/WalletConnectModal";
import { simulateMarketCreation } from "@/lib/web3";

interface AIPrediction {
  title: string;
  description: string;
  category: string;
  tags: string[];
  suggestedEndDate: Date;
  resolutionMethod: string;
  options: string[];
}

export default function AICreateMarket() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { walletAddress, connectWallet } = useWallet();
  const [userInput, setUserInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [prediction, setPrediction] = useState<AIPrediction | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const handleGenerate = async () => {
    if (!userInput.trim()) {
      toast({
        title: "Input required",
        description: "Please enter your event idea",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiRequest('POST', '/api/ai/generate-prediction', {
        userInput: userInput.trim()
      });
      const data = await response.json();
      
      setPrediction({
        ...data,
        suggestedEndDate: new Date(data.suggestedEndDate)
      });
      
      toast({
        title: "Prediction Generated!",
        description: "Review and create your market",
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreate = async () => {
    if (!walletAddress) {
      setShowWalletModal(true);
      return;
    }

    if (!prediction) return;

    setIsCreating(true);
    try {
      // Simulate blockchain transaction
      const txHash = await simulateMarketCreation(prediction);
      
      // Create market in database
      await apiRequest('POST', '/api/markets', {
        creatorWallet: walletAddress,
        title: prediction.title,
        description: prediction.description,
        category: prediction.category,
        tags: prediction.tags,
        resolutionMethod: prediction.resolutionMethod,
        endDate: prediction.suggestedEndDate.toISOString(),
        txHash,
        options: prediction.options
      });

      toast({
        title: "Market Created!",
        description: `Transaction: ${txHash.slice(0, 10)}...`,
      });

      setTimeout(() => setLocation('/'), 1500);
    } catch (error) {
      console.error("Error creating market:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create market",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        walletAddress={walletAddress}
        onWalletConnect={() => walletAddress ? undefined : setShowWalletModal(true)}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="mb-4"
          >
            ← Back to Markets
          </Button>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary" />
            AI Market Creator
          </h1>
          <p className="text-muted-foreground">
            Describe any event and AI will transform it into a verifiable prediction market
          </p>
        </div>

        <div className="space-y-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>What do you want to predict?</CardTitle>
              <CardDescription>
                Enter a casual event idea - AI will reformulate it into a clear prediction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event-idea">Your Event Idea</Label>
                <Input
                  id="event-idea"
                  placeholder="e.g., Elon Musk tweets about cats"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  disabled={isGenerating}
                  className="text-base"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !userInput.trim()}
                  className="gap-2"
                >
                  {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Sparkles className="w-4 h-4" />
                  Generate Prediction
                </Button>
                {prediction && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPrediction(null);
                      setUserInput("");
                    }}
                  >
                    Reset
                  </Button>
                )}
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium">Examples:</p>
                <p>• "Bitcoin reaches $70k this week"</p>
                <p>• "I'll go to the gym 5 times this week"</p>
                <p>• "My startup reaches 100 users before December"</p>
              </div>
            </CardContent>
          </Card>

          {/* Generated Prediction */}
          {prediction && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Generated Prediction
                </CardTitle>
                <CardDescription>Review and create your market on BNB Chain</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Market Title</Label>
                  <div className="p-3 bg-muted rounded-lg font-medium">
                    {prediction.title}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    {prediction.description}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      Category
                    </Label>
                    <Badge variant="secondary" className="text-sm">
                      {prediction.category}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      End Date
                    </Label>
                    <div className="text-sm text-muted-foreground">
                      {prediction.suggestedEndDate.toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {prediction.tags.map((tag, i) => (
                      <Badge key={i} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Options</Label>
                  <div className="flex flex-wrap gap-2">
                    {prediction.options.map((option, i) => (
                      <Badge key={i} className="px-4 py-2">
                        {option}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Resolution Method</Label>
                  <div className="text-sm text-muted-foreground">
                    {prediction.resolutionMethod}
                  </div>
                </div>

                <Button
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="w-full gap-2"
                  size="lg"
                >
                  {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Market on BNB Chain
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <WalletConnectModal
        open={showWalletModal}
        onOpenChange={setShowWalletModal}
        onConnect={connectWallet}
      />
    </div>
  );
}
