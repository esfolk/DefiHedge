'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

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

interface RiskContributionChartProps {
  data: RiskContributionResponse
}

// Generate distinct colors for the chart
const COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
        <p className="font-semibold text-gray-900">{data.asset}</p>
        <p className="text-red-600">
          Risk Contribution: <span className="font-medium">{data.risk_contribution.toFixed(1)}%</span>
        </p>
        <p className="text-blue-600">
          Portfolio Weight: <span className="font-medium">{data.portfolio_weight.toFixed(1)}%</span>
        </p>
        <p className="text-sm text-gray-600 mt-1">
          {data.risk_contribution > data.portfolio_weight ? '⚠️ High Risk Asset' : '✅ Lower Risk Asset'}
        </p>
      </div>
    )
  }
  return null
}

export function RiskContributionChart({ data }: RiskContributionChartProps) {
  const chartData = data.data.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length]
  }))

  // Calculate insights
  const maxRiskAsset = data.data.reduce((max, asset) => 
    asset.risk_contribution > max.risk_contribution ? asset : max
  )
  
  const riskConcentration = data.data.filter(asset => asset.risk_contribution > 20).length

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🍩 Risk Contribution Analysis
          <span className="text-sm font-normal text-gray-500">
            ({new Date(data.analysis_date).toLocaleDateString()})
          </span>
        </CardTitle>
        <CardDescription>
          Shows what percentage of total portfolio risk each asset contributes.
          This can be very different from portfolio weights!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="risk_contribution"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Insights and Legend */}
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Key Insights</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Total Portfolio Risk:</span>
                  <span className="font-medium text-red-600">{data.total_portfolio_risk.toFixed(2)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Highest Risk Asset:</span>
                  <span className="font-medium">{maxRiskAsset.asset} ({maxRiskAsset.risk_contribution.toFixed(1)}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Risk Concentration:</span>
                  <span className="font-medium">
                    {riskConcentration > 0 ? `${riskConcentration} high-risk assets` : 'Well diversified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Asset List */}
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Risk vs Weight Comparison</h4>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {data.data
                  .sort((a, b) => b.risk_contribution - a.risk_contribution)
                  .map((asset, index) => {
                    const isHighRisk = asset.risk_contribution > asset.portfolio_weight * 1.5
                    return (
                      <div key={asset.asset} className="flex items-center justify-between p-2 rounded border">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: COLORS[data.data.indexOf(asset) % COLORS.length] }}
                          />
                          <span className="font-medium text-sm">{asset.asset}</span>
                          {isHighRisk && <span className="text-xs text-red-500">⚠️</span>}
                        </div>
                        <div className="text-xs text-right">
                          <div className="text-red-600">Risk: {asset.risk_contribution.toFixed(1)}%</div>
                          <div className="text-blue-600">Weight: {asset.portfolio_weight.toFixed(1)}%</div>
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            </div>
          </div>
        </div>

        {/* Warning for high-risk assets */}
        {riskConcentration > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-yellow-600">⚠️</span>
              <div className="text-sm">
                <p className="font-semibold text-yellow-800">Risk Concentration Detected</p>
                <p className="text-yellow-700 mt-1">
                  {riskConcentration} of your assets contribute disproportionately high risk relative to their portfolio weight. 
                  Consider rebalancing to reduce concentration risk.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
