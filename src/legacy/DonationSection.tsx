import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Heart, Copy, ExternalLink } from 'lucide-react';
import { ethers } from 'ethers';
import { useWeb3 } from './useWeb3';
import { ETHEREUM_NETWORK } from '@/contracts/swnsContract';

interface DonationAddress {
  network: string;
  address: string;
  icon: string;
}

const donationAddresses: DonationAddress[] = [
  {
    network: 'EVM (Ethereum/BSC/Polygon)',
    address: '0x86979D26A14e17CF2E719dcB369d559f3ad41057',
    icon: '⚡'
  },
  {
    network: 'Solana',
    address: 'GXysRwrHscn6qoPpw3UYPHPxvcnHQ9YWsmpZwjhgU8bW',
    icon: '☀️'
  }
];

export const DonationSection = () => {
  const { signer, isConnected, balance, chainId } = useWeb3();
  const [selectedToken, setSelectedToken] = useState('eth');
  const [donationAmount, setDonationAmount] = useState('');
  const [isDonating, setIsDonating] = useState(false);
  const [ethBalance, setEthBalance] = useState('0');

  // Get ETH balance on mainnet
  const getEthBalance = async () => {
    if (isConnected && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        if (accounts.length > 0) {
          // Check if we're on mainnet, if not switch temporarily to check balance
          const currentNetwork = await provider.getNetwork();
          if (Number(currentNetwork.chainId) === 1) {
            const balance = await provider.getBalance(accounts[0]);
            setEthBalance(ethers.formatEther(balance));
          } else {
            // Switch to mainnet temporarily to get balance
            try {
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x1' }], // Mainnet
              });
              const balance = await provider.getBalance(accounts[0]);
              setEthBalance(ethers.formatEther(balance));
            } catch (error) {
              console.log('Could not switch to mainnet to check balance');
              setEthBalance('0');
            }
          }
        }
      } catch (error) {
        console.error('Error getting ETH balance:', error);
        setEthBalance('0');
      }
    }
  };

  // Switch to Ethereum Mainnet
  const switchToMainnet = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask Required",
        description: "Please install MetaMask to donate with ETH",
        variant: "destructive"
      });
      return false;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }], // Mainnet
      });
      
      toast({
        title: "Switched to Mainnet! 🎉",
        description: "You're now on Ethereum Mainnet for donation",
      });
      
      // Refresh balance after switch
      setTimeout(getEthBalance, 1000);
      return true;
    } catch (error: any) {
      console.error('Error switching to mainnet:', error);
      toast({
        title: "Network Switch Failed",
        description: "Could not switch to Ethereum Mainnet",
        variant: "destructive"
      });
      return false;
    }
  };

  // Load ETH balance when connected
  useEffect(() => {
    if (isConnected) {
      getEthBalance();
    }
  }, [isConnected]);

  const copyToClipboard = (text: string, network: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Address Copied!",
      description: `${network} address copied to clipboard`,
    });
  };

  const handleDonate = async () => {
    if (!isConnected || !signer) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to donate",
        variant: "destructive"
      });
      return;
    }

    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid donation amount",
        variant: "destructive"
      });
      return;
    }

    // Check if we're on mainnet, if not switch first
    if (chainId !== 1) {
      const switched = await switchToMainnet();
      if (!switched) return;
    }

    setIsDonating(true);

    try {
      const amount = ethers.parseEther(donationAmount);
      const evmAddress = donationAddresses[0].address;

      // Create a new provider for mainnet to ensure we're on the right network
      const provider = new ethers.BrowserProvider(window.ethereum);
      const mainnetSigner = await provider.getSigner();

      const tx = await mainnetSigner.sendTransaction({
        to: evmAddress,
        value: amount
      });

      toast({
        title: "Donation Sent! 💝",
        description: "Thank you for your generous donation!",
      });

      await tx.wait();
      
      toast({
        title: "Donation Confirmed! 🎉",
        description: `Successfully donated ${donationAmount} ETH`,
      });

      setDonationAmount('');
      // Refresh ETH balance
      getEthBalance();
      
    } catch (error: any) {
      console.error('Donation error:', error);
      toast({
        title: "Donation Failed",
        description: error.reason || error.message || "Transaction failed",
        variant: "destructive"
      });
    } finally {
      setIsDonating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-12">
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader className="text-center">
          <CardTitle className="text-white flex items-center justify-center gap-2 text-2xl">
            <Heart className="w-6 h-6 text-red-400" />
            Support SmartVerse Development
          </CardTitle>
          <CardDescription className="text-purple-200">
            Help us build the future of decentralized naming systems
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Donation Addresses */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-lg">Donation Addresses</h3>
            {donationAddresses.map((addr, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{addr.icon}</span>
                    <div>
                      <p className="text-white font-medium">{addr.network}</p>
                      <p className="text-purple-300 text-sm font-mono break-all">
                        {addr.address}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(addr.address, addr.network)}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Donation Form */}
          <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-6 border border-white/20">
            <h3 className="text-white font-semibold text-lg mb-4">Quick Donation (Ethereum Mainnet)</h3>
            <div className="space-y-4">
              <div>
                <label className="text-purple-200 text-sm mb-2 block">Token</label>
                <Select value={selectedToken} onValueChange={setSelectedToken}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eth">ETH (Ethereum Mainnet)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-purple-200 text-sm mb-2 block">Amount</label>
                <Input
                  type="number"
                  step="0.001"
                  placeholder="Enter donation amount"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-purple-300"
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-purple-300 text-xs">
                    ETH Balance: {parseFloat(ethBalance).toFixed(4)} ETH
                  </p>
                  {chainId !== 1 && (
                    <Button
                      onClick={switchToMainnet}
                      variant="outline"
                      size="sm"
                      className="bg-blue-500/20 border-blue-400/50 text-blue-300 hover:bg-blue-500/30 text-xs"
                    >
                      Switch to Mainnet
                    </Button>
                  )}
                </div>
                {chainId !== 1 && (
                  <p className="text-yellow-400 text-xs mt-1">
                    ⚠️ You need to be on Ethereum Mainnet to donate with ETH
                  </p>
                )}
              </div>

              <Button
                onClick={handleDonate}
                disabled={!isConnected || isDonating || !donationAmount}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-3"
              >
                {isDonating ? (
                  'Sending Donation...'
                ) : (
                  <>
                    <Heart className="w-4 h-4 mr-2" />
                    Donate {donationAmount && `${donationAmount} ETH`}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Thank You Message */}
          <div className="text-center space-y-2">
            <p className="text-purple-200 text-sm">
              🙏 Thank you for supporting open-source development!
            </p>
            <p className="text-purple-300 text-xs">
              Your donations help us maintain and improve SmartVerse for everyone.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
