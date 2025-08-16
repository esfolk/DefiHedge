"""
Database models for DeFiGuard Risk portfolio data
"""

from typing import Optional, List
from datetime import datetime
from dataclasses import dataclass
from decimal import Decimal

from pydantic import BaseModel, Field


@dataclass
class TokenBalance:
    """Token balance data structure"""
    address: str
    symbol: str
    name: str
    balance: str  # Keep as string to avoid precision loss
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


@dataclass
class Portfolio:
    """Complete portfolio data structure"""
    address: str
    total_value_usd: float
    chains: List[ChainBalance]
    last_updated: datetime
    supported_networks: int


# Pydantic models for API validation
class TokenBalanceModel(BaseModel):
    """Pydantic model for token balance validation"""
    address: str = Field(..., description="Token contract address")
    symbol: str = Field(..., min_length=1, max_length=10, description="Token symbol")
    name: str = Field(..., min_length=1, max_length=100, description="Token name")
    balance: str = Field(..., description="Token balance as string")
    decimals: int = Field(..., ge=0, le=18, description="Token decimals")
    price_usd: float = Field(..., ge=0, description="Token price in USD")
    value_usd: float = Field(..., ge=0, description="Token value in USD")
    logo_url: Optional[str] = Field(None, description="Token logo URL")
    
    class Config:
        arbitrary_types_allowed = True


class ChainBalanceModel(BaseModel):
    """Pydantic model for chain balance validation"""
    chain_id: int = Field(..., description="Blockchain network ID")
    chain_name: str = Field(..., description="Blockchain network name")
    tokens: List[TokenBalanceModel] = Field(..., description="List of token balances")
    total_value_usd: float = Field(..., ge=0, description="Total chain value in USD")
    
    class Config:
        arbitrary_types_allowed = True


class PortfolioModel(BaseModel):
    """Pydantic model for portfolio validation"""
    address: str = Field(..., min_length=42, max_length=42, description="Wallet address")
    total_value_usd: float = Field(..., ge=0, description="Total portfolio value in USD")
    chains: List[ChainBalanceModel] = Field(..., description="Chain balance data")
    last_updated: datetime = Field(..., description="Last update timestamp")
    supported_networks: int = Field(..., ge=0, description="Number of supported networks")
    
    class Config:
        arbitrary_types_allowed = True
