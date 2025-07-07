import { useState, useEffect } from 'react';
import { HeaderWagmi } from '@/components/HeaderWagmi';
import { HeroSection } from '@/components/HeroSection';
import { FeatureCards } from '@/components/FeatureCards';
import { CrossChainStatus } from '@/components/CrossChainStatus';
import { CrossChainNameRegistration } from '@/components/CrossChainNameRegistration';
import { CrossChainSendTokens } from '@/components/CrossChainSendTokens';
import { NameExpirationStatus } from '@/components/NameExpirationStatus';
import { SmartVersePay } from '@/components/SmartVersePay';
import { DonationSectionWagmi } from '@/components/DonationSectionWagmi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccount, useChainId } from 'wagmi';
import { Globe, QrCode, Calendar, Send, User } from 'lucide-react';

export const IndexWagmi = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-x-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-1000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-md bg-black/20 border-b border-white/10 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <HeaderWagmi />
        </div>
      </div>
      
      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <HeroSection />
        </section>
        
        {/* Feature Cards */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <FeatureCards />
        </section>
        
        {/* Core Features Grid */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="space-y-8 sm:space-y-10 lg:space-y-12">
            {/* Section Title */}
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                🌐 Cross-Chain SmartVerse
              </h2>
              <p className="text-gray-300 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
                Register once on Hub Chain, use everywhere. Your name works across all supported networks!
              </p>
            </div>
            
            {/* Cross-Chain Status */}
            <CrossChainStatus />
            
            {/* Main Features Tabs */}
            <Tabs defaultValue="register" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8 bg-white/10 backdrop-blur-sm">
                <TabsTrigger value="register" className="flex items-center gap-2 text-white data-[state=active]:bg-white/20">
                  <User className="w-4 h-4" />
                  Register
                </TabsTrigger>
                <TabsTrigger value="manage" className="flex items-center gap-2 text-white data-[state=active]:bg-white/20">
                  <Calendar className="w-4 h-4" />
                  Manage
                </TabsTrigger>
                <TabsTrigger value="transfer" className="flex items-center gap-2 text-white data-[state=active]:bg-white/20">
                  <Send className="w-4 h-4" />
                  Transfer
                </TabsTrigger>
                <TabsTrigger value="payment" className="flex items-center gap-2 text-white data-[state=active]:bg-white/20">
                  <QrCode className="w-4 h-4" />
                  QR Pay
                </TabsTrigger>
              </TabsList>

              <TabsContent value="register" className="w-full">
                <CrossChainNameRegistration />
              </TabsContent>

              <TabsContent value="manage" className="w-full">
                <NameExpirationStatus />
              </TabsContent>

              <TabsContent value="transfer" className="w-full">
                <CrossChainSendTokens />
              </TabsContent>

              <TabsContent value="payment" className="w-full">
                <SmartVersePay />
              </TabsContent>
            </Tabs>
          </div>
        </section>
        
        {/* Donation Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 pb-12 sm:pb-16 lg:pb-20">
          <div className="space-y-6 sm:space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                Support Development
              </h2>
              <p className="text-gray-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                Help us continue building amazing web3 tools for the community
              </p>
            </div>
            <DonationSectionWagmi />
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-semibold text-lg">SmartVerse</span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2025 SmartVerse. Building the future of web3 naming services.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default IndexWagmi;
