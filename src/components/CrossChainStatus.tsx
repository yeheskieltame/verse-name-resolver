
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAccount, useChainId } from 'wagmi';
import { CrossChainNameService } from "@/services/crossChainNameService";
import { HUB_CHAIN_ID } from "@/wagmi";

export const CrossChainStatus = () => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  
  if (!isConnected) {
    return null;
  }
  
  const networkInfo = CrossChainNameService.getNetworkInfo(chainId);
  // Add isSpoke property for compatibility
  const extendedNetworkInfo = {
    ...networkInfo,
    isSpoke: !networkInfo.isHub
  };
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🌐 Cross-Chain Status
        </CardTitle>
        <CardDescription>
          Your connection status in the SmartVerse ecosystem
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Current Network Status */}
          <div className="space-y-2">
            <h4 className="font-medium">Current Network</h4>
            <div className="flex items-center gap-2">
              <Badge variant={extendedNetworkInfo.isHub ? "default" : "secondary"}>
                {extendedNetworkInfo.name}
              </Badge>
              {extendedNetworkInfo.isHub && (
                <Badge variant="outline" className="text-blue-600">
                  🏛️ Hub Chain
                </Badge>
              )}
              {extendedNetworkInfo.isSpoke && (
                <Badge variant="outline" className="text-green-600">
                  ⚡ Transaction Chain
                </Badge>
              )}
            </div>
          </div>

          {/* Function Available */}
          <div className="space-y-2">
            <h4 className="font-medium">Available Functions</h4>
            <div className="flex flex-wrap gap-1">
              {extendedNetworkInfo.isHub && (
                <Badge variant="default" className="text-xs">
                  Register Names
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                Send Transactions
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Resolve Names
              </Badge>
            </div>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        {/* Cross-Chain Explanation */}
        <div className="space-y-2">
          <h4 className="font-medium">How it works:</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            {extendedNetworkInfo.isHub ? (
              <>
                <p>✅ You're on the <strong>Hub Chain</strong> - you can register new names here</p>
                <p>📝 All usernames are stored as NFTs on Mainnet (Hub Chain)</p>
                <p>🔄 You can switch to any other network for transactions</p>
              </>
            ) : (
              <>
                <p>⚡ You're on a <strong>Transaction Chain</strong> - perfect for daily transactions</p>
                <p>🔍 When you send to someone.sw, we'll find their address from Hub Chain</p>
                <p>📝 To register new names, switch to Hub Chain (Mainnet)</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
