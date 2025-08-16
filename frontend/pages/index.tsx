import { useState } from 'react';
import Head from 'next/head';
import { WalletConnect } from '@/components/WalletConnect';
import { PortfolioDashboard } from '@/components/PortfolioDashboard';
import { RiskAnalysisDashboard } from '@/components/RiskAnalysisDashboard';
import { DemoPortfolioSelector } from '@/components/DemoPortfolioSelector';
import { ChainlinkDashboard } from '@/components/ChainlinkDashboard';
import { WalletConnection } from '@/../types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompleteRiskAnalysis } from '@/hooks/use-api';
import { CompleteRiskAnalysisResponse } from '@/services/api';
import { DEMO_PORTFOLIOS } from '@/config/demo';

export default function Home() {
  const [walletConnection, setWalletConnection] = useState<WalletConnection | null>(null);
  const [activeTab, setActiveTab] = useState('portfolio');
  const [showDemoSelector, setShowDemoSelector] = useState(!walletConnection);
  
  // Risk analysis hook for the current wallet
  const riskAnalysis = useCompleteRiskAnalysis(walletConnection?.address || null);
  
  // Handle demo portfolio selection
  const handleDemoPortfolioSelect = (address: string) => {
    const portfolio = DEMO_PORTFOLIOS.find(p => p.address === address);
    if (portfolio) {
      setWalletConnection({
        address: address,
        provider: 'demo',
        chainId: '1'
      });
      setShowDemoSelector(false);
      setActiveTab('portfolio'); // Start with portfolio overview
    }
  };
  
  // Function to run live risk analysis
  const handleRiskAnalysis = async (address: string): Promise<CompleteRiskAnalysisResponse | null> => {
    try {
      console.log('🔍 Starting live risk analysis for:', address);
      const result = await riskAnalysis.execute();
      console.log('✅ Risk analysis completed:', result);
      return result;
    } catch (error) {
      console.error('❌ Risk analysis failed:', error);
      throw error;
    }
  };
  
  // Handle wallet connection changes
  const handleWalletConnectionChange = (connection: WalletConnection | null) => {
    setWalletConnection(connection);
    setShowDemoSelector(!connection);
  };

  return (
    <>
      <Head>
        <title>DeFiGuard Risk - Multi-Chain Portfolio Management</title>
        <meta
          name="description"
          content="AI-powered multi-chain DeFi portfolio management with advanced risk analysis and quantitative insights."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent mb-2">
              DeFiGuard Risk
            </h1>
            <p className="text-muted-foreground text-lg">
              AI-Powered Multi-Chain Portfolio Management
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Demo Portfolio Selector - Show when no wallet connected */}
            {showDemoSelector && (
              <DemoPortfolioSelector 
                onSelectPortfolio={handleDemoPortfolioSelect}
                selectedAddress={walletConnection?.address}
              />
            )}
            
            {/* Wallet Connection - Show when no demo selected */}
            {!showDemoSelector && (
              <WalletConnect onConnectionChange={handleWalletConnectionChange} />
            )}

            {/* Dashboard Tabs */}
            {walletConnection && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="portfolio" className="flex items-center gap-2">
                    📊 Portfolio Overview
                  </TabsTrigger>
                  <TabsTrigger value="risk" className="flex items-center gap-2">
                    🎯 Risk Analysis
                  </TabsTrigger>
                  <TabsTrigger value="chainlink" className="flex items-center gap-2">
                    🔗 Oracle Data
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="portfolio">
                  <PortfolioDashboard connection={walletConnection} />
                </TabsContent>
                
                <TabsContent value="risk">
                  <RiskAnalysisDashboard 
                    walletAddress={walletConnection.address}
                    onAnalyze={handleRiskAnalysis}
                    isLoading={riskAnalysis.loading}
                    initialData={riskAnalysis.data}
                  />
                </TabsContent>
                
                <TabsContent value="chainlink">
                  <ChainlinkDashboard autoRefresh={true} />
                </TabsContent>
              </Tabs>
            )}

            {/* Footer */}
            <footer className="text-center text-muted-foreground text-sm py-8 border-t border-border">
              <div className="space-y-2">
                <p>&copy; 2025 DeFiGuard Risk. All rights reserved.</p>
              <p>
                Powered by Coinbase CDP • Riskfolio-Lib • PyPortfolioOpt • Multi-Chain Analytics
              </p>
              </div>
            </footer>
          </div>
        </div>
      </main>
    </>
  );
}
