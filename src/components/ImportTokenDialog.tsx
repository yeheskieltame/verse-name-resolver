import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { useAccount, usePublicClient } from 'wagmi';
import { type Address, erc20Abi, formatUnits, isAddress } from 'viem';
import { type Token } from '@/hooks/useTokenBalances';

interface ImportTokenDialogProps {
  onTokenImported: (token: Token) => void;
}

export const ImportTokenDialog = ({ onTokenImported }: ImportTokenDialogProps) => {
  const { address: userAddress } = useAccount();
  const publicClient = usePublicClient();
  
  const [isOpen, setIsOpen] = useState(false);
  const [tokenAddress, setTokenAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<{
    name: string;
    symbol: string;
    decimals: number;
    balance: bigint;
  } | null>(null);

  const handleAddressChange = (value: string) => {
    setTokenAddress(value);
    setError(null);
    setTokenInfo(null);
  };

  const validateAndFetchToken = async () => {
    if (!tokenAddress.trim()) {
      setError('Please enter a token address');
      return;
    }

    if (!isAddress(tokenAddress)) {
      setError('Invalid token address format');
      return;
    }

    if (!publicClient || !userAddress) {
      setError('Wallet not connected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch token info
      const [name, symbol, decimals, balance] = await Promise.all([
        publicClient.readContract({
          address: tokenAddress as Address,
          abi: erc20Abi,
          functionName: 'name',
        }),
        publicClient.readContract({
          address: tokenAddress as Address,
          abi: erc20Abi,
          functionName: 'symbol',
        }),
        publicClient.readContract({
          address: tokenAddress as Address,
          abi: erc20Abi,
          functionName: 'decimals',
        }),
        publicClient.readContract({
          address: tokenAddress as Address,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [userAddress],
        }),
      ]);

      setTokenInfo({
        name: name as string,
        symbol: symbol as string,
        decimals: decimals as number,
        balance: balance as bigint,
      });

    } catch (error: any) {
      console.error('Error fetching token info:', error);
      
      if (error.message?.includes('execution reverted')) {
        setError('Invalid token contract or contract does not exist');
      } else if (error.message?.includes('network')) {
        setError('Network error. Please try again.');
      } else {
        setError('Failed to fetch token information. Make sure this is a valid ERC20 token.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportToken = () => {
    if (!tokenInfo) return;

    const token: Token = {
      address: tokenAddress as Address,
      name: tokenInfo.name,
      symbol: tokenInfo.symbol,
      decimals: tokenInfo.decimals,
      balance: tokenInfo.balance,
      formattedBalance: formatUnits(tokenInfo.balance, tokenInfo.decimals),
      isNative: false,
    };

    onTokenImported(token);
    
    // Reset state and close dialog
    setTokenAddress('');
    setTokenInfo(null);
    setError(null);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white border-amber-400"
        >
          <Plus className="w-4 h-4 mr-1" />
          Import
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md bg-white border-amber-200 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-gray-800">Import Custom Token</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tokenAddress" className="text-gray-700">Token Contract Address</Label>
            <Input
              id="tokenAddress"
              placeholder="0x..."
              value={tokenAddress}
              onChange={(e) => handleAddressChange(e.target.value)}
              className="bg-white border-amber-200 text-gray-700 placeholder:text-gray-400"
            />
          </div>

          <Button 
            onClick={validateAndFetchToken}
            disabled={!tokenAddress.trim() || isLoading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              'Validate Token'
            )}
          </Button>

          {/* Error Display */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {/* Token Info Display */}
          {tokenInfo && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  Token found and validated!
                </AlertDescription>
              </Alert>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Name:</span>
                  <span className="text-sm text-gray-800">{tokenInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Symbol:</span>
                  <span className="text-sm text-gray-800">{tokenInfo.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Decimals:</span>
                  <span className="text-sm text-gray-800">{tokenInfo.decimals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Your Balance:</span>
                  <span className="text-sm text-gray-800">{formatUnits(tokenInfo.balance, tokenInfo.decimals)}</span>
                </div>
              </div>

              <Button 
                onClick={handleImportToken}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
              >
                Import {tokenInfo.symbol}
              </Button>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> Only import tokens you trust. Imported tokens will be stored locally and may not be verified.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
