# DeFiGuard Risk - AI-Powered Multi-Chain Portfolio Management

![DeFiGuard Risk](https://img.shields.io/badge/DeFi-Portfolio%20Manager-blue)
![Hackathon Project](https://img.shields.io/badge/Hackathon-2025-green)

## Overview

DeFiGuard Risk is a sophisticated multi-chain portfolio management system that combines real-time data aggregation, advanced risk analysis, and AI-powered insights with automated cross-chain rebalancing capabilities. The system follows a "Fetch, Analyze, Act" pattern to deliver institutional-grade portfolio management for DeFi investors.

## Key Features

- 🔗 **Multi-Chain Portfolio Aggregation**: View all your DeFi holdings across Ethereum, Polygon, Arbitrum, Optimism, and Base
- 🧠 **AI-Powered Insights**: Natural language interface for portfolio analysis and recommendations
- 📊 **Advanced Risk Analysis**: Proprietary quantitative methodology using Barillas 6 Factor Model
- ⚡ **Automated Rebalancing**: One-click cross-chain portfolio optimization using Chainlink CCIP
- 🔍 **Real-Time Monitoring**: Continuous risk assessment and market regime detection
- 🛡️ **Security First**: Non-custodial design with comprehensive security measures

## Quick Start with Docker

### Prerequisites
- Docker and Docker Compose
- Git
- MetaMask or other Web3 wallet

### One-Command Setup
```bash
# Clone and start the entire application
git clone https://github.com/your-username/DefiGuardRisk.git
cd DefiGuardRisk
docker-compose up --build
```

This will start:
- Frontend (Next.js) on `http://localhost:3000`
- Backend (FastAPI) on `http://localhost:8000`
- Redis cache on `localhost:6379`
- PostgreSQL database on `localhost:5432`

## Architecture

### Core Workflow: "Fetch, Analyze, Act"
1. **Fetch**: Aggregate portfolio data across multiple blockchains using Coinbase CDP Data API
2. **Analyze**: Perform sophisticated risk analysis using historical data from The Graph and Riskfolio-Lib
3. **Act**: Execute automated cross-chain rebalancing using Chainlink CCIP

### Technology Stack

#### Frontend (Dockerized)
- **Next.js 14** with TypeScript
- **React 18** for component architecture
- **wagmi** for wallet connection
- **Tailwind CSS** for styling
- **Chart.js** for data visualization

#### Backend
- **FastAPI** with Python 3.11
- **Redis** for caching
- **PostgreSQL** for data persistence
- **Pydantic** for data validation

#### Smart Contracts
- **Solidity 0.8.19**
- **Hardhat** development environment
- **Chainlink CCIP** for cross-chain operations

### External Integrations
- **Coinbase CDP Data API** for multi-chain data
- **The Graph** for historical data
- **Chainlink MCP Server** for AI capabilities
- **Riskfolio-Lib** for quantitative analysis

## Development Setup

### Option 1: Full Docker Development (Recommended)
```bash
# Start all services with hot reload
docker-compose -f docker-compose.dev.yml up --build

# View logs
docker-compose logs -f frontend
docker-compose logs -f backend
```

### Option 2: Mixed Development (Frontend Docker + Local Backend)
```bash
# Start only frontend in Docker
docker-compose up frontend

# Run backend locally
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Option 3: Traditional Local Development
```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Smart Contracts
cd contracts
npm install
npx hardhat node
```

## Project Structure

```
DefiGuardRisk/
├── frontend/                 # Next.js React application (Dockerized)
│   ├── Dockerfile           # Frontend Docker configuration
│   ├── components/          # React components
│   ├── pages/              # Next.js pages
│   ├── styles/             # CSS and styling
│   └── types/              # TypeScript definitions
├── backend/                 # FastAPI Python backend
│   ├── Dockerfile          # Backend Docker configuration
│   ├── services/           # Business logic services
│   ├── models/             # Data models
│   ├── api/                # API endpoints
│   └── tests/              # Unit and integration tests
├── contracts/              # Smart contracts
│   ├── contracts/          # Solidity contracts
│   ├── scripts/            # Deployment scripts
│   └── test/               # Contract tests
├── docker-compose.yml      # Production Docker setup
├── docker-compose.dev.yml  # Development Docker setup
├── docs/                   # Documentation
├── scripts/                # Automation scripts
└── .kiro/                  # Project specifications
```

## API Documentation

Once running, visit `http://localhost:8000/docs` for interactive API documentation.

## Docker Commands

```bash
# Build and start all services
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f [service-name]

# Stop all services
docker-compose down

# Rebuild specific service
docker-compose build frontend
docker-compose up frontend

# Clean up containers and volumes
docker-compose down -v
docker system prune -a
```

## Environment Configuration

Create these files:
```bash
# Frontend environment
cp frontend/.env.example frontend/.env.local

# Backend environment  
cp backend/.env.example backend/.env

# Docker environment
cp .env.example .env
```

## Key Components

### Portfolio Service
- Multi-chain balance aggregation via Coinbase CDP Data API
- Real-time price data integration
- Portfolio value calculation and caching

### Risk Analysis Engine
- Barillas 6 Factor Model implementation
- PCA and eigenvalue analysis
- GRS statistics and risk-premium testing
- Markov Chain regime-switching models

### AI Agent Service
- Natural language portfolio queries via Chainlink MCP
- Automated strategy recommendations
- Risk explanation in plain language

### Rebalancing Engine
- Factor-based portfolio optimization
- Cross-chain transaction routing via Chainlink CCIP
- Gas optimization and slippage protection

## Testing

```bash
# Run all tests with Docker
docker-compose -f docker-compose.test.yml up --build

# Individual test suites
docker-compose exec backend pytest
docker-compose exec frontend npm test
docker-compose exec contracts npx hardhat test
```

## Security Features

- Non-custodial design - never access private keys
- Smart contract security audits with Slither
- Comprehensive input validation
- Rate limiting and DDoS protection
- Docker security best practices

## Contributing

This is a hackathon project. Contribute by:
1. Forking the repository
2. Making changes in a feature branch
3. Adding tests
4. Submitting a pull request

## License

MIT License - see [LICENSE](LICENSE) file.

## Hackathon Roadmap

- [x] Project structure and Docker setup
- [ ] Multi-chain portfolio aggregation
- [ ] Advanced quantitative risk analysis
- [ ] AI-powered portfolio insights
- [ ] Cross-chain automated rebalancing
- [ ] Production deployment

---

**Built for the 2025 Hackathon** 🚀

**Disclaimer**: Experimental software for educational purposes. Always DYOR before financial decisions.
