// Core DeFiGuard Risk TypeScript Interfaces
// Based on the design.md specifications

export interface Portfolio {
  address: string;
  totalValueUSD: number;
  lastUpdated: Date;
  chains: ChainBalance[];
  riskMetrics?: RiskMetrics;
}

export interface ChainBalance {
  chainId: number;
  chainName: string;
  tokens: TokenBalance[];
  totalValueUSD: number;
}

export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  priceUSD: number;
  valueUSD: number;
  logoUrl?: string;
}

export interface RiskMetrics {
  portfolioRisk: number;
  sortinoRatio: number;
  conditionalVaR: number;
  maxDrawdown: number;
  sharpeRatio: number;
  volatility: number;
  assetRisks: AssetRisk[];
  lastCalculated: Date;
  factorAnalysis?: FactorAnalysis;
}

export interface AssetRisk {
  symbol: string;
  riskScore: number;
  contribution: number;
  recommendation: string;
}

// Proprietary Quantitative Analysis Types
export interface FactorAnalysis {
  barillasFactors: BarillasFactorModel;
  pcaResults: PCAResults;
  grsStatistics: GRSStatistics;
  markovRegimes: MarkovRegime[];
  lastUpdated: Date;
}

export interface BarillasFactorModel {
  factorLoadings: FactorLoading[];
  rSquared: number;
  adjustedRSquared: number;
  residualRisk: number;
}

export interface FactorLoading {
  factorName: string;
  loading: number;
  tStatistic: number;
  pValue: number;
}

export interface PCAResults {
  eigenValues: number[];
  eigenVectors: number[][];
  explainedVarianceRatio: number[];
  cumulativeVariance: number[];
  principalComponents: PrincipalComponent[];
}

export interface PrincipalComponent {
  componentNumber: number;
  variance: number;
  loadings: { [symbol: string]: number };
}

export interface GRSStatistics {
  grsStatistic: number;
  pValue: number;
  criticalValue: number;
  isSignificant: boolean;
  degreesOfFreedom: [number, number];
}

export interface MarkovRegime {
  regimeId: number;
  regimeName: string;
  probability: number;
  characteristics: {
    volatility: number;
    expectedReturn: number;
    correlationLevel: string;
  };
}

export interface RebalanceStrategy {
  id: string;
  currentAllocation: AllocationTarget[];
  targetAllocation: AllocationTarget[];
  transactions: RebalanceTransaction[];
  estimatedGas: GasEstimate[];
  expectedSlippage: number;
  confidence: number;
  factorOptimization?: FactorOptimization;
}

export interface AllocationTarget {
  symbol: string;
  address: string;
  chainId: number;
  currentWeight: number;
  targetWeight: number;
  currentValueUSD: number;
  targetValueUSD: number;
}

export interface RebalanceTransaction {
  chainId: number;
  type: 'swap' | 'bridge' | 'transfer';
  fromToken: string;
  toToken: string;
  amount: string;
  estimatedGas: string;
  dexRouter?: string;
  ccipMessageId?: string;
}

export interface GasEstimate {
  chainId: number;
  chainName: string;
  gasPrice: string;
  gasLimit: string;
  estimatedCostUSD: number;
}

export interface FactorOptimization {
  targetFactorExposures: { [factorName: string]: number };
  currentFactorExposures: { [factorName: string]: number };
  optimizationObjective: 'factor_neutral' | 'factor_tilted' | 'risk_parity';
  constraints: OptimizationConstraint[];
}

export interface OptimizationConstraint {
  type: 'max_weight' | 'min_weight' | 'max_turnover' | 'max_gas_cost';
  value: number;
  description: string;
}

// AI Agent Types
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    portfolioContext?: Portfolio;
    riskAnalysis?: RiskMetrics;
    recommendations?: AIRecommendation[];
  };
}

export interface AIRecommendation {
  id: string;
  type: 'rebalance' | 'risk_reduction' | 'diversification' | 'factor_exposure';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: string;
  confidence: number;
  actionRequired: boolean;
  quantitativeSupport?: QuantitativeEvidence;
}

export interface QuantitativeEvidence {
  backtestResults?: BacktestResult[];
  stressTestResults?: StressTestResult[];
  factorContributions?: { [factor: string]: number };
  riskMetricsImpact?: RiskMetricsChange;
}

export interface BacktestResult {
  period: string;
  returns: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
}

export interface StressTestResult {
  scenario: string;
  portfolioImpact: number;
  worstCaseScenario: number;
  probabilityOfLoss: number;
}

export interface RiskMetricsChange {
  currentValue: number;
  projectedValue: number;
  improvement: number;
  improvementPercentage: number;
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Chain Configuration Types
export interface ChainConfig {
  id: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
  testnet: boolean;
  iconUrl?: string;
}

// Enhanced Wallet Connection Types with Provider Support
export interface WalletConnection {
  address: string;
  chainId: number;
  isConnected: boolean;
  connector?: string;
  provider?: any;
}

// DeFi Dashboard Types (from frontend-temp integration)
export interface Chain {
  id: string;
  name: string;
  symbol: string;
  logo: string;
  rpcUrl: string;
  blockExplorer: string;
  isTestnet?: boolean;
}

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logo?: string;
  balance: string;
  balanceUSD: number;
  price: number;
  priceChange24h?: number;
  chain: string;
}

export interface PortfolioData {
  address: string;
  totalValueUSD: number;
  chains: {
    [chainId: string]: {
      name: string;
      totalValueUSD: number;
      tokens: Token[];
    };
  };
  lastUpdated: string;
}

export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
  lastUpdated: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalTokens: number;
  chainsCount: number;
  topHoldings: Token[];
  chainDistribution: {
    chainId: string;
    name: string;
    value: number;
    percentage: number;
  }[];
}

// Supported Chains Configuration
export const SUPPORTED_CHAINS: Chain[] = [
  {
    id: '1',
    name: 'Ethereum',
    symbol: 'ETH',
    logo: '🔷',
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorer: 'https://etherscan.io'
  },
  {
    id: '137',
    name: 'Polygon',
    symbol: 'MATIC',
    logo: '🔮',
    rpcUrl: 'https://polygon.llamarpc.com',
    blockExplorer: 'https://polygonscan.com'
  },
  {
    id: '42161',
    name: 'Arbitrum',
    symbol: 'ARB',
    logo: '🔵',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io'
  },
  {
    id: '10',
    name: 'Optimism',
    symbol: 'OP',
    logo: '🔴',
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io'
  },
  {
    id: '8453',
    name: 'Base',
    symbol: 'BASE',
    logo: '🔶',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org'
  }
];

// Error Types
export interface DeFiGuardError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  recoverable: boolean;
}

// Utility Types
export type ChainId = 1 | 137 | 42161 | 10 | 8453; // Ethereum, Polygon, Arbitrum, Optimism, Base
export type TimeFrame = '1D' | '7D' | '30D' | '90D' | '1Y';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
