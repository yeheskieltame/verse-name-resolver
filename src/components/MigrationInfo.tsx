import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Zap, Shield, Smartphone } from 'lucide-react';

export const MigrationInfo = () => {
  return (
    <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 backdrop-blur-lg border-green-400/20 mb-8">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          Wagmi + RainbowKit Migration Complete! 🎉
        </CardTitle>
        <CardDescription className="text-green-200">
          This DApp now uses the latest web3 technologies for the best user experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <div>
              <p className="text-white text-sm font-medium">Performance</p>
              <p className="text-gray-300 text-xs">Viem + Wagmi optimization</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-white text-sm font-medium">Type Safety</p>
              <p className="text-gray-300 text-xs">Full TypeScript support</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-purple-400" />
            <div>
              <p className="text-white text-sm font-medium">Mobile Ready</p>
              <p className="text-gray-300 text-xs">RainbowKit integration</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <div>
              <p className="text-white text-sm font-medium">Modern Stack</p>
              <p className="text-gray-300 text-xs">Latest web3 standards</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-200">
            Wagmi v2
          </Badge>
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-200">
            Viem
          </Badge>
          <Badge variant="secondary" className="bg-pink-500/20 text-pink-200">
            RainbowKit
          </Badge>
          <Badge variant="secondary" className="bg-green-500/20 text-green-200">
            React Query
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
