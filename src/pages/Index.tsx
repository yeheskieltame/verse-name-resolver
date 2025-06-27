
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Wallet, Search, Send, Shield, Globe, Zap, Check, X } from 'lucide-react';

interface WalletState {
  isConnected: boolean;
  address: string;
  balance: number;
}

interface RegisteredName {
  name: string;
  address: string;
  owner: string;
}

const Index = () => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: '',
    balance: 0
  });
  
  const [searchName, setSearchName] = useState('');
  const [registeredNames, setRegisteredNames] = useState<RegisteredName[]>([
    { name: 'admin.sw', address: '0x742d35Cc6aBc7532BD5038acb21cd5e', owner: '0x742d35Cc6aBc7532BD5038acb21cd5e' },
    { name: 'demo.sw', address: '0x8ba1f109551bD432803012645Hac189B', owner: '0x8ba1f109551bD432803012645Hac189B' }
  ]);
  
  const [userNames, setUserNames] = useState<string[]>([]);
  const [sendToName, setSendToName] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const connectWallet = async () => {
    // Simulate wallet connection
    try {
      const mockAddress = '0x' + Math.random().toString(16).substring(2, 42);
      setWallet({
        isConnected: true,
        address: mockAddress,
        balance: 1250.75
      });
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to MetaMask",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Please install MetaMask",
        variant: "destructive"
      });
    }
  };

  const disconnectWallet = () => {
    setWallet({
      isConnected: false,
      address: '',
      balance: 0
    });
    setUserNames([]);
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const checkNameAvailability = async (name: string) => {
    if (!name.endsWith('.sw')) {
      return { available: false, error: 'Name must end with .sw' };
    }
    
    const cleanName = name.toLowerCase();
    const exists = registeredNames.some(n => n.name === cleanName);
    
    return { available: !exists, error: null };
  };

  const searchForName = async () => {
    if (!searchName.trim()) return;
    
    setIsSearching(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result = await checkNameAvailability(searchName);
    setIsSearching(false);
    
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
  };

  const registerName = async () => {
    if (!wallet.isConnected) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    if (!searchName.trim()) return;
    
    const result = await checkNameAvailability(searchName);
    if (!result.available) {
      toast({
        title: "Cannot Register",
        description: result.error || "Name is not available",
        variant: "destructive"
      });
      return;
    }

    setIsRegistering(true);
    
    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newName: RegisteredName = {
      name: searchName.toLowerCase(),
      address: wallet.address,
      owner: wallet.address
    };
    
    setRegisteredNames(prev => [...prev, newName]);
    setUserNames(prev => [...prev, newName.name]);
    setSearchName('');
    setIsRegistering(false);
    
    toast({
      title: "Registration Successful! 🎉",
      description: `${newName.name} is now yours!`,
    });
  };

  const resolveName = (name: string): string | null => {
    const found = registeredNames.find(n => n.name === name.toLowerCase());
    return found ? found.address : null;
  };

  const sendTokens = async () => {
    if (!wallet.isConnected) {
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

    const resolvedAddress = resolveName(sendToName);
    if (!resolvedAddress) {
      toast({
        title: "Name Not Found",
        description: `${sendToName} is not registered`,
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    
    // Simulate transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const amount = parseFloat(sendAmount);
    setWallet(prev => ({ ...prev, balance: prev.balance - amount }));
    setSendToName('');
    setSendAmount('');
    setIsSending(false);
    
    toast({
      title: "Transfer Successful! 💸",
      description: `Sent ${amount} tokens to ${sendToName}`,
    });
  };

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
          
          {wallet.isConnected ? (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-white text-sm font-medium">{wallet.balance.toFixed(2)} ETH</p>
                <p className="text-purple-200 text-xs">{wallet.address.substring(0, 6)}...{wallet.address.substring(38)}</p>
              </div>
              <Button onClick={disconnectWallet} variant="outline" className="border-purple-400 text-purple-100 hover:bg-purple-800">
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
            Send crypto using simple names like <span className="text-purple-300 font-mono">yourname.sw</span> instead of complex wallet addresses
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
                Claim your unique .sw identity
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
                  disabled={isSearching}
                  variant="outline"
                  className="border-purple-400 text-purple-100 hover:bg-purple-800"
                >
                  {isSearching ? '...' : 'Check'}
                </Button>
              </div>
              
              <Button 
                onClick={registerName} 
                disabled={!searchName || isRegistering}
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
                Send Tokens
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
                placeholder="Amount"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-purple-300"
              />
              
              <Button 
                onClick={sendTokens} 
                disabled={!sendToName || !sendAmount || isSending}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                {isSending ? 'Sending...' : 'Send Tokens'}
              </Button>

              {sendToName && (
                <div className="text-sm">
                  {resolveName(sendToName) ? (
                    <div className="flex items-center gap-2 text-green-300">
                      <Check className="w-4 h-4" />
                      <span>Name resolved successfully</span>
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
              {registeredNames.slice(-5).map((name) => (
                <div key={name.name} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{name.name}</p>
                    <p className="text-purple-300 text-sm font-mono">{name.address.substring(0, 10)}...{name.address.substring(32)}</p>
                  </div>
                  <Badge variant="outline" className="border-purple-400 text-purple-200">
                    Active
                  </Badge>
                </div>
              ))}
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
