import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Send, Check, X } from 'lucide-react';
import { SWNSServiceWagmi } from '@/services/swnsServiceWagmi';
import { parseEther, formatEther, isAddress } from 'viem';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { getNetworkConfig, ETHEREUM_NETWORK } from '@/contracts/swnsContract';

interface SendTokensWagmiProps {
  swnsService: SWNSServiceWagmi | null;
  updateBalance: () => Promise<void>;
  chainId: number;
}

export const SendTokensWagmi = ({ 
  swnsService, 
  updateBalance,
  chainId 
}: SendTokensWagmiProps) => {
  const { isConnected } = useAccount();
  const [sendToName, setSendToName] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  
  const currentNetwork = getNetworkConfig(chainId);
  const currencySymbol = currentNetwork?.symbol || 'ETH';
  const isMainnet = chainId === ETHEREUM_NETWORK.chainId;

  // Send transaction hook
  const { sendTransaction, data: txHash, isPending: isSending } = useSendTransaction();

  // Watch for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Handle successful transaction
  useEffect(() => {
    if (isConfirmed && txHash) {
      toast({
        title: "Transfer Successful! 🎉",
        description: `Sent ${sendAmount} ${currencySymbol} to ${sendToName}`,
      });
      
      setSendToName('');
      setSendAmount('');
      setResolvedAddress(null);
      updateBalance();
    }
  }, [isConfirmed, txHash, sendAmount, currencySymbol, sendToName, updateBalance]);

  const resolveName = async (name: string): Promise<string | null> => {
    if (!swnsService) return null;
    return await swnsService.resolveName(name);
  };

  // Auto-resolve name when typing
  useEffect(() => {
    const resolveTimeout = setTimeout(async () => {
      if (sendToName.trim() && sendToName.includes('.sw')) {
        setIsResolving(true);
        try {
          const address = await resolveName(sendToName);
          setResolvedAddress(address);
        } catch (error) {
          console.error('Resolution error:', error);
          setResolvedAddress(null);
        } finally {
          setIsResolving(false);
        }
      } else if (isAddress(sendToName)) {
        setResolvedAddress(sendToName);
      } else {
        setResolvedAddress(null);
      }
    }, 500);

    return () => clearTimeout(resolveTimeout);
  }, [sendToName, swnsService]);

  const sendTokens = async () => {
    if (!isConnected) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    if (!sendToName.trim() || !sendAmount.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter recipient and amount",
        variant: "destructive"
      });
      return;
    }

    let toAddress: string;

    // Determine recipient address
    if (sendToName.includes('.sw')) {
      if (!resolvedAddress) {
        toast({
          title: "Cannot Resolve Name",
          description: "Unable to resolve the .sw name to an address",
          variant: "destructive"
        });
        return;
      }
      toAddress = resolvedAddress;
    } else if (isAddress(sendToName)) {
      toAddress = sendToName;
    } else {
      toast({
        title: "Invalid Recipient",
        description: "Please enter a valid .sw name or Ethereum address",
        variant: "destructive"
      });
      return;
    }

    try {
      const value = parseEther(sendAmount);

      await sendTransaction({
        to: toAddress as `0x${string}`,
        value,
      });

      toast({
        title: "Transaction Sent! ⏳",
        description: "Waiting for confirmation...",
      });
      
    } catch (error: any) {
      console.error('Send error:', error);
      toast({
        title: "Transfer Failed",
        description: error.message || "Transaction failed",
        variant: "destructive"
      });
    }
  };

  const getRecipientDisplay = () => {
    if (sendToName.includes('.sw')) {
      if (isResolving) {
        return "Resolving...";
      } else if (resolvedAddress) {
        return `${resolvedAddress.slice(0, 6)}...${resolvedAddress.slice(-4)}`;
      } else {
        return "Name not found";
      }
    } else if (isAddress(sendToName)) {
      return `${sendToName.slice(0, 6)}...${sendToName.slice(-4)}`;
    }
    return "";
  };

  const isValidRecipient = () => {
    if (sendToName.includes('.sw')) {
      return !!resolvedAddress;
    }
    return isAddress(sendToName);
  };

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 max-w-4xl mx-auto hover:bg-white/15 transition-all duration-300">
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl lg:text-2xl">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          Send {currencySymbol}
        </CardTitle>
        <CardDescription className="text-gray-300 text-sm sm:text-base leading-relaxed">
          Send {currencySymbol} to a <span className="text-blue-300 font-mono">.sw</span> name or Ethereum address
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 sm:space-y-8">
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          {/* Left Column - Form */}
          <div className="space-y-4 sm:space-y-6">
            {/* Recipient Input */}
            <div className="space-y-3">
              <label className="text-sm sm:text-base text-gray-300 font-medium block">
                Recipient
              </label>
              <div className="relative">
                <Input
                  placeholder="alice.sw or 0x1234..."
                  value={sendToName}
                  onChange={(e) => setSendToName(e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 pr-12 h-11 sm:h-12 text-base focus:ring-2 focus:ring-blue-400/50"
                />
                {sendToName && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isResolving ? (
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
                    ) : isValidRecipient() ? (
                      <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-green-400" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center">
                        <X className="w-4 h-4 text-red-400" />
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Resolution Display */}
              {sendToName && getRecipientDisplay() && (
                <div className={`p-3 rounded-lg border ${
                  isValidRecipient() 
                    ? 'bg-green-500/10 border-green-400/30' 
                    : 'bg-red-500/10 border-red-400/30'
                }`}>
                  <div className="flex items-center gap-2">
                    {isValidRecipient() ? (
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                    )}
                    <span className={`text-sm font-medium ${
                      isValidRecipient() ? 'text-green-200' : 'text-red-200'
                    }`}>
                      {isValidRecipient() ? 'Resolved to:' : 'Could not resolve:'}
                    </span>
                  </div>
                  <code className={`text-xs block mt-1 break-all ${
                    isValidRecipient() ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {getRecipientDisplay()}
                  </code>
                </div>
              )}
            </div>

            {/* Amount Input */}
            <div className="space-y-3">
              <label className="text-sm sm:text-base text-gray-300 font-medium block">
                Amount ({currencySymbol})
              </label>
              <Input
                type="number"
                step="0.001"
                placeholder="0.001"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 h-11 sm:h-12 text-base focus:ring-2 focus:ring-blue-400/50"
              />
            </div>

            {/* Send Button */}
            <Button 
              onClick={sendTokens}
              disabled={
                isSending || 
                isConfirming || 
                !isConnected || 
                !sendToName.trim() || 
                !sendAmount.trim() || 
                !isValidRecipient()
              }
              size="lg"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 h-12 sm:h-14 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isSending || isConfirming ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                `Send ${sendAmount || '0'} ${currencySymbol}`
              )}
            </Button>

            {!isConnected && (
              <p className="text-center text-gray-400 text-xs sm:text-sm">
                Connect your wallet to send tokens
              </p>
            )}
          </div>

          {/* Right Column - Info & Examples */}
          <div className="space-y-4 sm:space-y-6">
            {/* How it Works */}
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-400/20 rounded-xl p-4 sm:p-6">
              <h3 className="text-white font-semibold text-base sm:text-lg mb-3 sm:mb-4">
                How it works
              </h3>
              <div className="space-y-3 text-sm sm:text-base text-gray-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-400 text-xs font-bold">1</span>
                  </div>
                  <p>Enter a <span className="text-blue-300 font-mono">.sw</span> name or Ethereum address</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-400 text-xs font-bold">2</span>
                  </div>
                  <p>Specify the amount of {currencySymbol} to send</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-400 text-xs font-bold">3</span>
                  </div>
                  <p>Confirm the transaction in your wallet</p>
                </div>
              </div>
            </div>

            {/* Examples */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6">
              <h3 className="text-white font-semibold text-base sm:text-lg mb-3 sm:mb-4">
                Examples
              </h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Smart name:</p>
                  <code className="text-blue-300 bg-black/20 px-2 py-1 rounded">alice.sw</code>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Ethereum address:</p>
                  <code className="text-green-300 bg-black/20 px-2 py-1 rounded text-xs break-all">
                    0x742d35Cc6AB99A72D3D5...
                  </code>
                </div>
              </div>
            </div>

            {/* Status Indicator */}
            {sendToName && (
              <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                <h4 className="text-white font-medium text-sm mb-2">Status</h4>
                <div className="flex items-center gap-2">
                  {isResolving ? (
                    <>
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      <span className="text-yellow-300 text-sm">Resolving name...</span>
                    </>
                  ) : isValidRecipient() ? (
                    <>
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-green-300 text-sm">Ready to send</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span className="text-red-300 text-sm">Invalid recipient</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
