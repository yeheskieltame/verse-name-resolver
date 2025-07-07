import { useState } from 'react';
import { CrossChainNameRegistration } from '@/components/CrossChainNameRegistration';
import { NameExpirationStatus } from '@/components/NameExpirationStatus';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Calendar, Settings, Info } from 'lucide-react';

export const DashboardPage = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      {/* Page Header */}
      <div className="text-center space-y-6 mb-8 sm:mb-12">
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            🌐 Dashboard
          </h1>
          <p className="text-gray-300 text-base sm:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed">
            Manage your web3 identity. Register new names and keep track of your existing ones.
          </p>
        </div>
        
        {/* Info Badge */}
        <div className="flex justify-center">
          <div className="category-badge flex items-center gap-2 text-purple-200 bg-purple-500/20 px-4 py-2 rounded-full border border-purple-500/30">
            <Info className="w-4 h-4" />
            <span className="text-sm font-medium">Infrastructure Layer</span>
          </div>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="register" className="w-full max-w-6xl mx-auto">
        <TabsList className="tabs-main grid w-full grid-cols-2 mb-8 bg-white/10 backdrop-blur-sm h-auto">
          <TabsTrigger value="register" className="flex items-center gap-3 text-white data-[state=active]:bg-white/20 p-4 h-auto flex-col space-y-1">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span className="font-semibold">Register Names</span>
            </div>
            <span className="text-xs opacity-80">Get your .sw identity</span>
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-3 text-white data-[state=active]:bg-white/20 p-4 h-auto flex-col space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span className="font-semibold">Manage Names</span>
            </div>
            <span className="text-xs opacity-80">Renew & track expiration</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="register" className="w-full mt-8">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Register New Name</h2>
              <p className="text-gray-300 text-sm sm:text-base">
                Secure your unique .sw identity on the blockchain
              </p>
            </div>
            <CrossChainNameRegistration />
          </div>
        </TabsContent>

        <TabsContent value="manage" className="w-full mt-8">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Manage Your Names</h2>
              <p className="text-gray-300 text-sm sm:text-base">
                View expiration dates, renew subscriptions, and manage your portfolio
              </p>
            </div>
            <NameExpirationStatus />
          </div>
        </TabsContent>
      </Tabs>

      {/* Additional Information */}
      <div className="mt-12 sm:mt-16">
        <div className="bg-gradient-to-r from-purple-600/10 via-pink-600/5 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8">
          <div className="text-center space-y-4">
            <Settings className="w-8 h-8 text-purple-400 mx-auto" />
            <h3 className="text-lg font-semibold text-white">How It Works</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
              <div className="space-y-2">
                <div className="text-purple-300 font-medium text-sm">1. Register</div>
                <div className="text-gray-300 text-sm">Choose your unique .sw name and register it on the hub chain (Sepolia)</div>
              </div>
              <div className="space-y-2">
                <div className="text-pink-300 font-medium text-sm">2. Manage</div>
                <div className="text-gray-300 text-sm">Keep track of expiration dates and renew your subscription before it expires</div>
              </div>
              <div className="space-y-2">
                <div className="text-blue-300 font-medium text-sm">3. Use Everywhere</div>
                <div className="text-gray-300 text-sm">Your name works across all supported EVM networks for payments and transfers</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
