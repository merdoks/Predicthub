import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Menu, Shield, TrendingUp, Home, Sparkles, BarChart3, User, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onWalletConnect: () => void;
  walletAddress?: string;
}

export default function Header({ onWalletConnect, walletAddress }: HeaderProps) {
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 hover-elevate active-elevate-2 px-2 py-1 rounded-md whitespace-nowrap">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shrink-0">
                <span className="text-primary-foreground font-bold text-lg">P</span>
              </div>
              <span className="hidden sm:inline text-xl font-bold whitespace-nowrap">PredictHub</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/community" className="flex items-center gap-2 px-3 py-2 rounded-md hover-elevate active-elevate-2 text-sm" data-testid="link-community">
                <Users className="w-4 h-4" />
                Community
              </Link>
              <Link href="/leaderboard" className="flex items-center gap-2 px-3 py-2 rounded-md hover-elevate active-elevate-2 text-sm">
                <BarChart3 className="w-4 h-4" />
                Leaderboard
              </Link>
              <Link href="/oracle" className="flex items-center gap-2 px-3 py-2 rounded-md hover-elevate active-elevate-2 text-sm">
                <Shield className="w-4 h-4" />
                Oracle
              </Link>
              <Link href="/polymarket" className="flex items-center gap-2 px-3 py-2 rounded-md hover-elevate active-elevate-2 text-sm">
                <TrendingUp className="w-4 h-4" />
                Explore
              </Link>
              {walletAddress && (
                <Link href="/profile" className="flex items-center gap-2 px-3 py-2 rounded-md hover-elevate active-elevate-2 text-sm" data-testid="link-profile">
                  <User className="w-4 h-4" />
                  Profile
                </Link>
              )}
            </nav>

            {/* Mobile Navigation Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                  <Menu className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link href="/" className="flex items-center">
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/ai-create" className="flex items-center">
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Create
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/community" className="flex items-center" data-testid="link-community-mobile">
                    <Users className="w-4 h-4 mr-2" />
                    Community Ideas
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/leaderboard" className="flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Leaderboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/oracle" className="flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Oracle
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/polymarket" className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Explore Markets
                  </Link>
                </DropdownMenuItem>
                {walletAddress && (
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center" data-testid="link-profile-mobile">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            {walletAddress ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-card-border">
                  <div className="w-2 h-2 rounded-full bg-chart-2"></div>
                  <span className="font-mono text-sm" data-testid="text-wallet-address">
                    {truncateAddress(walletAddress)}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onWalletConnect}
                  data-testid="button-disconnect-wallet"
                  className="hidden sm:inline-flex min-h-12"
                >
                  Disconnect
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={onWalletConnect}
                  data-testid="button-wallet-connect"
                  className="sm:hidden min-h-12 min-w-12"
                >
                  <Wallet className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <Button 
                  onClick={onWalletConnect}
                  data-testid="button-wallet-connect"
                  className="hidden sm:inline-flex min-h-12"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </Button>
                <Button 
                  onClick={onWalletConnect}
                  size="icon"
                  data-testid="button-wallet-connect"
                  className="sm:hidden min-h-12 min-w-12"
                >
                  <Wallet className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
