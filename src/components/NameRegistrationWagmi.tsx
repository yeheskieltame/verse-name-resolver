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
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 h-full hover:bg-white/15 transition-all duration-300">
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl lg:text-2xl">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center flex-shrink-0">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          Register Your Name
        </CardTitle>
        <CardDescription className="text-gray-300 text-sm sm:text-base leading-relaxed">
          Search and register your unique <span className="text-purple-300 font-mono">.sw</span> name on {currentNetwork.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {isMainnet && (
          <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <p className="text-blue-200 text-sm sm:text-base leading-relaxed">
                SWNS is not deployed on Ethereum Mainnet. Switch to <span className="font-semibold">Taranium</span> or <span className="font-semibold">Sepolia</span> to register names.
              </p>
            </div>
          </div>
        )}
        
        {/* Search Input */}
        <div className="space-y-3">
          <label className="text-sm sm:text-base text-gray-300 font-medium block">
            Enter your desired name
          </label>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Input
                placeholder="myname"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isSearching && searchForName()}
                className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 h-11 sm:h-12 text-base focus:ring-2 focus:ring-purple-400/50"
                disabled={isMainnet}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-mono">
                .sw
              </div>
            </div>
            <Button 
              onClick={searchForName}
              disabled={isSearching || !searchName.trim() || isMainnet}
              variant="outline"
              size="lg"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50 font-medium h-11 sm:h-12 px-6 sm:px-8 whitespace-nowrap"
            >
              {isSearching ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">Checking...</span>
                </div>
              ) : (
                'Check'
              )}
            </Button>
          </div>
        </div>

        {/* Registration Section */}
        {searchName && (
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/20 rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-5">
            {/* Name Preview */}
            <div className="text-center space-y-2">
              <p className="text-gray-300 text-sm sm:text-base">
                You want to register:
              </p>
              <div className="bg-black/20 rounded-lg p-3 sm:p-4 border border-white/10">
                <span className="font-mono text-lg sm:text-xl lg:text-2xl text-white break-all">
                  {searchName}
                </span>
                <span className="font-mono text-lg sm:text-xl lg:text-2xl text-purple-300">
                  .sw
                </span>
              </div>
            </div>
            
            {/* Registration Fee */}
            <div className="flex items-center justify-center">
              <div className="bg-purple-500/20 border border-purple-400/30 rounded-lg px-4 py-2 sm:px-6 sm:py-3">
                <div className="text-center">
                  <p className="text-purple-200 text-xs sm:text-sm">Registration Fee</p>
                  <p className="text-white font-bold text-lg sm:text-xl">
                    {formatEther(registrationFee)} {currencySymbol}
                  </p>
                </div>
              </div>
            </div>

            {/* Register Button */}
            <Button 
              onClick={registerName}
              disabled={isRegistering || isConfirming || !isConnected || isMainnet}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 h-12 sm:h-14 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isRegistering || isConfirming ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                `Register for ${formatEther(registrationFee)} ${currencySymbol}`
              )}
            </Button>
            
            {!isConnected && (
              <p className="text-center text-gray-400 text-xs sm:text-sm">
                Connect your wallet to register names
              </p>
            )}
          </div>
        )}

        {/* Help Text */}
        {!searchName && (
          <div className="text-center py-4 sm:py-6">
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
              Enter a name above to check availability and register your unique web3 identity
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
