import { Badge } from "@/components/ui/badge";
import { 
  TARANIUM_NETWORK, 
  SEPOLIA_NETWORK, 
  getNetworkConfig 
} from '@/contracts/swnsContract';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface NetworkIndicatorProps {
  chainId: number | null;
  className?: string;
}

export const NetworkIndicator = ({ chainId, className = "" }: NetworkIndicatorProps) => {
  if (!chainId) {
    return (
      <Badge variant="outline" className={`border-gray-400 text-gray-400 ${className}`}>
        <AlertCircle className="w-3 h-3 mr-1" />
        Not Connected
      </Badge>
    );
  }

  const networkConfig = getNetworkConfig(chainId);
  const isSupported = chainId === TARANIUM_NETWORK.chainId || chainId === SEPOLIA_NETWORK.chainId;

  if (!isSupported) {
    return (
      <Badge variant="outline" className={`border-yellow-400 text-yellow-400 ${className}`}>
        <AlertCircle className="w-3 h-3 mr-1" />
        Unsupported Network
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={`border-green-400 text-green-400 ${className}`}
    >
      <CheckCircle className="w-3 h-3 mr-1" />
      {networkConfig.name}
    </Badge>
  );
};
