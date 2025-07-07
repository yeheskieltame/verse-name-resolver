import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Copy, Zap, Crown } from 'lucide-react';
import { toast } from "@/hooks/use-toast";

interface DemoName {
  name: string;
  address: string;
  owner: string;
  status: 'registered' | 'demo' | 'example';
}

export const DemoNameDirectory = () => {
  const [showDemo, setShowDemo] = useState(true);

  // Demo data untuk menunjukkan cara kerja sistem
  const demoNames: DemoName[] = [
    {
      name: 'alice.sw',
      address: '0x742d35Cc6635C0532925a3b8D400d78A3C8a8A8B',
      owner: '0x742d35Cc6635C0532925a3b8D400d78A3C8a8A8B',
      status: 'example'
    },
    {
      name: 'bob.sw',
      address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
      owner: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
      status: 'example'
    },
    {
      name: 'developer.sw',
      address: '0x8697C15331677E6EbF0316E2D09e4269D5c1057F',
      owner: '0x8697C15331677E6EbF0316E2D09e4269D5c1057F',
      status: 'demo'
    },
    {
      name: 'smartverse.sw',
      address: '0x1234567890123456789012345678901234567890',
      owner: '0x1234567890123456789012345678901234567890',
      status: 'demo'
    }
  ];

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

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'registered':
        return { label: 'Registered', color: 'border-green-400/50 text-green-300 bg-green-500/10' };
      case 'demo':
        return { label: 'Demo', color: 'border-blue-400/50 text-blue-300 bg-blue-500/10' };
      case 'example':
        return { label: 'Example', color: 'border-purple-400/50 text-purple-300 bg-purple-500/10' };
      default:
        return { label: 'Unknown', color: 'border-gray-400/50 text-gray-300 bg-gray-500/10' };
    }
  };

  if (!showDemo) {
    return null;
  }

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 h-full hover:bg-white/15 transition-all duration-300">
      <CardHeader className="pb-4 sm:pb-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl lg:text-2xl">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center flex-shrink-0">
                <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              Demo Directory
            </CardTitle>
            <CardDescription className="text-gray-300 text-sm sm:text-base leading-relaxed">
              Example of how Cross-Chain SmartVerse works
            </CardDescription>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDemo(false)}
            className="text-gray-400 hover:text-white hover:bg-white/20"
          >
            ✕
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 sm:space-y-4">
        {/* Demo Notice */}
        <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 font-medium text-sm">Demo Mode</span>
          </div>
          <p className="text-purple-200 text-xs leading-relaxed">
            This shows how the Name Directory will look when people register names on Hub Chain (Sepolia).
          </p>
        </div>

        {/* Demo Names List */}
        <div className="space-y-2 sm:space-y-3 max-h-80 overflow-y-auto scrollbar-thin">
          {demoNames.map((name, index) => {
            const statusInfo = getStatusInfo(name.status);
            
            return (
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
                        className={`${statusInfo.color} text-xs`}
                      >
                        {statusInfo.label}
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

                  {/* Cross-Chain Indicator */}
                  <div className="flex items-center gap-1 text-xs text-gray-500 justify-end">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <span>Cross-Chain</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Demo Summary */}
        <div className="pt-3 border-t border-white/10">
          <div className="flex justify-between items-center text-sm">
            <p className="text-gray-400">
              <span className="text-purple-300 font-semibold">{demoNames.length}</span> demo names shown
            </p>
            <p className="text-gray-500 text-xs">
              Real names will appear here
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <h4 className="text-blue-300 font-medium text-sm mb-2">🌐 How Cross-Chain Works:</h4>
          <ul className="text-blue-200 text-xs space-y-1">
            <li>• Register once on Sepolia (Hub Chain)</li>
            <li>• Use your name on any supported network</li>
            <li>• Send/receive tokens using simple names</li>
            <li>• Names are stored as NFTs you own</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
