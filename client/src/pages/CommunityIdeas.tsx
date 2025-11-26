import { useState, useEffect } from "react";
import Header from "@/components/Header";
import WalletConnectModal from "@/components/WalletConnectModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { ArrowLeft, TrendingUp, MessageSquare, Share2, Plus, Sparkles } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useWallet } from "@/contexts/WalletContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { MarketProposal } from "@shared/schema";
import { generatePrediction } from "@/lib/ai-service";

const CATEGORIES = ["Sports", "Politics", "Entertainment", "Technology", "Finance", "Crypto", "Community", "Personal", "Science", "Other"];

export default function CommunityIdeas() {
  const [, setLocation] = useLocation();
  const { walletAddress, connectWallet, disconnectWallet } = useWallet();
  const { toast } = useToast();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "proposed" | "created">("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Form state
  const [userInput, setUserInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Community");
  const [tags, setTags] = useState("");

  // Fetch proposals
  const { data: proposals = [], isLoading, isError, error } = useQuery<MarketProposal[]>({
    queryKey: filter === "all" ? ['/api/proposals'] : [`/api/proposals?status=${filter}`],
  });

  // Create proposal mutation
  const createProposalMutation = useMutation({
    mutationFn: async (proposal: { proposerWallet: string; title: string; description: string; category: string; tags: string[] }) => {
      const res = await apiRequest('POST', '/api/proposals', proposal);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
      toast({
        title: "Proposal created!",
        description: "Your market idea has been submitted for community voting.",
      });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Failed to create proposal",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    },
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ proposalId, voterWallet }: { proposalId: string; voterWallet: string }) => {
      const res = await apiRequest('POST', `/api/proposals/${proposalId}/vote`, { voterWallet });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
      toast({
        title: "Vote recorded!",
        description: "Your vote has been counted.",
      });
    },
    onError: (error: Error) => {
      const is409 = error.message.includes("409");
      toast({
        title: is409 ? "Already voted" : "Failed to vote",
        description: is409 ? "You've already voted for this proposal" : "Please try again",
        variant: "destructive",
      });
    },
  });

  // Unvote mutation
  const unvoteMutation = useMutation({
    mutationFn: async ({ proposalId, voterWallet }: { proposalId: string; voterWallet: string }) => {
      const res = await apiRequest('DELETE', `/api/proposals/${proposalId}/vote`, { voterWallet });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
    },
  });

  const handleWalletConnect = () => {
    if (walletAddress) {
      disconnectWallet();
    } else {
      setShowWalletModal(true);
    }
  };

  const handleWalletConnected = async () => {
    await connectWallet();
  };

  const handleAIGenerate = async () => {
    if (!userInput.trim()) {
      toast({
        title: "Input required",
        description: "Please describe your market idea",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const prediction = await generatePrediction(userInput);
      setTitle(prediction.title);
      setDescription(prediction.description);
      setCategory(prediction.category);
      setTags(prediction.tags.join(", "));
    } catch (error) {
      toast({
        title: "AI generation failed",
        description: "Please try again or fill in the details manually",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateProposal = () => {
    if (!walletAddress) {
      setShowWalletModal(true);
      return;
    }

    if (!title.trim() || !description.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a title and description",
        variant: "destructive",
      });
      return;
    }

    const tagArray = tags
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0);

    createProposalMutation.mutate({
      proposerWallet: walletAddress,
      title: title.trim(),
      description: description.trim(),
      category,
      tags: tagArray,
    });
  };

  const resetForm = () => {
    setUserInput("");
    setTitle("");
    setDescription("");
    setCategory("Community");
    setTags("");
  };

  const handleVote = async (proposalId: string) => {
    if (!walletAddress) {
      setShowWalletModal(true);
      return;
    }

    // Check if user already voted
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return;

    voteMutation.mutate({ proposalId, voterWallet: walletAddress });
  };

  const handleShare = async (proposal: MarketProposal) => {
    const shareData = {
      title: `${proposal.title} - PredictHub Community Idea`,
      text: `Vote on this market idea: ${proposal.title}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "Share this proposal with your community",
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  // Show error toast if query fails (using useEffect to prevent infinite re-renders)
  useEffect(() => {
    if (isError && error) {
      toast({
        title: "Failed to load proposals",
        description: error instanceof Error ? error.message : "Please try refreshing the page",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const filteredProposals = filter === "all" 
    ? proposals 
    : proposals.filter(p => p.status === filter);

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onWalletConnect={handleWalletConnect}
        walletAddress={walletAddress}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => setLocation('/')}
            className="mb-4"
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Markets
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Community Ideas</h1>
              <p className="text-muted-foreground">
                Propose and vote on new prediction market topics
              </p>
            </div>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="lg" data-testid="button-create-proposal">
                  <Plus className="w-4 h-4 mr-2" />
                  Propose Market
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Propose a New Market</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* AI Input */}
                  <div className="space-y-2">
                    <Label>Describe your idea (AI will help format it)</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="E.g., Will Bitcoin reach $100k by end of year?"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        data-testid="input-ai-idea"
                      />
                      <Button
                        onClick={handleAIGenerate}
                        disabled={isGenerating || !userInput.trim()}
                        data-testid="button-ai-generate"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {isGenerating ? "Generating..." : "AI Help"}
                      </Button>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Will...?"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      data-testid="input-proposal-title"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what this market would predict..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      data-testid="input-proposal-description"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger data-testid="select-proposal-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      placeholder="crypto, bitcoin, price"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      data-testid="input-proposal-tags"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateDialog(false);
                        resetForm();
                      }}
                      data-testid="button-cancel-proposal"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateProposal}
                      disabled={createProposalMutation.isPending || !title.trim() || !description.trim()}
                      data-testid="button-submit-proposal"
                    >
                      {createProposalMutation.isPending ? "Creating..." : "Create Proposal"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filter tabs */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList>
              <TabsTrigger value="all" data-testid="filter-all">
                All Ideas
              </TabsTrigger>
              <TabsTrigger value="proposed" data-testid="filter-proposed">
                Open Proposals
              </TabsTrigger>
              <TabsTrigger value="created" data-testid="filter-created">
                Created Markets
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Proposals List */}
        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {filter === "all" 
                ? "No proposals yet. Be the first to suggest a market!" 
                : `No ${filter} proposals found.`}
            </p>
            {filter !== "all" && (
              <Button variant="outline" onClick={() => setFilter("all")}>
                View All Proposals
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProposals.map((proposal) => (
              <Card key={proposal.id} className="p-6" data-testid={`proposal-${proposal.id}`}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold" data-testid={`proposal-title-${proposal.id}`}>
                        {proposal.title}
                      </h3>
                      <Badge variant="secondary" data-testid={`proposal-category-${proposal.id}`}>
                        {proposal.category}
                      </Badge>
                      {proposal.status === "created" && (
                        <Badge variant="default" data-testid={`proposal-status-${proposal.id}`}>
                          Market Created
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-muted-foreground mb-3" data-testid={`proposal-description-${proposal.id}`}>
                      {proposal.description}
                    </p>
                    
                    {proposal.tags && proposal.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {proposal.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        Proposed by {proposal.proposerWallet.slice(0, 6)}...{proposal.proposerWallet.slice(-4)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex sm:flex-col items-center sm:items-end gap-2">
                    <Button
                      variant={proposal.votes > 0 ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleVote(proposal.id)}
                      disabled={!walletAddress || voteMutation.isPending}
                      data-testid={`button-vote-${proposal.id}`}
                      className="gap-1"
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-semibold" data-testid={`proposal-votes-${proposal.id}`}>
                        {voteMutation.isPending ? "..." : proposal.votes}
                      </span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare(proposal)}
                      data-testid={`button-share-${proposal.id}`}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <WalletConnectModal
        open={showWalletModal}
        onOpenChange={setShowWalletModal}
        onConnect={handleWalletConnected}
      />
    </div>
  );
}
