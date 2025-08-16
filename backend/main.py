"""
DeFiGuard Risk - FastAPI Backend Application
Multi-chain DeFi portfolio management with AI-powered insights
"""

import os
import sys
from contextlib import asynccontextmanager
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, Depends, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
import uvicorn

# Import our services and models
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.coinbase_service import DeFiGuardCoinbaseService, create_coinbase_service
from services.graph_service import DeFiGuardGraphService, create_graph_service
from models.api_models import (
    PortfolioResponse, PortfolioRequest, PriceResponse, PriceRequest,
    HealthResponse, ErrorResponse, SuccessResponse, ChainId,
    TokenBalanceResponse, ChainBalanceResponse
)

# Configuration
class Settings:
    APP_NAME = "DeFiGuard Risk API"
    APP_VERSION = "1.0.0"
    APP_DESCRIPTION = "AI-Powered Multi-Chain DeFi Portfolio Management"
    
    # Environment variables
    CDP_API_KEY_ID = os.getenv("CDP_API_KEY_ID")
    CDP_API_SECRET = os.getenv("CDP_API_KEY_SECRET")
    REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    DEBUG = os.getenv("DEBUG", "true").lower() == "true"
    
    # API Configuration
    MAX_PORTFOLIO_SIZE = int(os.getenv("MAX_PORTFOLIO_SIZE", "100"))
    API_RATE_LIMIT = int(os.getenv("API_RATE_LIMIT", "100"))

settings = Settings()

# Global service instances
coinbase_service: Optional[DeFiGuardCoinbaseService] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown"""
    # Startup
    logger.info("🚀 Starting DeFiGuard Risk API...")
    
    global coinbase_service
    
    try:
        # Initialize services
        if not settings.CDP_API_KEY_ID or not settings.CDP_API_SECRET:
            logger.error("❌ CDP API credentials not configured")
            raise ValueError("CDP API credentials required")
        
        coinbase_service = create_coinbase_service(
            settings.CDP_API_KEY_ID,
            settings.CDP_API_SECRET,
            settings.REDIS_URL
        )
        
        await coinbase_service.initialize()
        logger.info("✅ Services initialized successfully")
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize services: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("🔒 Shutting down DeFiGuard Risk API...")
    if coinbase_service:
        await coinbase_service.close()
    logger.info("✅ Shutdown complete")

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=settings.APP_DESCRIPTION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Dependency injection
async def get_coinbase_service() -> DeFiGuardCoinbaseService:
    """Get Coinbase service dependency"""
    if coinbase_service is None:
        raise HTTPException(
            status_code=503, 
            detail="Coinbase service not available"
        )
    return coinbase_service

# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=exc.detail,
            detail=f"HTTP {exc.status_code}"
        ).dict()
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal server error",
            detail=str(exc) if settings.DEBUG else "An unexpected error occurred"
        ).dict()
    )

# Health check endpoint
@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check(
    service: DeFiGuardCoinbaseService = Depends(get_coinbase_service)
):
    """
    Check system health and service status
    """
    try:
        health_data = await service.health_check()
        return HealthResponse(**health_data)
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

# Root endpoint
@app.get("/", response_model=SuccessResponse, tags=["System"])
async def root():
    """
    API root endpoint with basic information
    """
    return SuccessResponse(
        message=f"Welcome to {settings.APP_NAME} v{settings.APP_VERSION}",
        data={
            "service": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "description": settings.APP_DESCRIPTION,
            "docs": "/docs" if settings.DEBUG else "Not available in production",
            "supported_chains": [chain.name.title() for chain in ChainId],
            "features": [
                "Multi-chain portfolio aggregation",
                "Real-time balance fetching", 
                "Token price data",
                "Risk analysis (coming soon)",
                "AI-powered insights (coming soon)"
            ]
        }
    )

# Portfolio endpoints
@app.get("/portfolio/{address}", response_model=PortfolioResponse, tags=["Portfolio"])
async def get_portfolio(
    address: str = Path(..., description="Wallet address", min_length=42, max_length=42),
    chains: Optional[List[int]] = Query(None, description="Specific chain IDs to fetch"),
    service: DeFiGuardCoinbaseService = Depends(get_coinbase_service)
):
    """
    Get complete portfolio data for a wallet address across multiple chains
    
    - **address**: Ethereum-compatible wallet address (0x...)
    - **chains**: Optional list of chain IDs to limit the request
    
    Returns detailed balance information for each supported blockchain network.
    """
    try:
        # Validate address format
        if not address.startswith('0x') or len(address) != 42:
            raise HTTPException(
                status_code=400, 
                detail="Invalid address format. Must be 42-character hex string starting with 0x"
            )
        
        # Validate chain IDs
        if chains:
            valid_chains = [chain.value for chain in ChainId]
            invalid_chains = [c for c in chains if c not in valid_chains]
            if invalid_chains:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported chain IDs: {invalid_chains}. Supported: {valid_chains}"
                )
        
        logger.info(f"🔍 Fetching portfolio for {address} on chains: {chains or 'all'}")
        
        # Get portfolio data from Coinbase service
        chain_balances = await service.get_portfolio_balances(address, chains)
        
        # Convert to response format
        portfolio_chains = []
        total_portfolio_value = 0.0
        
        for chain_balance in chain_balances:
            # Convert tokens
            token_responses = []
            for token in chain_balance.tokens:
                token_responses.append(TokenBalanceResponse(
                    address=token.address,
                    symbol=token.symbol,
                    name=token.name,
                    balance=token.balance,
                    decimals=token.decimals,
                    price_usd=token.price_usd,
                    value_usd=token.value_usd,
                    logo_url=token.logo_url
                ))
            
            # Create chain response
            chain_response = ChainBalanceResponse(
                chain_id=chain_balance.chain_id,
                chain_name=chain_balance.chain_name,
                tokens=token_responses,
                total_value_usd=chain_balance.total_value_usd
            )
            
            portfolio_chains.append(chain_response)
            total_portfolio_value += chain_balance.total_value_usd
        
        # Create portfolio response
        portfolio_response = PortfolioResponse(
            address=address.lower(),
            total_value_usd=total_portfolio_value,
            chains=portfolio_chains,
            supported_networks=len(chain_balances),
            last_updated=datetime.utcnow()
        )
        
        logger.info(f"✅ Portfolio fetched: ${total_portfolio_value:.2f} across {len(portfolio_chains)} chains")
        return portfolio_response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching portfolio for {address}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch portfolio: {str(e)}")

@app.post("/portfolio/batch", response_model=List[PortfolioResponse], tags=["Portfolio"])
async def get_portfolios_batch(
    requests: List[PortfolioRequest],
    service: DeFiGuardCoinbaseService = Depends(get_coinbase_service)
):
    """
    Get portfolio data for multiple wallet addresses in a single request
    
    Useful for fetching data for multiple wallets efficiently.
    """
    if len(requests) > 10:
        raise HTTPException(
            status_code=400,
            detail="Maximum 10 addresses per batch request"
        )
    
    results = []
    
    for request in requests:
        try:
            # Reuse the single portfolio endpoint logic
            chain_balances = await service.get_portfolio_balances(request.address, request.chains)
            
            # Convert to response format (similar to single endpoint)
            portfolio_chains = []
            total_portfolio_value = 0.0
            
            for chain_balance in chain_balances:
                token_responses = [
                    TokenBalanceResponse(
                        address=token.address,
                        symbol=token.symbol,
                        name=token.name,
                        balance=token.balance,
                        decimals=token.decimals,
                        price_usd=token.price_usd,
                        value_usd=token.value_usd,
                        logo_url=token.logo_url
                    ) for token in chain_balance.tokens
                ]
                
                chain_response = ChainBalanceResponse(
                    chain_id=chain_balance.chain_id,
                    chain_name=chain_balance.chain_name,
                    tokens=token_responses,
                    total_value_usd=chain_balance.total_value_usd
                )
                
                portfolio_chains.append(chain_response)
                total_portfolio_value += chain_balance.total_value_usd
            
            portfolio_response = PortfolioResponse(
                address=request.address.lower(),
                total_value_usd=total_portfolio_value,
                chains=portfolio_chains,
                supported_networks=len(portfolio_chains),
                last_updated=datetime.utcnow()
            )
            
            results.append(portfolio_response)
            
        except Exception as e:
            logger.error(f"Error in batch request for {request.address}: {e}")
            # Continue with other addresses even if one fails
            continue
    
    return results

# Price endpoints
@app.get("/price/{symbol}", response_model=PriceResponse, tags=["Prices"])
async def get_token_price(
    symbol: str = Path(..., description="Token symbol (e.g., ETH, USDC)"),
    address: Optional[str] = Query(None, description="Token contract address"),
    service: DeFiGuardCoinbaseService = Depends(get_coinbase_service)
):
    """
    Get current price for a specific token
    
    - **symbol**: Token symbol (ETH, USDC, etc.)
    - **address**: Optional token contract address for more specific lookup
    """
    try:
        price = await service.get_token_price(symbol.upper(), address)
        
        if price is None:
            raise HTTPException(
                status_code=404,
                detail=f"Price data not available for token: {symbol}"
            )
        
        return PriceResponse(
            symbol=symbol.upper(),
            price_usd=price,
            last_updated=datetime.utcnow()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching price for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch price: {str(e)}")

# Chain information endpoints
@app.get("/chains", response_model=SuccessResponse, tags=["System"])
async def get_supported_chains(
    service: DeFiGuardCoinbaseService = Depends(get_coinbase_service)
):
    """
    Get list of supported blockchain networks
    """
    try:
        chains = await service.get_supported_chains()
        
        chain_info = []
        for chain_id, network_name in chains.items():
            chain_info.append({
                "chain_id": chain_id,
                "name": network_name.title(),
                "network_name": network_name
            })
        
        return SuccessResponse(
            message="Supported blockchain networks",
            data={
                "chains": chain_info,
                "total_supported": len(chain_info)
            }
        )
        
    except Exception as e:
        logger.error(f"Error fetching supported chains: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch chain information")

# Development and testing endpoints
if settings.DEBUG:
    @app.get("/debug/test", response_model=SuccessResponse, tags=["Debug"])
    async def debug_test():
        """
        Debug endpoint for testing (only available in debug mode)
        """
        return SuccessResponse(
            message="Debug endpoint working",
            data={
                "environment": "development",
                "debug": True,
                "timestamp": datetime.utcnow().isoformat()
            }
        )

# Application entry point
if __name__ == "__main__":
    # Configure logging
    logger.remove()
    logger.add(
        sys.stderr,
        level="DEBUG" if settings.DEBUG else "INFO",
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
    )
    
    logger.info("🚀 Starting DeFiGuard Risk API server...")
    
    # Run the server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        workers=1 if settings.DEBUG else 4,
        log_level="debug" if settings.DEBUG else "info"
    )
