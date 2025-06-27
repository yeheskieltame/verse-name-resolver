
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { Wallet, Globe, AlertCircle, ChevronDown } from 'lucide-react';
import { 
  TARANIUM_NETWORK, 
  SEPOLIA_NETWORK, 
  ETHEREUM_NETWORK,
  SUPPORTED_NETWORKS,
  getNetworkConfig 
} from '@/contracts/swnsContract';

interface HeaderProps {
  isConnected: boolean;
  account: string;
  balance: string;
  chainId: number | null;
  connectWallet: () => Promise<void>;
  handleDisconnect: () => void;
  switchToNetwork: (network: typeof TARANIUM_NETWORK) => Promise<void>;
}

export const Header = ({ 
  isConnected, 
  account, 
  balance, 
  chainId, 
  connectWallet, 
  handleDisconnect,
  switchToNetwork
}: HeaderProps) => {
  const handleConnect = async () => {
    try {
      await connectWallet();
      toast({
        title: "Wallet Connected! 🎉",
        description: "Successfully connected to your wallet",
      });
    } catch (error: any) {
      console.error('Connection error:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Please install MetaMask and try again",
        variant: "destructive"
      });
    }
  };

  const handleNetworkSwitch = async (network: typeof TARANIUM_NETWORK) => {
    try {
      await switchToNetwork(network);
      toast({
        title: "Network Switched! 🎉",
        description: `Successfully switched to ${network.name}`,
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

  const getCurrentNetwork = () => {
    return chainId ? getNetworkConfig(chainId) : null;
  };

  const currentNetwork = getCurrentNetwork();
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
                className={`border-purple-400 text-purple-100 hover:bg-purple-800 ${
                  !isSupported ? 'border-yellow-500 text-yellow-300' : ''
                }`}
              >
                <Globe className="w-4 h-4 mr-2" />
                {currentNetwork?.name || 'Unknown'}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-purple-900 border-purple-700">
              <DropdownMenuItem 
                onClick={() => handleNetworkSwitch(TARANIUM_NETWORK)}
                className="text-purple-100 hover:bg-purple-800 cursor-pointer"
              >
                <Globe className="w-4 h-4 mr-2" />
                {TARANIUM_NETWORK.name}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleNetworkSwitch(SEPOLIA_NETWORK)}
                className="text-purple-100 hover:bg-purple-800 cursor-pointer"
              >
                <Globe className="w-4 h-4 mr-2" />
                {SEPOLIA_NETWORK.name}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleNetworkSwitch(ETHEREUM_NETWORK)}
                className="text-purple-100 hover:bg-purple-800 cursor-pointer"
              >
                <Globe className="w-4 h-4 mr-2" />
                {ETHEREUM_NETWORK.name}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="text-right">
            <p className="text-white text-sm font-medium">
              {parseFloat(balance).toFixed(4)} {currentNetwork?.symbol || 'ETH'}
            </p>
            <p className="text-purple-200 text-xs">{account.substring(0, 6)}...{account.substring(38)}</p>
            {!isSupported && (
              <div className="flex items-center gap-1 text-yellow-300 text-xs">
                <AlertCircle className="w-3 h-3" />
                Unsupported Network
              </div>
            )}
          </div>
          <Button onClick={handleDisconnect} variant="outline" className="border-purple-400 text-purple-100 hover:bg-purple-800">
            <Wallet className="w-4 h-4 mr-2" />
            Disconnect
          </Button>
        </div>
      ) : (
        <Button onClick={handleConnect} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
        </Button>
      )}
    </div>
  );
};
