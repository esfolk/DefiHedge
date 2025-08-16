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


# Future API models for advanced features

class RiskMetricsResponse(BaseModel):
    """Risk analysis response (for future implementation)"""
    portfolio_risk: float = Field(..., description="Overall portfolio risk score")
    sortino_ratio: Optional[float] = Field(None, description="Sortino ratio")
    conditional_var: Optional[float] = Field(None, description="Conditional Value at Risk")
    max_drawdown: Optional[float] = Field(None, description="Maximum drawdown")
    sharpe_ratio: Optional[float] = Field(None, description="Sharpe ratio")
    volatility: Optional[float] = Field(None, description="Portfolio volatility")
    calculated_at: datetime = Field(..., description="Risk calculation timestamp")
    
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
