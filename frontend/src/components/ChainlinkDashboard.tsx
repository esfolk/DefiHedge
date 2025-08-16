import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Activity, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import { ChainlinkPriceFeed } from './ChainlinkPriceFeed';

interface NetworkStatus {
  status: string;
  active_nodes?: number;
  total_feeds?: number;
  network_health?: string;
  last_update?: string;
}

interface SupportedFeeds {
  feeds: Record<string, string[]>;
  total_feeds: number;
  chains: string[];
}

interface CrossChainPrice {
  symbol: string;
  chains: Record<string, any>;
  price_variance: number;
}

interface ChainlinkDashboardProps {
  defaultSymbols?: string[];
  autoRefresh?: boolean;
}

export const ChainlinkDashboard: React.FC<ChainlinkDashboardProps> = ({
  defaultSymbols = ['ETH/USD', 'BTC/USD', 'LINK/USD', 'USDC/USD'],
  autoRefresh = true
}) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
  const [supportedFeeds, setSupportedFeeds] = useState<SupportedFeeds | null>(null);
  const [crossChainPrices, setCrossChainPrices] = useState<Record<string, CrossChainPrice>>({});
  const [selectedSymbol, setSelectedSymbol] = useState<string>('ETH/USD');
  const [selectedChain, setSelectedChain] = useState<string>('ethereum');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNetworkStatus = async () => {
    try {
      const response = await fetch('/api/chainlink/network/status');
      if (response.ok) {
        const data = await response.json();
        setNetworkStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch network status:', err);
    }
  };

  const fetchSupportedFeeds = async () => {
    try {
      const response = await fetch('/api/chainlink/feeds');
      if (response.ok) {
        const data = await response.json();
        setSupportedFeeds(data);
      }
    } catch (err) {
      console.error('Failed to fetch supported feeds:', err);
    }
  };

  const fetchCrossChainPrices = async (symbol: string) => {
    try {
      const response = await fetch(`/api/chainlink/price/${symbol}/cross-chain`);
      if (response.ok) {
        const data = await response.json();
        setCrossChainPrices(prev => ({
          ...prev,
          [symbol]: data
        }));
      }
    } catch (err) {
      console.error(`Failed to fetch cross-chain prices for ${symbol}:`, err);
    }
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        await Promise.all([
          fetchNetworkStatus(),
          fetchSupportedFeeds(),
          ...defaultSymbols.map(symbol => fetchCrossChainPrices(symbol))
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize dashboard');
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();

    if (autoRefresh) {
      const interval = setInterval(initializeDashboard, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getNetworkHealthColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'online':
        return 'text-green-500';
      case 'warning':
        return 'text-orange-500';
      case 'error':
      case 'offline':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getNetworkHealthIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'error':
      case 'offline':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatVariance = (variance: number) => {
    return `±${variance.toFixed(4)}`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading Chainlink Oracle Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Network Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Chainlink Oracle Network
                {networkStatus && getNetworkHealthIcon(networkStatus.status)}
              </CardTitle>
              <CardDescription>
                Real-time price feeds and network status
              </CardDescription>
            </div>
            <div className="text-right">
              <Button
                onClick={() => window.location.reload()}
                variant="ghost"
                size="sm"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {networkStatus && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Network Status</p>
                <p className={`font-semibold ${getNetworkHealthColor(networkStatus.status)}`}>
                  {networkStatus.status?.charAt(0).toUpperCase() + networkStatus.status?.slice(1)}
                </p>
              </div>
              
              {networkStatus.active_nodes && (
                <div>
                  <p className="text-sm text-muted-foreground">Active Nodes</p>
                  <p className="font-semibold">{networkStatus.active_nodes.toLocaleString()}</p>
                </div>
              )}
              
              {networkStatus.total_feeds && (
                <div>
                  <p className="text-sm text-muted-foreground">Total Feeds</p>
                  <p className="font-semibold">{networkStatus.total_feeds.toLocaleString()}</p>
                </div>
              )}
              
              {supportedFeeds && (
                <div>
                  <p className="text-sm text-muted-foreground">Supported Chains</p>
                  <p className="font-semibold">{supportedFeeds.chains.length}</p>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Price Feeds Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual Feeds</TabsTrigger>
          <TabsTrigger value="cross-chain">Cross-Chain</TabsTrigger>
          <TabsTrigger value="feeds">All Feeds</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {defaultSymbols.map((symbol) => (
              <ChainlinkPriceFeed
                key={symbol}
                symbol={symbol}
                chain="ethereum"
                showVolatility={true}
                autoRefresh={autoRefresh}
              />
            ))}
          </div>
        </TabsContent>

        {/* Individual Feeds Tab */}
        <TabsContent value="individual" className="space-y-4">
          <div className="flex gap-4 items-center">
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select price feed" />
              </SelectTrigger>
              <SelectContent>
                {supportedFeeds && Object.keys(supportedFeeds.feeds).map((symbol) => (
                  <SelectItem key={symbol} value={symbol}>
                    {symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedChain} onValueChange={setSelectedChain}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select chain" />
              </SelectTrigger>
              <SelectContent>
                {supportedFeeds && supportedFeeds.chains.map((chain) => (
                  <SelectItem key={chain} value={chain}>
                    {chain.charAt(0).toUpperCase() + chain.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ChainlinkPriceFeed
            key={`${selectedSymbol}-${selectedChain}`}
            symbol={selectedSymbol}
            chain={selectedChain}
            showVolatility={true}
            autoRefresh={autoRefresh}
          />
        </TabsContent>

        {/* Cross-Chain Comparison Tab */}
        <TabsContent value="cross-chain" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(crossChainPrices).map(([symbol, data]) => (
              <Card key={symbol}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {symbol} Cross-Chain Comparison
                    <Badge variant="outline">
                      Variance: {formatVariance(data.price_variance)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(data.chains).map(([chain, priceData]: [string, any]) => (
                      <div key={chain} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">
                            {chain.charAt(0).toUpperCase() + chain.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-lg font-bold">
                          ${priceData.price?.toFixed(2) || 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Updated: {priceData.updated_at ? new Date(priceData.updated_at).toLocaleTimeString() : 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* All Feeds Tab */}
        <TabsContent value="feeds" className="space-y-4">
          {supportedFeeds && (
            <Card>
              <CardHeader>
                <CardTitle>Supported Price Feeds</CardTitle>
                <CardDescription>
                  {supportedFeeds.total_feeds} price feeds across {supportedFeeds.chains.length} chains
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {Object.entries(supportedFeeds.feeds).map(([symbol, chains]) => (
                    <div key={symbol} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{symbol}</p>
                        <div className="flex gap-1 mt-1">
                          {chains.map((chain) => (
                            <Badge key={chain} variant="outline" className="text-xs">
                              {chain}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {chains.length} chain{chains.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
