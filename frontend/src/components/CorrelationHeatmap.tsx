'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

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

interface CorrelationHeatmapProps {
  data: CorrelationResponse
}

// Function to get color based on correlation value
const getCorrelationColor = (correlation: number): string => {
  // Convert correlation from -1 to 1 to a color scale
  // Red for high positive correlation (bad for diversification)
  // Blue for low/negative correlation (good for diversification)
  const intensity = Math.abs(correlation)
  
  if (correlation > 0.7) return `rgba(239, 68, 68, ${intensity})` // High correlation - red
  if (correlation > 0.3) return `rgba(251, 146, 60, ${intensity})` // Medium correlation - orange
  if (correlation > 0) return `rgba(254, 240, 138, ${intensity})` // Low positive correlation - yellow
  if (correlation > -0.3) return `rgba(147, 197, 253, ${intensity})` // Low negative correlation - light blue
  return `rgba(59, 130, 246, ${intensity})` // High negative correlation - blue
}

const getCorrelationLabel = (correlation: number): string => {
  if (correlation > 0.7) return 'High'
  if (correlation > 0.3) return 'Medium'
  if (correlation > 0) return 'Low +'
  if (correlation > -0.3) return 'Low -'
  return 'Negative'
}

const getDiversificationScore = (ratio: number): { score: string; color: string; description: string } => {
  if (ratio > 0.7) return { 
    score: 'Excellent', 
    color: 'text-green-600', 
    description: 'Very well diversified portfolio' 
  }
  if (ratio > 0.5) return { 
    score: 'Good', 
    color: 'text-blue-600', 
    description: 'Well diversified with room for improvement' 
  }
  if (ratio > 0.3) return { 
    score: 'Fair', 
    color: 'text-yellow-600', 
    description: 'Moderate diversification, consider adding uncorrelated assets' 
  }
  return { 
    score: 'Poor', 
    color: 'text-red-600', 
    description: 'Highly correlated assets, poor diversification' 
  }
}

export function CorrelationHeatmap({ data }: CorrelationHeatmapProps) {
  // Create correlation matrix
  const matrix: { [key: string]: { [key: string]: number } } = {}
  
  data.data.forEach(({ asset1, asset2, correlation }) => {
    if (!matrix[asset1]) matrix[asset1] = {}
    matrix[asset1][asset2] = correlation
  })

  const diversification = getDiversificationScore(data.summary.diversification_ratio)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔥 Asset Correlation Heatmap
          <span className="text-sm font-normal text-gray-500">
            ({new Date(data.analysis_date).toLocaleDateString()})
          </span>
        </CardTitle>
        <CardDescription>
          Visualizes how your assets move relative to each other. 
          Red = high correlation (poor diversification), Blue = low correlation (good diversification).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Heatmap */}
          <div className="lg:col-span-2">
            <div className="bg-white border rounded-lg p-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="p-2"></th>
                      {data.assets.map((asset) => (
                        <th key={asset} className="p-2 text-xs font-medium text-gray-600 transform -rotate-45 min-w-[40px]">
                          {asset}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.assets.map((asset1) => (
                      <tr key={asset1}>
                        <td className="p-2 text-xs font-medium text-gray-600 min-w-[60px]">{asset1}</td>
                        {data.assets.map((asset2) => {
                          const correlation = matrix[asset1]?.[asset2] ?? 0
                          const isMainDiagonal = asset1 === asset2
                          
                          return (
                            <td
                              key={`${asset1}-${asset2}`}
                              className="p-1 relative group"
                            >
                              <div
                                className={`
                                  w-8 h-8 rounded flex items-center justify-center text-xs font-medium transition-all
                                  ${isMainDiagonal ? 'bg-gray-300 text-gray-700' : 'hover:scale-110 cursor-pointer'}
                                `}
                                style={{
                                  backgroundColor: isMainDiagonal ? '#e5e7eb' : getCorrelationColor(correlation),
                                  color: isMainDiagonal ? '#374151' : Math.abs(correlation) > 0.5 ? '#ffffff' : '#000000'
                                }}
                                title={`${asset1} vs ${asset2}: ${correlation.toFixed(3)}`}
                              >
                                {isMainDiagonal ? '1.0' : correlation.toFixed(1)}
                              </div>
                              
                              {/* Tooltip on hover */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                {asset1} × {asset2}<br />
                                Correlation: {correlation.toFixed(3)}<br />
                                {getCorrelationLabel(correlation)} correlation
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Legend and Insights */}
          <div className="space-y-4">
            {/* Diversification Score */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Diversification Analysis</h4>
              <div className="space-y-3">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${diversification.color}`}>
                    {diversification.score}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Diversification Score
                  </div>
                </div>
                <p className="text-xs text-gray-600 text-center">
                  {diversification.description}
                </p>
              </div>
            </div>

            {/* Statistics */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Correlation Stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Average Correlation:</span>
                  <span className="font-medium">{(data.summary.average_correlation * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Highest Correlation:</span>
                  <span className="font-medium text-red-600">{(data.summary.max_correlation * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Lowest Correlation:</span>
                  <span className="font-medium text-blue-600">{(data.summary.min_correlation * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Color Legend */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Color Guide</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.8)' }}></div>
                  <span className="text-xs">High correlation (0.7+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(251, 146, 60, 0.8)' }}></div>
                  <span className="text-xs">Medium correlation (0.3-0.7)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(254, 240, 138, 0.8)' }}></div>
                  <span className="text-xs">Low positive (0-0.3)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(147, 197, 253, 0.8)' }}></div>
                  <span className="text-xs">Low negative (-0.3-0)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(59, 130, 246, 0.8)' }}></div>
                  <span className="text-xs">High negative (-0.3+)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {data.summary.diversification_ratio < 0.5 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-yellow-600">💡</span>
              <div className="text-sm">
                <p className="font-semibold text-yellow-800">Diversification Recommendation</p>
                <p className="text-yellow-700 mt-1">
                  Your portfolio shows high correlation between assets. Consider adding assets that move independently 
                  of your current holdings to improve diversification and reduce overall risk.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
