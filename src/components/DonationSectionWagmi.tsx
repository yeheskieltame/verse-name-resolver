import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Heart, Copy, ExternalLink } from 'lucide-react';
import { parseEther, formatEther } from 'viem';
import { useAccount, useBalance, useSendTransaction, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
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

export const DonationSectionWagmi = () => {
  const { isConnected, address, chainId } = useAccount();
  const [selectedToken, setSelectedToken] = useState('eth');
  const [donationAmount, setDonationAmount] = useState('');
  const [copiedAddress, setCopiedAddress] = useState('');
  
  // Get current chain balance
  const { data: balance } = useBalance({
    address,
  });

  // Get ETH mainnet balance
  const { data: ethBalance } = useBalance({
    address,
    chainId: 1, // Ethereum mainnet
  });

  // Switch chain hook
  const { switchChain } = useSwitchChain();

  // Send transaction hook
  const { sendTransaction, data: txHash, isPending: isDonating } = useSendTransaction();

  // Watch for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Handle successful donation
  useEffect(() => {
    if (isConfirmed && txHash) {
      toast({
        title: "Thank You! 💖",
        description: `Your donation of ${donationAmount} ETH has been sent successfully!`,
      });
      
      setDonationAmount('');
    }
  }, [isConfirmed, txHash, donationAmount]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
      setTimeout(() => setCopiedAddress(''), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleDonate = async () => {
    if (!isConnected) {
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

    // Switch to mainnet if not already there
    if (chainId !== 1) {
      try {
        await switchChain({ chainId: 1 });
      } catch (error) {
        console.error('Failed to switch to mainnet:', error);
        toast({
          title: "Network Switch Failed",
          description: "Please switch to Ethereum Mainnet manually",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      const value = parseEther(donationAmount);
      const donationAddress = donationAddresses[0].address;

      await sendTransaction({
        to: donationAddress as `0x${string}`,
        value,
      });

      toast({
        title: "Transaction Sent! ⏳",
        description: "Processing your donation...",
      });
      
    } catch (error: any) {
      console.error('Donation error:', error);
      toast({
        title: "Donation Failed",
        description: error.message || "Transaction failed",
        variant: "destructive"
      });
    }
  };

  const openExplorer = (address: string, network: string) => {
    if (network.includes('EVM')) {
      window.open(`https://etherscan.io/address/${address}`, '_blank');
    } else if (network.includes('Solana')) {
      window.open(`https://explorer.solana.com/address/${address}`, '_blank');
    }
  };

  const currentBalance = balance ? formatEther(balance.value) : '0';
  const mainnetBalance = ethBalance ? formatEther(ethBalance.value) : '0';
  const isOnMainnet = chainId === 1;

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-400" />
          Support the Project
        </CardTitle>
        <CardDescription className="text-gray-300">
          Help us continue building amazing web3 tools
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Network Info */}
        <div className="bg-purple-500/10 border border-purple-400/20 rounded-lg p-4">
          <h3 className="text-white font-medium mb-2">Current Network</h3>
          <p className="text-purple-200 text-sm">
            {isOnMainnet ? 'Ethereum Mainnet' : `Chain ID: ${chainId}`}
          </p>
          {!isOnMainnet && (
            <p className="text-yellow-300 text-xs mt-1">
              💡 Switch to Ethereum Mainnet for ETH donations
            </p>
          )}
        </div>

        {/* Balance Info */}
        {isConnected && (
          <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">Your Balances</h3>
            <div className="space-y-1 text-sm">
              <p className="text-blue-200">
                Current Network: {parseFloat(currentBalance).toFixed(4)} ETH
              </p>
              <p className="text-blue-200">
                Ethereum Mainnet: {parseFloat(mainnetBalance).toFixed(4)} ETH
              </p>
            </div>
          </div>
        )}

        {/* Donation Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Donation Amount (ETH)</label>
            <Input
              type="number"
              step="0.001"
              placeholder="0.01"
              value={donationAmount}
              onChange={(e) => setDonationAmount(e.target.value)}
              className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
            />
          </div>

          <Button 
            onClick={handleDonate}
            disabled={isDonating || isConfirming || !isConnected || !donationAmount}
            className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white hover:from-pink-600 hover:to-red-600"
          >
            {isDonating || isConfirming ? 
              'Processing...' : 
              `Donate ${donationAmount || '0'} ETH`
            }
          </Button>
        </div>

        {/* Donation Addresses */}
        <div className="space-y-4">
          <h3 className="text-white font-medium">Or send directly to:</h3>
          
          {donationAddresses.map((donation, index) => (
            <div key={index} className="bg-gray-500/10 border border-gray-400/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{donation.icon}</span>
                  <span className="text-white font-medium">{donation.network}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openExplorer(donation.address, donation.network)}
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50"
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-black/20 px-2 py-1 rounded text-xs text-gray-300 break-all">
                  {donation.address}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(donation.address, donation.network)}
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50"
                >
                  {copiedAddress === donation.address ? (
                    <span className="text-green-400">✓</span>
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center text-sm text-gray-400">
          <p>Every donation helps us build better tools for the community! 🙏</p>
        </div>
      </CardContent>
    </Card>
  );
};
