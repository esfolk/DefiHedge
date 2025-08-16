/**
 * Demo Configuration for DeFiGuard Risk
 * Curated sample portfolios for compelling demonstrations
 */

export interface DemoPortfolio {
  address: string;
  name: string;
  description: string;
  estimatedValue: string;
  riskProfile: 'Conservative' | 'Balanced' | 'Aggressive' | 'Experimental';
  highlights: string[];
  expectedMetrics?: {
    sharpe_ratio?: number;
    annual_return?: number;
    max_drawdown?: number;
    diversification_score?: number;
  };
}

export const DEMO_PORTFOLIOS: DemoPortfolio[] = [
  {
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    name: 'DeFi Blue Chip Portfolio',
    description: 'Well-diversified portfolio focused on established DeFi protocols with strong risk-adjusted returns',
    estimatedValue: '$2.5M+',
    riskProfile: 'Balanced',
    highlights: [
      'High Sharpe ratio (>1.2)',
      'Excellent diversification across protocols',
      'Strong correlation analysis',
      'Optimal efficient frontier positioning'
    ],
    expectedMetrics: {
      sharpe_ratio: 1.35,
      annual_return: 24.8,
      max_drawdown: -18.5,
      diversification_score: 0.82
    }
  },
  {
    address: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
    name: 'Yield Farming Specialist',
    description: 'High-yield focused portfolio with sophisticated liquidity provision strategies',
    estimatedValue: '$1.8M+',
    riskProfile: 'Aggressive',
    highlights: [
      'High annual returns (30%+)',
      'Advanced LP token strategies',
      'Multi-chain yield optimization',
      'Risk contribution analysis reveals concentration risks'
    ],
    expectedMetrics: {
      sharpe_ratio: 0.95,
      annual_return: 32.4,
      max_drawdown: -28.2,
      diversification_score: 0.65
    }
  },
  {
    address: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503',
    name: 'Institutional Grade Portfolio',
    description: 'Conservative, institution-grade portfolio with emphasis on risk management',
    estimatedValue: '$5.2M+',
    riskProfile: 'Conservative',
    highlights: [
      'Exceptional risk management',
      'Low correlation between assets',
      'Stable returns with minimal drawdown',
      'Perfect for institutional investors'
    ],
    expectedMetrics: {
      sharpe_ratio: 1.85,
      annual_return: 16.8,
      max_drawdown: -8.3,
      diversification_score: 0.91
    }
  },
  {
    address: '0x8ba1f109551bD432803012645Hac136c72PDc933',
    name: 'Experimental DeFi Lab',
    description: 'Cutting-edge DeFi experiments with novel protocols and strategies',
    estimatedValue: '$850K+',
    riskProfile: 'Experimental',
    highlights: [
      'Novel DeFi protocol exposure',
      'High volatility with high returns',
      'Perfect for risk analysis demonstration',
      'Shows importance of position sizing'
    ],
    expectedMetrics: {
      sharpe_ratio: 0.72,
      annual_return: 45.6,
      max_drawdown: -42.1,
      diversification_score: 0.48
    }
  }
];

export const DEMO_MODE_CONFIG = {
  // API simulation for offline demos
  simulateApiDelay: true,
  apiDelayMs: 2000,
  
  // UI enhancements for demos
  showProgressIndicators: true,
  enableSmoothTransitions: true,
  highlightKeyMetrics: true,
  
  // Demo-specific features
  showMetricExplanations: true,
  enableGuidedTour: false, // Can be enabled for first-time users
  autoProgressThroughTabs: false,
  
  // Performance optimizations
  preloadChartData: true,
  enableDataCaching: true,
  
  // Presentation mode
  largerFonts: false,
  highContrast: false,
  reducedAnimations: false
};

export const DEMO_SCRIPT = {
  introduction: {
    title: 'Welcome to DeFiGuard Risk',
    subtitle: 'AI-Powered Multi-Chain Portfolio Management',
    keyPoints: [
      'Real-time portfolio aggregation across multiple blockchains',
      'Institutional-grade risk analysis using modern portfolio theory',
      'Advanced quantitative metrics powered by Riskfolio-Lib and PyPortfolioOpt',
      'Beautiful visualizations for complex financial data'
    ]
  },
  
  portfolioOverview: {
    title: 'Multi-Chain Portfolio Aggregation',
    keyPoints: [
      'Seamless integration with Coinbase CDP for real-time data',
      'Support for Ethereum, Polygon, Base, and other major chains',
      'Automatic token recognition and price fetching',
      'Real-time portfolio valuation and composition analysis'
    ]
  },
  
  riskAnalysis: {
    title: 'Professional Risk Analysis',
    sections: {
      riskContribution: {
        title: 'Risk Contribution Analysis',
        description: 'Understand which assets contribute most to your portfolio risk',
        keyPoints: [
          'Reveals hidden concentration risks',
          'Helps optimize position sizing',
          'Critical for professional portfolio management'
        ]
      },
      correlation: {
        title: 'Asset Correlation Heatmap',
        description: 'Visualize diversification and correlation patterns',
        keyPoints: [
          'Identify over-correlated positions',
          'Optimize for true diversification',
          'Essential for risk-adjusted returns'
        ]
      },
      efficientFrontier: {
        title: 'Efficient Frontier Analysis',
        description: 'Find optimal risk-return combinations',
        keyPoints: [
          'Modern portfolio theory in action',
          'Identify optimal portfolio positioning',
          'Compare current vs. optimal allocations'
        ]
      }
    }
  },
  
  businessValue: {
    title: 'Business Value Proposition',
    keyPoints: [
      'Institutional-grade analysis previously unavailable for DeFi',
      'Democratizes sophisticated portfolio management tools',
      'Enables data-driven investment decisions',
      'Reduces portfolio risk through quantitative analysis',
      'Supports professional DeFi portfolio management'
    ]
  }
};

export const DEMO_METRICS_EXPLANATIONS = {
  sharpe_ratio: {
    name: 'Sharpe Ratio',
    description: 'Measures risk-adjusted return. Higher is better.',
    goodRange: '> 1.0 is excellent, > 2.0 is exceptional',
    calculation: '(Return - Risk-free rate) / Standard Deviation'
  },
  sortino_ratio: {
    name: 'Sortino Ratio',
    description: 'Like Sharpe ratio, but only considers downside risk',
    goodRange: '> 1.0 is good, > 1.5 is excellent',
    calculation: '(Return - Risk-free rate) / Downside Deviation'
  },
  max_drawdown: {
    name: 'Maximum Drawdown',
    description: 'Largest peak-to-trough decline. Lower is better.',
    goodRange: '< 20% is conservative, < 10% is very conservative',
    calculation: 'Maximum % loss from any peak'
  },
  var_95: {
    name: 'Value at Risk (95%)',
    description: 'Maximum expected loss 95% of the time',
    goodRange: 'Depends on risk tolerance and investment horizon',
    calculation: '95th percentile of loss distribution'
  },
  annual_return: {
    name: 'Annual Return',
    description: 'Expected yearly return based on historical data',
    goodRange: 'Varies by market conditions and risk profile',
    calculation: 'Annualized historical return'
  },
  annual_volatility: {
    name: 'Annual Volatility',
    description: 'Measure of price fluctuation. Lower can be better for risk-averse investors.',
    goodRange: '< 20% is low, > 50% is high volatility',
    calculation: 'Annualized standard deviation of returns'
  }
};

export default {
  DEMO_PORTFOLIOS,
  DEMO_MODE_CONFIG,
  DEMO_SCRIPT,
  DEMO_METRICS_EXPLANATIONS
};
