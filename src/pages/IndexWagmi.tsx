import { useState, useEffect } from 'react';
import { HeaderWagmi } from '@/components/HeaderWagmi';
import { HeroSection } from '@/components/HeroSection';
import { FeatureCards } from '@/components/FeatureCards';
import { NameRegistrationWagmi } from '@/components/NameRegistrationWagmi';
import { NameDirectory } from '@/components/NameDirectory';
import { SendTokensWagmi } from '@/components/SendTokensWagmi';
import { DonationSectionWagmi } from '@/components/DonationSectionWagmi';
import { SWNSServiceWagmi } from '@/services/swnsServiceWagmi';
import { useAccount, useChainId, useWalletClient, usePublicClient } from 'wagmi';
import { Globe } from 'lucide-react';

export const IndexWagmi = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [swnsService, setSWNSService] = useState<SWNSServiceWagmi | null>(null);
  const [registrationFee, setRegistrationFee] = useState<bigint>(BigInt(0));
  const [registeredNames, setRegisteredNames] = useState<{ name: string; address: string; owner: string; }[]>([]);

  // Mock function for backward compatibility
  const updateBalance = async () => {
    // Balance updates automatically with wagmi
    return Promise.resolve();
  };

  // Initialize SWNS service when wallet connects or chain changes
  useEffect(() => {
    if (chainId) {
      const service = new SWNSServiceWagmi(walletClient, publicClient, chainId);
      setSWNSService(service);
      
      // Get registration fee
      service.getRegistrationFee().then(setRegistrationFee);
      
      // Listen to name registration events
      service.onNameRegistered((name, owner, tokenId) => {
        setRegisteredNames(prev => [...prev, {
          name,
          address: owner,
          owner
        }]);
      });
    }
  }, [walletClient, publicClient, chainId]);

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
                Manage Your Smart Names
              </h2>
              <p className="text-gray-300 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
                Register, discover, and transfer smart wallet names with ease
              </p>
            </div>
            
            {/* Name Management Row */}
            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
              <div className="space-y-6 lg:space-y-0">
                <NameRegistrationWagmi
                  swnsService={swnsService}
                  registrationFee={registrationFee}
                  updateBalance={updateBalance}
                  chainId={chainId || 9924}
                />
              </div>
              
              <div className="space-y-6 lg:space-y-0">
                <NameDirectory 
                  registeredNames={registeredNames}
                />
              </div>
            </div>
            
            {/* Transfer Section */}
            <div className="w-full">
              <SendTokensWagmi
                swnsService={swnsService}
                updateBalance={updateBalance}
                chainId={chainId || 9924}
              />
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
