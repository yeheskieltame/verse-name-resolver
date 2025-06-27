import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { Globe, AlertCircle, ChevronDown } from 'lucide-react';
import { 
  TARANIUM_NETWORK, 
  SEPOLIA_NETWORK, 
  ETHEREUM_NETWORK,
  SUPPORTED_NETWORKS,
  getNetworkConfig 
} from '@/contracts/swnsContract';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';

export const HeaderWagmi = () => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const switchToNetwork = async (targetNetwork: typeof TARANIUM_NETWORK) => {
    try {
      await switchChain({ chainId: targetNetwork.chainId });
      toast({
        title: "Network Switched! 🎉",
        description: `Successfully switched to ${targetNetwork.name}`,
      });
    } catch (error: any) {
      console.error('Network switch error:', error);
      toast({
        title: "Network Switch Failed", 
        description: error.message || "Failed to switch network",
        variant: "destructive"
      });
    }
  };

  const currentNetwork = chainId ? getNetworkConfig(chainId) : null;
  const isSupported = chainId ? SUPPORTED_NETWORKS[chainId] : false;

  return (
    <div className="flex justify-between items-center mb-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
          <Globe className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">SmartVerse</h1>
          <p className="text-purple-200 text-sm">Smart Wallet Name Service</p>
        </div>
      </div>
      
      {isConnected ? (
        <div className="flex items-center gap-4">
          {/* Network Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50"
              >
                <div className="flex items-center gap-2">
                  {!isSupported && <AlertCircle className="w-4 h-4 text-red-400" />}
                  <span className="text-sm font-medium">
                    {currentNetwork ? currentNetwork.name : 'Unknown Network'}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-900/95 backdrop-blur-lg border-white/20 shadow-xl">
              <DropdownMenuItem 
                onClick={() => switchToNetwork(TARANIUM_NETWORK)}
                className="text-white hover:bg-white/20 cursor-pointer focus:bg-white/20"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="font-medium">{TARANIUM_NETWORK.name}</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => switchToNetwork(SEPOLIA_NETWORK)}
                className="text-white hover:bg-white/20 cursor-pointer focus:bg-white/20"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="font-medium">{SEPOLIA_NETWORK.name}</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => switchToNetwork(ETHEREUM_NETWORK)}
                className="text-white hover:bg-white/20 cursor-pointer focus:bg-white/20"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="font-medium">{ETHEREUM_NETWORK.name}</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* RainbowKit Connect Button */}
          <ConnectButton 
            showBalance={true}
            chainStatus="icon"
            accountStatus="avatar"
          />
        </div>
      ) : (
        <div className="flex items-center gap-4">
          {/* Network Info when not connected */}
          {currentNetwork && (
            <div className="text-sm text-gray-300">
              Current Network: {currentNetwork.name}
            </div>
          )}
          
          {/* RainbowKit Connect Button */}
          <ConnectButton 
            showBalance={false}
            chainStatus="icon"
            accountStatus="address"
          />
        </div>
      )}
    </div>
  );
};
