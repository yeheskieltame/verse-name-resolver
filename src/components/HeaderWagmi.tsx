import { ConnectButton } from '@rainbow-me/rainbowkit';
import { toast } from "@/hooks/use-toast";
import { Globe, Network } from 'lucide-react';
import { 
  SUPPORTED_NETWORKS,
  getNetworkConfig 
} from '@/contracts/swnsContract';
import { useAccount, useChainId } from 'wagmi';

export const HeaderWagmi = () => {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  const currentNetwork = chainId ? getNetworkConfig(chainId) : null;

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
