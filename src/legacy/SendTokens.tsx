
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Send, Check, X } from 'lucide-react';
import { SWNSService } from './swnsService';
import { ethers } from 'ethers';
import { getNetworkConfig, ETHEREUM_NETWORK } from '@/contracts/swnsContract';

interface SendTokensProps {
  swnsService: SWNSService | null;
  isConnected: boolean;
  signer: ethers.JsonRpcSigner | null;
  updateBalance: () => Promise<void>;
  chainId: number | null;
}

export const SendTokens = ({ 
  swnsService, 
  isConnected, 
  signer, 
  updateBalance,
  chainId 
}: SendTokensProps) => {
  const [sendToName, setSendToName] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  
  const currentNetwork = chainId ? getNetworkConfig(chainId) : null;
  const currencySymbol = currentNetwork?.symbol || 'ETH';
  const isMainnet = chainId === ETHEREUM_NETWORK.chainId;

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
          description: `${sendToName}.sw is not registered`,
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
        description: `Sent ${sendAmount} ${currencySymbol} to ${sendToName}.sw`,
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

  // Auto-resolve name when input changes
  useEffect(() => {
    const checkResolution = async () => {
      if (sendToName && swnsService) {
        setIsResolving(true);
        const address = await resolveName(sendToName);
        setResolvedAddress(address);
        setIsResolving(false);
      } else {
        setResolvedAddress(null);
      }
    };
    
    checkResolution();
  }, [sendToName, swnsService]);

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Send className="w-5 h-5" />
          Send {currencySymbol} Tokens
        </CardTitle>
        <CardDescription className="text-purple-200">
          Send crypto using .sw names
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isMainnet && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-300">
              <span className="text-sm font-medium">⚠️ SWNS Not Available on Mainnet</span>
            </div>
            <p className="text-yellow-200 text-xs mt-1">
              Please switch to Taranium Testnet or Sepolia to send tokens using .sw names.
            </p>
          </div>
        )}
        
        <div className="relative">
          <Input
            placeholder="Recipient username (e.g., friend)"
            value={sendToName}
            onChange={(e) => setSendToName(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-purple-300 pr-10"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-300 text-sm">
            .sw
          </span>
        </div>
        
        <Input
          type="number"
          step="0.001"
          placeholder={`Amount in ${currencySymbol}`}
          value={sendAmount}
          onChange={(e) => setSendAmount(e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder:text-purple-300"
        />
        
        <Button 
          onClick={sendTokens} 
          disabled={!sendToName || !sendAmount || isSending || !isConnected || isMainnet}
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
  );
};
