import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Copy, ExternalLink, Clock, RefreshCw } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { crossChainNameService } from '@/services/crossChainNameService';
import { type Address } from 'viem';

interface RegisteredName {
  name: string;
  address: string;
  owner: string;
  tokenId?: string;
}

export const CrossChainNameDirectory = () => {
  const [registeredNames, setRegisteredNames] = useState<RegisteredName[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Load all registered names from Hub Chain
  const loadRegisteredNames = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Loading all registered names from Hub Chain...');
      
      // Get all registered names from contract events
      const allNames = await crossChainNameService.getAllRegisteredNames();
      
      // Convert to the format expected by the component
      const formattedNames: RegisteredName[] = allNames.map(name => ({
        name: name.name,
        address: name.address,
        owner: name.owner,
        tokenId: name.tokenId,
      }));
      
      setRegisteredNames(formattedNames);
      setLastUpdate(new Date());
      
      console.log(`✅ Loaded ${formattedNames.length} registered names`);
      
      if (formattedNames.length > 0) {
        toast({
          title: "Names Loaded! 📋",
          description: `Found ${formattedNames.length} registered names on Hub Chain`,
        });
      } else {
        // Don't show error toast for empty results - it's expected for new contracts
        console.log('ℹ️ No registered names found - this is expected for new contracts');
      }
      
    } catch (error) {
      console.error('Error loading registered names:', error);
      toast({
        title: "Loading Error",
        description: "Could not load names from Hub Chain. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load names on component mount
  useEffect(() => {
    loadRegisteredNames();
  }, []);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 h-full hover:bg-white/15 transition-all duration-300">
      <CardHeader className="pb-4 sm:pb-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl lg:text-2xl">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              Cross-Chain Directory
            </CardTitle>
            <CardDescription className="text-gray-300 text-sm sm:text-base leading-relaxed">
              Names registered on Hub Chain (Sepolia)
            </CardDescription>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={loadRegisteredNames}
            disabled={isLoading}
            className="text-white hover:bg-white/20"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 sm:space-y-4">
        {isLoading ? (
          /* Loading State */
          <div className="text-center py-8 sm:py-12 space-y-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full flex items-center justify-center mx-auto">
              <RefreshCw className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400 opacity-60 animate-spin" />
            </div>
            <div className="space-y-2">
              <p className="text-gray-300 text-sm sm:text-base font-medium">
                Loading names from Hub Chain...
              </p>
              <p className="text-gray-400 text-xs sm:text-sm">
                Querying Sepolia for registered names
              </p>
            </div>
          </div>
        ) : registeredNames.length > 0 ? (
          <>
            {/* Names List */}
            <div className="space-y-2 sm:space-y-3 max-h-80 overflow-y-auto scrollbar-thin">
              {registeredNames.map((name, index) => (
                <div 
                  key={`${name.name}-${index}`} 
                  className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl p-3 sm:p-4 transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    {/* Name Section */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm sm:text-base text-white font-medium">
                          {name.name}
                        </span>
                        <Badge 
                          variant="outline" 
                          className="border-green-400/50 text-green-300 bg-green-500/10 text-xs"
                        >
                          Hub Chain
                        </Badge>
                      </div>
                      
                      {/* Address */}
                      <div className="flex items-center gap-2">
                        <code className="text-xs sm:text-sm text-gray-400 font-mono">
                          {shortenAddress(name.address)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(name.address, 'Address')}
                          className="h-6 w-6 p-0 hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-1 text-xs text-gray-500 justify-end">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>Active</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="pt-3 border-t border-white/10">
              <div className="flex justify-between items-center text-sm">
                <p className="text-gray-400">
                  <span className="text-white font-semibold">{registeredNames.length}</span> names on Hub Chain
                </p>
                {lastUpdate && (
                  <p className="text-gray-500 text-xs">
                    Updated: {formatTime(lastUpdate)}
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-8 sm:py-12 space-y-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400 opacity-60" />
            </div>
            <div className="space-y-2">
              <p className="text-gray-300 text-sm sm:text-base font-medium">
                No registered names found
              </p>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-xs mx-auto">
                Be the first to register a <span className="text-blue-300 font-mono">.sw</span> name on Hub Chain!
              </p>
              <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <p className="text-blue-300 text-xs">
                  💡 <strong>Tip:</strong> Switch to Sepolia network and register your name to see it appear here
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
