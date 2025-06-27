import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Search } from 'lucide-react';
import { SWNSServiceWagmi } from '@/services/swnsServiceWagmi';
import { getNetworkConfig, ETHEREUM_NETWORK } from '@/contracts/swnsContract';
import { formatEther } from 'viem';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';

interface NameRegistrationWagmiProps {
  swnsService: SWNSServiceWagmi | null;
  registrationFee: bigint;
  updateBalance: () => Promise<void>;
  chainId: number;
}

export const NameRegistrationWagmi = ({ 
  swnsService, 
  registrationFee, 
  updateBalance,
  chainId 
}: NameRegistrationWagmiProps) => {
  const { isConnected } = useAccount();
  const [searchName, setSearchName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string>('');

  // Watch for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: lastTxHash as `0x${string}`,
  });

  // Handle successful transaction
  useEffect(() => {
    if (isConfirmed && lastTxHash) {
      toast({
        title: "Registration Successful! 🎉",
        description: `${searchName}.sw is now yours!`,
      });
      
      setSearchName('');
      setLastTxHash('');
      updateBalance();
      setIsRegistering(false);
    }
  }, [isConfirmed, lastTxHash, searchName, updateBalance]);

  // Get current network config to display correct currency
  const currentNetwork = getNetworkConfig(chainId);
  const isMainnet = chainId === ETHEREUM_NETWORK.chainId;
  const currencySymbol = currentNetwork?.symbol || 'ETH';

  const searchForName = async () => {
    if (!searchName.trim()) return;
    if (!swnsService) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }
    
    setIsSearching(true);
    
    try {
      const result = await swnsService.checkNameAvailability(searchName);
      
      if (result.error) {
        toast({
          title: "Invalid Name",
          description: result.error,
          variant: "destructive"
        });
      } else if (result.available) {
        toast({
          title: "Name Available! ✨",
          description: `${searchName}.sw is available for registration`,
        });
      } else {
        toast({
          title: "Name Taken",
          description: `${searchName}.sw is already registered`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: "Failed to check name availability",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const registerName = async () => {
    if (!isConnected || !swnsService) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    if (!searchName.trim()) return;

    setIsRegistering(true);
    
    try {
      // Check availability first
      const result = await swnsService.checkNameAvailability(searchName);
      if (!result.available) {
        toast({
          title: "Cannot Register",
          description: result.error || "Name is not available",
          variant: "destructive"
        });
        setIsRegistering(false);
        return;
      }

      // Register the name
      const txHash = await swnsService.registerName(searchName);
      setLastTxHash(txHash);
      
      toast({
        title: "Transaction Sent! ⏳",
        description: "Waiting for confirmation...",
      });
      
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Transaction failed",
        variant: "destructive"
      });
      setIsRegistering(false);
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Search className="w-5 h-5" />
          Register Your Name
        </CardTitle>
        <CardDescription className="text-gray-300">
          Search and register your unique .sw name on {currentNetwork.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isMainnet && (
          <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3 mb-4">
            <p className="text-blue-200 text-sm">
              ℹ️ SWNS is not deployed on Ethereum Mainnet. Switch to Taranium or Sepolia to register names.
            </p>
          </div>
        )}
        
        <div className="flex gap-2">
          <Input
            placeholder="Enter desired name"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isSearching && searchForName()}
            className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
            disabled={isMainnet}
          />
          <Button 
            onClick={searchForName}
            disabled={isSearching || !searchName.trim() || isMainnet}
            variant="outline"
            className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50 font-medium"
          >
            {isSearching ? '...' : 'Search'}
          </Button>
        </div>

        {searchName && (
          <div className="text-center py-4">
            <p className="text-gray-300 mb-2">
              You want to register: <span className="font-bold text-white">{searchName}.sw</span>
            </p>
            
            <div className="flex items-center justify-center gap-4 mb-4">
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-200">
                Fee: {formatEther(registrationFee)} {currencySymbol}
              </Badge>
            </div>

            <Button 
              onClick={registerName}
              disabled={isRegistering || isConfirming || !isConnected || isMainnet}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
            >
              {isRegistering || isConfirming ? 'Registering...' : `Register for ${formatEther(registrationFee)} ${currencySymbol}`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
