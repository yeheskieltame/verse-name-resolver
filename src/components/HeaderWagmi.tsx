import { ConnectButton } from '@rainbow-me/rainbowkit';
import { toast } from "@/hooks/use-toast";
import { Globe, Network, Sparkles, HelpCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useTourManager } from '@/hooks/useTourManager';
import { 
  SUPPORTED_NETWORKS,
  getNetworkConfig 
} from '@/contracts/swnsContract';
import { useAccount, useChainId } from 'wagmi';

export const HeaderWagmi = () => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { startTour } = useTourManager();

  const currentNetwork = chainId ? getNetworkConfig(chainId) : null;

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-6">
      {/* Logo & Title */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
          <Globe className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
            SmartVerse
            <Sparkles className="w-5 h-5 text-purple-500" />
          </h1>
          <p className="text-gray-600 text-sm sm:text-base leading-tight">
            Smart Wallet Name Service
          </p>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 sm:flex-shrink-0">
        {/* Help Tour Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => startTour('general')}
          className="flex items-center gap-2 self-center tour-help-button"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Panduan</span>
        </Button>

        {isConnected ? (
          <>
            {/* RainbowKit Connect Button */}
            <div className="flex justify-center sm:justify-end wallet-connect-button">
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
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                <Network className="w-4 h-4 text-gray-500" />
                <span>Current: {currentNetwork.name}</span>
              </div>
            )}
            
            {/* RainbowKit Connect Button */}
            <div className="flex justify-center sm:justify-end wallet-connect-button">
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
