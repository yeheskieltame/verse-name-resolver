import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { Loader2, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { useAccount, useWalletClient, useChainId, useBalance } from 'wagmi';
import { parseEther, formatEther, type Address } from 'viem';
import { crossChainNameService, CrossChainNameService } from "@/services/crossChainNameService";

export const CrossChainSendTokens = () => {
  const { address: userAddress, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const { data: balance } = useBalance({ address: userAddress });
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<Address | null>(null);
  const [resolutionError, setResolutionError] = useState<string | null>(null);

  const networkInfo = CrossChainNameService.getNetworkInfo(chainId);

  // Resolve nama recipient
  const handleResolveRecipient = async () => {
    if (!recipient.trim()) {
      setResolvedAddress(null);
      setResolutionError(null);
      return;
    }

    setIsResolving(true);
    setResolutionError(null);
    
    try {
      // Jika input adalah alamat wallet langsung (0x...)
      if (recipient.startsWith('0x') && recipient.length === 42) {
        setResolvedAddress(recipient as Address);
        setIsResolving(false);
        return;
      }

      // Jika input adalah nama (.sw)
      const address = await crossChainNameService.resolveNameToAddress(recipient);
      
      if (address) {
        setResolvedAddress(address);
        toast({
          title: "Name Resolved! 🎯",
          description: `${recipient} → ${address}`,
        });
      } else {
        setResolutionError(`Name "${recipient}" not found in the SmartVerse system`);
        setResolvedAddress(null);
      }
    } catch (error) {
      console.error('Resolution error:', error);
      setResolutionError('Error resolving name. Please try again.');
      setResolvedAddress(null);
    } finally {
      setIsResolving(false);
    }
  };

  // Handle perubahan input recipient
  const handleRecipientChange = (value: string) => {
    setRecipient(value);
    setResolvedAddress(null);
    setResolutionError(null);
  };

  // Kirim transaksi
  const handleSendTransaction = async () => {
    if (!walletClient || !resolvedAddress || !amount) return;

    setIsSending(true);
    
    try {
      const amountWei = parseEther(amount);
      
      // Validasi balance
      if (balance && amountWei > balance.value) {
        throw new Error('Insufficient balance');
      }

      // Kirim transaksi di jaringan yang sedang aktif
      console.log(`💸 Sending ${amount} ${networkInfo.name} native token to ${resolvedAddress}`);
      
      const txHash = await walletClient.sendTransaction({
        to: resolvedAddress,
        value: amountWei,
      } as any);

      toast({
        title: "Transaction Sent! 🚀",
        description: `Sent ${amount} ${balance?.symbol || 'ETH'} to ${recipient}`,
      });

      console.log(`✅ Transaction sent on ${networkInfo.name}: ${txHash}`);
      
      // Reset form
      setRecipient('');
      setAmount('');
      setResolvedAddress(null);
      setResolutionError(null);
      
    } catch (error: any) {
      console.error('Transaction error:', error);
      toast({
        title: "Transaction Failed",
        description: error.message || "An error occurred while sending the transaction",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🌐 Cross-Chain Send</CardTitle>
          <CardDescription>
            Send tokens to anyone using their SmartVerse name
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to use this feature
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🌐 Cross-Chain Send
          <Badge variant="outline" className="ml-auto">
            {networkInfo.name}
          </Badge>
        </CardTitle>
        <CardDescription>
          Send tokens to anyone using their SmartVerse name (.sw) - works across all networks!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Info */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Current Network:</span>
            <Badge variant={networkInfo.isHub ? "default" : "secondary"}>
              {networkInfo.name}
            </Badge>
            <span className="text-muted-foreground">
              {networkInfo.isHub ? "• Hub Chain" : "• Transaction Chain"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {networkInfo.isHub 
              ? "You're on the Hub Chain - names are resolved and transactions happen here"
              : "You're on a Transaction Chain - names are resolved from Sepolia, transactions happen here"
            }
          </p>
        </div>

        {/* Recipient Input */}
        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient</Label>
          <div className="flex gap-2">
            <Input
              id="recipient"
              placeholder="Enter name (e.g., alice.sw) or address (0x...)"
              value={recipient}
              onChange={(e) => handleRecipientChange(e.target.value)}
              onBlur={handleResolveRecipient}
            />
            <Button 
              variant="outline" 
              onClick={handleResolveRecipient}
              disabled={!recipient.trim() || isResolving}
            >
              {isResolving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Resolve"
              )}
            </Button>
          </div>
          
          {/* Resolution Status */}
          {resolvedAddress && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>✅ Resolved:</strong> {resolvedAddress}
              </AlertDescription>
            </Alert>
          )}
          
          {resolutionError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {resolutionError}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <div className="flex gap-2">
            <Input
              id="amount"
              type="number"
              step="0.001"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="flex items-center px-3 bg-muted rounded-md">
              <span className="text-sm font-medium">
                {balance?.symbol || 'ETH'}
              </span>
            </div>
          </div>
          {balance && (
            <p className="text-xs text-muted-foreground">
              Balance: {formatEther(balance.value)} {balance.symbol}
            </p>
          )}
        </div>

        {/* Send Button */}
        <Button 
          onClick={handleSendTransaction}
          disabled={!resolvedAddress || !amount || isSending}
          className="w-full"
        >
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send {amount} {balance?.symbol || 'ETH'}
            </>
          )}
        </Button>

        {/* Info */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-1">How it works:</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Names are resolved from Sepolia (Hub Chain) automatically</li>
            <li>• Transactions happen on your current network ({networkInfo.name})</li>
            <li>• You can send to any .sw name regardless of your current network</li>
            <li>• Names are stored as NFTs on the Hub Chain for security</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
