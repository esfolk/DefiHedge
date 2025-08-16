import { useState, useEffect, useCallback } from 'react';
import { PortfolioData, PriceData, Chain } from '@/../types';
import api, {
  CompleteRiskAnalysisResponse,
  RiskContributionResponse,
  CorrelationResponse,
  EfficientFrontierResponse,
  PortfolioMetricsResponse
} from '@/services/api';

// Generic hook for API calls with loading/error states
export function useApiCall<T>(
  apiFunction: () => Promise<T>,
  dependencies: any[] = [],
  immediate: boolean = true
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('API call failed:', err);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  const retry = useCallback(() => {
    execute();
  }, [execute]);

  return { data, loading, error, retry, execute };
}

// Hook for backend health status
export function useBackendHealth() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [healthData, setHealthData] = useState<any>(null);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const checkHealth = useCallback(async () => {
    try {
      const health = await api.health.check();
      setHealthData(health);
      setIsHealthy(true);
      setLastCheck(new Date());
    } catch (error) {
      setIsHealthy(false);
      setLastCheck(new Date());
      console.error('Backend health check failed:', error);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return {
    isHealthy,
    healthData,
    lastCheck,
    recheckHealth: checkHealth,
  };
}

// Hook for portfolio data
export function usePortfolio(address: string | null, chains?: string[]) {
  const apiCall = useCallback(async () => {
    if (!address) throw new Error('No address provided');
    return await api.portfolio.get(address, chains);
  }, [address, chains?.join(',')]);

  return useApiCall<PortfolioData>(
    apiCall,
    [address, chains?.join(',')],
    !!address // Only execute immediately if address is provided
  );
}

// Hook for batch portfolio data
export function useBatchPortfolio(addresses: string[], chains?: string[]) {
  const apiCall = useCallback(async () => {
    if (addresses.length === 0) throw new Error('No addresses provided');
    return await api.portfolio.getBatch(addresses, chains);
  }, [addresses.join(','), chains?.join(',')]);

  return useApiCall<PortfolioData[]>(
    apiCall,
    [addresses.join(','), chains?.join(',')],
    addresses.length > 0 // Only execute immediately if addresses are provided
  );
}

// Hook for token price
export function useTokenPrice(symbol: string | null) {
  const apiCall = useCallback(async () => {
    if (!symbol) throw new Error('No symbol provided');
    return await api.price.get(symbol);
  }, [symbol]);

  return useApiCall<PriceData>(
    apiCall,
    [symbol],
    !!symbol // Only execute immediately if symbol is provided
  );
}

// Hook for supported chains
export function useSupportedChains() {
  const apiCall = useCallback(async () => {
    return await api.chains.getAll();
  }, []);

  return useApiCall<Chain[]>(apiCall, [], true);
}

// Hook for managing multiple API calls
export function useMultipleApiCalls() {
  const [calls, setCalls] = useState<Map<string, any>>(new Map());

  const addCall = useCallback((key: string, apiFunction: () => Promise<any>) => {
    setCalls(prev => new Map(prev.set(key, {
      data: null,
      loading: true,
      error: null,
      execute: apiFunction
    })));

    // Execute the call
    apiFunction()
      .then(data => {
        setCalls(prev => {
          const updated = new Map(prev);
          const current = updated.get(key);
          if (current) {
            updated.set(key, { ...current, data, loading: false, error: null });
          }
          return updated;
        });
      })
      .catch(error => {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        setCalls(prev => {
          const updated = new Map(prev);
          const current = updated.get(key);
          if (current) {
            updated.set(key, { ...current, loading: false, error: errorMessage });
          }
          return updated;
        });
      });
  }, []);

  const getCall = useCallback((key: string) => {
    return calls.get(key) || { data: null, loading: false, error: null, execute: null };
  }, [calls]);

  const retryCall = useCallback(async (key: string) => {
    const call = calls.get(key);
    if (call?.execute) {
      setCalls(prev => {
        const updated = new Map(prev);
        const current = updated.get(key);
        if (current) {
          updated.set(key, { ...current, loading: true, error: null });
        }
        return updated;
      });

      try {
        const data = await call.execute();
        setCalls(prev => {
          const updated = new Map(prev);
          const current = updated.get(key);
          if (current) {
            updated.set(key, { ...current, data, loading: false, error: null });
          }
          return updated;
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        setCalls(prev => {
          const updated = new Map(prev);
          const current = updated.get(key);
          if (current) {
            updated.set(key, { ...current, loading: false, error: errorMessage });
          }
          return updated;
        });
      }
    }
  }, [calls]);

  return { addCall, getCall, retryCall };
}

// Risk Analysis Hooks

// Hook for complete risk analysis
export function useCompleteRiskAnalysis(address: string | null, lookbackDays: number = 365) {
  const apiCall = useCallback(async () => {
    if (!address) throw new Error('No address provided');
    return await api.riskAnalysis.getComplete(address, lookbackDays);
  }, [address, lookbackDays]);

  return useApiCall<CompleteRiskAnalysisResponse>(
    apiCall,
    [address, lookbackDays],
    false // Don't execute immediately - wait for manual trigger
  );
}

// Hook for risk contribution analysis
export function useRiskContribution(address: string | null, lookbackDays: number = 365) {
  const apiCall = useCallback(async () => {
    if (!address) throw new Error('No address provided');
    return await api.riskAnalysis.getRiskContribution(address, lookbackDays);
  }, [address, lookbackDays]);

  return useApiCall<RiskContributionResponse>(
    apiCall,
    [address, lookbackDays],
    false // Don't execute immediately - wait for manual trigger
  );
}

// Hook for correlation analysis
export function useCorrelationAnalysis(address: string | null, lookbackDays: number = 365) {
  const apiCall = useCallback(async () => {
    if (!address) throw new Error('No address provided');
    return await api.riskAnalysis.getCorrelation(address, lookbackDays);
  }, [address, lookbackDays]);

  return useApiCall<CorrelationResponse>(
    apiCall,
    [address, lookbackDays],
    false // Don't execute immediately - wait for manual trigger
  );
}

// Hook for efficient frontier analysis
export function useEfficientFrontier(address: string | null, lookbackDays: number = 365) {
  const apiCall = useCallback(async () => {
    if (!address) throw new Error('No address provided');
    return await api.riskAnalysis.getEfficientFrontier(address, lookbackDays);
  }, [address, lookbackDays]);

  return useApiCall<EfficientFrontierResponse>(
    apiCall,
    [address, lookbackDays],
    false // Don't execute immediately - wait for manual trigger
  );
}

// Combined hook for all risk analysis operations
export function useRiskAnalysisManager(address: string | null, lookbackDays: number = 365) {
  const completeAnalysis = useCompleteRiskAnalysis(address, lookbackDays);
  const riskContribution = useRiskContribution(address, lookbackDays);
  const correlation = useCorrelationAnalysis(address, lookbackDays);
  const efficientFrontier = useEfficientFrontier(address, lookbackDays);

  const runCompleteAnalysis = useCallback(async () => {
    if (!address) return null;
    try {
      return await completeAnalysis.execute();
    } catch (error) {
      console.error('Complete risk analysis failed:', error);
      throw error;
    }
  }, [address, completeAnalysis.execute]);

  const runRiskContribution = useCallback(async () => {
    if (!address) return null;
    return await riskContribution.execute();
  }, [address, riskContribution.execute]);

  const runCorrelation = useCallback(async () => {
    if (!address) return null;
    return await correlation.execute();
  }, [address, correlation.execute]);

  const runEfficientFrontier = useCallback(async () => {
    if (!address) return null;
    return await efficientFrontier.execute();
  }, [address, efficientFrontier.execute]);

  const isAnyLoading = completeAnalysis.loading || riskContribution.loading || correlation.loading || efficientFrontier.loading;
  const hasAnyError = completeAnalysis.error || riskContribution.error || correlation.error || efficientFrontier.error;

  return {
    // Individual analysis results
    completeAnalysis,
    riskContribution,
    correlation,
    efficientFrontier,
    
    // Combined execution functions
    runCompleteAnalysis,
    runRiskContribution,
    runCorrelation,
    runEfficientFrontier,
    
    // Combined state
    isAnyLoading,
    hasAnyError,
    
    // Utility functions
    retryAll: () => {
      completeAnalysis.retry();
      riskContribution.retry();
      correlation.retry();
      efficientFrontier.retry();
    }
  };
}
