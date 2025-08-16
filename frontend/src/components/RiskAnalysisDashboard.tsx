'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { RiskContributionChart } from './RiskContributionChart'
import { CorrelationHeatmap } from './CorrelationHeatmap'
import { EfficientFrontierChart } from './EfficientFrontierChart'
import { RefreshCcw, AlertTriangle, TrendingUp, Shield, Target } from 'lucide-react'

// Type definitions for the complete risk analysis response
interface RiskContributionData {
  asset: string
  risk_contribution: number
  portfolio_weight: number
}

interface RiskContributionResponse {
  data: RiskContributionData[]
  total_portfolio_risk: number
  analysis_date: string
}

interface CorrelationData {
  asset1: string
  asset2: string
  correlation: number
}

interface CorrelationSummary {
  average_correlation: number
  max_correlation: number
  min_correlation: number
  diversification_ratio: number
}

interface CorrelationResponse {
  data: CorrelationData[]
  assets: string[]
  summary: CorrelationSummary
  analysis_date: string
}

interface FrontierPoint {
  return: number
  risk: number
  sharpe_ratio: number
}

interface PortfolioPoint {
  return: number
  risk: number
  sharpe_ratio: number
}

interface OptimalPortfolios {
  max_sharpe: PortfolioPoint
  min_volatility: PortfolioPoint
}

interface EfficientFrontierResponse {
  frontier_points: FrontierPoint[]
  current_portfolio: PortfolioPoint
  optimal_portfolios: OptimalPortfolios
  analysis_date: string
}

interface PortfolioMetricsResponse {
  annual_return: number
  annual_volatility: number
  sharpe_ratio: number
  var_95: number
  max_drawdown: number
  calmar_ratio: number
  sortino_ratio: number
  analysis_period_days: number
  analysis_date: string
}

interface CompleteRiskAnalysis {
  risk_contribution: RiskContributionResponse
  correlation: CorrelationResponse
  efficient_frontier: EfficientFrontierResponse
  portfolio_metrics: PortfolioMetricsResponse
}

interface RiskAnalysisDashboardProps {
  walletAddress: string
  onAnalyze?: (address: string) => Promise<CompleteRiskAnalysis | null>
  isLoading?: boolean
  initialData?: CompleteRiskAnalysis | null
}

// Mock data for demonstration
const generateMockData = (): CompleteRiskAnalysis => ({
  risk_contribution: {
    data: [
      { asset: 'ETH', risk_contribution: 45.2, portfolio_weight: 35.0 },
      { asset: 'USDC', risk_contribution: 15.1, portfolio_weight: 30.0 },
      { asset: 'MATIC', risk_contribution: 25.3, portfolio_weight: 20.0 },
      { asset: 'LINK', risk_contribution: 14.4, portfolio_weight: 15.0 }
    ],
    total_portfolio_risk: 18.5,
    analysis_date: new Date().toISOString()
  },
  correlation: {
    data: [
      { asset1: 'ETH', asset2: 'ETH', correlation: 1.0 },
      { asset1: 'ETH', asset2: 'USDC', correlation: -0.12 },
      { asset1: 'ETH', asset2: 'MATIC', correlation: 0.78 },
      { asset1: 'ETH', asset2: 'LINK', correlation: 0.65 },
      { asset1: 'USDC', asset2: 'ETH', correlation: -0.12 },
      { asset1: 'USDC', asset2: 'USDC', correlation: 1.0 },
      { asset1: 'USDC', asset2: 'MATIC', correlation: -0.05 },
      { asset1: 'USDC', asset2: 'LINK', correlation: 0.02 },
      { asset1: 'MATIC', asset2: 'ETH', correlation: 0.78 },
      { asset1: 'MATIC', asset2: 'USDC', correlation: -0.05 },
      { asset1: 'MATIC', asset2: 'MATIC', correlation: 1.0 },
      { asset1: 'MATIC', asset2: 'LINK', correlation: 0.72 },
      { asset1: 'LINK', asset2: 'ETH', correlation: 0.65 },
      { asset1: 'LINK', asset2: 'USDC', correlation: 0.02 },
      { asset1: 'LINK', asset2: 'MATIC', correlation: 0.72 },
      { asset1: 'LINK', asset2: 'LINK', correlation: 1.0 }
    ],
    assets: ['ETH', 'USDC', 'MATIC', 'LINK'],
    summary: {
      average_correlation: 0.42,
      max_correlation: 0.78,
      min_correlation: -0.12,
      diversification_ratio: 0.58
    },
    analysis_date: new Date().toISOString()
  },
  efficient_frontier: {
    frontier_points: [
      { return: 8.5, risk: 12.5, sharpe_ratio: 0.68 },
      { return: 12.2, risk: 15.8, sharpe_ratio: 0.77 },
      { return: 15.8, risk: 18.5, sharpe_ratio: 0.85 },
      { return: 19.5, risk: 22.1, sharpe_ratio: 0.88 },
      { return: 23.2, risk: 26.8, sharpe_ratio: 0.87 },
      { return: 26.8, risk: 32.5, sharpe_ratio: 0.82 }
    ],
    current_portfolio: {
      return: 16.5,
      risk: 21.2,
      sharpe_ratio: 0.78
    },
    optimal_portfolios: {
      max_sharpe: {
        return: 19.5,
        risk: 22.1,
        sharpe_ratio: 0.88
      },
      min_volatility: {
        return: 8.5,
        risk: 12.5,
        sharpe_ratio: 0.68
      }
    },
    analysis_date: new Date().toISOString()
  },
  portfolio_metrics: {
    annual_return: 16.5,
    annual_volatility: 21.2,
    sharpe_ratio: 0.78,
    var_95: -5.2,
    max_drawdown: -18.5,
    calmar_ratio: 0.89,
    sortino_ratio: 1.12,
    analysis_period_days: 365,
    analysis_date: new Date().toISOString()
  }
})

export function RiskAnalysisDashboard({ 
  walletAddress, 
  onAnalyze, 
  isLoading = false,
  initialData = null 
}: RiskAnalysisDashboardProps) {
  const [analysisData, setAnalysisData] = useState<CompleteRiskAnalysis | null>(initialData)
  const [activeTab, setActiveTab] = useState<'overview' | 'risk' | 'correlation' | 'frontier'>('overview')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = async () => {
    if (!onAnalyze) {
      // Use mock data for demo
      setIsAnalyzing(true)
      setTimeout(() => {
        setAnalysisData(generateMockData())
        setIsAnalyzing(false)
      }, 2000)
      return
    }

    setIsAnalyzing(true)
    try {
      const result = await onAnalyze(walletAddress)
      if (result) {
        setAnalysisData(result)
      }
    } catch (error) {
      console.error('Risk analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getRiskLevel = (sharpeRatio: number) => {
    if (sharpeRatio > 1.5) return { level: 'Low', color: 'bg-green-100 text-green-800' }
    if (sharpeRatio > 1.0) return { level: 'Medium', color: 'bg-yellow-100 text-yellow-800' }
    if (sharpeRatio > 0.5) return { level: 'High', color: 'bg-orange-100 text-orange-800' }
    return { level: 'Very High', color: 'bg-red-100 text-red-800' }
  }

  const getDiversificationLevel = (ratio: number) => {
    if (ratio > 0.7) return { level: 'Excellent', color: 'bg-green-100 text-green-800' }
    if (ratio > 0.5) return { level: 'Good', color: 'bg-blue-100 text-blue-800' }
    if (ratio > 0.3) return { level: 'Fair', color: 'bg-yellow-100 text-yellow-800' }
    return { level: 'Poor', color: 'bg-red-100 text-red-800' }
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Risk Analysis Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Advanced portfolio risk analysis for {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </p>
        </div>
        <Button 
          onClick={handleAnalyze}
          disabled={isAnalyzing || isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCcw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
        </Button>
      </div>

      {/* Loading State */}
      {(isAnalyzing || isLoading) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <RefreshCcw className="h-8 w-8 animate-spin text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Portfolio Risk</h3>
            <p className="text-gray-600 text-center max-w-md">
              Fetching historical data and calculating risk metrics using advanced portfolio theory...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {analysisData && !isAnalyzing && !isLoading && (
        <>
          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                activeTab === 'overview' 
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Overview
              </div>
            </button>
            <button
              onClick={() => setActiveTab('risk')}
              className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                activeTab === 'risk' 
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Risk Contribution
              </div>
            </button>
            <button
              onClick={() => setActiveTab('correlation')}
              className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                activeTab === 'correlation' 
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Correlation
              </div>
            </button>
            <button
              onClick={() => setActiveTab('frontier')}
              className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                activeTab === 'frontier' 
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Efficient Frontier
              </div>
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Annual Return</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {analysisData.portfolio_metrics.annual_return.toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Expected yearly return</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Portfolio Risk</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {analysisData.portfolio_metrics.annual_volatility.toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Annual volatility</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Risk Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={getRiskLevel(analysisData.portfolio_metrics.sharpe_ratio).color}>
                    {getRiskLevel(analysisData.portfolio_metrics.sharpe_ratio).level}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-2">Based on Sharpe ratio</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Diversification</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={getDiversificationLevel(analysisData.correlation.summary.diversification_ratio).color}>
                    {getDiversificationLevel(analysisData.correlation.summary.diversification_ratio).level}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-2">Asset correlation analysis</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Content based on active tab */}
          <div className="space-y-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RiskContributionChart data={analysisData.risk_contribution} />
                <CorrelationHeatmap data={analysisData.correlation} />
              </div>
            )}
            
            {activeTab === 'risk' && (
              <RiskContributionChart data={analysisData.risk_contribution} />
            )}
            
            {activeTab === 'correlation' && (
              <CorrelationHeatmap data={analysisData.correlation} />
            )}
            
            {activeTab === 'frontier' && (
              <EfficientFrontierChart data={analysisData.efficient_frontier} />
            )}
          </div>

          {/* Portfolio Metrics Summary (always show) */}
          {activeTab === 'overview' && (
            <Card>
              <CardHeader>
                <CardTitle>📊 Portfolio Metrics Summary</CardTitle>
                <CardDescription>
                  Comprehensive risk and return metrics calculated over {analysisData.portfolio_metrics.analysis_period_days} days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Sharpe Ratio</div>
                    <div className="font-semibold text-lg">{analysisData.portfolio_metrics.sharpe_ratio.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Sortino Ratio</div>
                    <div className="font-semibold text-lg">{analysisData.portfolio_metrics.sortino_ratio.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Max Drawdown</div>
                    <div className="font-semibold text-lg text-red-600">{analysisData.portfolio_metrics.max_drawdown.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-gray-600">VaR (95%)</div>
                    <div className="font-semibold text-lg text-red-600">{analysisData.portfolio_metrics.var_95.toFixed(1)}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* No Data State */}
      {!analysisData && !isAnalyzing && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Risk Analysis Available</h3>
            <p className="text-gray-600 text-center mb-4 max-w-md">
              Click "Run Analysis" to perform sophisticated portfolio risk analysis using modern portfolio theory.
            </p>
            <Button onClick={handleAnalyze} className="flex items-center gap-2">
              <RefreshCcw className="h-4 w-4" />
              Start Analysis
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
