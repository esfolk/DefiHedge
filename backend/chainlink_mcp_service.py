"""
Chainlink MCP Service for DeFiGuard Risk Backend
Provides integration with Chainlink price feeds, oracle data, and CCIP functionality
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any
import httpx
from datetime import datetime, timedelta

from config import settings

logger = logging.getLogger(__name__)


class ChainlinkMCPService:
    """Service for interacting with Chainlink MCP server"""
    
    def __init__(self):
        self.base_url = settings.chainlink_mcp_server_url
        self.node_url = settings.chainlink_node_url
        self.client = httpx.AsyncClient(timeout=30.0)
        
        # Common price feed addresses for major tokens
        self.price_feeds = {
            "ETH/USD": {
                "ethereum": "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419",
                "polygon": "0xf9680d99d6c9589e2a93a78a04a279e509205945",
                "arbitrum": "0x639fe6ab55c921f74e7fac1ee960c0b6293ba612",
                "base": "0x71041dddad3595f9ced3dccfbe3d1f4b0d5aec52"
            },
            "BTC/USD": {
                "ethereum": "0xf4030086522a5beea4988f8ca5b36dbc97bee88c",
                "polygon": "0xc907e116054ad103354f2d350fd2514433d57f6f",
                "arbitrum": "0x6ce185860a4963106506c203335a2910413708e9"
            },
            "MATIC/USD": {
                "ethereum": "0x7bac85a8a13a4bcd8abb3eb7d6b4d632c5a57676",
                "polygon": "0xab594600376ec9fd91f8e885dadf0ce036862de0"
            },
            "LINK/USD": {
                "ethereum": "0x2c1d072e956affc0d435cb7ac38ef18d24d9127c",
                "polygon": "0xd9ffdb71ebe7496cc440152d43986aae0ab76665",
                "arbitrum": "0x86e53cf1b870786351da77a57575e79cb55812cb"
            },
            "USDC/USD": {
                "ethereum": "0x8fffffd4afb6115b954bd326cbe7b4ba576818f6",
                "polygon": "0xfe4a8cc5b5b2366c1b58bea3858e81843581b2f7",
                "arbitrum": "0x50834f3163758fcc1df9973b6e91f0f0f0434ad3"
            }
        }
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

    async def get_price_feed(self, symbol: str, chain: str = "ethereum") -> Optional[Dict[str, Any]]:
        """Get latest price from Chainlink price feed"""
        try:
            if symbol not in self.price_feeds:
                logger.warning(f"Price feed not available for {symbol}")
                return None
                
            if chain not in self.price_feeds[symbol]:
                logger.warning(f"Price feed for {symbol} not available on {chain}")
                return None
                
            feed_address = self.price_feeds[symbol][chain]
            
            # Call MCP server for price feed data
            response = await self.client.post(
                f"{self.base_url}/mcp/call",
                json={
                    "method": "get_price_feed",
                    "params": {
                        "feed_address": feed_address,
                        "chain": chain
                    }
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "symbol": symbol,
                    "price": float(data.get("price", 0)),
                    "decimals": data.get("decimals", 8),
                    "updated_at": data.get("updated_at"),
                    "round_id": data.get("round_id"),
                    "chain": chain,
                    "feed_address": feed_address
                }
            else:
                logger.error(f"Failed to get price feed for {symbol}: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting price feed for {symbol}: {str(e)}")
            return None

    async def get_multiple_prices(self, symbols: List[str], chain: str = "ethereum") -> Dict[str, Any]:
        """Get multiple price feeds in parallel"""
        try:
            tasks = []
            for symbol in symbols:
                task = self.get_price_feed(symbol, chain)
                tasks.append(task)
                
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            price_data = {}
            for i, result in enumerate(results):
                if isinstance(result, dict) and result is not None:
                    price_data[symbols[i]] = result
                    
            return price_data
            
        except Exception as e:
            logger.error(f"Error getting multiple prices: {str(e)}")
            return {}

    async def get_historical_prices(self, symbol: str, chain: str = "ethereum", 
                                  days: int = 30) -> List[Dict[str, Any]]:
        """Get historical price data from Chainlink feeds"""
        try:
            if symbol not in self.price_feeds or chain not in self.price_feeds[symbol]:
                return []
                
            feed_address = self.price_feeds[symbol][chain]
            
            response = await self.client.post(
                f"{self.base_url}/mcp/call",
                json={
                    "method": "get_historical_prices",
                    "params": {
                        "feed_address": feed_address,
                        "chain": chain,
                        "days": days
                    }
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("historical_data", [])
            else:
                logger.error(f"Failed to get historical prices for {symbol}: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"Error getting historical prices for {symbol}: {str(e)}")
            return []

    async def get_price_volatility(self, symbol: str, chain: str = "ethereum", 
                                 period: int = 24) -> Optional[Dict[str, Any]]:
        """Calculate price volatility using Chainlink data"""
        try:
            historical_data = await self.get_historical_prices(symbol, chain, period)
            
            if len(historical_data) < 2:
                return None
                
            prices = [float(item["price"]) for item in historical_data]
            
            # Calculate volatility metrics
            import statistics
            mean_price = statistics.mean(prices)
            variance = statistics.variance(prices)
            volatility = (variance ** 0.5) / mean_price * 100  # Percentage volatility
            
            min_price = min(prices)
            max_price = max(prices)
            price_range = ((max_price - min_price) / min_price) * 100
            
            return {
                "symbol": symbol,
                "chain": chain,
                "period_hours": period,
                "volatility_percent": volatility,
                "mean_price": mean_price,
                "min_price": min_price,
                "max_price": max_price,
                "price_range_percent": price_range,
                "data_points": len(historical_data)
            }
            
        except Exception as e:
            logger.error(f"Error calculating volatility for {symbol}: {str(e)}")
            return None

    async def get_cross_chain_prices(self, symbol: str) -> Dict[str, Any]:
        """Get price feeds across all supported chains"""
        try:
            if symbol not in self.price_feeds:
                return {}
                
            chains = list(self.price_feeds[symbol].keys())
            tasks = []
            
            for chain in chains:
                task = self.get_price_feed(symbol, chain)
                tasks.append(task)
                
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            cross_chain_data = {}
            for i, result in enumerate(results):
                if isinstance(result, dict) and result is not None:
                    cross_chain_data[chains[i]] = result
                    
            return cross_chain_data
            
        except Exception as e:
            logger.error(f"Error getting cross-chain prices for {symbol}: {str(e)}")
            return {}

    async def get_supported_feeds(self) -> Dict[str, List[str]]:
        """Get all supported price feed symbols and chains"""
        try:
            supported_feeds = {}
            
            for symbol, chains in self.price_feeds.items():
                supported_feeds[symbol] = list(chains.keys())
                
            return supported_feeds
            
        except Exception as e:
            logger.error(f"Error getting supported feeds: {str(e)}")
            return {}

    async def get_feed_health(self, symbol: str, chain: str = "ethereum") -> Optional[Dict[str, Any]]:
        """Check the health and freshness of a price feed"""
        try:
            feed_data = await self.get_price_feed(symbol, chain)
            
            if not feed_data:
                return None
                
            current_time = datetime.utcnow()
            updated_at = datetime.fromisoformat(feed_data.get("updated_at", ""))
            time_diff = current_time - updated_at
            
            # Consider feed stale if older than 1 hour
            is_stale = time_diff > timedelta(hours=1)
            
            return {
                "symbol": symbol,
                "chain": chain,
                "is_healthy": not is_stale,
                "last_updated": feed_data.get("updated_at"),
                "minutes_since_update": int(time_diff.total_seconds() / 60),
                "current_price": feed_data.get("price"),
                "round_id": feed_data.get("round_id")
            }
            
        except Exception as e:
            logger.error(f"Error checking feed health for {symbol}: {str(e)}")
            return None

    async def get_oracle_network_status(self) -> Dict[str, Any]:
        """Get overall Chainlink oracle network status"""
        try:
            response = await self.client.post(
                f"{self.base_url}/mcp/call",
                json={
                    "method": "get_network_status",
                    "params": {}
                }
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to get oracle network status: {response.status_code}")
                return {"status": "unknown", "error": "Failed to fetch network status"}
                
        except Exception as e:
            logger.error(f"Error getting oracle network status: {str(e)}")
            return {"status": "error", "error": str(e)}

    async def health_check(self) -> Dict[str, Any]:
        """Health check for Chainlink MCP service"""
        try:
            # Test connection to MCP server
            response = await self.client.get(f"{self.base_url}/health")
            
            if response.status_code == 200:
                # Test a sample price feed
                eth_price = await self.get_price_feed("ETH/USD", "ethereum")
                
                return {
                    "status": "healthy",
                    "mcp_server_url": self.base_url,
                    "connection": "ok",
                    "sample_feed_working": eth_price is not None,
                    "supported_symbols": len(self.price_feeds),
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                return {
                    "status": "unhealthy",
                    "connection": "failed",
                    "error": f"HTTP {response.status_code}"
                }
                
        except Exception as e:
            return {
                "status": "unhealthy",
                "connection": "failed",
                "error": str(e)
            }


# Global service instance
chainlink_mcp_service = ChainlinkMCPService()
