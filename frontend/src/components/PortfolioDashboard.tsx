import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Layers, AlertCircle } from 'lucide-react';
import { PortfolioData, WalletConnection, SUPPORTED_CHAINS } from '@/../types';
import { ChainSelector } from './ChainSelector';
import { TokenList } from './TokenList';
import { PortfolioSummary } from './PortfolioSummary';
import { useToast } from '@/hooks/use-toast';
import { usePortfolio } from '@/hooks/use-api';
import api from '@/services/api';

interface PortfolioDashboardProps {
  connection: WalletConnection;
}

export const PortfolioDashboard = ({ connection }: PortfolioDashboardProps) => {
  const [selectedChain, setSelectedChain] = useState<string>('all');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const { toast } = useToast();
  
  // Use the API hook for fetching portfolio data
  const { 
    data: portfolioData, 
    loading: isLoading, 
    error, 
    retry 
  } = usePortfolio(connection.address);

  // Handle refresh with toast notification
  const handleRefresh = () => {
    setLastRefresh(new Date());
    retry();
    toast({
      title: "Portfolio Refreshed",
      description: "Fetching latest data from blockchain...",
    });
  };

  // Show error messages when API calls fail
  useEffect(() => {
    if (error) {
      toast({
        title: "Failed to Load Portfolio",
        description: error,
        variant: "destructive"
      });
    }
  }, [error, toast]);

  const getFilteredTokens = () => {
    if (!portfolioData) return [];
    
    if (selectedChain === 'all') {
      return Object.values(portfolioData.chains).flatMap(chain => chain.tokens);
    }
    
    return portfolioData.chains[selectedChain]?.tokens || [];
  };

  const getSelectedChainValue = () => {
    if (!portfolioData) return 0;
    
    if (selectedChain === 'all') {
      return portfolioData.totalValueUSD;
    }
    
    return portfolioData.chains[selectedChain]?.totalValueUSD || 0;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (isLoading && !portfolioData) {
    return (
      <div className="space-y-6">
        <Card className="glass-card shadow-card p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center pulse-glow">
              <Layers className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Loading Portfolio</h3>
              <p className="text-muted-foreground">
                Fetching your multi-chain DeFi portfolio data...
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!portfolioData) {
    return (
      <Card className="glass-card shadow-card p-8 text-center">
        <div className="space-y-4">
          <DollarSign className="w-16 h-16 mx-auto text-muted-foreground" />
          <div>
            <h3 className="text-xl font-semibold mb-2">No Portfolio Data</h3>
            <p className="text-muted-foreground">
              Unable to load portfolio data for this address.
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const filteredTokens = getFilteredTokens();
  const selectedChainValue = getSelectedChainValue();

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <Card className="glass-card shadow-card p-6 transition-smooth">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
              Portfolio Overview
            </h2>
            <p className="text-muted-foreground">
              Last updated {formatTimeAgo(lastRefresh)}
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
            <p className="text-3xl font-bold">
              {formatCurrency(portfolioData.totalValueUSD)}
            </p>
            <div className="flex items-center gap-1 text-sm text-success">
              <TrendingUp className="w-4 h-4" />
              <span>+2.45% (24h)</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Active Chains</p>
            <p className="text-2xl font-semibold">
              {Object.keys(portfolioData.chains).length}
            </p>
            <div className="flex gap-1">
              {Object.keys(portfolioData.chains).map(chainId => {
                const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
                return (
                  <Badge key={chainId} variant="secondary" className="text-xs">
                    {chain?.logo} {chain?.name}
                  </Badge>
                );
              })}
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total Tokens</p>
            <p className="text-2xl font-semibold">
              {Object.values(portfolioData.chains).reduce((acc, chain) => acc + chain.tokens.length, 0)}
            </p>
            <p className="text-sm text-muted-foreground">
              Across {Object.keys(portfolioData.chains).length} networks
            </p>
          </div>
        </div>
      </Card>

      {/* Chain Selector */}
      <ChainSelector
        chains={Object.keys(portfolioData.chains)}
        selectedChain={selectedChain}
        onChainChange={setSelectedChain}
        portfolioData={portfolioData}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Token List */}
        <div className="lg:col-span-2">
          <TokenList
            tokens={filteredTokens}
            totalValue={selectedChainValue}
            isLoading={isLoading}
          />
        </div>

        {/* Portfolio Summary */}
        <div>
          <PortfolioSummary portfolioData={portfolioData} />
        </div>
      </div>
    </div>
  );
};