import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { PortfolioData, PriceData, Chain } from '@/../types';
import { apiCache, cacheKeys, performanceMonitor } from '@/utils/performance';

// API Response interfaces matching backend models
export interface APIHealthResponse {
  status: string;
  timestamp: string;
  version: string;
  components: {
    coinbase_service: string;
    database: string;
    cache: string;
  };
}

export interface APIPortfolioResponse {
  success: boolean;
  data: PortfolioData;
  timestamp: string;
}

export interface APIPriceResponse {
  success: boolean;
  data: PriceData;
  timestamp: string;
}

export interface APIChainsResponse {
  success: boolean;
  data: Chain[];
  timestamp: string;
}

export interface APIBatchPortfolioRequest {
  addresses: string[];
  chains?: string[];
}

export interface APIBatchPortfolioResponse {
  success: boolean;
  data: PortfolioData[];
  timestamp: string;
}

export interface APIError {
  success: false;
  error: string;
  details?: any;
  timestamp: string;
}

// Risk Analysis API interfaces matching backend models
export interface RiskContributionData {
  asset: string;
  risk_contribution: number;
  portfolio_weight: number;
}

export interface RiskContributionResponse {
  data: RiskContributionData[];
  total_portfolio_risk: number;
  analysis_date: string;
}

export interface CorrelationData {
  asset1: string;
  asset2: string;
  correlation: number;
}

export interface CorrelationSummary {
  average_correlation: number;
  max_correlation: number;
  min_correlation: number;
  diversification_ratio: number;
}

export interface CorrelationResponse {
  data: CorrelationData[];
  assets: string[];
  summary: CorrelationSummary;
  analysis_date: string;
}

export interface FrontierPoint {
  return: number;
  risk: number;
  sharpe_ratio: number;
}

export interface PortfolioPoint {
  return: number;
  risk: number;
  sharpe_ratio: number;
}

export interface OptimalPortfolios {
  max_sharpe: PortfolioPoint;
  min_volatility: PortfolioPoint;
}

export interface EfficientFrontierResponse {
  frontier_points: FrontierPoint[];
  current_portfolio: PortfolioPoint;
  optimal_portfolios: OptimalPortfolios;
  analysis_date: string;
}

export interface PortfolioMetricsResponse {
  annual_return: number;
  annual_volatility: number;
  sharpe_ratio: number;
  var_95: number;
  max_drawdown: number;
  calmar_ratio: number;
  sortino_ratio: number;
  analysis_period_days: number;
  analysis_date: string;
}

export interface CompleteRiskAnalysisResponse {
  risk_contribution: RiskContributionResponse;
  correlation: CorrelationResponse;
  efficient_frontier: EfficientFrontierResponse;
  portfolio_metrics: PortfolioMetricsResponse;
}

export interface RiskAnalysisRequest {
  lookback_days?: number;
}

class APIClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        console.error(`❌ API Response Error: ${error.response?.status} ${error.config?.url}`, error);
        
        // Handle network errors
        if (!error.response) {
          throw new Error(`Network error: Unable to connect to ${this.baseURL}. Please ensure the backend server is running.`);
        }

        // Handle API errors
        const apiError = error.response?.data as APIError;
        if (apiError?.error) {
          throw new Error(apiError.error);
        }

        // Handle HTTP status errors
        switch (error.response?.status) {
          case 404:
            throw new Error('Resource not found');
          case 500:
            throw new Error('Internal server error');
          case 503:
            throw new Error('Service unavailable');
          default:
            throw new Error(`API error: ${error.response?.status} ${error.response?.statusText}`);
        }
      }
    );
  }

  // Health check endpoint
  async checkHealth(): Promise<APIHealthResponse> {
    const response = await this.client.get<APIHealthResponse>('/health');
    return response.data;
  }

  // Get portfolio for a single address
  async getPortfolio(address: string, chains?: string[]): Promise<PortfolioData> {
    const params = new URLSearchParams();
    if (chains && chains.length > 0) {
      params.append('chains', chains.join(','));
    }
    
    const url = `/portfolio/${address}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.client.get<APIPortfolioResponse>(url);
    
    if (!response.data.success) {
      throw new Error('Failed to fetch portfolio data');
    }
    
    return response.data.data;
  }

  // Get portfolios for multiple addresses (batch)
  async getBatchPortfolios(request: APIBatchPortfolioRequest): Promise<PortfolioData[]> {
    const response = await this.client.post<APIBatchPortfolioResponse>('/portfolio/batch', request);
    
    if (!response.data.success) {
      throw new Error('Failed to fetch batch portfolio data');
    }
    
    return response.data.data;
  }

  // Get token price
  async getPrice(symbol: string): Promise<PriceData> {
    const response = await this.client.get<APIPriceResponse>(`/price/${symbol}`);
    
    if (!response.data.success) {
      throw new Error(`Failed to fetch price for ${symbol}`);
    }
    
    return response.data.data;
  }

  // Get supported chains
  async getChains(): Promise<Chain[]> {
    const response = await this.client.get<APIChainsResponse>('/chains');
    
    if (!response.data.success) {
      throw new Error('Failed to fetch supported chains');
    }
    
    return response.data.data;
  }

  // Debug endpoint (only available in development)
  async getDebugTest(): Promise<any> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Debug endpoint not available in production');
    }
    
    const response = await this.client.get('/debug/test');
    return response.data;
  }

  // Get base URL for reference
  getBaseURL(): string {
    return this.baseURL;
  }

  // Check if backend is reachable
  async isBackendHealthy(): Promise<boolean> {
    try {
      await this.checkHealth();
      return true;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }

  // Risk Analysis endpoints with caching
  async getCompleteRiskAnalysis(address: string, lookbackDays: number = 365): Promise<CompleteRiskAnalysisResponse> {
    const cacheKey = cacheKeys.riskAnalysis(address, lookbackDays);
    
    // Check cache first
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) {
      console.log('🔄 Using cached risk analysis data for', address);
      return cachedData;
    }
    
    const endTimer = performanceMonitor.startTimer('risk_analysis_complete');
    
    try {
      const params = new URLSearchParams();
      if (lookbackDays !== 365) {
        params.append('lookback_days', lookbackDays.toString());
      }
      
      const url = `/portfolio/${address}/risk-analysis${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await this.client.post<CompleteRiskAnalysisResponse>(url);
      
      // Cache the response for 10 minutes (risk analysis is expensive)
      apiCache.set(cacheKey, response.data, 10);
      
      const duration = endTimer();
      console.log(`⚡ Risk analysis completed in ${duration.toFixed(0)}ms`);
      
      return response.data;
    } catch (error) {
      endTimer();
      throw error;
    }
  }

  async getRiskContribution(address: string, lookbackDays: number = 365): Promise<RiskContributionResponse> {
    const params = new URLSearchParams();
    if (lookbackDays !== 365) {
      params.append('lookback_days', lookbackDays.toString());
    }
    
    const url = `/portfolio/${address}/risk-contribution${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.client.post<RiskContributionResponse>(url);
    return response.data;
  }

  async getCorrelationAnalysis(address: string, lookbackDays: number = 365): Promise<CorrelationResponse> {
    const params = new URLSearchParams();
    if (lookbackDays !== 365) {
      params.append('lookback_days', lookbackDays.toString());
    }
    
    const url = `/portfolio/${address}/correlation${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.client.post<CorrelationResponse>(url);
    return response.data;
  }

  async getEfficientFrontier(address: string, lookbackDays: number = 365): Promise<EfficientFrontierResponse> {
    const params = new URLSearchParams();
    if (lookbackDays !== 365) {
      params.append('lookback_days', lookbackDays.toString());
    }
    
    const url = `/portfolio/${address}/efficient-frontier${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.client.post<EfficientFrontierResponse>(url);
    return response.data;
  }
}

// Create singleton instance
export const apiClient = new APIClient();

// Helper functions for common operations
export const api = {
  // Portfolio operations
  portfolio: {
    get: (address: string, chains?: string[]) => apiClient.getPortfolio(address, chains),
    getBatch: (addresses: string[], chains?: string[]) => 
      apiClient.getBatchPortfolios({ addresses, chains }),
  },

  // Price operations  
  price: {
    get: (symbol: string) => apiClient.getPrice(symbol),
  },

  // Chain operations
  chains: {
    getAll: () => apiClient.getChains(),
  },

  // Health operations
  health: {
    check: () => apiClient.checkHealth(),
    isHealthy: () => apiClient.isBackendHealthy(),
  },

  // Debug operations (dev only)
  debug: {
    test: () => apiClient.getDebugTest(),
  },

  // Risk analysis operations
  riskAnalysis: {
    getComplete: (address: string, lookbackDays?: number) => apiClient.getCompleteRiskAnalysis(address, lookbackDays),
    getRiskContribution: (address: string, lookbackDays?: number) => apiClient.getRiskContribution(address, lookbackDays),
    getCorrelation: (address: string, lookbackDays?: number) => apiClient.getCorrelationAnalysis(address, lookbackDays),
    getEfficientFrontier: (address: string, lookbackDays?: number) => apiClient.getEfficientFrontier(address, lookbackDays),
  },

  // Utility
  getBaseURL: () => apiClient.getBaseURL(),
};

export default api;
