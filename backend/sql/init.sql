-- DeFiGuard Risk Database Schema
-- PostgreSQL initialization script

-- Create database (if not exists)
-- This is handled by Docker, but keeping for reference
-- CREATE DATABASE defiguard_db;

-- Connect to the database
\c defiguard_db;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create schemas for organization
CREATE SCHEMA IF NOT EXISTS portfolio;
CREATE SCHEMA IF NOT EXISTS risk;
CREATE SCHEMA IF NOT EXISTS rebalance;
CREATE SCHEMA IF NOT EXISTS ai;

-- Portfolio Tables
CREATE TABLE portfolio.portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address VARCHAR(42) NOT NULL UNIQUE,
    total_value_usd NUMERIC(20, 6) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE portfolio.chain_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolio.portfolios(id) ON DELETE CASCADE,
    chain_id INTEGER NOT NULL,
    chain_name VARCHAR(50) NOT NULL,
    total_value_usd NUMERIC(20, 6) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(portfolio_id, chain_id)
);

CREATE TABLE portfolio.token_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chain_balance_id UUID NOT NULL REFERENCES portfolio.chain_balances(id) ON DELETE CASCADE,
    token_address VARCHAR(42) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    balance NUMERIC(36, 18) NOT NULL DEFAULT 0,
    decimals INTEGER NOT NULL DEFAULT 18,
    price_usd NUMERIC(20, 6) NOT NULL DEFAULT 0,
    value_usd NUMERIC(20, 6) NOT NULL DEFAULT 0,
    logo_url TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(chain_balance_id, token_address)
);

-- Risk Analysis Tables
CREATE TABLE risk.risk_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolio.portfolios(id) ON DELETE CASCADE,
    portfolio_risk NUMERIC(10, 6) NOT NULL,
    sortino_ratio NUMERIC(10, 6),
    conditional_var NUMERIC(10, 6),
    max_drawdown NUMERIC(10, 6),
    sharpe_ratio NUMERIC(10, 6),
    volatility NUMERIC(10, 6),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE risk.asset_risks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    risk_metric_id UUID NOT NULL REFERENCES risk.risk_metrics(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    risk_score NUMERIC(10, 6) NOT NULL,
    contribution NUMERIC(10, 6) NOT NULL,
    recommendation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE risk.factor_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    risk_metric_id UUID NOT NULL REFERENCES risk.risk_metrics(id) ON DELETE CASCADE,
    factor_loadings JSONB NOT NULL,
    r_squared NUMERIC(10, 6),
    adjusted_r_squared NUMERIC(10, 6),
    residual_risk NUMERIC(10, 6),
    pca_results JSONB,
    grs_statistics JSONB,
    markov_regimes JSONB,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rebalancing Tables
CREATE TABLE rebalance.strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolio.portfolios(id) ON DELETE CASCADE,
    strategy_name VARCHAR(100) NOT NULL,
    current_allocation JSONB NOT NULL,
    target_allocation JSONB NOT NULL,
    expected_slippage NUMERIC(10, 6),
    confidence NUMERIC(5, 4),
    factor_optimization JSONB,
    status VARCHAR(20) DEFAULT 'pending', -- pending, executing, completed, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE rebalance.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_id UUID NOT NULL REFERENCES rebalance.strategies(id) ON DELETE CASCADE,
    chain_id INTEGER NOT NULL,
    transaction_type VARCHAR(20) NOT NULL, -- swap, bridge, transfer
    from_token VARCHAR(42) NOT NULL,
    to_token VARCHAR(42) NOT NULL,
    amount NUMERIC(36, 18) NOT NULL,
    estimated_gas NUMERIC(36, 18),
    dex_router VARCHAR(42),
    ccip_message_id VARCHAR(66),
    transaction_hash VARCHAR(66),
    status VARCHAR(20) DEFAULT 'pending', -- pending, submitted, confirmed, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE rebalance.gas_estimates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_id UUID NOT NULL REFERENCES rebalance.strategies(id) ON DELETE CASCADE,
    chain_id INTEGER NOT NULL,
    chain_name VARCHAR(50) NOT NULL,
    gas_price NUMERIC(36, 18) NOT NULL,
    gas_limit NUMERIC(36, 18) NOT NULL,
    estimated_cost_usd NUMERIC(20, 6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Agent Tables
CREATE TABLE ai.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES portfolio.portfolios(id) ON DELETE SET NULL,
    session_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE ai.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES ai.conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- user, assistant
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE ai.recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolio.portfolios(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50) NOT NULL,
    priority VARCHAR(10) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    expected_impact TEXT,
    confidence NUMERIC(5, 4),
    action_required BOOLEAN DEFAULT false,
    quantitative_support JSONB,
    status VARCHAR(20) DEFAULT 'active', -- active, dismissed, executed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Historical Data Tables
CREATE TABLE portfolio.price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_address VARCHAR(42) NOT NULL,
    chain_id INTEGER NOT NULL,
    price_usd NUMERIC(20, 6) NOT NULL,
    volume_24h NUMERIC(36, 18),
    market_cap NUMERIC(36, 18),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(token_address, chain_id, timestamp)
);

-- Indexes for performance
CREATE INDEX idx_portfolios_address ON portfolio.portfolios(address);
CREATE INDEX idx_chain_balances_portfolio_id ON portfolio.chain_balances(portfolio_id);
CREATE INDEX idx_chain_balances_chain_id ON portfolio.chain_balances(chain_id);
CREATE INDEX idx_token_balances_chain_balance_id ON portfolio.token_balances(chain_balance_id);
CREATE INDEX idx_token_balances_symbol ON portfolio.token_balances(symbol);
CREATE INDEX idx_risk_metrics_portfolio_id ON risk.risk_metrics(portfolio_id);
CREATE INDEX idx_strategies_portfolio_id ON rebalance.strategies(portfolio_id);
CREATE INDEX idx_strategies_status ON rebalance.strategies(status);
CREATE INDEX idx_transactions_strategy_id ON rebalance.transactions(strategy_id);
CREATE INDEX idx_transactions_status ON rebalance.transactions(status);
CREATE INDEX idx_conversations_portfolio_id ON ai.conversations(portfolio_id);
CREATE INDEX idx_messages_conversation_id ON ai.messages(conversation_id);
CREATE INDEX idx_recommendations_portfolio_id ON ai.recommendations(portfolio_id);
CREATE INDEX idx_recommendations_status ON ai.recommendations(status);
CREATE INDEX idx_price_history_token_chain ON portfolio.price_history(token_address, chain_id);
CREATE INDEX idx_price_history_timestamp ON portfolio.price_history(timestamp);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolio.portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON rebalance.strategies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON rebalance.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON ai.conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recommendations_updated_at BEFORE UPDATE ON ai.recommendations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA portfolio TO defiguard;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA risk TO defiguard;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA rebalance TO defiguard;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ai TO defiguard;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA portfolio TO defiguard;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA risk TO defiguard;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA rebalance TO defiguard;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ai TO defiguard;
