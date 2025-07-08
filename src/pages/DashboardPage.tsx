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
        <div className="flex justify-center mb-6">
          <img 
            src="/smartverse.svg" 
            alt="Platform Logo" 
            className="h-16 w-auto sm:h-20"
          />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            🌐 Dashboard
          </h1>
          <p className="text-gray-600 text-base sm:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed">
            Manage your web3 identity. Register new names and keep track of your existing ones.
          </p>
        </div>
        
        {/* Info Badge */}
        <div className="flex justify-center">
          <div className="category-badge flex items-center gap-2 text-purple-700 bg-purple-50 px-4 py-2 rounded-full border border-purple-200">
            <Info className="w-4 h-4" />
            <span className="text-sm font-medium">Infrastructure Layer</span>
          </div>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="register" className="w-full max-w-6xl mx-auto">
        <TabsList className="tabs-main grid w-full grid-cols-2 mb-8 bg-white border border-gray-200 h-auto">
          <TabsTrigger value="register" className="flex items-center gap-3 text-gray-700 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 p-4 h-auto flex-col space-y-1">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span className="font-semibold">Register Names</span>
            </div>
            <span className="text-xs opacity-80">Get your .sw identity</span>
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-3 text-gray-700 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 p-4 h-auto flex-col space-y-1">
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
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Register New Name</h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Secure your unique .sw identity on the blockchain
              </p>
            </div>
            <CrossChainNameRegistration />
          </div>
        </TabsContent>

        <TabsContent value="manage" className="w-full mt-8">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Manage Your Names</h2>
              <p className="text-gray-600 text-sm sm:text-base">
                View expiration dates, renew subscriptions, and manage your portfolio
              </p>
            </div>
            <NameExpirationStatus />
          </div>
        </TabsContent>
      </Tabs>

      {/* Additional Information */}
      <div className="mt-12 sm:mt-16">
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 sm:p-8">
          <div className="text-center space-y-4">
            <Settings className="w-8 h-8 text-purple-600 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-900">How It Works</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
              <div className="space-y-2">
                <div className="text-purple-600 font-medium text-sm">1. Register</div>
                <div className="text-gray-600 text-sm">Choose your unique .sw name and register it on the hub chain (Sepolia)</div>
              </div>
              <div className="space-y-2">
                <div className="text-pink-600 font-medium text-sm">2. Manage</div>
                <div className="text-gray-600 text-sm">Keep track of expiration dates and renew your subscription before it expires</div>
              </div>
              <div className="space-y-2">
                <div className="text-blue-600 font-medium text-sm">3. Use Everywhere</div>
                <div className="text-gray-600 text-sm">Your name works across all supported EVM networks for payments and transfers</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
