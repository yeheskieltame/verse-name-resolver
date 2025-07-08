import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { Loader2, Send, AlertCircle, CheckCircle, ArrowUpRight } from 'lucide-react';
import { useAccount, useWalletClient, useChainId } from 'wagmi';
import { parseEther, parseUnits, type Address, erc20Abi } from 'viem';
import { crossChainNameService, CrossChainNameService } from "@/services/crossChainNameService";
import { useTokenBalances, type Token } from '@/hooks/useTokenBalances';
import { TokenSelector } from './TokenSelector';

export const CrossChainSendTokens = () => {
  const { address: userAddress, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const { tokens, isLoading: isLoadingTokens } = useTokenBalances();
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<Address | null>(null);
  const [resolutionError, setResolutionError] = useState<string | null>(null);
  const [importedTokens, setImportedTokens] = useState<Token[]>([]);

  const networkInfo = CrossChainNameService.getNetworkInfo(chainId);

  // Combine default tokens with imported tokens
  const allTokens = [...tokens, ...importedTokens];

  // Handle imported token
  const handleTokenImported = (token: Token) => {
    setImportedTokens(prev => {
      // Check if token already exists to avoid duplicates
      const exists = prev.some(t => t.address.toLowerCase() === token.address.toLowerCase());
      if (exists) return prev;
      return [...prev, token];
    });
    
    toast({
      title: "Token Imported! 🎉",
      description: `${token.symbol} has been added to your token list`,
    });
  };

  // Auto-select first token when tokens are loaded
  useEffect(() => {
    if (allTokens.length > 0 && !selectedToken) {
      setSelectedToken(allTokens[0]);
    }
  }, [allTokens, selectedToken]);

  // Reset imported tokens when chain changes
  useEffect(() => {
    setImportedTokens([]);
  }, [chainId]);

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
        setResolutionError(`Name "${recipient}" not found. Make sure it's registered on the Hub Chain (Sepolia testnet).`);
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
    if (!walletClient || !resolvedAddress || !amount || !selectedToken) return;

    setIsSending(true);
    
    try {
      let txHash: string;
      
      if (selectedToken.isNative) {
        // Send native token
        const amountWei = parseEther(amount);
        
        // Validasi balance
        if (amountWei > selectedToken.balance) {
          throw new Error('Insufficient balance');
        }

        console.log(`💸 Sending ${amount} ${selectedToken.symbol} to ${resolvedAddress}`);
        
        txHash = await walletClient.sendTransaction({
          to: resolvedAddress,
          value: amountWei,
        } as any);
        
      } else {
        // Send ERC20 token
        const amountWei = parseUnits(amount, selectedToken.decimals);
        
        // Validasi balance
        if (amountWei > selectedToken.balance) {
          throw new Error('Insufficient balance');
        }

        console.log(`💸 Sending ${amount} ${selectedToken.symbol} to ${resolvedAddress}`);

        txHash = await walletClient.writeContract({
          address: selectedToken.address,
          abi: erc20Abi,
          functionName: 'transfer',
          args: [resolvedAddress, amountWei],
        } as any);
      }

      toast({
        title: "Transaction Sent! 🚀",
        description: `Sent ${amount} ${selectedToken.symbol} to ${recipient}`,
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

  // Quick amount buttons
  const handleQuickAmount = (percentage: number) => {
    if (!selectedToken) return;
    
    const balance = parseFloat(selectedToken.formattedBalance);
    const quickAmount = (balance * percentage / 100).toFixed(6);
    setAmount(quickAmount);
  };

  if (!isConnected) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Send className="w-5 h-5" />
            Cross-Chain Token Transfer
          </CardTitle>
          <CardDescription className="text-gray-600">
            Connect your wallet to send tokens using SmartVerse names
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-gray-900 flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-400 rounded-lg flex items-center justify-center">
            <Send className="w-4 h-4 text-white" />
          </div>
          Cross-Chain Token Transfer
        </CardTitle>
        <CardDescription className="text-gray-600">
          Send any token to .sw names on <strong>{networkInfo.name}</strong>
        </CardDescription>
        
        {/* Test Connection Button */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Username resolution via Hub Chain</span>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const result = await crossChainNameService.testConnection();
              toast({
                title: result.success ? "Connection Test ✅" : "Connection Test ❌",
                description: result.message,
                variant: result.success ? "default" : "destructive",
              });
            }}
            className="text-xs h-6 bg-gray-50 hover:bg-gray-100 text-gray-600"
          >
            Test Connection
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Token Selection */}
        <div className="space-y-2">
          <Label className="text-gray-900">Select Token</Label>
          <TokenSelector
            tokens={allTokens}
            selectedToken={selectedToken}
            onTokenSelect={setSelectedToken}
            onTokenImported={handleTokenImported}
            importedTokens={importedTokens}
            disabled={isLoadingTokens}
          />
          {isLoadingTokens && (
            <p className="text-xs text-gray-500 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading available tokens...
            </p>
          )}
        </div>

        {/* Recipient Input */}
        <div className="space-y-2">
          <Label htmlFor="recipient" className="text-gray-900">Send To</Label>
          <div className="flex gap-2">
            <Input
              id="recipient"
              placeholder="alice.sw or 0x123..."
              value={recipient}
              onChange={(e) => handleRecipientChange(e.target.value)}
              className="flex-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
            />
            <Button
              onClick={handleResolveRecipient}
              disabled={!recipient.trim() || isResolving}
              variant="outline"
              className="border-blue-400 bg-blue-500 hover:bg-blue-600 text-white font-medium"
            >
              {isResolving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Resolve'
              )}
            </Button>
          </div>
          <div className="text-xs text-gray-600">
            💡 Tip: Register a name first on Sepolia testnet, then use it here on any chain
          </div>
          
          {/* Resolution Status */}
          {resolvedAddress && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                ✅ Resolved to: <code className="font-mono text-sm bg-green-100 px-1 rounded">{resolvedAddress}</code>
              </AlertDescription>
            </Alert>
          )}
          
          {resolutionError && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">{resolutionError}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-gray-900">Amount</Label>
          <div className="flex gap-2">
            <Input
              id="amount"
              type="number"
              step="0.001"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
            />
            {selectedToken && (
              <div className="flex items-center px-3 bg-gray-50 rounded-md border border-gray-300">
                <span className="text-sm font-medium text-gray-900">
                  {selectedToken.symbol}
                </span>
              </div>
            )}
          </div>
          
          {selectedToken && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Balance: {parseFloat(selectedToken.formattedBalance).toFixed(4)} {selectedToken.symbol}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickAmount(25)}
                  className="text-xs h-6 px-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  25%
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickAmount(50)}
                  className="text-xs h-6 px-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  50%
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickAmount(100)}
                  className="text-xs h-6 px-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  Max
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Send Button */}
        <Button 
          onClick={handleSendTransaction}
          disabled={!resolvedAddress || !amount || !selectedToken || isSending}
          className="w-full bg-gradient-to-r from-green-400 to-blue-400 hover:from-green-500 hover:to-blue-500 text-white font-semibold"
        >
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send {amount} {selectedToken?.symbol || 'Token'}
            </>
          )}
        </Button>

        {/* Cross-Chain Info */}
        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 font-medium text-sm">Cross-Chain Transfer</span>
          </div>
          <p className="text-blue-200 text-xs leading-relaxed">
            This transaction will be executed on <strong>{networkInfo.name}</strong>. 
            The recipient name will be resolved from the Hub Chain automatically.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
