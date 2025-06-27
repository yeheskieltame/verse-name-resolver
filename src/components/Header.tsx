
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Wallet, Globe, AlertCircle } from 'lucide-react';

interface HeaderProps {
  isConnected: boolean;
  account: string;
  balance: string;
  chainId: number | null;
  connectWallet: () => Promise<void>;
  handleDisconnect: () => void;
}

export const Header = ({ 
  isConnected, 
  account, 
  balance, 
  chainId, 
  connectWallet, 
  handleDisconnect 
}: HeaderProps) => {
  const handleConnect = async () => {
    try {
      await connectWallet();
      toast({
        title: "Wallet Connected! 🎉",
        description: "Successfully connected to Taranium testnet",
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
          <div className="text-right">
            <p className="text-white text-sm font-medium">{parseFloat(balance).toFixed(4)} TARAN</p>
            <p className="text-purple-200 text-xs">{account.substring(0, 6)}...{account.substring(38)}</p>
            {chainId !== 9924 && (
              <div className="flex items-center gap-1 text-yellow-300 text-xs">
                <AlertCircle className="w-3 h-3" />
                Wrong Network
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
