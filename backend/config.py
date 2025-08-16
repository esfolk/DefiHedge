"""
Configuration management for DeFiGuard Risk Backend
"""

import os
from typing import List, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Application Info
    app_name: str = Field("DeFiGuard Risk API", env="APP_NAME")
    app_version: str = Field("1.0.0", env="APP_VERSION")
    app_description: str = Field("AI-Powered Multi-Chain DeFi Portfolio Management", env="APP_DESCRIPTION")
    
    # Environment
    environment: str = Field("development", env="ENVIRONMENT")
    debug: bool = Field(True, env="DEBUG")
    log_level: str = Field("DEBUG", env="LOG_LEVEL")
    
    # API Keys
    cdp_api_key_id: str = Field(..., env="CDP_API_KEY_ID")
    cdp_api_secret: str = Field(..., env="CDP_API_KEY_SECRET")
    graph_api_key: Optional[str] = Field(None, env="GRAPH_API_KEY")
    mcp_server_url: Optional[str] = Field(None, env="MCP_SERVER_URL")
    
    # Database & Cache
    database_url: str = Field("postgresql://defiguard:password@postgres:5432/defiguard_db", env="DATABASE_URL")
    redis_url: str = Field("redis://redis:6379", env="REDIS_URL")
    redis_cache_ttl: int = Field(300, env="REDIS_CACHE_TTL")
    
    # Security
    jwt_secret: str = Field("dev-jwt-secret-change-in-production", env="JWT_SECRET")
    api_secret_key: str = Field("dev-api-secret-change-in-production", env="API_SECRET_KEY")
    cors_origins: str = Field("http://localhost:3000,http://localhost:3001", env="CORS_ORIGINS")
    
    # API Configuration
    api_rate_limit: int = Field(100, env="API_RATE_LIMIT")
    max_portfolio_size: int = Field(100, env="MAX_PORTFOLIO_SIZE")
    worker_processes: int = Field(4, env="WORKER_PROCESSES")
    
    # Blockchain Networks
    ethereum_rpc_url: Optional[str] = Field(None, env="ETHEREUM_RPC_URL")
    polygon_rpc_url: Optional[str] = Field(None, env="POLYGON_RPC_URL")
    arbitrum_rpc_url: Optional[str] = Field(None, env="ARBITRUM_RPC_URL")
    optimism_rpc_url: Optional[str] = Field(None, env="OPTIMISM_RPC_URL")
    base_rpc_url: Optional[str] = Field(None, env="BASE_RPC_URL")
    
    # Feature Flags
    enable_swagger: bool = Field(True, env="ENABLE_SWAGGER")
    enable_metrics: bool = Field(True, env="ENABLE_METRICS")
    enable_debug_logs: bool = Field(True, env="ENABLE_DEBUG_LOGS")
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore"
    }
        
    @property
    def is_production(self) -> bool:
        """Check if running in production environment"""
        return self.environment.lower() == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development environment"""
        return self.environment.lower() == "development"
    
    def get_cors_origins(self) -> List[str]:
        """Get CORS origins as a list"""
        return [origin.strip() for origin in self.cors_origins.split(",")]


# Global settings instance
settings = Settings()


# Chain configuration
class ChainConfig:
    """Blockchain network configuration"""
    
    SUPPORTED_CHAINS = {
        1: {
            "name": "Ethereum",
            "symbol": "ETH",
            "rpc_url": settings.ethereum_rpc_url,
            "explorer": "https://etherscan.io"
        },
        137: {
            "name": "Polygon",
            "symbol": "MATIC", 
            "rpc_url": settings.polygon_rpc_url,
            "explorer": "https://polygonscan.com"
        },
        42161: {
            "name": "Arbitrum",
            "symbol": "ETH",
            "rpc_url": settings.arbitrum_rpc_url,
            "explorer": "https://arbiscan.io"
        },
        10: {
            "name": "Optimism",
            "symbol": "ETH",
            "rpc_url": settings.optimism_rpc_url,
            "explorer": "https://optimistic.etherscan.io"
        },
        8453: {
            "name": "Base",
            "symbol": "ETH",
            "rpc_url": settings.base_rpc_url,
            "explorer": "https://basescan.org"
        }
    }
    
    @classmethod
    def get_chain_info(cls, chain_id: int) -> Optional[dict]:
        """Get chain information by ID"""
        return cls.SUPPORTED_CHAINS.get(chain_id)
    
    @classmethod
    def get_all_chains(cls) -> dict:
        """Get all supported chains"""
        return cls.SUPPORTED_CHAINS
    
    @classmethod 
    def is_supported(cls, chain_id: int) -> bool:
        """Check if chain is supported"""
        return chain_id in cls.SUPPORTED_CHAINS


# API Configuration
class APIConfig:
    """API-specific configuration"""
    
    # Rate limiting
    RATE_LIMIT_PER_MINUTE = settings.api_rate_limit
    RATE_LIMIT_BURST = settings.api_rate_limit * 2
    
    # Pagination
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100
    
    # Caching
    CACHE_TTL_SHORT = 30  # seconds
    CACHE_TTL_MEDIUM = 300  # 5 minutes
    CACHE_TTL_LONG = 3600  # 1 hour
    
    # Validation
    MAX_ADDRESS_BATCH_SIZE = 10
    MAX_SYMBOL_LENGTH = 10
    
    # Timeouts
    EXTERNAL_API_TIMEOUT = 30
    DATABASE_TIMEOUT = 10
