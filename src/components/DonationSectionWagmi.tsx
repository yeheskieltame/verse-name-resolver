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
    <Card className="bg-white border border-gray-200 shadow-lg max-w-5xl mx-auto hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="text-gray-900 flex items-center gap-2 text-lg sm:text-xl lg:text-2xl">
          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          Support the Project
        </CardTitle>
        <CardDescription className="text-gray-600 text-sm sm:text-base leading-relaxed">
          Help us continue building amazing web3 tools for the community
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 sm:space-y-8 lg:space-y-10">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
          {/* Left Column - Quick Donation */}
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <h3 className="text-white font-semibold text-base sm:text-lg">Quick Donation</h3>
              <p className="text-gray-600 text-sm sm:text-base">Send ETH directly from your wallet</p>
            </div>
            
            {/* Network Info */}
            <div className="bg-purple-500/10 border border-purple-400/20 rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-6 h-6 bg-purple-500/30 rounded-full flex items-center justify-center">
                  <span className="text-purple-300 text-xs font-bold">ⓘ</span>
                </div>
                <h4 className="text-white font-medium text-sm sm:text-base">Current Network</h4>
              </div>
              <p className="text-purple-200 text-sm sm:text-base">
                {isOnMainnet ? 'Ethereum Mainnet' : `Chain ID: ${chainId}`}
              </p>
              {!isOnMainnet && (
                <p className="text-yellow-300 text-xs sm:text-sm mt-2 flex items-center gap-2">
                  <span>💡</span>
                  <span>Switch to Ethereum Mainnet for ETH donations</span>
                </p>
              )}
            </div>

            {/* Balance Info */}
            {isConnected && (
              <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 bg-blue-500/30 rounded-full flex items-center justify-center">
                    <span className="text-blue-300 text-xs font-bold">$</span>
                  </div>
                  <h4 className="text-white font-medium text-sm sm:text-base">Your Balances</h4>
                </div>
                <div className="space-y-2 text-sm sm:text-base">
                  <div className="flex justify-between">
                    <span className="text-blue-200">Current Network:</span>
                    <span className="text-white font-mono">{parseFloat(currentBalance).toFixed(4)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Ethereum Mainnet:</span>
                    <span className="text-gray-900 font-mono">{parseFloat(mainnetBalance).toFixed(4)} ETH</span>
                  </div>
                </div>
              </div>
            )}

            {/* Donation Form */}
            <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 sm:p-6 space-y-4">
              <div className="space-y-3">
                <label className="text-sm sm:text-base text-gray-900 font-medium block">
                  Donation Amount (ETH)
                </label>
                <Input
                  type="number"
                  step="0.001"
                  placeholder="0.01"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 h-11 sm:h-12 text-base focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <Button 
                onClick={handleDonate}
                disabled={isDonating || isConfirming || !isConnected || !donationAmount}
                size="lg"
                className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white hover:from-pink-600 hover:to-red-600 h-12 sm:h-14 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isDonating || isConfirming ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    <span>Donate {donationAmount || '0'} ETH</span>
                  </div>
                )}
              </Button>
              
              {!isConnected && (
                <p className="text-center text-gray-600 text-xs sm:text-sm">
                  Connect your wallet to make donations
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Direct Addresses */}
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <h3 className="text-gray-900 font-semibold text-base sm:text-lg">Direct Transfer</h3>
              <p className="text-gray-600 text-sm sm:text-base">Send directly to our addresses</p>
            </div>
            
            {donationAddresses.map((donation, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 hover:bg-gray-50 transition-colors shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-lg text-white">
                      {donation.icon}
                    </div>
                    <div>
                      <span className="text-gray-900 font-medium text-sm sm:text-base block">{donation.network}</span>
                      <span className="text-gray-500 text-xs">Blockchain network</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openExplorer(donation.address, donation.network)}
                    className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 self-start sm:self-center"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="ml-2 hidden sm:inline">View</span>
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-gray-600 text-xs mb-2">Address:</p>
                    <code className="text-gray-800 text-xs sm:text-sm break-all leading-relaxed block font-mono">
                      {donation.address}
                    </code>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(donation.address, donation.network)}
                    className="w-full border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                  >
                    {copiedAddress === donation.address ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-xs">✓</span>
                        </div>
                        <span className="text-green-600">Copied!</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Copy className="w-4 h-4" />
                        <span>Copy Address</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Thank You Message */}
        <div className="text-center pt-6 sm:pt-8 border-t border-gray-200">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-gray-200 rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="text-gray-900 font-semibold text-base sm:text-lg">Thank You!</span>
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
              Every donation helps us build better tools for the community and advance the web3 ecosystem. 
              Your support means the world to us! 🙏
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
