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
          className="bg-blue-500 hover:bg-blue-600 text-white border-blue-400"
        >
          <Plus className="w-4 h-4 mr-2" />
          Import Token
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Import Custom Token
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Token Address Input */}
          <div className="space-y-2">
            <Label className="text-white">Token Contract Address</Label>
            <Input
              placeholder="0x..."
              value={tokenAddress}
              onChange={(e) => handleAddressChange(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
            />
            <p className="text-xs text-gray-400">
              Enter the contract address of the ERC20 token you want to add
            </p>
          </div>

          {/* Validate Button */}
          <Button
            onClick={validateAndFetchToken}
            disabled={!tokenAddress.trim() || isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Fetching Token Info...
              </>
            ) : (
              'Validate Token'
            )}
          </Button>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Token Info Display */}
          {tokenInfo && (
            <div className="space-y-3">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Token information fetched successfully!
                </AlertDescription>
              </Alert>
              
              <div className="bg-gray-800 p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Name:</span>
                  <span className="text-white font-medium">{tokenInfo.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Symbol:</span>
                  <Badge variant="outline" className="text-white border-gray-600">
                    {tokenInfo.symbol}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Decimals:</span>
                  <span className="text-white">{tokenInfo.decimals}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Your Balance:</span>
                  <span className="text-white font-medium">
                    {formatUnits(tokenInfo.balance, tokenInfo.decimals)} {tokenInfo.symbol}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleImportToken}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Import This Token
              </Button>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-900/50 p-3 rounded-lg">
            <h4 className="text-blue-300 font-medium text-sm mb-1">Important:</h4>
            <ul className="text-xs text-blue-200 space-y-1">
              <li>• Only import tokens you trust</li>
              <li>• Verify the contract address from official sources</li>
              <li>• Imported tokens are only stored for this session</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
