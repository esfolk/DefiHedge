"""
The Graph Integration Service for DeFiGuard Risk
Historical data retrieval for quantitative analysis and risk assessment
"""

import asyncio
import json
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass

import aiohttp
import redis.asyncio as redis
from loguru import logger
from pydantic import BaseModel


@dataclass
class PricePoint:
    """Historical price data point"""
    timestamp: datetime
    price_usd: float
    volume_24h: Optional[float] = None
    market_cap: Optional[float] = None


@dataclass
class TokenHistoricalData:
    """Historical data for a token"""
    token_address: str
    symbol: str
    name: str
    price_history: List[PricePoint]
    period_days: int


class GraphQueryResult(BaseModel):
    """Result from Graph query"""
    data: Dict[str, Any]
    errors: Optional[List[Dict[str, Any]]] = None


class DeFiGuardGraphService:
    """
    The Graph integration service for DeFiGuard Risk
    
    Provides:
    - Historical price data for risk analysis
    - DeFi protocol data from subgraphs
    - Token metrics and volume data
    - Caching with Redis for performance
    """
    
    # Popular DeFi subgraph endpoints
    SUBGRAPH_ENDPOINTS = {
        "uniswap_v3": "https://gateway-arbitrum.network.thegraph.com/api/{api_key}/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV",
        "uniswap_v2": "https://gateway-arbitrum.network.thegraph.com/api/{api_key}/subgraphs/id/A3Np3RQbaBA6oKJgiwDJeo5T3zrYfGHPWFYayMwtNDum", 
        "aave_v3": "https://gateway-arbitrum.network.thegraph.com/api/{api_key}/subgraphs/id/C4ayEZP2yTXRAB8vSaTrgN4m9anTe9Mdm2ViyiAuV9TV",
        "compound_v2": "https://gateway-arbitrum.network.thegraph.com/api/{api_key}/subgraphs/id/GRgmmsU8UgHxHs4oL5nF8L2wTbzDLK5mNiE6GwfFJvZk",
        "balancer_v2": "https://gateway-arbitrum.network.thegraph.com/api/{api_key}/subgraphs/id/C4ayEZP2yTXRAB8vSaTrgN4m9anTe9Mdm2ViyiAuV9TV"
    }
    
    def __init__(self, api_key: str, redis_url: str):
        self.api_key = api_key
        self.redis_url = redis_url
        self.redis_client = None
        self.session = None
        self._initialized = False
        
        # Format subgraph URLs with API key
        self.formatted_endpoints = {
            name: url.format(api_key=api_key) 
            for name, url in self.SUBGRAPH_ENDPOINTS.items()
        }
    
    async def initialize(self):
        """Initialize async components"""
        if self._initialized:
            return
            
        try:
            # Initialize Redis
            self.redis_client = redis.from_url(self.redis_url)
            
            # Initialize HTTP session
            self.session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=30),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                }
            )
            
            self._initialized = True
            logger.info("✅ DeFiGuard Graph service initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Graph service: {e}")
            raise
    
    async def close(self):
        """Clean up resources"""
        if self.session:
            await self.session.close()
        if self.redis_client:
            await self.redis_client.close()
        logger.info("🔒 Graph service resources cleaned up")
    
    async def get_cached_data(self, cache_key: str) -> Optional[Any]:
        """Get cached data from Redis"""
        try:
            if not self.redis_client:
                return None
                
            cached = await self.redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception as e:
            logger.warning(f"Cache read error: {e}")
        return None
    
    async def cache_data(self, cache_key: str, data: Any, ttl: int = 3600):
        """Cache data in Redis with TTL (default 1 hour)"""
        try:
            if self.redis_client:
                await self.redis_client.setex(
                    cache_key,
                    ttl,
                    json.dumps(data, default=str)
                )
        except Exception as e:
            logger.warning(f"Cache write error: {e}")
    
    async def query_subgraph(self, subgraph: str, query: str) -> GraphQueryResult:
        """
        Execute GraphQL query against a subgraph
        
        Args:
            subgraph: Name of the subgraph (e.g., 'uniswap_v3')
            query: GraphQL query string
            
        Returns:
            GraphQueryResult with data and potential errors
        """
        if not self._initialized:
            await self.initialize()
            
        endpoint = self.formatted_endpoints.get(subgraph)
        if not endpoint:
            raise ValueError(f"Unknown subgraph: {subgraph}")
        
        try:
            payload = {"query": query}
            
            async with self.session.post(endpoint, json=payload) as response:
                result_data = await response.json()
                
                if response.status != 200:
                    logger.error(f"Graph query failed: {response.status} - {result_data}")
                    raise Exception(f"Graph API returned {response.status}")
                
                return GraphQueryResult(**result_data)
                
        except Exception as e:
            logger.error(f"Error querying subgraph {subgraph}: {e}")
            raise
    
    async def get_token_price_history(
        self, 
        token_address: str, 
        days: int = 90,
        subgraph: str = "uniswap_v3"
    ) -> TokenHistoricalData:
        """
        Get historical price data for a token
        
        Args:
            token_address: Token contract address
            days: Number of days of history to fetch (default 90)
            subgraph: Subgraph to query (default uniswap_v3)
            
        Returns:
            TokenHistoricalData with price history
        """
        cache_key = f"defiguard:graph:prices:{token_address}:{days}:{subgraph}"
        
        # Check cache first
        cached_data = await self.get_cached_data(cache_key)
        if cached_data:
            logger.info(f"📦 Using cached price history for {token_address}")
            return TokenHistoricalData(**cached_data)
        
        logger.info(f"🔍 Fetching {days} days of price history for {token_address}")
        
        # Calculate timestamp for query
        end_time = int(datetime.now(timezone.utc).timestamp())
        start_time = int((datetime.now(timezone.utc) - timedelta(days=days)).timestamp())
        
        # GraphQL query for token price history
        query = f"""
        {{
            token(id: "{token_address.lower()}") {{
                id
                symbol
                name
                decimals
                tokenDayData(
                    first: {days}
                    orderBy: date
                    orderDirection: desc
                    where: {{
                        date_gte: {start_time}
                        date_lte: {end_time}
                    }}
                ) {{
                    date
                    priceUSD
                    volume
                    volumeUSD
                    totalValueLocked
                    totalValueLockedUSD
                }}
            }}
        }}
        """
        
        try:
            result = await self.query_subgraph(subgraph, query)
            
            if result.errors:
                logger.error(f"GraphQL errors: {result.errors}")
            
            token_data = result.data.get("token")
            if not token_data:
                logger.warning(f"No data found for token {token_address}")
                return TokenHistoricalData(
                    token_address=token_address,
                    symbol="UNKNOWN",
                    name="Unknown Token",
                    price_history=[],
                    period_days=days
                )
            
            # Process price history
            price_history = []
            for day_data in token_data.get("tokenDayData", []):
                try:
                    timestamp = datetime.fromtimestamp(int(day_data["date"]), tz=timezone.utc)
                    price_usd = float(day_data.get("priceUSD", 0))
                    volume_24h = float(day_data.get("volumeUSD", 0))
                    
                    price_point = PricePoint(
                        timestamp=timestamp,
                        price_usd=price_usd,
                        volume_24h=volume_24h
                    )
                    price_history.append(price_point)
                    
                except (ValueError, KeyError) as e:
                    logger.warning(f"Error processing day data: {e}")
                    continue
            
            # Create historical data object
            historical_data = TokenHistoricalData(
                token_address=token_address,
                symbol=token_data.get("symbol", "UNKNOWN"),
                name=token_data.get("name", "Unknown Token"),
                price_history=sorted(price_history, key=lambda x: x.timestamp),
                period_days=days
            )
            
            # Cache the results
            cache_data = {
                "token_address": historical_data.token_address,
                "symbol": historical_data.symbol,
                "name": historical_data.name,
                "price_history": [
                    {
                        "timestamp": p.timestamp.isoformat(),
                        "price_usd": p.price_usd,
                        "volume_24h": p.volume_24h,
                        "market_cap": p.market_cap
                    } for p in historical_data.price_history
                ],
                "period_days": historical_data.period_days
            }
            
            await self.cache_data(cache_key, cache_data, ttl=3600)  # 1 hour cache
            
            logger.info(f"✅ Retrieved {len(price_history)} price points for {historical_data.symbol}")
            return historical_data
            
        except Exception as e:
            logger.error(f"Error fetching price history for {token_address}: {e}")
            # Return empty data structure on error
            return TokenHistoricalData(
                token_address=token_address,
                symbol="ERROR",
                name="Error fetching data",
                price_history=[],
                period_days=days
            )
    
    async def get_portfolio_historical_data(
        self, 
        token_addresses: List[str], 
        days: int = 90
    ) -> List[TokenHistoricalData]:
        """
        Get historical data for multiple tokens (portfolio analysis)
        
        Args:
            token_addresses: List of token contract addresses
            days: Number of days of history
            
        Returns:
            List of TokenHistoricalData objects
        """
        logger.info(f"🔍 Fetching historical data for {len(token_addresses)} tokens")
        
        # Fetch data concurrently for all tokens
        tasks = []
        for address in token_addresses:
            task = self.get_token_price_history(address, days)
            tasks.append(task)
        
        # Wait for all requests to complete
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        historical_data = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Error fetching data for {token_addresses[i]}: {result}")
                continue
            
            if isinstance(result, TokenHistoricalData):
                historical_data.append(result)
        
        logger.info(f"✅ Successfully retrieved historical data for {len(historical_data)} tokens")
        return historical_data
    
    async def get_defi_protocol_data(self, protocol: str) -> Dict[str, Any]:
        """
        Get DeFi protocol-specific data
        
        Args:
            protocol: Protocol name (e.g., 'aave', 'compound', 'uniswap')
            
        Returns:
            Protocol data dictionary
        """
        cache_key = f"defiguard:graph:protocol:{protocol}"
        
        # Check cache
        cached_data = await self.get_cached_data(cache_key)
        if cached_data:
            return cached_data
        
        # Protocol-specific queries
        protocol_queries = {
            "uniswap": """
            {
                uniswapDayDatas(first: 7, orderBy: date, orderDirection: desc) {
                    date
                    volumeUSD
                    tvlUSD
                    feesUSD
                    txCount
                }
            }
            """,
            "aave": """
            {
                reserves(first: 10, orderBy: totalLiquidity, orderDirection: desc) {
                    symbol
                    name
                    totalLiquidity
                    availableLiquidity
                    totalBorrows
                    liquidityRate
                    variableBorrowRate
                }
            }
            """
        }
        
        query = protocol_queries.get(protocol.lower())
        if not query:
            return {"error": f"No query available for protocol: {protocol}"}
        
        try:
            # Determine which subgraph to use
            subgraph_map = {
                "uniswap": "uniswap_v3",
                "aave": "aave_v3"
            }
            
            subgraph = subgraph_map.get(protocol.lower(), "uniswap_v3")
            result = await self.query_subgraph(subgraph, query)
            
            # Cache and return result
            await self.cache_data(cache_key, result.data, ttl=1800)  # 30 min cache
            return result.data
            
        except Exception as e:
            logger.error(f"Error fetching protocol data for {protocol}: {e}")
            return {"error": str(e)}
    
    async def health_check(self) -> Dict[str, Any]:
        """Check service health"""
        if not self._initialized:
            await self.initialize()
            
        try:
            # Test Graph API with simple query
            test_query = """
            {
                _meta {
                    block {
                        number
                        hash
                    }
                }
            }
            """
            
            result = await self.query_subgraph("uniswap_v3", test_query)
            graph_status = "healthy" if result.data else "degraded"
            
            # Test Redis connection
            redis_status = "healthy"
            try:
                if self.redis_client:
                    await self.redis_client.ping()
            except:
                redis_status = "unavailable"
            
            return {
                "service": "DeFiGuard Graph Service",
                "status": "healthy" if graph_status == "healthy" else "degraded",
                "components": {
                    "graph_api": graph_status,
                    "redis_cache": redis_status
                },
                "available_subgraphs": len(self.formatted_endpoints),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                "service": "DeFiGuard Graph Service",
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }


# Service factory function
def create_graph_service(api_key: str, redis_url: str) -> DeFiGuardGraphService:
    """Create and return configured Graph service instance"""
    return DeFiGuardGraphService(api_key, redis_url)


# Testing function
async def test_graph_service():
    """Test the Graph service with your API key"""
    service = create_graph_service(
        "eyJhbGciOiJLTVNFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3OTEzNjQzNjQsImp0aSI6ImUyOTc4MDc4LTkwZTgtNDE2MS05MmJmLTI2YWFmOTcwYTg1OSIsImlhdCI6MTc1NTM2NDM2NCwiaXNzIjoiZGZ1c2UuaW8iLCJzdWIiOiIwbG9kdWUzMTRlMTI1NjA5ZWU0NzMiLCJ2IjoxLCJha2kiOiJkYzE1YzA2MTljM2I4ZWZjZmZkYTE0ZWIxOWQ1Y2IzY2RlOTQwMzg5N2M4NDFkMDg2YzE5MzYwZmI4NzJkZmQwIiwidWlkIjoiMGxvZHVlMzE0ZTEyNTYwOWVlNDczIn0.RdNInjJEd9g9X3motQjSQu3ESaQy5jfw9hoZtJT7abzA-rxm932yASPA927qTfyyCUkB_V_QUkTpZc3imLoMpw",
        "redis://localhost:6379"
    )
    
    try:
        await service.initialize()
        
        # Test health check
        health = await service.health_check()
        print(f"Health: {health}")
        
        # Test with USDC token (common token)
        usdc_address = "0xa0b86a33e6441de61ddbE1a4B4C2d1aF9fCa7F"
        historical_data = await service.get_token_price_history(usdc_address, days=30)
        
        print(f"Historical data for {historical_data.symbol}:")
        print(f"  Address: {historical_data.token_address}")
        print(f"  Price points: {len(historical_data.price_history)}")
        print(f"  Period: {historical_data.period_days} days")
        
        if historical_data.price_history:
            latest = historical_data.price_history[-1]
            print(f"  Latest price: ${latest.price_usd:.4f}")
            print(f"  Latest volume: ${latest.volume_24h:.2f}")
        
    finally:
        await service.close()


if __name__ == "__main__":
    asyncio.run(test_graph_service())
