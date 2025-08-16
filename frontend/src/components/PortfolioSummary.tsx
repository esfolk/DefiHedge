import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, PieChart, Trophy, Target } from 'lucide-react';
import { PortfolioData, SUPPORTED_CHAINS } from '@/../types';

interface PortfolioSummaryProps {
  portfolioData: PortfolioData;
}

export const PortfolioSummary = ({ portfolioData }: PortfolioSummaryProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: value > 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: 2
    }).format(value);
  };

  // Calculate chain distribution
  const chainDistribution = Object.entries(portfolioData.chains).map(([chainId, chainData]) => {
    const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
    return {
      chainId,
      name: chain?.name || 'Unknown',
      logo: chain?.logo || '?',
      value: chainData.totalValueUSD,
      percentage: (chainData.totalValueUSD / portfolioData.totalValueUSD) * 100
    };
  }).sort((a, b) => b.value - a.value);

  // Get top holdings across all chains
  const allTokens = Object.values(portfolioData.chains).flatMap(chain => chain.tokens);
  const topHoldings = allTokens
    .sort((a, b) => b.balanceUSD - a.balanceUSD)
    .slice(0, 5);

  // Calculate summary stats
  const totalTokens = allTokens.length;
  const totalChains = Object.keys(portfolioData.chains).length;

  // Portfolio health indicators
  const diversificationScore = Math.min(100, (totalTokens / 10) * 100);
  const chainDiversification = Math.min(100, (totalChains / 5) * 100);

  return (
    <div className="space-y-6">
      {/* Portfolio Stats */}
      <Card className="glass-card shadow-card p-6 transition-smooth">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Portfolio Stats</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Value</span>
            <span className="font-semibold">{formatCurrency(portfolioData.totalValueUSD)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Tokens</span>
            <span className="font-semibold">{totalTokens}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Active Chains</span>
            <span className="font-semibold">{totalChains}</span>
          </div>
          
          <div className="pt-2 border-t border-card-border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Diversification</span>
              <span className="font-semibold">{diversificationScore.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary to-primary-glow rounded-full h-2 transition-smooth"
                style={{ width: `${diversificationScore}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Chain Distribution */}
      <Card className="glass-card shadow-card p-6 transition-smooth">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Chain Distribution</h3>
        </div>
        
        <div className="space-y-3">
          {chainDistribution.map((chain) => (
            <div key={chain.chainId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{chain.logo}</span>
                  <span className="font-medium">{chain.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(chain.value)}</p>
                  <p className="text-sm text-muted-foreground">{chain.percentage.toFixed(1)}%</p>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-smooth"
                  style={{ width: `${chain.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Holdings */}
      <Card className="glass-card shadow-card p-6 transition-smooth">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Top Holdings</h3>
        </div>
        
        <div className="space-y-3">
          {topHoldings.map((token, index) => {
            const chain = SUPPORTED_CHAINS.find(c => c.id === token.chain);
            const percentage = (token.balanceUSD / portfolioData.totalValueUSD) * 100;
            
            return (
              <div key={`${token.address}-${token.chain}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-card/50 transition-smooth">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs w-6 h-6 rounded-full p-0 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <div className="relative">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm">
                      {token.logo || token.symbol.charAt(0)}
                    </div>
                    {chain && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-background rounded-full flex items-center justify-center border border-card-border text-xs">
                        {chain.logo}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{token.symbol}</p>
                    <p className="text-xs text-muted-foreground">{token.name}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold text-sm">{formatCurrency(token.balanceUSD)}</p>
                  <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Performance Indicators */}
      <Card className="glass-card shadow-card p-6 transition-smooth">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-success" />
          <h3 className="text-lg font-semibold">Performance</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-success/5 rounded-lg border border-success/20">
            <p className="text-2xl font-bold text-success">+12.34%</p>
            <p className="text-xs text-muted-foreground">24h Change</p>
          </div>
          
          <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-2xl font-bold text-primary">+45.67%</p>
            <p className="text-xs text-muted-foreground">7d Change</p>
          </div>
          
          <div className="text-center p-3 bg-warning/5 rounded-lg border border-warning/20">
            <p className="text-2xl font-bold text-warning">+234.5%</p>
            <p className="text-xs text-muted-foreground">30d Change</p>
          </div>
          
          <div className="text-center p-3 bg-muted rounded-lg border border-card-border">
            <p className="text-2xl font-bold">+1,234%</p>
            <p className="text-xs text-muted-foreground">All Time</p>
          </div>
        </div>
      </Card>
    </div>
  );
};