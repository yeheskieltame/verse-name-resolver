
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Copy, ExternalLink, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface RegisteredName {
  name: string;
  address: string;
  owner: string;
}

interface NameDirectoryProps {
  registeredNames: RegisteredName[];
}

export const NameDirectory = ({ registeredNames }: NameDirectoryProps) => {
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

  const recentNames = registeredNames.slice(-8); // Show more names

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 h-full hover:bg-white/15 transition-all duration-300">
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl lg:text-2xl">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          Name Directory
        </CardTitle>
        <CardDescription className="text-gray-300 text-sm sm:text-base leading-relaxed">
          Recently registered <span className="text-blue-300 font-mono">.sw</span> names
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {recentNames.length > 0 ? (
          <>
            {/* Names List */}
            <div className="space-y-2 sm:space-y-3 max-h-80 overflow-y-auto scrollbar-thin">
              {recentNames.map((name, index) => (
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
                        <span className="font-mono text-sm sm:text-base text-blue-300">
                          .sw
                        </span>
                        <Badge 
                          variant="outline" 
                          className="border-green-400/50 text-green-300 bg-green-500/10 text-xs ml-auto sm:ml-0"
                        >
                          Active
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

                    {/* Time Indicator */}
                    <div className="flex items-center gap-1 text-xs text-gray-500 justify-end">
                      <Clock className="w-3 h-3" />
                      <span>Recent</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Count */}
            <div className="pt-3 border-t border-white/10">
              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  <span className="text-white font-semibold">{registeredNames.length}</span> names registered
                </p>
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
                No names registered yet
              </p>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-xs mx-auto">
                Be the first to claim your <span className="text-blue-300 font-mono">.sw</span> identity!
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
