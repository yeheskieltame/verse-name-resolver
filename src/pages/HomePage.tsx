import { HeroSection } from '@/components/HeroSection';
import { FeatureCards } from '@/components/FeatureCards';
import { CrossChainStatus } from '@/components/CrossChainStatus';
import { DonationSectionWagmi } from '@/components/DonationSectionWagmi';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Globe, QrCode, ArrowRight, Zap, Shield, Users } from 'lucide-react';

export const HomePage = () => {
  return (
    <>
      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <HeroSection />
      </section>
      
      {/* Feature Cards */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <FeatureCards />
      </section>
      
      {/* Cross-Chain Status */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <CrossChainStatus />
      </section>

      {/* Quick Start Actions */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
              🚀 Ready to Get Started?
            </h2>
            <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Choose your journey: Set up your web3 identity or start making payments instantly
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
            {/* Dashboard Card */}
            <div className="bg-gradient-to-br from-purple-600/20 via-pink-600/10 to-blue-600/20 backdrop-blur-sm border border-white/20 rounded-2xl p-6 sm:p-8 hover:scale-105 transition-all duration-300 group">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Dashboard</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Register and manage your .sw names. Your gateway to the decentralized web.
                </p>
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-2 text-purple-200">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">Secure name registration</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-200">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm">Instant renewal management</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-200">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Multi-network compatibility</span>
                  </div>
                </div>
                <Link to="/dashboard">
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0 text-white font-semibold py-3 group-hover:shadow-lg transition-all duration-300">
                    Access Dashboard
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* SmartVerse Pay Card */}
            <div className="bg-gradient-to-br from-blue-600/20 via-cyan-600/10 to-purple-600/20 backdrop-blur-sm border border-white/20 rounded-2xl p-6 sm:p-8 hover:scale-105 transition-all duration-300 group">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <QrCode className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">SmartVerse Pay</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Send tokens using simple names or QR codes. Web3 payments made easy.
                </p>
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-2 text-blue-200">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm">Instant token transfers</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-200">
                    <QrCode className="w-4 h-4" />
                    <span className="text-sm">QR code payments</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-200">
                    <Globe className="w-4 h-4" />
                    <span className="text-sm">Cross-chain support</span>
                  </div>
                </div>
                <Link to="/pay">
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border-0 text-white font-semibold py-3 group-hover:shadow-lg transition-all duration-300">
                    Start Paying
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
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
    </>
  );
};
