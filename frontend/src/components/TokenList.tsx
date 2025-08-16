import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, TrendingUp, TrendingDown, ArrowUpDown, ExternalLink } from 'lucide-react';
import { Token, SUPPORTED_CHAINS } from '@/../types';
import { cn } from '@/lib/utils';

interface TokenListProps {
  tokens: Token[];
  totalValue: number;
  isLoading?: boolean;
}

type SortField = 'symbol' | 'balance' | 'balanceUSD' | 'priceChange24h';
type SortDirection = 'asc' | 'desc';

export const TokenList = ({ tokens, totalValue, isLoading }: TokenListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('balanceUSD');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value: string, decimals?: number) => {
    const num = parseFloat(value);
    if (num === 0) return '0';
    if (num < 0.01) return '<0.01';
    if (num > 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    }
    if (num > 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toLocaleString('en-US', { 
      maximumFractionDigits: decimals || 4 
    });
  };

  const getTokenPercentage = (tokenValue: number) => {
    return totalValue > 0 ? (tokenValue / totalValue) * 100 : 0;
  };

  const getChainInfo = (chainId: string) => {
    return SUPPORTED_CHAINS.find(chain => chain.id === chainId);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedTokens = tokens
    .filter(token => 
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'balance') {
        aValue = parseFloat(a.balance);
        bValue = parseFloat(b.balance);
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  if (isLoading) {
    return (
      <Card className="glass-card shadow-card p-6">
        <div className="space-y-4">
          <div className="h-10 bg-muted animate-pulse rounded" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-muted animate-pulse rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
                <div className="h-3 bg-muted animate-pulse rounded w-1/6" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-20" />
                <div className="h-3 bg-muted animate-pulse rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card shadow-card transition-smooth">
      <div className="p-6 border-b border-card-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Token Holdings</h3>
          <Badge variant="outline">
            {filteredAndSortedTokens.length} tokens
          </Badge>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tokens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 pb-3 border-b border-card-border text-sm text-muted-foreground">
          <div className="col-span-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSort('symbol')}
              className="h-auto p-0 font-normal"
            >
              Token
              <ArrowUpDown className="ml-1 w-3 h-3" />
            </Button>
          </div>
          <div className="col-span-2 text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSort('balance')}
              className="h-auto p-0 font-normal"
            >
              Balance
              <ArrowUpDown className="ml-1 w-3 h-3" />
            </Button>
          </div>
          <div className="col-span-2 text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSort('balanceUSD')}
              className="h-auto p-0 font-normal"
            >
              Value
              <ArrowUpDown className="ml-1 w-3 h-3" />
            </Button>
          </div>
          <div className="col-span-2 text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSort('priceChange24h')}
              className="h-auto p-0 font-normal"
            >
              24h Change
              <ArrowUpDown className="ml-1 w-3 h-3" />
            </Button>
          </div>
          <div className="col-span-2 text-right">Allocation</div>
        </div>

        {/* Token List */}
        <div className="space-y-3 mt-4">
          {filteredAndSortedTokens.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No tokens found matching your search.' : 'No tokens found.'}
            </div>
          ) : (
            filteredAndSortedTokens.map((token, index) => {
              const chainInfo = getChainInfo(token.chain);
              const percentage = getTokenPercentage(token.balanceUSD);
              const isPositiveChange = (token.priceChange24h || 0) >= 0;

              return (
                <div
                  key={`${token.address}-${token.chain}`}
                  className="grid grid-cols-12 gap-4 items-center py-3 px-2 rounded-lg hover:bg-card/50 transition-smooth group"
                >
                  {/* Token Info */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-lg">
                        {token.logo || token.symbol.charAt(0)}
                      </div>
                      {chainInfo && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-background rounded-full flex items-center justify-center border border-card-border text-xs">
                          {chainInfo.logo}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{token.symbol}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-smooth"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">{token.name}</p>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="col-span-2 text-right">
                    <p className="font-medium">{formatNumber(token.balance)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(token.price)}
                    </p>
                  </div>

                  {/* USD Value */}
                  <div className="col-span-2 text-right">
                    <p className="font-medium">{formatCurrency(token.balanceUSD)}</p>
                  </div>

                  {/* 24h Change */}
                  <div className="col-span-2 text-right">
                    <div className={cn(
                      "flex items-center justify-end gap-1",
                      isPositiveChange ? "text-success" : "text-danger"
                    )}>
                      {isPositiveChange ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span className="text-sm font-medium">
                        {isPositiveChange ? '+' : ''}{(token.priceChange24h || 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Allocation */}
                  <div className="col-span-2 text-right">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{percentage.toFixed(1)}%</p>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className="bg-primary rounded-full h-1.5 transition-smooth"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
};