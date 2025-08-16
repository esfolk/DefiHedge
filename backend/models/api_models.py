"""
API Models for DeFiGuard Risk Backend
Pydantic models for request/response schemas
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, validator
from enum import Enum


class ChainId(int, Enum):
    """Supported blockchain networks"""
    ETHEREUM = 1
    POLYGON = 137
    ARBITRUM = 42161
    OPTIMISM = 10
    BASE = 8453


class TokenBalanceResponse(BaseModel):
    """Token balance data response"""
    address: str = Field(..., description="Token contract address")
    symbol: str = Field(..., description="Token symbol (e.g., ETH, USDC)")
    name: str = Field(..., description="Token full name")
    balance: str = Field(..., description="Token balance as string to avoid precision loss")
    decimals: int = Field(..., description="Token decimal places")
    price_usd: float = Field(..., description="Current price in USD")
    value_usd: float = Field(..., description="Total value in USD")
    logo_url: Optional[str] = Field(None, description="Token logo URL")


class ChainBalanceResponse(BaseModel):
    """Chain balance data response"""
    chain_id: int = Field(..., description="Blockchain network ID")
    chain_name: str = Field(..., description="Blockchain network name")
    tokens: List[TokenBalanceResponse] = Field(..., description="List of token balances")
    total_value_usd: float = Field(..., description="Total value in USD for this chain")


class PortfolioResponse(BaseModel):
    """Complete portfolio response"""
    address: str = Field(..., description="Wallet address")
    total_value_usd: float = Field(..., description="Total portfolio value in USD")
    chains: List[ChainBalanceResponse] = Field(..., description="Balance data for each chain")
    supported_networks: int = Field(..., description="Number of supported networks")
    last_updated: datetime = Field(..., description="Timestamp of last data update")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class PortfolioRequest(BaseModel):
    """Portfolio fetch request"""
    address: str = Field(..., description="Wallet address to fetch portfolio for", min_length=42, max_length=42)
    chains: Optional[List[int]] = Field(None, description="Specific chain IDs to fetch (optional)")
    
    @validator('address')
    def validate_address(cls, v):
        if not v.startswith('0x'):
            raise ValueError('Address must start with 0x')
        if len(v) != 42:
            raise ValueError('Address must be 42 characters long')
        return v.lower()
    
    @validator('chains')
    def validate_chains(cls, v):
        if v is not None:
            valid_chains = [chain.value for chain in ChainId]
            for chain_id in v:
                if chain_id not in valid_chains:
                    raise ValueError(f'Unsupported chain ID: {chain_id}')
        return v


class PriceRequest(BaseModel):
    """Token price request"""
    symbol: str = Field(..., description="Token symbol")
    address: Optional[str] = Field(None, description="Token contract address (optional)")


class PriceResponse(BaseModel):
    """Token price response"""
    symbol: str = Field(..., description="Token symbol")
    price_usd: float = Field(..., description="Current price in USD")
    last_updated: datetime = Field(..., description="Timestamp of price data")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class HealthResponse(BaseModel):
    """Service health response"""
    service: str = Field(..., description="Service name")
    status: str = Field(..., description="Overall service status")
    components: Dict[str, str] = Field(..., description="Status of individual components")
    supported_chains: int = Field(..., description="Number of supported blockchain networks")
    timestamp: datetime = Field(..., description="Health check timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ErrorResponse(BaseModel):
    """Error response model"""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class SuccessResponse(BaseModel):
    """Generic success response"""
    success: bool = Field(True, description="Success indicator")
    message: str = Field(..., description="Success message")
    data: Optional[Any] = Field(None, description="Response data")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


# Chainlink MCP API Models

class ChainlinkPriceFeedResponse(BaseModel):
    """Chainlink price feed response"""
    symbol: str = Field(..., description="Price pair symbol (e.g., ETH/USD)")
    price: float = Field(..., description="Current price")
    decimals: int = Field(..., description="Price feed decimals")
    updated_at: datetime = Field(..., description="Last update timestamp")
    round_id: str = Field(..., description="Price feed round ID")
    chain: str = Field(..., description="Blockchain network")
    feed_address: str = Field(..., description="Price feed contract address")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ChainlinkMultiplePricesResponse(BaseModel):
    """Multiple Chainlink price feeds response"""
    prices: Dict[str, ChainlinkPriceFeedResponse] = Field(..., description="Price feed data by symbol")
    chain: str = Field(..., description="Blockchain network")
    fetched_at: datetime = Field(default_factory=datetime.utcnow, description="Data fetch timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ChainlinkHistoricalPrice(BaseModel):
    """Historical price data point"""
    timestamp: datetime = Field(..., description="Price timestamp")
    price: float = Field(..., description="Price value")
    round_id: str = Field(..., description="Round ID")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ChainlinkHistoricalPricesResponse(BaseModel):
    """Historical price data response"""
    symbol: str = Field(..., description="Price pair symbol")
    chain: str = Field(..., description="Blockchain network")
    period_days: int = Field(..., description="Historical data period in days")
    data: List[ChainlinkHistoricalPrice] = Field(..., description="Historical price data")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ChainlinkVolatilityResponse(BaseModel):
    """Price volatility analysis response"""
    symbol: str = Field(..., description="Price pair symbol")
    chain: str = Field(..., description="Blockchain network")
    period_hours: int = Field(..., description="Analysis period in hours")
    volatility_percent: float = Field(..., description="Volatility percentage")
    mean_price: float = Field(..., description="Mean price over period")
    min_price: float = Field(..., description="Minimum price")
    max_price: float = Field(..., description="Maximum price")
    price_range_percent: float = Field(..., description="Price range percentage")
    data_points: int = Field(..., description="Number of data points analyzed")


class ChainlinkCrossChainPricesResponse(BaseModel):
    """Cross-chain price comparison response"""
    symbol: str = Field(..., description="Price pair symbol")
    chains: Dict[str, ChainlinkPriceFeedResponse] = Field(..., description="Price data by chain")
    price_variance: float = Field(..., description="Price variance across chains")
    fetched_at: datetime = Field(default_factory=datetime.utcnow, description="Data fetch timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ChainlinkSupportedFeedsResponse(BaseModel):
    """Supported price feeds response"""
    feeds: Dict[str, List[str]] = Field(..., description="Supported symbols and their chains")
    total_feeds: int = Field(..., description="Total number of supported feeds")
    chains: List[str] = Field(..., description="Supported blockchain networks")


class ChainlinkFeedHealthResponse(BaseModel):
    """Price feed health status response"""
    symbol: str = Field(..., description="Price pair symbol")
    chain: str = Field(..., description="Blockchain network")
    is_healthy: bool = Field(..., description="Whether feed is healthy")
    last_updated: datetime = Field(..., description="Last update timestamp")
    minutes_since_update: int = Field(..., description="Minutes since last update")
    current_price: float = Field(..., description="Current price")
    round_id: str = Field(..., description="Current round ID")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ChainlinkNetworkStatusResponse(BaseModel):
    """Oracle network status response"""
    status: str = Field(..., description="Overall network status")
    active_nodes: Optional[int] = Field(None, description="Number of active oracle nodes")
    total_feeds: Optional[int] = Field(None, description="Total number of price feeds")
    network_health: Optional[str] = Field(None, description="Network health indicator")
    last_update: Optional[datetime] = Field(None, description="Last network status update")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ChainlinkHealthCheckResponse(BaseModel):
    """Chainlink MCP service health response"""
    status: str = Field(..., description="Service status")
    mcp_server_url: str = Field(..., description="MCP server URL")
    connection: str = Field(..., description="Connection status")
    sample_feed_working: bool = Field(..., description="Whether sample feed is working")
    supported_symbols: int = Field(..., description="Number of supported symbols")
    timestamp: datetime = Field(..., description="Health check timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


# Future API models for advanced features

# Risk Analysis Models

class RiskContributionData(BaseModel):
    """Risk contribution data for a single asset"""
    asset: str = Field(..., description="Asset symbol")
    risk_contribution: float = Field(..., description="Risk contribution percentage")
    portfolio_weight: float = Field(..., description="Portfolio weight percentage")


class RiskContributionResponse(BaseModel):
    """Risk contribution analysis response"""
    data: List[RiskContributionData] = Field(..., description="Risk contribution data for each asset")
    total_portfolio_risk: float = Field(..., description="Total portfolio risk percentage")
    analysis_date: datetime = Field(..., description="Analysis timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class CorrelationData(BaseModel):
    """Asset correlation data point"""
    asset1: str = Field(..., description="First asset symbol")
    asset2: str = Field(..., description="Second asset symbol")
    correlation: float = Field(..., description="Correlation coefficient")


class CorrelationSummary(BaseModel):
    """Correlation analysis summary"""
    average_correlation: float = Field(..., description="Average correlation between assets")
    max_correlation: float = Field(..., description="Maximum correlation")
    min_correlation: float = Field(..., description="Minimum correlation")
    diversification_ratio: float = Field(..., description="Portfolio diversification ratio")


class CorrelationResponse(BaseModel):
    """Asset correlation analysis response"""
    data: List[CorrelationData] = Field(..., description="Correlation matrix data")
    assets: List[str] = Field(..., description="List of assets analyzed")
    summary: CorrelationSummary = Field(..., description="Correlation summary statistics")
    analysis_date: datetime = Field(..., description="Analysis timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class FrontierPoint(BaseModel):
    """Efficient frontier data point"""
    return: float = Field(..., alias="return", description="Expected return percentage")
    risk: float = Field(..., description="Risk (volatility) percentage")
    sharpe_ratio: float = Field(..., description="Sharpe ratio")
    
    class Config:
        allow_population_by_field_name = True


class PortfolioPoint(BaseModel):
    """Portfolio performance point"""
    return: float = Field(..., alias="return", description="Portfolio return percentage")
    risk: float = Field(..., description="Portfolio risk percentage")
    sharpe_ratio: float = Field(..., description="Portfolio Sharpe ratio")
    
    class Config:
        allow_population_by_field_name = True


class OptimalPortfolios(BaseModel):
    """Optimal portfolio configurations"""
    max_sharpe: PortfolioPoint = Field(..., description="Maximum Sharpe ratio portfolio")
    min_volatility: PortfolioPoint = Field(..., description="Minimum volatility portfolio")


class EfficientFrontierResponse(BaseModel):
    """Efficient frontier analysis response"""
    frontier_points: List[FrontierPoint] = Field(..., description="Efficient frontier curve points")
    current_portfolio: PortfolioPoint = Field(..., description="Current portfolio position")
    optimal_portfolios: OptimalPortfolios = Field(..., description="Optimal portfolio suggestions")
    analysis_date: datetime = Field(..., description="Analysis timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class PortfolioMetricsResponse(BaseModel):
    """Comprehensive portfolio metrics response"""
    annual_return: float = Field(..., description="Annualized return percentage")
    annual_volatility: float = Field(..., description="Annualized volatility percentage")
    sharpe_ratio: float = Field(..., description="Sharpe ratio")
    var_95: float = Field(..., description="Value at Risk (95% confidence) percentage")
    max_drawdown: float = Field(..., description="Maximum drawdown percentage")
    calmar_ratio: float = Field(..., description="Calmar ratio")
    sortino_ratio: float = Field(..., description="Sortino ratio")
    analysis_period_days: int = Field(..., description="Analysis period in days")
    analysis_date: datetime = Field(..., description="Analysis timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class RiskAnalysisRequest(BaseModel):
    """Risk analysis request"""
    portfolio_data: Dict[str, float] = Field(..., description="Portfolio data mapping symbols to USD values")
    lookback_days: Optional[int] = Field(365, description="Historical data lookback period in days")
    
    @validator('portfolio_data')
    def validate_portfolio_data(cls, v):
        if not v:
            raise ValueError('Portfolio data cannot be empty')
        for symbol, value in v.items():
            if value <= 0:
                raise ValueError(f'Portfolio value for {symbol} must be positive')
        return v
    
    @validator('lookback_days')
    def validate_lookback_days(cls, v):
        if v is not None and (v < 30 or v > 1095):
            raise ValueError('Lookback days must be between 30 and 1095')
        return v


class CompleteRiskAnalysisResponse(BaseModel):
    """Complete risk analysis response containing all analyses"""
    risk_contribution: RiskContributionResponse = Field(..., description="Risk contribution analysis")
    correlation: CorrelationResponse = Field(..., description="Asset correlation analysis")
    efficient_frontier: EfficientFrontierResponse = Field(..., description="Efficient frontier analysis")
    portfolio_metrics: PortfolioMetricsResponse = Field(..., description="Comprehensive portfolio metrics")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AssetRisk(BaseModel):
    """Individual asset risk data"""
    symbol: str = Field(..., description="Asset symbol")
    risk_score: float = Field(..., description="Risk score for this asset")
    contribution: float = Field(..., description="Contribution to portfolio risk")
    recommendation: str = Field(..., description="Risk management recommendation")


class AIRecommendationResponse(BaseModel):
    """AI recommendation response (for future implementation)"""
    id: str = Field(..., description="Recommendation ID")
    type: str = Field(..., description="Recommendation type")
    priority: str = Field(..., description="Priority level (high/medium/low)")
    title: str = Field(..., description="Recommendation title")
    description: str = Field(..., description="Detailed recommendation")
    confidence: float = Field(..., description="AI confidence level (0-1)")
    action_required: bool = Field(..., description="Whether user action is required")
    created_at: datetime = Field(..., description="Recommendation creation time")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
