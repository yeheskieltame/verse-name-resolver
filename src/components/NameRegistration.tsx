
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Search } from 'lucide-react';
import { SWNSService } from '@/services/swnsService';
import { getNetworkConfig } from '@/contracts/swnsContract';

interface NameRegistrationProps {
  swnsService: SWNSService | null;
  isConnected: boolean;
  registrationFee: string;
  updateBalance: () => Promise<void>;
  chainId: number | null;
}

export const NameRegistration = ({ 
  swnsService, 
  isConnected, 
  registrationFee, 
  updateBalance,
  chainId 
}: NameRegistrationProps) => {
  const [searchName, setSearchName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Get current network config to display correct currency
  const networkConfig = chainId ? getNetworkConfig(chainId) : null;
  const currencySymbol = networkConfig?.symbol || 'ETH';

  const searchForName = async () => {
    if (!searchName.trim()) return;
    if (!swnsService) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }
    
    setIsSearching(true);
    
    try {
      const result = await swnsService.checkNameAvailability(searchName);
      
      if (result.error) {
        toast({
          title: "Invalid Name",
          description: result.error,
          variant: "destructive"
        });
      } else if (result.available) {
        toast({
          title: "Name Available! ✨",
          description: `${searchName}.sw is available for registration`,
        });
      } else {
        toast({
          title: "Name Taken",
          description: `${searchName}.sw is already registered`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: "Failed to check name availability",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const registerName = async () => {
    if (!isConnected || !swnsService) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    if (!searchName.trim()) return;

    setIsRegistering(true);
    
    try {
      // Check availability first
      const result = await swnsService.checkNameAvailability(searchName);
      if (!result.available) {
        toast({
          title: "Cannot Register",
          description: result.error || "Name is not available",
          variant: "destructive"
        });
        setIsRegistering(false);
        return;
      }

      // Register the name
      const tx = await swnsService.registerName(searchName);
      
      toast({
        title: "Transaction Sent! ⏳",
        description: "Waiting for confirmation...",
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt?.status === 1) {
        toast({
          title: "Registration Successful! 🎉",
          description: `${searchName}.sw is now yours!`,
        });
        
        setSearchName('');
        await updateBalance();
        
        // The name will be added to userNames via the event listener
      } else {
        throw new Error('Transaction failed');
      }
      
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.reason || error.message || "Transaction failed",
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Search className="w-5 h-5" />
          Register Your Name
        </CardTitle>
        <CardDescription className="text-purple-200">
          Claim your unique .sw identity (Fee: {registrationFee} {currencySymbol})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Enter username (e.g., yourname)"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-purple-300 pr-10"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-300 text-sm">
              .sw
            </span>
          </div>
          <Button 
            onClick={searchForName} 
            disabled={isSearching || !swnsService}
            variant="outline"
            className="border-purple-400 text-purple-100 hover:bg-purple-800"
          >
            {isSearching ? '...' : 'Check'}
          </Button>
        </div>
        
        <Button 
          onClick={registerName} 
          disabled={!searchName || isRegistering || !isConnected}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          {isRegistering ? 'Registering...' : 'Register Name'}
        </Button>
      </CardContent>
    </Card>
  );
};
