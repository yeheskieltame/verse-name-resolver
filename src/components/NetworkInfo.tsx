import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TARANIUM_NETWORK, 
  SEPOLIA_NETWORK, 
  getContractAddress,
  getNetworkConfig 
} from '@/contracts/swnsContract';
import { Globe, Link, AlertCircle, CheckCircle } from 'lucide-react';

interface NetworkInfoProps {
  chainId: number | null;
  isConnected: boolean;
}

export const NetworkInfo = ({ chainId, isConnected }: NetworkInfoProps) => {
  if (!isConnected || !chainId) {
    return (
      <Card className="bg-gray-800/50 border-gray-700 mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Network Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-gray-400">
            <AlertCircle className="w-4 h-4" />
            <span>Not connected to any network</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const networkConfig = getNetworkConfig(chainId);
  const contractAddress = getContractAddress(chainId);
  const isSupported = chainId === TARANIUM_NETWORK.chainId || chainId === SEPOLIA_NETWORK.chainId;

  return (
    <Card className={`mb-6 ${isSupported ? 'bg-green-900/20 border-green-700' : 'bg-yellow-900/20 border-yellow-700'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Network Information
          {isSupported ? (
            <Badge variant="outline" className="border-green-400 text-green-400 ml-2">
              <CheckCircle className="w-3 h-3 mr-1" />
              Supported
            </Badge>
          ) : (
            <Badge variant="outline" className="border-yellow-400 text-yellow-400 ml-2">
              <AlertCircle className="w-3 h-3 mr-1" />
              Unsupported
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-purple-200 text-sm font-medium mb-1">Current Network</h4>
            <p className="text-white font-mono text-sm">{networkConfig.name}</p>
            <p className="text-gray-400 text-xs">Chain ID: {chainId}</p>
          </div>
          
          <div>
            <h4 className="text-purple-200 text-sm font-medium mb-1">Contract Address</h4>
            <div className="flex items-center gap-2">
              <Link className="w-4 h-4 text-purple-400" />
              <p className="text-white font-mono text-sm break-all">{contractAddress}</p>
            </div>
          </div>
        </div>

        {!isSupported && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 mt-4">
            <div className="flex items-center gap-2 text-yellow-300">
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm font-medium">Unsupported Network</p>
            </div>
            <p className="text-yellow-200 text-xs mt-1">
              Please switch to Taranium Testnet or Sepolia to use the SWNS service.
            </p>
          </div>
        )}

        {isSupported && chainId === 11155111 && (
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 mt-4">
            <div className="flex items-center gap-2 text-blue-300">
              <Globe className="w-4 h-4" />
              <p className="text-sm font-medium">Sepolia Testnet</p>
            </div>
            <p className="text-blue-200 text-xs mt-1">
              Need Sepolia ETH? Get free testnet tokens from{" "}
              <a 
                href="https://sepoliafaucet.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Sepolia Faucet
              </a>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
