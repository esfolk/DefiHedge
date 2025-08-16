'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { DEMO_PORTFOLIOS, DemoPortfolio } from '@/config/demo'
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  FlaskConical,
  DollarSign,
  BarChart3,
  Target,
  Sparkles
} from 'lucide-react'

interface DemoPortfolioSelectorProps {
  onSelectPortfolio: (address: string) => void;
  selectedAddress?: string;
}

const getRiskProfileIcon = (profile: string) => {
  switch (profile) {
    case 'Conservative': return Shield
    case 'Balanced': return BarChart3
    case 'Aggressive': return TrendingUp
    case 'Experimental': return FlaskConical
    default: return Target
  }
}

const getRiskProfileColor = (profile: string) => {
  switch (profile) {
    case 'Conservative': return 'bg-green-100 text-green-800'
    case 'Balanced': return 'bg-blue-100 text-blue-800'
    case 'Aggressive': return 'bg-orange-100 text-orange-800'
    case 'Experimental': return 'bg-purple-100 text-purple-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function DemoPortfolioSelector({ onSelectPortfolio, selectedAddress }: DemoPortfolioSelectorProps) {
  const [activeTab, setActiveTab] = useState('portfolios')

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            DeFiGuard Risk Demo
          </h1>
        </div>
        <p className="text-lg text-gray-600 mb-2">
          Institutional-Grade Portfolio Risk Analysis for DeFi
        </p>
        <p className="text-sm text-gray-500">
          Select a curated portfolio below to see our advanced quantitative analysis in action
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="portfolios" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Demo Portfolios
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Key Features
          </TabsTrigger>
        </TabsList>

        <TabsContent value="portfolios" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEMO_PORTFOLIOS.map((portfolio, index) => {
              const IconComponent = getRiskProfileIcon(portfolio.riskProfile)
              const isSelected = selectedAddress === portfolio.address
              
              return (
                <Card 
                  key={portfolio.address} 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-blue-300 ${
                    isSelected ? 'ring-2 ring-blue-500 border-blue-300' : ''
                  }`}
                  onClick={() => onSelectPortfolio(portfolio.address)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-lg">{portfolio.name}</CardTitle>
                      </div>
                      <Badge className={getRiskProfileColor(portfolio.riskProfile)}>
                        {portfolio.riskProfile}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">
                      {portfolio.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-green-600">{portfolio.estimatedValue}</span>
                      </div>
                      {portfolio.expectedMetrics?.sharpe_ratio && (
                        <div className="text-sm text-gray-600">
                          Sharpe: <span className="font-semibold">{portfolio.expectedMetrics.sharpe_ratio}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Key Highlights:</h4>
                      <ul className="space-y-1">
                        {portfolio.highlights.slice(0, 3).map((highlight, idx) => (
                          <li key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                            <div className="w-1 h-1 bg-blue-500 rounded-full" />
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {portfolio.expectedMetrics && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Annual Return</div>
                          <div className="font-semibold text-sm text-blue-600">
                            {portfolio.expectedMetrics.annual_return}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Max Drawdown</div>
                          <div className="font-semibold text-sm text-red-600">
                            {portfolio.expectedMetrics.max_drawdown}%
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      className={`w-full mt-4 ${
                        isSelected 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'bg-gray-600 hover:bg-gray-700'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectPortfolio(portfolio.address)
                      }}
                    >
                      {isSelected ? '✓ Selected' : 'Analyze Portfolio'}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          
          <Card className="mt-8">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-gray-800">Ready to Analyze Your Portfolio?</h3>
                <p className="text-sm text-gray-600">
                  Connect your own wallet or paste any Ethereum address to get started with real-time analysis
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Badge variant="outline" className="text-xs">
                    Multi-Chain Support
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Real-Time Data
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Institutional Grade
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">Risk Contribution</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Understand which assets contribute most to your portfolio risk
                </p>
                <ul className="space-y-1 text-xs text-gray-500">
                  <li>• Position-level risk breakdown</li>
                  <li>• Identify concentration risks</li>
                  <li>• Optimize position sizing</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-lg">Correlation Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Visualize diversification and correlation patterns
                </p>
                <ul className="space-y-1 text-xs text-gray-500">
                  <li>• Interactive correlation heatmap</li>
                  <li>• Diversification ratio calculation</li>
                  <li>• Identify over-correlated assets</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-lg">Efficient Frontier</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Find optimal risk-return combinations using modern portfolio theory
                </p>
                <ul className="space-y-1 text-xs text-gray-500">
                  <li>• Optimal portfolio positioning</li>
                  <li>• Risk-return optimization</li>
                  <li>• Sharpe ratio maximization</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-lg">Risk Metrics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Comprehensive portfolio risk measurements
                </p>
                <ul className="space-y-1 text-xs text-gray-500">
                  <li>• Sharpe & Sortino ratios</li>
                  <li>• Value at Risk (VaR)</li>
                  <li>• Maximum drawdown analysis</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-lg">Multi-Chain</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Seamless integration across multiple blockchains
                </p>
                <ul className="space-y-1 text-xs text-gray-500">
                  <li>• Ethereum, Polygon, Base</li>
                  <li>• Real-time price data</li>
                  <li>• Automated token recognition</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-indigo-600" />
                  <CardTitle className="text-lg">Advanced Analytics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Powered by institutional-grade libraries
                </p>
                <ul className="space-y-1 text-xs text-gray-500">
                  <li>• Riskfolio-Lib integration</li>
                  <li>• PyPortfolioOpt optimization</li>
                  <li>• Yahoo Finance data feeds</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
