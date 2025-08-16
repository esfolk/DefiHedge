/**
 * Performance optimization utilities for DeFiGuard Risk
 * Ensures smooth demo experience with caching and optimization
 */

// Simple in-memory cache for API responses
class APICache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  set(key: string, data: any, ttlMinutes: number = 5): void {
    const ttl = ttlMinutes * 60 * 1000; // Convert to milliseconds
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
}

// Global cache instance
export const apiCache = new APICache();

// Cache keys generator
export const cacheKeys = {
  portfolio: (address: string) => `portfolio:${address}`,
  riskAnalysis: (address: string, lookback: number) => `risk:${address}:${lookback}`,
  price: (symbol: string) => `price:${symbol}`,
  health: () => 'health'
};

// Performance monitoring
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();
  
  startTimer(key: string): () => number {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(key, duration);
      return duration;
    };
  }
  
  recordMetric(key: string, value: number): void {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    const values = this.metrics.get(key)!;
    values.push(value);
    
    // Keep only last 50 measurements
    if (values.length > 50) {
      values.shift();
    }
  }
  
  getAverageMetric(key: string): number {
    const values = this.metrics.get(key);
    if (!values || values.length === 0) return 0;
    
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }
  
  getAllMetrics(): Record<string, { average: number; count: number; latest: number }> {
    const result: Record<string, { average: number; count: number; latest: number }> = {};
    
    for (const [key, values] of this.metrics.entries()) {
      result[key] = {
        average: this.getAverageMetric(key),
        count: values.length,
        latest: values[values.length - 1] || 0
      };
    }
    
    return result;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Debounce utility for API calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
    }, waitMs);
  };
}

// Throttle utility for frequent events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limitMs);
    }
  };
}

// Chart rendering optimization
export const chartOptimization = {
  // Reduce data points for better performance
  downsampleData<T extends { x?: any; y?: any; [key: string]: any }>(
    data: T[], 
    maxPoints: number = 100
  ): T[] {
    if (data.length <= maxPoints) return data;
    
    const step = Math.ceil(data.length / maxPoints);
    return data.filter((_, index) => index % step === 0);
  },
  
  // Optimize animation settings for smooth demo
  getOptimalAnimationConfig(dataSize: number) {
    return {
      duration: dataSize > 50 ? 500 : 800, // Shorter animation for large datasets
      ease: 'easeInOut' as const,
      animateNewValues: dataSize <= 100, // Disable for very large datasets
    };
  }
};

// Demo-specific optimizations
export const demoOptimizations = {
  // Preload critical resources
  preloadResources: async () => {
    const promises = [
      // Preload demo portfolio data
      import('@/config/demo'),
      // Preload chart libraries
      import('recharts'),
    ];
    
    try {
      await Promise.all(promises);
      console.log('✅ Demo resources preloaded');
    } catch (error) {
      console.warn('⚠️ Some resources failed to preload:', error);
    }
  },
  
  // Simulate realistic loading times for better UX
  simulateLoading: (minMs: number = 800, maxMs: number = 2000) => {
    const randomDelay = minMs + Math.random() * (maxMs - minMs);
    return new Promise(resolve => setTimeout(resolve, randomDelay));
  },
  
  // Optimize for demo presentation
  presentationMode: {
    reducedAnimations: false,
    largerFonts: false,
    highContrast: false,
    showMetricExplanations: true
  }
};

// Browser performance detection
export const browserPerformance = {
  isHighPerformance: (): boolean => {
    // Check for hardware acceleration, memory, etc.
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    const hasWebGL = !!gl;
    
    // Check memory (if available)
    const memory = (performance as any).memory;
    const hasGoodMemory = !memory || memory.usedJSHeapSize < 50 * 1024 * 1024; // 50MB
    
    // Check connection
    const connection = (navigator as any).connection;
    const hasGoodConnection = !connection || connection.effectiveType !== 'slow-2g';
    
    return hasWebGL && hasGoodMemory && hasGoodConnection;
  },
  
  getOptimalSettings: () => {
    const isHighPerf = browserPerformance.isHighPerformance();
    
    return {
      animationsEnabled: isHighPerf,
      maxDataPoints: isHighPerf ? 200 : 50,
      chartAnimationDuration: isHighPerf ? 800 : 400,
      enableRealTimeUpdates: isHighPerf,
      cacheTimeout: isHighPerf ? 5 : 10 // minutes
    };
  }
};

// Error handling for performance issues
export const performanceErrorHandler = {
  handleAPITimeout: (error: any, operation: string) => {
    console.warn(`⚠️ ${operation} timed out:`, error);
    performanceMonitor.recordMetric(`${operation}_timeout`, 1);
    
    // Return cached data if available
    const cacheKey = cacheKeys.riskAnalysis(operation, 365);
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) {
      console.log('🔄 Using cached data for', operation);
      return cachedData;
    }
    
    throw new Error(`${operation} timed out. Please try again.`);
  },
  
  handleMemoryIssue: (operation: string) => {
    console.warn(`⚠️ Memory issue during ${operation}`);
    
    // Clear cache to free memory
    apiCache.clear();
    
    // Suggest browser refresh for severe issues
    if ((performance as any).memory?.usedJSHeapSize > 100 * 1024 * 1024) {
      console.warn('💾 High memory usage detected. Consider refreshing the page.');
    }
  }
};

export default {
  apiCache,
  cacheKeys,
  performanceMonitor,
  debounce,
  throttle,
  chartOptimization,
  demoOptimizations,
  browserPerformance,
  performanceErrorHandler
};
