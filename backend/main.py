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
from services.risk_analysis_service import get_risk_analysis_service, RiskAnalysisService
from models.api_models import (
    PortfolioResponse, PortfolioRequest, PriceResponse, PriceRequest,
    HealthResponse, ErrorResponse, SuccessResponse, ChainId,
    TokenBalanceResponse, ChainBalanceResponse,
    # Risk Analysis Models
    RiskAnalysisRequest, CompleteRiskAnalysisResponse,
    RiskContributionResponse, CorrelationResponse, 
    EfficientFrontierResponse, PortfolioMetricsResponse
)
from config import settings

# Using settings from config.py

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
        if not settings.cdp_api_key_id or not settings.cdp_api_secret:
            logger.error("❌ CDP API credentials not configured")
            raise ValueError("CDP API credentials required")
        
        coinbase_service = create_coinbase_service(
            settings.cdp_api_key_id,
            settings.cdp_api_secret,
            settings.redis_url
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
    title=settings.app_name,
    version=settings.app_version,
    description=settings.app_description,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
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
            detail=str(exc) if settings.debug else "An unexpected error occurred"
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
        message=f"Welcome to {settings.app_name} v{settings.app_version}",
        data={
            "service": settings.app_name,
            "version": settings.app_version,
            "description": settings.app_description,
            "docs": "/docs" if settings.debug else "Not available in production",
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

# Risk Analysis endpoints
@app.post("/portfolio/{address}/risk-analysis", response_model=CompleteRiskAnalysisResponse, tags=["Risk Analysis"])
async def analyze_portfolio_risk(
    address: str = Path(..., description="Wallet address", min_length=42, max_length=42),
    request: RiskAnalysisRequest = None,
    lookback_days: Optional[int] = Query(365, description="Historical data lookback period in days"),
    coinbase_service: DeFiGuardCoinbaseService = Depends(get_coinbase_service),
    risk_service: RiskAnalysisService = Depends(get_risk_analysis_service)
):
    """
    Perform comprehensive risk analysis on a portfolio
    
    This endpoint provides sophisticated portfolio risk analysis including:
    - Risk contribution analysis (which assets contribute most to portfolio risk)
    - Asset correlation heatmap (diversification analysis)
    - Efficient frontier analysis (optimal portfolio positioning)
    - Comprehensive portfolio metrics (Sharpe ratio, VaR, drawdown, etc.)
    
    - **address**: Ethereum-compatible wallet address (0x...)
    - **lookback_days**: Historical data period for analysis (30-1095 days)
    """
    try:
        # Validate address format
        if not address.startswith('0x') or len(address) != 42:
            raise HTTPException(
                status_code=400,
                detail="Invalid address format. Must be 42-character hex string starting with 0x"
            )
        
        logger.info(f"🔍 Starting risk analysis for portfolio: {address}")
        
        # Get portfolio data from Coinbase service
        chain_balances = await coinbase_service.get_portfolio_balances(address, None)
        
        if not chain_balances:
            raise HTTPException(
                status_code=404,
                detail="No portfolio data found for this address"
            )
        
        # Convert portfolio data to risk analysis format
        portfolio_data = {}
        for chain_balance in chain_balances:
            for token in chain_balance.tokens:
                # Use symbol as key, aggregate values if same token on multiple chains
                if token.symbol in portfolio_data:
                    portfolio_data[token.symbol] += token.value_usd
                else:
                    portfolio_data[token.symbol] = token.value_usd
        
        # Filter out assets with very small values (less than $10)
        portfolio_data = {k: v for k, v in portfolio_data.items() if v >= 10.0}
        
        if not portfolio_data:
            raise HTTPException(
                status_code=400,
                detail="Portfolio contains no significant assets for risk analysis (minimum $10 per asset)"
            )
        
        logger.info(f"📊 Analyzing portfolio with {len(portfolio_data)} assets, total value: ${sum(portfolio_data.values()):,.2f}")
        
        # Perform risk analysis
        analysis_results = await risk_service.get_portfolio_risk_analysis(
            portfolio_data=portfolio_data,
            lookback_days=lookback_days or 365
        )
        
        if "error" in analysis_results:
            raise HTTPException(
                status_code=500,
                detail=f"Risk analysis failed: {analysis_results['error']}"
            )
        
        # Convert to response models
        response = CompleteRiskAnalysisResponse(
            risk_contribution=RiskContributionResponse(**analysis_results['risk_contribution']),
            correlation=CorrelationResponse(**analysis_results['correlation']),
            efficient_frontier=EfficientFrontierResponse(**analysis_results['efficient_frontier']),
            portfolio_metrics=PortfolioMetricsResponse(**analysis_results['portfolio_metrics'])
        )
        
        logger.info(f"✅ Risk analysis completed successfully for {address}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Risk analysis error for {address}: {e}")
        raise HTTPException(status_code=500, detail=f"Risk analysis failed: {str(e)}")


@app.post("/portfolio/{address}/risk-contribution", response_model=RiskContributionResponse, tags=["Risk Analysis"])
async def get_risk_contribution(
    address: str = Path(..., description="Wallet address", min_length=42, max_length=42),
    lookback_days: Optional[int] = Query(365, description="Historical data lookback period in days"),
    coinbase_service: DeFiGuardCoinbaseService = Depends(get_coinbase_service),
    risk_service: RiskAnalysisService = Depends(get_risk_analysis_service)
):
    """
    Get risk contribution analysis - shows what percentage of total portfolio risk each asset contributes
    
    This is different from portfolio weights - an asset might be 5% of portfolio value 
    but contribute 30% of the risk!
    """
    try:
        # Get portfolio data and perform analysis (similar to above)
        chain_balances = await coinbase_service.get_portfolio_balances(address, None)
        portfolio_data = {}
        
        for chain_balance in chain_balances:
            for token in chain_balance.tokens:
                if token.symbol in portfolio_data:
                    portfolio_data[token.symbol] += token.value_usd
                else:
                    portfolio_data[token.symbol] = token.value_usd
        
        portfolio_data = {k: v for k, v in portfolio_data.items() if v >= 10.0}
        
        if not portfolio_data:
            raise HTTPException(status_code=400, detail="No significant assets found for analysis")
        
        analysis_results = await risk_service.get_portfolio_risk_analysis(
            portfolio_data=portfolio_data,
            lookback_days=lookback_days or 365
        )
        
        if "error" in analysis_results:
            raise HTTPException(status_code=500, detail=analysis_results['error'])
        
        return RiskContributionResponse(**analysis_results['risk_contribution'])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk contribution analysis failed: {str(e)}")


@app.post("/portfolio/{address}/correlation", response_model=CorrelationResponse, tags=["Risk Analysis"])
async def get_correlation_analysis(
    address: str = Path(..., description="Wallet address", min_length=42, max_length=42),
    lookback_days: Optional[int] = Query(365, description="Historical data lookback period in days"),
    coinbase_service: DeFiGuardCoinbaseService = Depends(get_coinbase_service),
    risk_service: RiskAnalysisService = Depends(get_risk_analysis_service)
):
    """
    Get asset correlation analysis - shows how assets move relative to each other
    
    High correlation (red) = assets move together = poor diversification
    Low correlation (blue/green) = assets move independently = good diversification
    """
    try:
        # Similar portfolio data extraction
        chain_balances = await coinbase_service.get_portfolio_balances(address, None)
        portfolio_data = {}
        
        for chain_balance in chain_balances:
            for token in chain_balance.tokens:
                if token.symbol in portfolio_data:
                    portfolio_data[token.symbol] += token.value_usd
                else:
                    portfolio_data[token.symbol] = token.value_usd
        
        portfolio_data = {k: v for k, v in portfolio_data.items() if v >= 10.0}
        
        if len(portfolio_data) < 2:
            raise HTTPException(status_code=400, detail="Need at least 2 assets for correlation analysis")
        
        analysis_results = await risk_service.get_portfolio_risk_analysis(
            portfolio_data=portfolio_data,
            lookback_days=lookback_days or 365
        )
        
        if "error" in analysis_results:
            raise HTTPException(status_code=500, detail=analysis_results['error'])
        
        return CorrelationResponse(**analysis_results['correlation'])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Correlation analysis failed: {str(e)}")


@app.post("/portfolio/{address}/efficient-frontier", response_model=EfficientFrontierResponse, tags=["Risk Analysis"])
async def get_efficient_frontier(
    address: str = Path(..., description="Wallet address", min_length=42, max_length=42),
    lookback_days: Optional[int] = Query(365, description="Historical data lookback period in days"),
    coinbase_service: DeFiGuardCoinbaseService = Depends(get_coinbase_service),
    risk_service: RiskAnalysisService = Depends(get_risk_analysis_service)
):
    """
    Get efficient frontier analysis - shows optimal risk/return combinations
    
    The efficient frontier shows the best possible return for each level of risk.
    Your current portfolio position is plotted against this optimal curve.
    """
    try:
        # Portfolio data extraction
        chain_balances = await coinbase_service.get_portfolio_balances(address, None)
        portfolio_data = {}
        
        for chain_balance in chain_balances:
            for token in chain_balance.tokens:
                if token.symbol in portfolio_data:
                    portfolio_data[token.symbol] += token.value_usd
                else:
                    portfolio_data[token.symbol] = token.value_usd
        
        portfolio_data = {k: v for k, v in portfolio_data.items() if v >= 10.0}
        
        if len(portfolio_data) < 2:
            raise HTTPException(status_code=400, detail="Need at least 2 assets for efficient frontier analysis")
        
        analysis_results = await risk_service.get_portfolio_risk_analysis(
            portfolio_data=portfolio_data,
            lookback_days=lookback_days or 365
        )
        
        if "error" in analysis_results:
            raise HTTPException(status_code=500, detail=analysis_results['error'])
        
        return EfficientFrontierResponse(**analysis_results['efficient_frontier'])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Efficient frontier analysis failed: {str(e)}")


# Development and testing endpoints
if settings.debug:
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
        level="DEBUG" if settings.debug else "INFO",
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
    )
    
    logger.info("🚀 Starting DeFiGuard Risk API server...")
    
    # Run the server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        workers=1 if settings.debug else 4,
        log_level="debug" if settings.debug else "info"
    )
