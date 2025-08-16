import { useState } from 'react';
import Head from 'next/head';
import { WalletConnect } from '@/components/WalletConnect';
import { PortfolioDashboard } from '@/components/PortfolioDashboard';
import { WalletConnection } from '@/../types';

export default function Home() {
  const [walletConnection, setWalletConnection] = useState<WalletConnection | null>(null);

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
            {/* Wallet Connection */}
            <WalletConnect onConnectionChange={setWalletConnection} />

            {/* Portfolio Dashboard */}
            {walletConnection && (
              <PortfolioDashboard connection={walletConnection} />
            )}

            {/* Footer */}
            <footer className="text-center text-muted-foreground text-sm py-8 border-t border-border">
              <div className="space-y-2">
                <p>&copy; 2025 DeFiGuard Risk. All rights reserved.</p>
                <p>
                  Powered by Coinbase Data API • Multi-Chain Analytics • AI Risk Assessment
                </p>
              </div>
            </footer>
          </div>
        </div>
      </main>
    </>
  );
}
