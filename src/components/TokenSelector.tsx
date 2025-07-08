import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, Coins, Search, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { type Token } from '@/hooks/useTokenBalances';
import { ImportTokenDialog } from './ImportTokenDialog';

interface TokenSelectorProps {
  tokens: Token[];
  selectedToken: Token | null;
  onTokenSelect: (token: Token) => void;
  onTokenImported?: (token: Token) => void;
  disabled?: boolean;
  importedTokens?: Token[];
}

export const TokenSelector = ({ tokens, selectedToken, onTokenSelect, onTokenImported, disabled, importedTokens = [] }: TokenSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTokens = tokens.filter(token =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTokenSelect = (token: Token) => {
    onTokenSelect(token);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleTokenImported = (token: Token) => {
    if (onTokenImported) {
      onTokenImported(token);
    }
    // Also auto-select the imported token
    onTokenSelect(token);
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    if (num < 1) return num.toFixed(4);
    if (num < 100) return num.toFixed(2);
    return num.toFixed(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between h-auto py-3 px-4 bg-white/90 hover:bg-white border-amber-200 hover:border-amber-300 text-gray-700"
          disabled={disabled}
        >
          {selectedToken ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
                <Coins className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">{selectedToken.symbol}</span>
                  {selectedToken.isNative && (
                    <Badge variant="outline" className="text-xs border-amber-400/50 text-amber-600">
                      Native
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  Balance: {formatBalance(selectedToken.formattedBalance)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <Coins className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-gray-500">Select Token</span>
            </div>
          )}
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md bg-white border-amber-200 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-gray-800 flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Select Token
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-amber-200 text-gray-700"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-gray-100 text-gray-500"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Token List */}
          <ScrollArea className="h-80">
            <div className="space-y-2">
              {filteredTokens.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? 'No tokens found' : 'No tokens available'}
                </div>
              ) : (
                filteredTokens.map((token) => (
                  <Card
                    key={`${token.address}-${token.symbol}`}
                    onClick={() => handleTokenSelect(token)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors bg-white border-amber-200 hover:border-amber-300"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
                            <Coins className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800">{token.symbol}</span>
                              {token.isNative && (
                                <Badge variant="outline" className="text-xs border-amber-400/50 text-amber-600">
                                  Native
                                </Badge>
                              )}
                              {importedTokens.some(t => t.address.toLowerCase() === token.address.toLowerCase()) && (
                                <Badge variant="outline" className="text-xs border-blue-400/50 text-blue-600">
                                  Imported
                                </Badge>
                              )}
                            </div>
                            <span className="text-sm text-gray-600">{token.name}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-800">{formatBalance(token.formattedBalance)}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Import Token Section */}
          <div className="pt-4">
            <Separator className="bg-amber-200" />
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-800">Can't find your token?</h4>
                  <p className="text-sm text-gray-600">Import a custom token by contract address</p>
                </div>
                <ImportTokenDialog onTokenImported={handleTokenImported} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>
                Showing {filteredTokens.length} tokens
                {importedTokens.length > 0 && (
                  <span className="text-green-400 text-xs ml-1">({importedTokens.length} imported)</span>
                )}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
