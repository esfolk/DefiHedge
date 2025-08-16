import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, ChevronDown, ExternalLink, Copy, Check, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { WalletConnection, SUPPORTED_CHAINS } from '@/../types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useBackendHealth } from '@/hooks/use-api';
import api from '@/services/api';

interface WalletConnectProps {
  onConnectionChange: (connection: WalletConnection | null) => void;
}

export const WalletConnect = ({ onConnectionChange }: WalletConnectProps) => {
  const [connection, setConnection] = useState<WalletConnection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const { toast } = useToast();
  const { isHealthy, healthData, recheckHealth } = useBackendHealth();

  // Mock wallet connection for demo
  const connectWallet = async (walletType: string) => {
    setIsConnecting(true);
    try {
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockConnection: WalletConnection = {
        address: '0x742d35Cc6634C0532925a3b8D321BFA0DFEB7531',
        chainId: 1,
        isConnected: true,
        provider: { name: walletType }
      };
      
      setConnection(mockConnection);
      onConnectionChange(mockConnection);
      
      toast({
        title: "Wallet Connected",
        description: `Successfully connected to ${walletType}`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setConnection(null);
    onConnectionChange(null);
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected successfully.",
    });
  };

  const copyAddress = async () => {
    if (connection?.address) {
      await navigator.clipboard.writeText(connection.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const switchNetwork = async (chainId: string) => {
    if (connection) {
      const updatedConnection = { ...connection, chainId: parseInt(chainId) };
      setConnection(updatedConnection);
      onConnectionChange(updatedConnection);
      
      const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
      toast({
        title: "Network Switched",
        description: `Switched to ${chain?.name}`,
      });
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Validate Ethereum address format
  const isValidAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // Connect with manual address input
  const connectWithAddress = async () => {
    if (!manualAddress.trim()) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Ethereum address.",
        variant: "destructive"
      });
      return;
    }

    if (!isValidAddress(manualAddress.trim())) {
      toast({
        title: "Invalid Address Format",
        description: "Please enter a valid Ethereum address (0x followed by 40 hex characters).",
        variant: "destructive"
      });
      return;
    }

    if (!isHealthy) {
      toast({
        title: "Backend Unavailable",
        description: "Cannot connect - backend service is not available. Please try again later.",
        variant: "destructive"
      });
      return;
    }

    setIsValidatingAddress(true);
    try {
      // Test if we can fetch portfolio data for this address
      await api.portfolio.get(manualAddress.trim());
      
      const newConnection: WalletConnection = {
        address: manualAddress.trim(),
        chainId: 1, // Default to Ethereum
        isConnected: true,
        provider: { name: 'Manual Input' }
      };
      
      setConnection(newConnection);
      onConnectionChange(newConnection);
      setManualAddress('');
      
      toast({
        title: "Address Connected",
        description: "Successfully connected to wallet address.",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to this address.",
        variant: "destructive"
      });
    } finally {
      setIsValidatingAddress(false);
    }
  };

  const getCurrentChain = () => {
    return SUPPORTED_CHAINS.find(chain => chain.id === connection?.chainId.toString());
  };

  if (!connection) {
    return (
      <div className="space-y-4">
        {/* Backend Status Indicator */}
        <Card className="glass-card shadow-card p-4 transition-smooth">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-success pulse-glow' : 'bg-danger'}`} />
              <div>
                <p className="font-medium text-sm">
                  Backend Status: {isHealthy ? 'Connected' : 'Disconnected'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isHealthy 
                    ? `API: ${api.getBaseURL()}`
                    : 'Backend service unavailable'
                  }
                </p>
              </div>
            </div>
            {!isHealthy && (
              <Button
                variant="outline"
                size="sm"
                onClick={recheckHealth}
                className="flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                Retry
              </Button>
            )}
          </div>
        </Card>

        {/* Main Connection Card */}
        <Card className="glass-card shadow-card p-6 transition-smooth">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Wallet className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
              <p className="text-muted-foreground">
                Connect your wallet to view your DeFi portfolio across multiple chains
              </p>
            </div>
            
            {/* Wallet Connection Options */}
            <div className="space-y-3">
              <Button 
                onClick={() => connectWallet('MetaMask')}
                disabled={isConnecting || !isHealthy}
                className="w-full gradient-primary shadow-primary hover:shadow-glow transition-smooth"
                size="lg"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  '🦊 Connect MetaMask'
                )}
              </Button>
              
              <Button 
                onClick={() => connectWallet('WalletConnect')}
                disabled={isConnecting || !isHealthy}
                variant="outline"
                className="w-full"
                size="lg"
              >
                🔗 WalletConnect
              </Button>
              
              <Button 
                onClick={() => connectWallet('Coinbase Wallet')}
                disabled={isConnecting || !isHealthy}
                variant="outline"
                className="w-full"
                size="lg"
              >
                🔵 Coinbase Wallet
              </Button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            {/* Manual Address Input */}
            <div className="space-y-3 text-left">
              <Label htmlFor="manual-address" className="text-sm font-medium">
                Enter Wallet Address
              </Label>
              <div className="flex gap-2">
                <Input
                  id="manual-address"
                  placeholder="0x1234...abcd"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  disabled={isValidatingAddress || !isHealthy}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      connectWithAddress();
                    }
                  }}
                />
                <Button
                  onClick={connectWithAddress}
                  disabled={isValidatingAddress || !isHealthy || !manualAddress.trim()}
                  size="default"
                >
                  {isValidatingAddress ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Connect'
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter any Ethereum address to view its multi-chain portfolio
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const currentChain = getCurrentChain();

  return (
    <Card className="glass-card shadow-card p-4 transition-smooth">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-success rounded-full pulse-glow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{formatAddress(connection.address)}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyAddress}
                className="h-6 w-6 p-0"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-success" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{currentChain?.logo}</span>
              <span>{currentChain?.name}</span>
              <Badge variant="secondary" className="text-xs">
                Connected
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Switch Network <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card">
              {SUPPORTED_CHAINS.map((chain) => (
                <DropdownMenuItem
                  key={chain.id}
                  onClick={() => switchNetwork(chain.id)}
                  className={chain.id === connection.chainId.toString() ? 'bg-primary/10' : ''}
                >
                  <span className="mr-2">{chain.logo}</span>
                  {chain.name}
                  {chain.id === connection.chainId.toString() && (
                    <Check className="w-4 h-4 ml-auto text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={disconnectWallet}
            className="text-danger hover:text-danger hover:bg-danger/10"
          >
            Disconnect
          </Button>
        </div>
      </div>
    </Card>
  );
};
