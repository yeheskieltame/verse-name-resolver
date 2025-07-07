import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Calendar, Clock, AlertTriangle, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import { useAccount, useWalletClient, useChainId } from 'wagmi';
import { formatEther, type Address } from 'viem';
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns';
import { crossChainNameService, CrossChainNameService } from "@/services/crossChainNameService";

interface NameWithExpiry {
  name: string;
  expiresAt: Date;
  isExpired: boolean;
  isInGracePeriod: boolean;
  daysRemaining: number;
}

export const NameExpirationStatus = () => {
  const { address: userAddress, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  
  const [userNames, setUserNames] = useState<NameWithExpiry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRenewing, setIsRenewing] = useState<string | null>(null);
  const [renewalFee, setRenewalFee] = useState<bigint | null>(null);
  const [registrationFee, setRegistrationFee] = useState<bigint | null>(null);

  const networkInfo = CrossChainNameService.getNetworkInfo(chainId);
  const isOnHubChain = networkInfo.isHub;

  // Load user names dengan info expiry
  useEffect(() => {
    if (userAddress && isConnected) {
      loadUserNamesWithExpiry();
      loadFees();
    }
  }, [userAddress, isConnected]);

  const loadUserNamesWithExpiry = async () => {
    if (!userAddress) return;
    
    setIsLoading(true);
    try {
      const names = await crossChainNameService.getUserNamesWithExpiry(userAddress);
      setUserNames(names);
      console.log('📋 Loaded user names with expiry:', names);
    } catch (error) {
      console.error('Error loading user names with expiry:', error);
      toast({
        title: "Error",
        description: "Failed to load your names and expiration info",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadFees = async () => {
    try {
      const [renewal, registration] = await Promise.all([
        crossChainNameService.getRenewalFee(),
        crossChainNameService.getRegistrationFee()
      ]);
      setRenewalFee(renewal);
      setRegistrationFee(registration);
    } catch (error) {
      console.error('Error loading fees:', error);
    }
  };

  const handleRenewName = async (name: string) => {
    if (!walletClient || !isOnHubChain) {
      toast({
        title: "Switch Network",
        description: "Please switch to Sepolia (Hub Chain) to renew names",
        variant: "destructive",
      });
      return;
    }

    setIsRenewing(name);
    
    try {
      const txHash = await crossChainNameService.renewName(name, walletClient);
      
      toast({
        title: "Renewal Sent! 🎉",
        description: `Transaction sent: ${txHash}`,
      });

      // Reload data setelah delay
      setTimeout(() => {
        loadUserNamesWithExpiry();
      }, 5000);
      
    } catch (error: any) {
      console.error('Renewal error:', error);
      toast({
        title: "Renewal Failed",
        description: error.message || "An error occurred during renewal",
        variant: "destructive",
      });
    } finally {
      setIsRenewing(null);
    }
  };

  const getStatusColor = (nameData: NameWithExpiry) => {
    if (nameData.isExpired) {
      return nameData.isInGracePeriod ? 'orange' : 'red';
    } else if (nameData.daysRemaining <= 30) {
      return 'yellow';
    } else {
      return 'green';
    }
  };

  const getStatusText = (nameData: NameWithExpiry) => {
    if (nameData.isExpired) {
      if (nameData.isInGracePeriod) {
        return `Grace Period (${90 + nameData.daysRemaining} days left)`;
      } else {
        return 'Expired';
      }
    } else if (nameData.daysRemaining <= 30) {
      return `Expires Soon (${nameData.daysRemaining} days)`;
    } else {
      return `Active (${nameData.daysRemaining} days left)`;
    }
  };

  const getStatusIcon = (nameData: NameWithExpiry) => {
    if (nameData.isExpired) {
      return nameData.isInGracePeriod ? <AlertTriangle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />;
    } else if (nameData.daysRemaining <= 30) {
      return <Clock className="w-4 h-4" />;
    } else {
      return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getProgressValue = (nameData: NameWithExpiry) => {
    const oneYear = 365; // Assuming 1 year subscription
    const daysUsed = oneYear - nameData.daysRemaining;
    return Math.max(0, Math.min(100, (daysUsed / oneYear) * 100));
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Name Subscription Status
          </CardTitle>
          <CardDescription>
            Monitor your .sw names and their expiration dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to view your name subscriptions
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Name Subscription Status
            <Badge variant="outline" className="ml-auto">
              {networkInfo.name}
            </Badge>
          </CardTitle>
          <CardDescription>
            Monitor your .sw names and renew subscriptions before they expire
          </CardDescription>
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={loadUserNamesWithExpiry}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
            
            {renewalFee && registrationFee && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="mr-4">Renewal: {formatEther(renewalFee)} ETH</span>
                <span>Registration: {formatEther(registrationFee)} ETH</span>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Network Warning */}
      {!isOnHubChain && (
        <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            You're on {networkInfo.name}. Switch to Sepolia (Hub Chain) to renew names.
          </AlertDescription>
        </Alert>
      )}

      {/* Names List */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading your names...
          </CardContent>
        </Card>
      ) : userNames.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Names Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You don't have any registered .sw names yet.
            </p>
            <Button variant="outline">
              Register Your First Name
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {userNames.map((nameData) => {
            const statusColor = getStatusColor(nameData);
            const statusText = getStatusText(nameData);
            const statusIcon = getStatusIcon(nameData);
            const progressValue = getProgressValue(nameData);
            
            return (
              <Card key={nameData.name} className={`border-l-4 ${
                statusColor === 'red' ? 'border-l-red-500' :
                statusColor === 'orange' ? 'border-l-orange-500' :
                statusColor === 'yellow' ? 'border-l-yellow-500' :
                'border-l-green-500'
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{nameData.name}</CardTitle>
                    <Badge 
                      variant="outline" 
                      className={`
                        ${statusColor === 'red' ? 'border-red-500 text-red-600 bg-red-50 dark:bg-red-900/20' :
                          statusColor === 'orange' ? 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-900/20' :
                          statusColor === 'yellow' ? 'border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' :
                          'border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20'}
                      `}
                    >
                      {statusIcon}
                      <span className="ml-1">{statusText}</span>
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subscription Progress</span>
                      <span>{Math.round(progressValue)}% used</span>
                    </div>
                    <Progress 
                      value={progressValue} 
                      className={`h-2 ${
                        statusColor === 'red' ? '[&>div]:bg-red-500' :
                        statusColor === 'orange' ? '[&>div]:bg-orange-500' :
                        statusColor === 'yellow' ? '[&>div]:bg-yellow-500' :
                        '[&>div]:bg-green-500'
                      }`}
                    />
                  </div>

                  {/* Expiration Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-600 dark:text-gray-400">Expires On:</p>
                      <p className="font-mono">{format(nameData.expiresAt, 'PPP')}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600 dark:text-gray-400">Time Remaining:</p>
                      <p>{formatDistanceToNow(nameData.expiresAt, { addSuffix: true })}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    {(nameData.isExpired && nameData.isInGracePeriod) || nameData.daysRemaining <= 90 ? (
                      <Button
                        onClick={() => handleRenewName(nameData.name)}
                        disabled={!isOnHubChain || isRenewing === nameData.name}
                        className={`${
                          statusColor === 'red' || statusColor === 'orange' 
                            ? 'bg-orange-500 hover:bg-orange-600' 
                            : 'bg-blue-500 hover:bg-blue-600'
                        } text-white`}
                      >
                        {isRenewing === nameData.name ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Renewing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Renew for {renewalFee ? formatEther(renewalFee) : '...'} ETH
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button variant="outline" disabled>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Active
                      </Button>
                    )}
                  </div>

                  {/* Special Alerts */}
                  {nameData.isExpired && nameData.isInGracePeriod && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Grace Period:</strong> Your name has expired but you have {90 + nameData.daysRemaining} days to renew it. After that, it will become available for others to register!
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {nameData.daysRemaining <= 30 && !nameData.isExpired && (
                    <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                        <strong>Renewal Reminder:</strong> Your name expires in {nameData.daysRemaining} days. Renew now to avoid any interruption!
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📋 Subscription Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">💰 Pricing</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• New registration: {registrationFee ? formatEther(registrationFee) : '...'} ETH/year</li>
                <li>• Renewal: {renewalFee ? formatEther(renewalFee) : '...'} ETH/year</li>
                <li>• Save money by renewing early!</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">⏰ Important Dates</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• 30 days before: Renewal reminder</li>
                <li>• Expiration: Name stops working</li>
                <li>• 90-day grace period to renew</li>
                <li>• After grace: Available for others</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
