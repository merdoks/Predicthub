import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Shield, CheckCircle, Clock, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import { useWallet } from "@/contexts/WalletContext";

interface OracleVerification {
  id: string;
  eventTitle: string;
  dataSource: string;
  result: string;
  verificationSummary: string;
  timestamp: string;
  status: "verified" | "pending" | "disputed";
}

export default function Oracle() {
  const { toast } = useToast();
  const { walletAddress, connectWallet, disconnectWallet } = useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);
  
  const [formData, setFormData] = useState({
    eventTitle: "",
    dataSource: "manual",
    result: "",
  });

  const { data: verifications = [] } = useQuery<OracleVerification[]>({
    queryKey: ['/api/oracle/verifications'],
  });

  const verifyMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest('POST', '/api/oracle/verify', {
        ...data,
        verifierWallet: walletAddress,
      });
    },
    onSuccess: () => {
      toast({
        title: "Verification Submitted!",
        description: "Your oracle verification has been recorded on-chain.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/oracle/verifications'] });
      setFormData({ eventTitle: "", dataSource: "manual", result: "" });
    },
    onError: () => {
      toast({
        title: "Verification Failed",
        description: "Unable to submit oracle verification.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) {
      setShowWalletModal(true);
      return;
    }
    verifyMutation.mutate(formData);
  };

  const handleWalletConnect = () => {
    if (walletAddress) {
      disconnectWallet();
    } else {
      setShowWalletModal(true);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="w-4 h-4 text-chart-2" />;
      case "pending":
        return <Clock className="w-4 h-4 text-chart-3" />;
      case "disputed":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onWalletConnect={handleWalletConnect}
        walletAddress={walletAddress}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Oracle Verification Engine</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Submit and verify prediction market outcomes with decentralized oracle data.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Submit Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="eventTitle">Event Title</Label>
                  <Input
                    id="eventTitle"
                    placeholder="e.g., Bitcoin price on Jan 1, 2025"
                    value={formData.eventTitle}
                    onChange={(e) => setFormData({ ...formData, eventTitle: e.target.value })}
                    required
                    data-testid="input-oracle-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataSource">Data Source</Label>
                  <Select
                    value={formData.dataSource}
                    onValueChange={(value) => setFormData({ ...formData, dataSource: value })}
                  >
                    <SelectTrigger data-testid="select-data-source">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Verification</SelectItem>
                      <SelectItem value="api">External API</SelectItem>
                      <SelectItem value="chainlink">Chainlink Oracle</SelectItem>
                      <SelectItem value="community">Community Vote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="result">Verification Result</Label>
                  <Textarea
                    id="result"
                    placeholder="Enter the verified outcome or result..."
                    value={formData.result}
                    onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                    required
                    rows={4}
                    data-testid="input-oracle-result"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={verifyMutation.isPending}
                  data-testid="button-submit-verification"
                >
                  {verifyMutation.isPending ? "Submitting..." : "Submit Verification"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Verifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {verifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No verifications yet. Be the first to submit!
                  </div>
                ) : (
                  verifications.slice(0, 5).map((verification) => (
                    <div
                      key={verification.id}
                      className="p-4 rounded-lg border border-border hover-elevate"
                      data-testid={`verification-${verification.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-semibold mb-1">{verification.eventTitle}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {verification.result}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {getStatusIcon(verification.status)}
                          <Badge variant={verification.status === "verified" ? "default" : "secondary"}>
                            {verification.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Source: {verification.dataSource}</span>
                        <span>{new Date(verification.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
