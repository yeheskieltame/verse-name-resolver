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
import OnboardingTour from '@/components/OnboardingTour';
import { useTourManager } from '@/hooks/useTourManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccount, useChainId } from 'wagmi';
import { QrCode, Calendar, Send, User, Sparkles, Globe } from 'lucide-react';

export const IndexWagmi = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // Tour manager for general app tour
  const {
    showTour,
    tourType,
    tourSettings,
    startTour,
    completeTour,
    closeTour
  } = useTourManager();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <HeaderWagmi />
        </div>
      </div>
      
      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <HeroSection />
        </section>
        
        {/* Feature Cards */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <FeatureCards />
        </section>
        
        {/* Core Features Grid */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="space-y-12 sm:space-y-16 lg:space-y-20">
            {/* Section Title */}
            <div className="text-center space-y-4 animate-fade-in">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                  Cross-Chain Identity Platform
                </h2>
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-gray-600 text-base sm:text-lg lg:text-xl max-w-4xl mx-auto leading-relaxed">
                Complete Web3 naming and payment infrastructure. Register your identity once, use everywhere across all networks.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
                <div className="category-badge flex items-center gap-2 text-purple-700">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">Infrastructure Layer</span>
                </div>
                <div className="category-badge flex items-center gap-2 text-blue-700">
                  <QrCode className="w-4 h-4" />
                  <span className="text-sm font-medium">Payment Features</span>
                </div>
              </div>
            </div>
            
            {/* Cross-Chain Status */}
            <div className="animate-scale-in">
              <CrossChainStatus />
            </div>
            
            {/* Main Sections */}
            <Tabs defaultValue="dashboard" className="w-full animate-fade-in">
              <TabsList className="tabs-main grid w-full grid-cols-2 mb-12 h-auto p-2">
                <TabsTrigger value="dashboard" className="flex items-center gap-3 text-gray-700 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:shadow-sm p-6 h-auto flex-col space-y-2 rounded-xl name-registration-section">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    <span className="font-semibold text-base">Dashboard</span>
                  </div>
                  <span className="text-xs opacity-75">Register & Manage Names</span>
                </TabsTrigger>
                <TabsTrigger value="smartverse-pay" className="flex items-center gap-3 text-gray-700 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:shadow-sm p-6 h-auto flex-col space-y-2 rounded-xl qr-scanner-section">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5" />
                    <span className="font-semibold text-base">Cross-Chain Pay</span>
                  </div>
                  <span className="text-xs opacity-75">Transfer & QR Payments</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="w-full space-y-8">
                {/* Dashboard Sub-tabs */}
                <Tabs defaultValue="register" className="w-full">
                  <TabsList className="tabs-sub grid w-full grid-cols-2 p-1">
                    <TabsTrigger value="register" className="flex items-center gap-2 text-gray-600 data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm rounded-lg">
                      <User className="w-4 h-4" />
                      Register Names
                    </TabsTrigger>
                    <TabsTrigger value="manage" className="flex items-center gap-2 text-gray-600 data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm rounded-lg">
                      <Calendar className="w-4 h-4" />
                      Manage Names
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="register" className="w-full mt-8">
                    <CrossChainNameRegistration />
                  </TabsContent>

                  <TabsContent value="manage" className="w-full mt-8">
                    <NameExpirationStatus />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="smartverse-pay" className="w-full space-y-8">
                {/* Cross-Chain Pay Sub-tabs */}
                <Tabs defaultValue="transfer" className="w-full">
                  <TabsList className="tabs-sub grid w-full grid-cols-2 p-1">
                    <TabsTrigger value="transfer" className="flex items-center gap-2 text-gray-600 data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm rounded-lg send-tokens-section">
                      <Send className="w-4 h-4" />
                      Send Tokens
                    </TabsTrigger>
                    <TabsTrigger value="qr-pay" className="flex items-center gap-2 text-gray-600 data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm rounded-lg qr-scanner-section">
                      <QrCode className="w-4 h-4" />
                      QR Payment
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="transfer" className="w-full mt-8">
                    <CrossChainSendTokens />
                  </TabsContent>

                  <TabsContent value="qr-pay" className="w-full mt-8">
                    <SmartVersePay />
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </div>
        </section>
        
        {/* Donation Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="space-y-8 sm:space-y-12">
            <div className="text-center space-y-4 animate-fade-in">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                Support Development
              </h2>
              <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                Help us continue building amazing web3 tools for the community
              </p>
            </div>
            <div className="animate-scale-in">
              <DonationSectionWagmi />
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3">
              <img 
                src="/smartverse.svg" 
                alt="Logo" 
                className="h-12 w-auto sm:h-16"
              />
            </div>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              © 2025. Building the future of web3 naming services with modern, clean design.
            </p>
          </div>
        </div>
      </footer>

      {/* Onboarding Tour */}
      <OnboardingTour
        isOpen={showTour}
        onClose={() => completeTour(tourType)}
        tourType={tourType}
        isBusinessUser={tourSettings.isBusinessUser}
      />
    </div>
  );
};

export default IndexWagmi;
