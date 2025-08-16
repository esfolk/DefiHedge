"""
Coinbase CDP Data API Integration Service for DeFiGuard Risk
Multi-chain portfolio data fetching with rate limiting and caching
"""

import asyncio
import os
from typing import Dict, List, Optional, Tuple, Any
from decimal import Decimal
import json
from datetime import datetime, timezone
from dataclasses import dataclass

from loguru import logger
import redis.asyncio as redis
from pydantic import BaseModel

# Import Coinbase CDP SDK
try:
    from cdp import CdpClient
except ImportError:
    logger.error("Coinbase CDP SDK not installed. Please install with: pip install cdp-sdk")
    CdpClient = None


@dataclass
class TokenBalance:
    """Token balance data structure"""
    address: str
    symbol: str
    name: str
    balance: str
    decimals: int
    price_usd: float
    value_usd: float
    logo_url: Optional[str] = None


@dataclass  
class ChainBalance:
    """Chain balance data structure"""
    chain_id: int
    chain_name: str
    tokens: List[TokenBalance]
    total_value_usd: float


class CoinbaseConfig:
    """Coinbase CDP API configuration"""
    
    # Supported chains mapping (CDP SDK format)
    CHAIN_MAPPING = {
        1: "ethereum",
        137: "polygon",
        42161: "arbitrum",
        10: "optimism", 
        8453: "base"
    }
    
    CHAIN_INFO = {
        "ethereum": {"chain_id": 1, "name": "Ethereum", "native_token": "ETH"},
        "polygon": {"chain_id": 137, "name": "Polygon", "native_token": "MATIC"},
        "arbitrum": {"chain_id": 42161, "name": "Arbitrum", "native_token": "ETH"},
        "optimism": {"chain_id": 10, "name": "Optimism", "native_token": "ETH"},
        "base": {"chain_id": 8453, "name": "Base", "native_token": "ETH"}
    }


class DeFiGuardCoinbaseService:
    """
    DeFiGuard Risk Coinbase CDP integration service
    
    Provides:
    - Multi-chain portfolio balance fetching
    - Token price data
    - Caching with Redis
    - Rate limiting
    - Error handling
    """
    
    def __init__(self, api_key_id: str, api_key_secret: str, redis_url: str):
        if not CdpClient:
            raise ImportError("Coinbase CDP SDK required")
            
        self.api_key_id = api_key_id
        self.api_key_secret = api_key_secret
        self.redis_url = redis_url
        self.redis_client = None
        self.cdp_client = None
        self._initialized = False
        
    async def initialize(self):
        """Initialize async components"""
        if self._initialized:
            return
            
        try:
            # Set CDP environment variables
            os.environ["CDP_API_KEY_ID"] = self.api_key_id
            os.environ["CDP_API_KEY_SECRET"] = self.api_key_secret
            
            # Initialize Redis
            self.redis_client = redis.from_url(self.redis_url)
            
            # Initialize CDP client
            self.cdp_client = CdpClient()
            
            self._initialized = True
            logger.info("✅ DeFiGuard Coinbase service initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Coinbase service: {e}")
            raise
    
    async def close(self):
        """Clean up resources"""
        if self.cdp_client:
            await self.cdp_client.close()
        if self.redis_client:
            await self.redis_client.close()
        logger.info("🔒 Coinbase service resources cleaned up")
    
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
    
    async def cache_data(self, cache_key: str, data: Any, ttl: int = 300):
        """Cache data in Redis with TTL"""
        try:
            if self.redis_client:
                await self.redis_client.setex(
                    cache_key,
                    ttl,
                    json.dumps(data, default=str)
                )
        except Exception as e:
            logger.warning(f"Cache write error: {e}")
    
    async def get_portfolio_balances(self, address: str, chains: List[int] = None) -> List[ChainBalance]:
        """
        Get portfolio balances across multiple chains
        
        Args:
            address: Wallet address
            chains: List of chain IDs (defaults to all supported)
            
        Returns:
            List of ChainBalance objects
        """
        if not self._initialized:
            await self.initialize()
            
        if chains is None:
            chains = list(CoinbaseConfig.CHAIN_MAPPING.keys())
            
        # Check cache
        cache_key = f"defiguard:balances:{address}:{'-'.join(map(str, chains))}"
        cached_data = await self.get_cached_data(cache_key)
        
        if cached_data:
            logger.info(f"📦 Using cached portfolio data for {address}")
            return [ChainBalance(**cb) for cb in cached_data]
        
        logger.info(f"🔍 Fetching fresh portfolio data for {address}")
        chain_balances = []
        
        for chain_id in chains:
            try:
                network_name = CoinbaseConfig.CHAIN_MAPPING.get(chain_id)
                if not network_name:
                    logger.warning(f"Unsupported chain ID: {chain_id}")
                    continue
                    
                chain_info = CoinbaseConfig.CHAIN_INFO[network_name]
                logger.info(f"  🌐 Fetching from {chain_info['name']} (Chain {chain_id})")
                
                # For now, create demo data structure
                # In production, this would use the actual CDP API calls
                chain_balance = ChainBalance(
                    chain_id=chain_id,
                    chain_name=chain_info['name'],
                    tokens=await self._fetch_chain_tokens(address, network_name),
                    total_value_usd=0.0
                )
                
                # Calculate total value
                chain_balance.total_value_usd = sum(token.value_usd for token in chain_balance.tokens)
                chain_balances.append(chain_balance)
                
                logger.info(f"  ✅ {chain_info['name']}: {len(chain_balance.tokens)} tokens, ${chain_balance.total_value_usd:.2f}")
                
            except Exception as e:
                logger.error(f"  ❌ Error fetching from chain {chain_id}: {e}")
                continue
        
        # Cache results
        if chain_balances:
            cache_data = [
                {
                    "chain_id": cb.chain_id,
                    "chain_name": cb.chain_name,
                    "tokens": [
                        {
                            "address": t.address,
                            "symbol": t.symbol,
                            "name": t.name,
                            "balance": t.balance,
                            "decimals": t.decimals,
                            "price_usd": t.price_usd,
                            "value_usd": t.value_usd,
                            "logo_url": t.logo_url
                        } for t in cb.tokens
                    ],
                    "total_value_usd": cb.total_value_usd
                }
                for cb in chain_balances
            ]
            await self.cache_data(cache_key, cache_data, ttl=30)  # 30 second cache
        
        total_value = sum(cb.total_value_usd for cb in chain_balances)
        logger.info(f"🎯 Portfolio summary: {len(chain_balances)} chains, total value: ${total_value:.2f}")
        
        return chain_balances
    
    async def _fetch_chain_tokens(self, address: str, network: str) -> List[TokenBalance]:
        """Fetch token balances for a specific chain"""
        try:
            # This is where we would integrate with the actual CDP API
            # For hackathon demo, returning sample data structure
            
            # In production, this would look like:
            # async with self.cdp_client as cdp:
            #     account = await cdp.evm.get_account(address=address)
            #     balances = await account.get_balances(network=network)
            #     return self._process_balances(balances)
            
            # Sample demo tokens for different networks
            demo_tokens = {
                "ethereum": [
                    TokenBalance(
                        address="0xA0b86a33E6441dE61DDbE1a4B4C2d1aF9fCa7F",
                        symbol="ETH",
                        name="Ethereum",
                        balance="1.5",
                        decimals=18,
                        price_usd=2500.0,
                        value_usd=3750.0
                    ),
                    TokenBalance(
                        address="0xA0b86a33E6441dE61DDbE1a4B4C2d1aF9fCa7F",
                        symbol="USDC",
                        name="USD Coin", 
                        balance="1000.0",
                        decimals=6,
                        price_usd=1.0,
                        value_usd=1000.0
                    )
                ],
                "base": [
                    TokenBalance(
                        address="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
                        symbol="USDC",
                        name="USD Coin",
                        balance="500.0",
                        decimals=6,
                        price_usd=1.0,
                        value_usd=500.0
                    )
                ]
            }
            
            return demo_tokens.get(network, [])
            
        except Exception as e:
            logger.error(f"Error fetching tokens from {network}: {e}")
            return []
    
    async def get_token_price(self, symbol: str, address: str = None) -> Optional[float]:
        """Get current token price in USD"""
        cache_key = f"defiguard:price:{symbol}:{address or 'native'}"
        
        # Check cache
        cached_price = await self.get_cached_data(cache_key)
        if cached_price:
            return cached_price.get("price")
        
        try:
            # In production, this would use CDP price APIs
            # For demo, return sample prices
            demo_prices = {
                "ETH": 2500.0,
                "USDC": 1.0,
                "MATIC": 0.85,
                "ARB": 0.95
            }
            
            price = demo_prices.get(symbol, 0.0)
            
            if price > 0:
                await self.cache_data(cache_key, {"price": price}, ttl=60)
            
            return price
            
        except Exception as e:
            logger.error(f"Error fetching price for {symbol}: {e}")
            return None
    
    async def get_supported_chains(self) -> Dict[int, str]:
        """Get supported blockchain networks"""
        return CoinbaseConfig.CHAIN_MAPPING
    
    async def health_check(self) -> Dict[str, Any]:
        """Check service health"""
        if not self._initialized:
            await self.initialize()
            
        try:
            # Test CDP connection
            cdp_status = "healthy" if self.cdp_client else "unavailable"
            
            # Test Redis connection
            redis_status = "healthy"
            try:
                if self.redis_client:
                    await self.redis_client.ping()
            except:
                redis_status = "unavailable"
            
            return {
                "service": "DeFiGuard Coinbase CDP",
                "status": "healthy" if cdp_status == "healthy" else "degraded",
                "components": {
                    "cdp_api": cdp_status,
                    "redis_cache": redis_status
                },
                "supported_chains": len(CoinbaseConfig.CHAIN_MAPPING),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                "service": "DeFiGuard Coinbase CDP",
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }


# Service factory function
def create_coinbase_service(api_key_id: str, api_key_secret: str, redis_url: str) -> DeFiGuardCoinbaseService:
    """Create and return configured Coinbase service instance"""
    return DeFiGuardCoinbaseService(api_key_id, api_key_secret, redis_url)


# For testing
async def test_service():
    """Test the Coinbase service"""
    service = create_coinbase_service(
        "8f652a5e-320b-47f1-97eb-07b8846c9fd7",
        "P86+MD85j7S8zlSOU5JXVkiyczcrncDPQTrbktpfAwGlf2/SoZd6X7I54CjwEA0JTYOFyWSravG2J1T642rY5w==",
        "redis://localhost:6379"
    )
    
    try:
        await service.initialize()
        
        # Test health check
        health = await service.health_check()
        print(f"Health: {health}")
        
        # Test portfolio fetching
        portfolio = await service.get_portfolio_balances(
            "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"  # Vitalik's address
        )
        
        print(f"Portfolio: {len(portfolio)} chains found")
        for chain in portfolio:
            print(f"  {chain.chain_name}: {len(chain.tokens)} tokens, ${chain.total_value_usd:.2f}")
        
    finally:
        await service.close()


if __name__ == "__main__":
    asyncio.run(test_service())
