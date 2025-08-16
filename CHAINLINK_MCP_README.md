# 🔗 Chainlink MCP Integration

DeFiGuard Risk now includes comprehensive integration with **Chainlink Model Context Protocol (MCP)** for real-time, decentralized price feeds and oracle data across multiple blockchains.

## 🎯 Features

### Oracle Data Integration
- **Real-time Price Feeds**: Live price data from Chainlink oracles
- **Cross-Chain Support**: Ethereum, Polygon, Arbitrum, Base networks
- **Historical Data**: Price history and volatility analysis
- **Feed Health Monitoring**: Oracle uptime and data freshness tracking
- **Network Status**: Overall Chainlink network health metrics

### Advanced Analytics
- **Volatility Analysis**: Price volatility calculations with statistical metrics
- **Cross-Chain Arbitrage**: Price variance detection across different networks
- **Feed Reliability**: Oracle response time and data quality metrics
- **Correlation Analysis**: Price correlation across different assets

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │ Chainlink MCP   │
│   Dashboard     │◄──►│   FastAPI        │◄──►│    Server       │
│                 │    │                  │    │                 │
│ • Price Feeds   │    │ • REST API       │    │ • Price Oracles │
│ • Volatility    │    │ • Data Caching   │    │ • Historical    │
│ • Cross-Chain   │    │ • Error Handling │    │ • Network Data  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 1. Start with Chainlink MCP
```powershell
# Use the integrated startup script
.\start-with-chainlink.ps1
```

### 2. Manual Setup
```bash
# Terminal 1: Start Chainlink MCP Server
npx -y @chainlink/mcp-server

# Terminal 2: Start DeFiGuard Backend
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 3: Start Frontend
cd frontend
npm run dev
```

### 3. Access the Platform
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8000/docs
- **Chainlink Data**: Navigate to "🔗 Oracle Data" tab

## 📡 API Endpoints

### Price Feeds
```http
GET /chainlink/price/{symbol}?chain=ethereum
GET /chainlink/prices?symbols=ETH/USD,BTC/USD&chain=ethereum
GET /chainlink/price/{symbol}/history?days=30
GET /chainlink/price/{symbol}/volatility?period=24
```

### Cross-Chain Analysis
```http
GET /chainlink/price/{symbol}/cross-chain
GET /chainlink/feeds
GET /chainlink/feed/{symbol}/health
```

### Network Monitoring
```http
GET /chainlink/health
GET /chainlink/network/status
```

## 🎛️ Configuration

### Environment Variables
```bash
# Chainlink MCP Configuration
CHAINLINK_MCP_SERVER_URL=http://localhost:3002
CHAINLINK_NODE_URL=https://cl-ea.linkpool.io/
OPENAI_API_KEY=your_openrouter_api_key

# RPC Endpoints
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID
ARBITRUM_RPC_URL=https://arbitrum-mainnet.infura.io/v3/YOUR_PROJECT_ID
BASE_RPC_URL=https://mainnet.base.org
```

### MCP Server Configuration
```json
{
  "servers": {
    "chainlink": {
      "command": "npx",
      "args": ["-y", "@chainlink/mcp-server"],
      "env": {
        "MCP_AI_SERVICE": "openai",
        "OPENAI_API_KEY": "your_api_key",
        "CHAINLINK_NODE_URL": "https://cl-ea.linkpool.io/",
        "ETHEREUM_RPC_URL": "https://mainnet.infura.io/v3/YOUR_PROJECT_ID"
      }
    }
  }
}
```

## 📊 Supported Price Feeds

| Symbol   | Ethereum | Polygon | Arbitrum | Base |
|----------|----------|---------|----------|------|
| ETH/USD  | ✅       | ✅      | ✅       | ✅   |
| BTC/USD  | ✅       | ✅      | ✅       | ❌   |
| LINK/USD | ✅       | ✅      | ✅       | ❌   |
| USDC/USD | ✅       | ✅      | ✅       | ❌   |
| MATIC/USD| ✅       | ✅      | ❌       | ❌   |

## 🎨 Frontend Components

### ChainlinkPriceFeed
Real-time price feed component with volatility analysis:
```typescript
<ChainlinkPriceFeed
  symbol="ETH/USD"
  chain="ethereum"
  showVolatility={true}
  autoRefresh={true}
/>
```

### ChainlinkDashboard
Comprehensive oracle data dashboard:
```typescript
<ChainlinkDashboard
  defaultSymbols={['ETH/USD', 'BTC/USD', 'LINK/USD']}
  autoRefresh={true}
/>
```

## 🛠️ Technical Implementation

### Backend Service
```python
# chainlink_mcp_service.py
class ChainlinkMCPService:
    async def get_price_feed(self, symbol: str, chain: str):
        # Fetch real-time price from Chainlink oracle
        
    async def get_volatility(self, symbol: str, period: int):
        # Calculate price volatility metrics
        
    async def get_cross_chain_prices(self, symbol: str):
        # Compare prices across different chains
```

### Frontend Integration
```typescript
// React hook for real-time price data
const { data: priceData, loading, error } = useChainlinkPrice('ETH/USD', 'ethereum');

// Cross-chain price comparison
const { data: crossChainData } = useChainlinkCrossChain('ETH/USD');
```

## 🔍 Monitoring & Analytics

### Price Feed Health
- **Freshness**: Time since last oracle update
- **Deviation**: Price variance from other sources  
- **Availability**: Oracle uptime statistics
- **Response Time**: Query performance metrics

### Network Metrics
- **Active Nodes**: Number of participating oracles
- **Data Feeds**: Total available price pairs
- **Update Frequency**: Oracle refresh rates
- **Network Health**: Overall system status

## ⚡ Performance Optimization

### Caching Strategy
- **Price Data**: 30-second cache for current prices
- **Historical Data**: 5-minute cache for volatility analysis
- **Network Status**: 1-minute cache for health metrics
- **Cross-Chain**: 1-minute cache for arbitrage data

### Error Handling
- **Fallback Sources**: Multiple oracle redundancy
- **Retry Logic**: Exponential backoff for failed requests
- **Circuit Breaker**: Automatic failover for unhealthy feeds
- **Graceful Degradation**: Continue with available data

## 🔒 Security Considerations

### API Key Management
- Secure storage of OpenRouter API key
- Environment variable isolation
- No plain-text secrets in code
- Rotation policies for production

### Data Validation
- Price feed authenticity verification
- Timestamp validation for data freshness  
- Cross-reference with multiple sources
- Anomaly detection for price spikes

## 🧪 Testing

### Price Feed Validation
```bash
# Test individual price feed
curl "http://localhost:8000/chainlink/price/ETH%2FUSD?chain=ethereum"

# Test cross-chain comparison
curl "http://localhost:8000/chainlink/price/ETH%2FUSD/cross-chain"

# Test network health
curl "http://localhost:8000/chainlink/health"
```

### Integration Testing
- Real-time data accuracy validation
- Cross-chain price consistency checks
- Error handling for offline oracles
- Performance under high load

## 📈 Future Enhancements

### Advanced Features
- **Custom Price Feeds**: Support for additional token pairs
- **CCIP Integration**: Cross-Chain Interoperability Protocol
- **VRF Integration**: Verifiable Random Functions
- **Automation**: Chainlink Keepers integration

### Analytics Extensions  
- **Predictive Pricing**: ML-based price forecasting
- **Market Making**: Arbitrage opportunity detection
- **Risk Scoring**: Oracle reliability metrics
- **Portfolio Impact**: Price feed influence on portfolio value

## 🤝 Contributing

### Development Setup
1. Install dependencies: `npm install @chainlink/mcp-server`
2. Configure environment variables
3. Run integration tests
4. Submit PRs with oracle data improvements

### Oracle Feed Requests
- Submit GitHub issues for new price pairs
- Provide chain deployment addresses
- Include liquidity and volume metrics
- Test on testnets before mainnet requests

---

## 📚 Resources

- **Chainlink Documentation**: https://docs.chain.link/
- **MCP Protocol**: https://modelcontextprotocol.io/
- **Price Feed Addresses**: https://docs.chain.link/data-feeds/price-feeds/addresses
- **API Reference**: http://localhost:8000/docs#/Chainlink%20MCP

**Ready to analyze portfolios with institutional-grade oracle data! 🚀**
