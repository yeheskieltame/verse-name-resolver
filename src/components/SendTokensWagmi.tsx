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
    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Send className="w-5 h-5" />
          Send {currencySymbol}
        </CardTitle>
        <CardDescription className="text-gray-300">
          Send {currencySymbol} to a .sw name or Ethereum address
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-gray-300">Recipient (.sw name or address)</label>
          <div className="relative">
            <Input
              placeholder="alice.sw or 0x..."
              value={sendToName}
              onChange={(e) => setSendToName(e.target.value)}
              className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
            />
            {sendToName && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isResolving ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
                ) : isValidRecipient() ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <X className="w-4 h-4 text-red-400" />
                )}
              </div>
            )}
          </div>
          {sendToName && getRecipientDisplay() && (
            <p className="text-xs text-gray-400">
              {isValidRecipient() ? '✓' : '✗'} Resolves to: {getRecipientDisplay()}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-300">Amount ({currencySymbol})</label>
          <Input
            type="number"
            step="0.001"
            placeholder="0.001"
            value={sendAmount}
            onChange={(e) => setSendAmount(e.target.value)}
            className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
          />
        </div>

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
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
        >
          {isSending || isConfirming ? 
            'Sending...' : 
            `Send ${sendAmount || '0'} ${currencySymbol}`
          }
        </Button>
      </CardContent>
    </Card>
  );
};
