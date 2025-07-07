import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { Loader2, UserPlus, AlertCircle, CheckCircle, Network } from 'lucide-react';
import { useAccount, useWalletClient, useChainId, useSwitchChain } from 'wagmi';
import { formatEther, type Address } from 'viem';
import { crossChainNameService, CrossChainNameService } from "@/services/crossChainNameService";
import { HUB_CHAIN_ID } from "@/wagmi";

export const CrossChainNameRegistration = () => {
  const { address: userAddress, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  const [name, setName] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [registrationFee, setRegistrationFee] = useState<bigint | null>(null);
  const [renewalFee, setRenewalFee] = useState<bigint | null>(null);
  const [userNames, setUserNames] = useState<string[]>([]);

  const networkInfo = CrossChainNameService.getNetworkInfo(chainId);
  const isOnHubChain = crossChainNameService.isHubChain(chainId);
  const actualHubChainId = crossChainNameService.getActualHubChainId();

  // Load user's existing names
  useEffect(() => {
    if (userAddress) {
      loadUserNames();
    }
  }, [userAddress]);

  // Load registration and renewal fees
  useEffect(() => {
    loadFees();
  }, []);

  const loadUserNames = async () => {
    if (!userAddress) return;
    
    try {
      const names = await crossChainNameService.getUserNames(userAddress);
      setUserNames(names);
    } catch (error) {
      console.error('Error loading user names:', error);
    }
  };

  const loadFees = async () => {
    try {
      const [regFee, renFee] = await Promise.all([
        crossChainNameService.getRegistrationFee(),
        crossChainNameService.getRenewalFee()
      ]);
      setRegistrationFee(regFee);
      setRenewalFee(renFee);
    } catch (error) {
      console.error('Error loading fees:', error);
    }
  };

  // Check name availability
  const checkNameAvailability = async () => {
    if (!name.trim()) {
      setNameAvailable(null);
      setAvailabilityError(null);
      return;
    }

    setIsChecking(true);
    setAvailabilityError(null);
    
    try {
      const result = await crossChainNameService.checkNameAvailability(name);
      setNameAvailable(result.available);
      setAvailabilityError(result.error || null);
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailabilityError('Error checking availability');
      setNameAvailable(null);
    } finally {
      setIsChecking(false);
    }
  };

  // Handle name input change
  const handleNameChange = (value: string) => {
    setName(value);
    setNameAvailable(null);
    setAvailabilityError(null);
  };

  // Switch to Hub Chain
  const handleSwitchToHub = async () => {
    if (!switchChain) return;
    
    try {
      await switchChain({ chainId: actualHubChainId });
      toast({
        title: "Network Switched! 🔄",
        description: `You're now on the Hub Chain (ID: ${actualHubChainId}). You can register names here.`,
      });
    } catch (error) {
      console.error('Error switching network:', error);
      toast({
        title: "Network Switch Failed",
        description: `Please manually switch to Hub Chain (ID: ${actualHubChainId}) in your wallet.`,
        variant: "destructive",
      });
    }
  };

  // Register name
  const handleRegisterName = async () => {
    if (!walletClient || !name.trim() || nameAvailable !== true) return;

    setIsRegistering(true);
    
    try {
      const txHash = await crossChainNameService.registerNameOnHub(name, walletClient);
      
      toast({
        title: "Registration Sent! 🎉",
        description: `Transaction sent: ${txHash}`,
      });

      // Reset form
      setName('');
      setNameAvailable(null);
      setAvailabilityError(null);
      
      // Reload user names after a delay
      setTimeout(() => {
        loadUserNames();
      }, 5000);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🎯 Register Your Name</CardTitle>
          <CardDescription>
            Register your unique SmartVerse name (.sw) - works across all networks!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to register names
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* User's Names Display */}
      {userNames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎭 Your Names
              <Badge variant="outline">{userNames.length}</Badge>
            </CardTitle>
            <CardDescription>
              Names you own in the SmartVerse ecosystem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {userNames.map((name, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎯 Register New Name
            <Badge variant="outline" className="ml-auto">
              {networkInfo.name}
            </Badge>
          </CardTitle>
          <CardDescription>
            Register your unique SmartVerse name (.sw) - works across all networks!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Network Status */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Current Network:</span>
              <Badge variant={networkInfo.isHub ? "default" : "secondary"}>
                {networkInfo.name}
              </Badge>
              {networkInfo.isHub && (
                <Badge variant="outline" className="text-blue-600">
                  🏛️ Hub Chain
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {networkInfo.isHub 
                ? "Perfect! You can register names on the Hub Chain"
                : "Names can only be registered on Sepolia (Hub Chain)"
              }
            </p>
          </div>

          {/* Network Switch Alert */}
          {!isOnHubChain && (
            <Alert className="border-blue-200 bg-blue-50">
              <Network className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="flex items-center justify-between">
                  <span>Switch to Sepolia to register names</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSwitchToHub}
                    className="ml-2"
                  >
                    Switch Network
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name">Choose Your Name</Label>
            <div className="flex gap-2">
              <Input
                id="name"
                placeholder="Enter name (e.g., alice)"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                onBlur={checkNameAvailability}
                disabled={!isOnHubChain}
              />
              <div className="flex items-center px-3 bg-muted rounded-md">
                <span className="text-sm font-medium">.sw</span>
              </div>
              <Button 
                variant="outline" 
                onClick={checkNameAvailability}
                disabled={!name.trim() || isChecking || !isOnHubChain}
              >
                {isChecking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Check"
                )}
              </Button>
            </div>
            
            {/* Availability Status */}
            {nameAvailable === true && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>✅ Available:</strong> {name}.sw is available for registration!
                </AlertDescription>
              </Alert>
            )}
            
            {nameAvailable === false && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>❌ Not Available:</strong> {availabilityError || `${name}.sw is already taken`}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Fee Information */}
          {(registrationFee !== null || renewalFee !== null) && isOnHubChain && (
            <div className="p-3 bg-blue-50 rounded-lg space-y-2">
              <h4 className="text-sm font-medium text-blue-900">💰 Subscription Pricing</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {registrationFee !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">New Registration:</span>
                    <Badge variant="outline" className="bg-blue-100">
                      {formatEther(registrationFee)} ETH/year
                    </Badge>
                  </div>
                )}
                {renewalFee !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Renewal (Save!):</span>
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                      {formatEther(renewalFee)} ETH/year
                    </Badge>
                  </div>
                )}
              </div>
              {registrationFee !== null && renewalFee !== null && renewalFee < registrationFee && (
                <p className="text-xs text-green-700 mt-2">
                  💡 Renewal is cheaper! Save {formatEther(registrationFee - renewalFee)} ETH per year by renewing early.
                </p>
              )}
            </div>
          )}

          {/* Register Button */}
          <Button 
            onClick={handleRegisterName}
            disabled={!isOnHubChain || nameAvailable !== true || isRegistering}
            className="w-full"
          >
            {isRegistering ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Register {name}.sw
                {registrationFee !== null && ` for ${formatEther(registrationFee)} ETH`}
              </>
            )}
          </Button>

          {/* Info */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-1">📋 How SmartVerse Names Work:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• <strong>Annual Subscription:</strong> Names are now registered for 1 year periods</li>
              <li>• <strong>Hub Chain Storage:</strong> Names stored as NFTs on Sepolia (testnet)</li>
              <li>• <strong>Cross-Chain Usage:</strong> Works across all 16+ supported networks</li>
              <li>• <strong>Easy Renewals:</strong> Renew before expiry at a lower cost</li>
              <li>• <strong>Grace Period:</strong> 90 days to renew after expiration</li>
              <li>• <strong>QR Payments:</strong> Generate QR codes for easy payments</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
