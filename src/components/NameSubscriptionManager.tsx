import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { Loader2, Calendar, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useAccount, useWalletClient } from 'wagmi';
import { formatEther, type Address } from 'viem';
import { crossChainNameService } from "@/services/crossChainNameService";

interface NameWithExpiry {
  name: string;
  expiresAt: Date;
  isExpired: boolean;
  isInGracePeriod: boolean;
  daysRemaining: number;
}

export const NameSubscriptionManager = () => {
  const { address: userAddress, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [userNames, setUserNames] = useState<NameWithExpiry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [renewalFee, setRenewalFee] = useState<bigint | null>(null);
  const [renewingNames, setRenewingNames] = useState<Set<string>>(new Set());

  // Load user names with expiry info
  const loadUserNames = async () => {
    if (!userAddress) return;
    
    setIsLoading(true);
    try {
      const names = await crossChainNameService.getUserNamesWithExpiry(userAddress);
      setUserNames(names);
    } catch (error) {
      console.error('Error loading user names:', error);
      toast({
        title: "Loading Failed",
        description: "Failed to load your names. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load renewal fee
  const loadRenewalFee = async () => {
    try {
      const fee = await crossChainNameService.getRenewalFee();
      setRenewalFee(fee);
    } catch (error) {
      console.error('Error loading renewal fee:', error);
    }
  };

  useEffect(() => {
    if (isConnected && userAddress) {
      loadUserNames();
      loadRenewalFee();
    }
  }, [isConnected, userAddress]);

  // Handle name renewal
  const handleRenewName = async (name: string) => {
    if (!walletClient) {
      toast({
        title: "Wallet Required",
        description: "Please ensure your wallet is connected",
        variant: "destructive",
      });
      return;
    }

    setRenewingNames(prev => new Set([...prev, name]));
    
    try {
      const txHash = await crossChainNameService.renewName(name, walletClient);
      
      toast({
        title: "Renewal Sent! 🎉",
        description: `Renewal transaction sent: ${txHash}`,
      });

      // Reload names after a delay
      setTimeout(() => {
        loadUserNames();
      }, 5000);
      
    } catch (error: any) {
      console.error('Renewal error:', error);
      toast({
        title: "Renewal Failed",
        description: error.message || "An error occurred during renewal",
        variant: "destructive",
      });
    } finally {
      setRenewingNames(prev => {
        const newSet = new Set(prev);
        newSet.delete(name);
        return newSet;
      });
    }
  };

  const getStatusBadge = (nameData: NameWithExpiry) => {
    if (nameData.isInGracePeriod) {
      return <Badge variant="destructive" className="text-xs">Grace Period</Badge>;
    } else if (nameData.isExpired) {
      return <Badge variant="outline" className="text-xs border-gray-500 text-gray-500">Expired</Badge>;
    } else if (nameData.daysRemaining <= 30) {
      return <Badge variant="outline" className="text-xs border-orange-500 text-orange-500">Expires Soon</Badge>;
    } else {
      return <Badge variant="outline" className="text-xs border-green-500 text-green-500">Active</Badge>;
    }
  };

  const getStatusIcon = (nameData: NameWithExpiry) => {
    if (nameData.isInGracePeriod) {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    } else if (nameData.isExpired) {
      return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    } else if (nameData.daysRemaining <= 30) {
      return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    } else {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const formatExpiryDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysRemainingText = (daysRemaining: number) => {
    if (daysRemaining < 0) {
      const daysExpired = Math.abs(daysRemaining);
      return `Expired ${daysExpired} days ago`;
    } else if (daysRemaining === 0) {
      return 'Expires today';
    } else if (daysRemaining === 1) {
      return '1 day remaining';
    } else {
      return `${daysRemaining} days remaining`;
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📋 My Names</CardTitle>
          <CardDescription>
            Manage your SmartVerse names and subscription status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to view your names
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📋 My Names
          {renewalFee && (
            <Badge variant="outline" className="ml-auto text-xs">
              Renewal: {formatEther(renewalFee)} ETH
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Manage your SmartVerse names and subscription status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-gray-600">Loading your names...</span>
          </div>
        ) : userNames.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>You don't have any registered names yet</p>
            <p className="text-sm">Register your first name to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {userNames.map((nameData, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(nameData)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{nameData.name}</span>
                          {getStatusBadge(nameData)}
                        </div>
                        <div className="text-sm text-gray-600">
                          <div>Expires: {formatExpiryDate(nameData.expiresAt)}</div>
                          <div className={
                            nameData.isInGracePeriod ? 'text-red-400' :
                            nameData.isExpired ? 'text-gray-500' :
                            nameData.daysRemaining <= 30 ? 'text-orange-400' :
                            'text-green-400'
                          }>
                            {getDaysRemainingText(nameData.daysRemaining)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Renewal Button */}
                    {(!nameData.isExpired || nameData.isInGracePeriod) && (
                      <Button
                        onClick={() => handleRenewName(nameData.name)}
                        disabled={renewingNames.has(nameData.name)}
                        size="sm"
                        variant={nameData.isInGracePeriod ? "destructive" : 
                                nameData.daysRemaining <= 30 ? "outline" : "ghost"}
                      >
                        {renewingNames.has(nameData.name) ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Renewing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Renew
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Grace Period Info */}
        {userNames.some(name => name.isInGracePeriod) && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Urgent:</strong> Some of your names are in grace period! 
              You have 90 days from expiration to renew before they become available for others to register.
            </AlertDescription>
          </Alert>
        )}

        {/* Expiry Warning */}
        {userNames.some(name => !name.isExpired && name.daysRemaining <= 30) && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Reminder:</strong> Some of your names will expire soon. 
              Renew them now to avoid losing access during the grace period.
            </AlertDescription>
          </Alert>
        )}

        {/* Refresh Button */}
        <div className="flex justify-center">
          <Button
            onClick={loadUserNames}
            disabled={isLoading}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
