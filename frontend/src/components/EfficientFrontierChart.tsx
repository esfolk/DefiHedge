'use client'

import React from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

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

interface EfficientFrontierChartProps {
  data: EfficientFrontierResponse
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const point = payload[0].payload
    const isCurrentPortfolio = point.type === 'current'
    const isOptimal = point.type === 'optimal'
    
    return (
      <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
        <p className="font-semibold text-gray-900">
          {isCurrentPortfolio ? 'Your Current Portfolio' : 
           isOptimal ? `${point.label} Portfolio` : 'Efficient Frontier Point'}
        </p>
        <p className="text-blue-600">
          Expected Return: <span className="font-medium">{point.return?.toFixed(1)}%</span>
        </p>
        <p className="text-red-600">
          Risk (Volatility): <span className="font-medium">{point.risk?.toFixed(1)}%</span>
        </p>
        <p className="text-green-600">
          Sharpe Ratio: <span className="font-medium">{point.sharpe_ratio?.toFixed(2)}</span>
        </p>
        {isCurrentPortfolio && (
          <p className="text-sm text-gray-600 mt-1">
            {point.sharpe_ratio < 1 ? '⚠️ Below optimal efficiency' : '✅ Reasonably efficient'}
          </p>
        )}
      </div>
    )
  }
  return null
}

const getPositionAnalysis = (current: PortfolioPoint, optimal: OptimalPortfolios) => {
  const maxSharpe = optimal.max_sharpe
  const minVol = optimal.min_volatility
  
  // Compare current portfolio to optimal portfolios
  const riskDiff = current.risk - maxSharpe.risk
  const returnDiff = maxSharpe.return - current.return
  const sharpeDiff = maxSharpe.sharpe_ratio - current.sharpe_ratio
  
  let analysis = {
    efficiency: 'Good',
    color: 'text-green-600',
    recommendations: [] as string[]
  }
  
  if (sharpeDiff > 0.5) {
    analysis.efficiency = 'Poor'
    analysis.color = 'text-red-600'
    analysis.recommendations.push('Consider rebalancing towards the maximum Sharpe ratio portfolio')
  } else if (sharpeDiff > 0.2) {
    analysis.efficiency = 'Fair'
    analysis.color = 'text-yellow-600'
    analysis.recommendations.push('There\'s room for improvement in risk-adjusted returns')
  }
  
  if (riskDiff > 5) {
    analysis.recommendations.push('Your portfolio has higher risk than necessary for the expected return')
  }
  
  if (returnDiff > 3) {
    analysis.recommendations.push('You could potentially achieve higher returns for similar risk')
  }
  
  if (current.risk < minVol.risk * 1.1) {
    analysis.recommendations.push('Consider the minimum volatility portfolio for lower risk')
  }
  
  return analysis
}

export function EfficientFrontierChart({ data }: EfficientFrontierChartProps) {
  // Prepare chart data
  const frontierData = data.frontier_points.map(point => ({
    ...point,
    type: 'frontier'
  }))
  
  const currentData = [{
    ...data.current_portfolio,
    type: 'current'
  }]
  
  const optimalData = [
    {
      ...data.optimal_portfolios.max_sharpe,
      type: 'optimal',
      label: 'Max Sharpe'
    },
    {
      ...data.optimal_portfolios.min_volatility,
      type: 'optimal',  
      label: 'Min Volatility'
    }
  ]
  
  const analysis = getPositionAnalysis(data.current_portfolio, data.optimal_portfolios)
  
  // Calculate chart domain with some padding
  const allPoints = [...frontierData, ...currentData, ...optimalData]
  const minRisk = Math.min(...allPoints.map(p => p.risk)) * 0.9
  const maxRisk = Math.max(...allPoints.map(p => p.risk)) * 1.1
  const minReturn = Math.min(...allPoints.map(p => p.return)) * 0.9
  const maxReturn = Math.max(...allPoints.map(p => p.return)) * 1.1
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🚀 Efficient Frontier Analysis
          <span className="text-sm font-normal text-gray-500">
            ({new Date(data.analysis_date).toLocaleDateString()})
          </span>
        </CardTitle>
        <CardDescription>
          Shows the optimal risk/return combinations. Your current portfolio position is plotted against 
          the efficient frontier to show optimization opportunities.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2">
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="risk" 
                    name="Risk (Volatility)"
                    unit="%"
                    domain={[minRisk, maxRisk]}
                    label={{ value: 'Risk (Volatility) %', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="return" 
                    name="Expected Return"
                    unit="%"
                    domain={[minReturn, maxReturn]}
                    label={{ value: 'Expected Return %', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  
                  {/* Efficient Frontier Curve */}
                  <Scatter
                    name="Efficient Frontier"
                    data={frontierData}
                    fill="#3B82F6"
                    fillOpacity={0.8}
                    strokeWidth={2}
                    shape="circle"
                  />
                  
                  {/* Current Portfolio */}
                  <Scatter
                    name="Current Portfolio"
                    data={currentData}
                    fill="#EF4444"
                    fillOpacity={1}
                    strokeWidth={2}
                    shape="diamond"
                  />
                  
                  {/* Optimal Portfolios */}
                  <Scatter
                    name="Optimal Portfolios"
                    data={optimalData}
                    fill="#10B981"
                    fillOpacity={1}
                    strokeWidth={2}
                    shape="star"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Analysis Panel */}
          <div className="space-y-4">
            {/* Portfolio Efficiency */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Portfolio Efficiency</h4>
              <div className="text-center mb-3">
                <div className={`text-2xl font-bold ${analysis.color}`}>
                  {analysis.efficiency}
                </div>
                <div className="text-sm text-gray-600">
                  Risk-Adjusted Performance
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Your Sharpe Ratio:</span>
                  <span className="font-medium">{data.current_portfolio.sharpe_ratio.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Optimal Sharpe:</span>
                  <span className="font-medium text-green-600">{data.optimal_portfolios.max_sharpe.sharpe_ratio.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {/* Portfolio Positions */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Portfolio Positions</h4>
              <div className="space-y-3 text-sm">
                <div className="border-l-4 border-red-500 pl-3">
                  <div className="font-medium text-red-700">Current Portfolio</div>
                  <div>Return: {data.current_portfolio.return.toFixed(1)}% | Risk: {data.current_portfolio.risk.toFixed(1)}%</div>
                </div>
                
                <div className="border-l-4 border-green-500 pl-3">
                  <div className="font-medium text-green-700">Max Sharpe Portfolio</div>
                  <div>Return: {data.optimal_portfolios.max_sharpe.return.toFixed(1)}% | Risk: {data.optimal_portfolios.max_sharpe.risk.toFixed(1)}%</div>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-3">
                  <div className="font-medium text-blue-700">Min Volatility Portfolio</div>
                  <div>Return: {data.optimal_portfolios.min_volatility.return.toFixed(1)}% | Risk: {data.optimal_portfolios.min_volatility.risk.toFixed(1)}%</div>
                </div>
              </div>
            </div>
            
            {/* Chart Legend */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Chart Legend</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Efficient Frontier (Optimal curve)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 transform rotate-45"></div>
                  <span>Your Current Portfolio</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500" style={{clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'}}></div>
                  <span>Optimal Portfolios</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recommendations */}
        {analysis.recommendations.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-blue-600 text-xl">💡</span>
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">Optimization Opportunities</h4>
                <ul className="space-y-1 text-sm text-blue-700">
                  {analysis.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-blue-600 mt-3">
                  <strong>Note:</strong> The efficient frontier is based on historical data and should be combined with fundamental analysis and risk tolerance considerations.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
