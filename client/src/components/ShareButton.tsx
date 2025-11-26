import { Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  testId?: string;
}

export function ShareButton({ 
  title, 
  text, 
  url, 
  variant = "ghost", 
  size = "icon",
  testId = "button-share"
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const shareUrl = url || window.location.href;
  
  const handleShare = async () => {
    const shareData = {
      title,
      text,
      url: shareUrl,
    };
    
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
          toast({
            title: "Sharing failed",
            description: "Please try again",
            variant: "destructive",
          });
        }
      }
    } else {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          toast({
            title: "Link copied!",
            description: "Share this link with your friends",
          });
          setTimeout(() => setCopied(false), 2000);
        } else {
          toast({
            title: "Copy not supported",
            description: "Please copy the URL manually",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        toast({
          title: "Failed to copy",
          description: "Please copy the URL manually",
          variant: "destructive",
        });
      }
    }
  };
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      data-testid={testId}
      title="Share this market"
    >
      {copied ? (
        <Check className="h-4 w-4" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
    </Button>
  );
}

export function ShareButtonWithText({ title, text, url, testId = "button-share-text" }: Omit<ShareButtonProps, 'variant' | 'size'>) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const shareUrl = url || window.location.href;
  
  const handleShare = async () => {
    const shareData = {
      title,
      text,
      url: shareUrl,
    };
    
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
          toast({
            title: "Sharing failed",
            description: "Please try again",
            variant: "destructive",
          });
        }
      }
    } else {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          toast({
            title: "Link copied!",
            description: "Share this link with your friends",
          });
          setTimeout(() => setCopied(false), 2000);
        } else {
          toast({
            title: "Copy not supported",
            description: "Please copy the URL manually",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        toast({
          title: "Failed to copy",
          description: "Please copy the URL manually",
          variant: "destructive",
        });
      }
    }
  };
  
  return (
    <Button
      variant="outline"
      onClick={handleShare}
      data-testid={testId}
      className="gap-2"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </>
      )}
    </Button>
  );
}
