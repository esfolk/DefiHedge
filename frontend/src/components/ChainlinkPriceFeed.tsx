import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChainlinkPriceData {
  symbol: string;
  price: number;
  decimals: number;
  updated_at: string;
  round_id: string;
  chain: string;
  feed_address: string;
}

interface ChainlinkVolatility {
  volatility_percent: number;
  mean_price: number;
  min_price: number;
  max_price: number;
  price_range_percent: number;
}

interface ChainlinkPriceFeedProps {
  symbol: string;
  chain?: string;
  showVolatility?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const ChainlinkPriceFeed: React.FC<ChainlinkPriceFeedProps> = ({
  symbol,
  chain = 'ethereum',
  showVolatility = false,
  autoRefresh = true,
  refreshInterval = 30000
}) => {
  const [priceData, setPriceData] = useState<ChainlinkPriceData | null>(null);
  const [volatilityData, setVolatilityData] = useState<ChainlinkVolatility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPriceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/chainlink/price/${symbol}?chain=${chain}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch price data: ${response.statusText}`);
      }

      const data = await response.json();
      setPriceData(data);
      setLastUpdated(new Date());

      if (showVolatility) {
        const volatilityResponse = await fetch(`/api/chainlink/price/${symbol}/volatility?chain=${chain}&period=24`);
        
        if (volatilityResponse.ok) {
          const volatilityInfo = await volatilityResponse.json();
          setVolatilityData(volatilityInfo);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceData();

    if (autoRefresh) {
      const interval = setInterval(fetchPriceData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [symbol, chain, autoRefresh, refreshInterval]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(price);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  };

  const getVolatilityColor = (volatility: number) => {
    if (volatility > 10) return 'text-red-500';
    if (volatility > 5) return 'text-orange-500';
    return 'text-green-500';
  };

  const getPriceChangeIcon = () => {
    if (!volatilityData) return null;
    
    const currentPrice = priceData?.price || 0;
    const meanPrice = volatilityData.mean_price;
    
    if (currentPrice > meanPrice) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (currentPrice < meanPrice) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading {symbol} Price Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            Error Loading Price Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={fetchPriceData} 
            variant="outline" 
            size="sm" 
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!priceData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>No Price Data Available</CardTitle>
          <CardDescription>
            Price feed for {symbol} on {chain} is not available
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {symbol} Price Feed
              {getPriceChangeIcon()}
            </CardTitle>
            <CardDescription>
              Chainlink Oracle on {chain.charAt(0).toUpperCase() + chain.slice(1)}
            </CardDescription>
          </div>
          <div className="text-right">
            <Button
              onClick={fetchPriceData}
              variant="ghost"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Price */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Current Price</p>
            <p className="text-2xl font-bold">{formatPrice(priceData.price)}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Last Updated</p>
            <p className="text-sm">{formatTime(priceData.updated_at)}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Round ID</p>
            <p className="text-sm font-mono">#{priceData.round_id}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Decimals</p>
            <p className="text-sm">{priceData.decimals}</p>
          </div>
        </div>

        {/* Volatility Information */}
        {showVolatility && volatilityData && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">24-Hour Volatility Analysis</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Volatility</p>
                <p className={`text-sm font-semibold ${getVolatilityColor(volatilityData.volatility_percent)}`}>
                  {volatilityData.volatility_percent.toFixed(2)}%
                </p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground">Min Price</p>
                <p className="text-sm">{formatPrice(volatilityData.min_price)}</p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground">Max Price</p>
                <p className="text-sm">{formatPrice(volatilityData.max_price)}</p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground">Range</p>
                <p className="text-sm">{volatilityData.price_range_percent.toFixed(2)}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Feed Information */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Feed Information</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Chain: {chain}</Badge>
            <Badge variant="outline">
              Address: {priceData.feed_address.slice(0, 6)}...{priceData.feed_address.slice(-4)}
            </Badge>
            {lastUpdated && (
              <Badge variant="outline">
                Refreshed: {lastUpdated.toLocaleTimeString()}
              </Badge>
            )}
          </div>
        </div>

        {/* Health Status Indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          <span>Feed is healthy and up-to-date</span>
        </div>
      </CardContent>
    </Card>
  );
};
