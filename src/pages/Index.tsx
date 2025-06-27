
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Wallet, Search, Send, Shield, Globe, Zap, Check, X, AlertCircle } from 'lucide-react';
import { useWeb3 } from '@/hooks/useWeb3';
import { SWNSService } from '@/services/swnsService';
import { ethers } from 'ethers';

interface RegisteredName {
  name: string;
  address: string;
  owner: string;
}

const Index = () => {
  const { 
    provider, 
    signer, 
    account, 
    balance, 
    isConnected, 
    chainId,
    connectWallet: connectWeb3Wallet, 
    disconnectWallet,
    updateBalance 
  } = useWeb3();
  
  const [searchName, setSearchName] = useState('');
  const [registeredNames, setRegisteredNames] = useState<RegisteredName[]>([]);
  const [userNames, setUserNames] = useState<string[]>([]);
  const [sendToName, setSendToName] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [swnsService, setSWNSService] = useState<SWNSService | null>(null);
  const [registrationFee, setRegistrationFee] = useState<string>('0');

  // Initialize SWNS service when signer is available
  useEffect(() => {
    if (signer) {
      const service = new SWNSService(signer);
      setSWNSService(service);

      // Get registration fee
      service.getRegistrationFee().then(fee => {
        setRegistrationFee(ethers.formatEther(fee));
      });

      // Listen to name registration events
      service.onNameRegistered((name, owner, tokenId) => {
        if (owner.toLowerCase() === account.toLowerCase()) {
          setUserNames(prev => [...prev, name]);
        }
        
        setRegisteredNames(prev => [...prev, {
          name,
          address: owner,
          owner
        }]);
      });

      return () => {
        service.removeAllListeners();
      };
    }
  }, [signer, account]);

  const connectWallet = async () => {
    try {
      await connectWeb3Wallet();
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

  const handleDisconnect = () => {
    disconnectWallet();
    setUserNames([]);
    setSWNSService(null);
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

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
          description: `${searchName} is available for registration`,
        });
      } else {
        toast({
          title: "Name Taken",
          description: `${searchName} is already registered`,
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
          description: `${searchName} is now yours!`,
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

  const resolveName = async (name: string): Promise<string | null> => {
    if (!swnsService) return null;
    return await swnsService.resolveName(name);
  };

  const sendTokens = async () => {
    if (!isConnected || !signer) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    if (!sendToName.trim() || !sendAmount.trim()) {
      toast({
        title: "Fill All Fields",
        description: "Please enter recipient name and amount",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    
    try {
      const resolvedAddress = await resolveName(sendToName);
      if (!resolvedAddress) {
        toast({
          title: "Name Not Found",
          description: `${sendToName} is not registered`,
          variant: "destructive"
        });
        return;
      }

      const amount = ethers.parseEther(sendAmount);
      
      const tx = await signer.sendTransaction({
        to: resolvedAddress,
        value: amount
      });

      toast({
        title: "Transaction Sent! ⏳",
        description: "Waiting for confirmation...",
      });

      await tx.wait();
      
      toast({
        title: "Transfer Successful! 💸",
        description: `Sent ${sendAmount} TARAN to ${sendToName}`,
      });
      
      setSendToName('');
      setSendAmount('');
      await updateBalance();
      
    } catch (error: any) {
      console.error('Send error:', error);
      toast({
        title: "Transfer Failed",
        description: error.reason || error.message || "Transaction failed",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  
  useEffect(() => {
    const checkResolution = async () => {
      if (sendToName && swnsService) {
        const address = await resolveName(sendToName);
        setResolvedAddress(address);
      } else {
        setResolvedAddress(null);
      }
    };
    
    checkResolution();
  }, [sendToName, swnsService]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
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
            <Button onClick={connectWallet} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          )}
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-white mb-4">
            Web3 Made <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Simple</span>
          </h2>
          <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
            Send crypto using simple names like <span className="text-purple-300 font-mono">yourname.sw</span> instead of complex wallet addresses on Taranium Network
          </p>
          
          <div className="flex justify-center gap-8 mb-8">
            <div className="flex items-center gap-2 text-purple-200">
              <Shield className="w-5 h-5" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-2 text-purple-200">
              <Zap className="w-5 h-5" />
              <span>Fast</span>
            </div>
            <div className="flex items-center gap-2 text-purple-200">
              <Globe className="w-5 h-5" />
              <span>Decentralized</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Name Registration */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="w-5 h-5" />
                Register Your Name
              </CardTitle>
              <CardDescription className="text-purple-200">
                Claim your unique .sw identity (Fee: {registrationFee} TARAN)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter name (e.g., yourname.sw)"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-purple-300"
                />
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

              {userNames.length > 0 && (
                <div>
                  <p className="text-white text-sm font-medium mb-2">Your Names:</p>
                  <div className="flex flex-wrap gap-2">
                    {userNames.map((name) => (
                      <Badge key={name} variant="secondary" className="bg-purple-700 text-purple-100">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Send Tokens */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Send className="w-5 h-5" />
                Send TARAN Tokens
              </CardTitle>
              <CardDescription className="text-purple-200">
                Send crypto using .sw names
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Recipient (e.g., friend.sw)"
                value={sendToName}
                onChange={(e) => setSendToName(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-purple-300"
              />
              
              <Input
                type="number"
                step="0.001"
                placeholder="Amount in TARAN"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-purple-300"
              />
              
              <Button 
                onClick={sendTokens} 
                disabled={!sendToName || !sendAmount || isSending || !isConnected}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                {isSending ? 'Sending...' : 'Send Tokens'}
              </Button>

              {sendToName && (
                <div className="text-sm">
                  {resolvedAddress ? (
                    <div className="flex items-center gap-2 text-green-300">
                      <Check className="w-4 h-4" />
                      <span>Name resolved: {resolvedAddress.substring(0, 10)}...{resolvedAddress.substring(32)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-300">
                      <X className="w-4 h-4" />
                      <span>Name not found</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Registered Names Directory */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 mt-8 max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-white">Name Directory</CardTitle>
            <CardDescription className="text-purple-200">
              Recently registered .sw names
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {registeredNames.slice(-5).map((name, index) => (
                <div key={`${name.name}-${index}`} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{name.name}</p>
                    <p className="text-purple-300 text-sm font-mono">{name.address.substring(0, 10)}...{name.address.substring(32)}</p>
                  </div>
                  <Badge variant="outline" className="border-purple-400 text-purple-200">
                    Active
                  </Badge>
                </div>
              ))}
              {registeredNames.length === 0 && (
                <div className="text-center py-8 text-purple-300">
                  No names registered yet. Be the first to claim your .sw identity!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">Secure & Decentralized</h3>
            <p className="text-purple-200 text-sm">Your names are stored on-chain, fully owned by you</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">Lightning Fast</h3>
            <p className="text-purple-200 text-sm">Instant name resolution and seamless transactions</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">Universal Access</h3>
            <p className="text-purple-200 text-sm">Works with any wallet, any blockchain, anywhere</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
