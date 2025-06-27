import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { Globe, AlertCircle, ChevronDown, Network } from 'lucide-react';
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

  const networks = [
    { config: TARANIUM_NETWORK, color: "bg-purple-400" },
    { config: SEPOLIA_NETWORK, color: "bg-blue-400" },
    { config: ETHEREUM_NETWORK, color: "bg-gray-400" }
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
      {/* Logo & Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
          <Globe className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-2xl font-bold text-white truncate">
            SmartVerse
          </h1>
          <p className="text-purple-200 text-xs sm:text-sm leading-tight">
            Smart Wallet Name Service
          </p>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 sm:flex-shrink-0">
        {isConnected ? (
          <>
            {/* Network Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50 justify-between sm:justify-center min-w-0 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {!isSupported && <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                    <Network className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium truncate max-w-[100px] sm:max-w-[120px]">
                      {currentNetwork ? currentNetwork.name : 'Unknown'}
                    </span>
                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900/95 backdrop-blur-lg border-white/20 shadow-xl w-56">
                {networks.map(({ config, color }) => (
                  <DropdownMenuItem 
                    key={config.chainId}
                    onClick={() => switchToNetwork(config)}
                    className="text-white hover:bg-white/20 cursor-pointer focus:bg-white/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 ${color} rounded-full`}></div>
                      <span className="font-medium">{config.name}</span>
                      {chainId === config.chainId && (
                        <span className="ml-auto text-green-400 text-xs">✓</span>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* RainbowKit Connect Button */}
            <div className="flex justify-center sm:justify-end">
              <ConnectButton 
                showBalance={true}
                chainStatus="icon"
                accountStatus="avatar"
              />
            </div>
          </>
        ) : (
          <>
            {/* Network Info when not connected */}
            {currentNetwork && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-300 bg-white/5 px-3 py-2 rounded-lg backdrop-blur-sm border border-white/10">
                <Network className="w-4 h-4" />
                <span>Current: {currentNetwork.name}</span>
              </div>
            )}
            
            {/* RainbowKit Connect Button */}
            <div className="flex justify-center sm:justify-end">
              <ConnectButton 
                showBalance={false}
                chainStatus="icon"
                accountStatus="address"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
