import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PortfolioData, SUPPORTED_CHAINS } from '@/../types';
import { cn } from '@/lib/utils';

interface ChainSelectorProps {
  chains: string[];
  selectedChain: string;
  onChainChange: (chainId: string) => void;
  portfolioData: PortfolioData;
}

export const ChainSelector = ({ 
  chains, 
  selectedChain, 
  onChainChange, 
  portfolioData 
}: ChainSelectorProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: value > 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: 2
    }).format(value);
  };

  const getChainPercentage = (chainId: string) => {
    const chainValue = portfolioData.chains[chainId]?.totalValueUSD || 0;
    return (chainValue / portfolioData.totalValueUSD) * 100;
  };

  return (
    <Card className="glass-card shadow-card p-6 transition-smooth">
      <h3 className="text-lg font-semibold mb-4">Filter by Chain</h3>
      
      <div className="flex flex-wrap gap-3">
        {/* All Chains Option */}
        <Button
          variant={selectedChain === 'all' ? 'default' : 'outline'}
          onClick={() => onChainChange('all')}
          className={cn(
            "transition-smooth",
            selectedChain === 'all' && "gradient-primary shadow-primary"
          )}
        >
          <span className="mr-2">🌐</span>
          All Chains
          <Badge variant="secondary" className="ml-2">
            {formatCurrency(portfolioData.totalValueUSD)}
          </Badge>
        </Button>

        {/* Individual Chain Options */}
        {chains.map((chainId) => {
          const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
          const chainData = portfolioData.chains[chainId];
          const percentage = getChainPercentage(chainId);
          
          if (!chain || !chainData) return null;

          return (
            <Button
              key={chainId}
              variant={selectedChain === chainId ? 'default' : 'outline'}
              onClick={() => onChainChange(chainId)}
              className={cn(
                "transition-smooth",
                selectedChain === chainId && "gradient-primary shadow-primary"
              )}
            >
              <span className="mr-2">{chain.logo}</span>
              {chain.name}
              <div className="ml-2 flex items-center gap-1">
                <Badge variant="secondary">
                  {formatCurrency(chainData.totalValueUSD)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {percentage.toFixed(1)}%
                </Badge>
              </div>
            </Button>
          );
        })}
      </div>
      
      {selectedChain !== 'all' && (
        <div className="mt-4 p-4 bg-card rounded-lg border border-card-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(() => {
                const chain = SUPPORTED_CHAINS.find(c => c.id === selectedChain);
                return (
                  <>
                    <span className="text-lg">{chain?.logo}</span>
                    <span className="font-medium">{chain?.name} Portfolio</span>
                  </>
                );
              })()}
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">
                {formatCurrency(portfolioData.chains[selectedChain]?.totalValueUSD || 0)}
              </p>
              <p className="text-sm text-muted-foreground">
                {portfolioData.chains[selectedChain]?.tokens.length || 0} tokens
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};