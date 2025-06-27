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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <HeaderWagmi />
      
      <main className="container mx-auto px-4 py-8 space-y-12">
        <HeroSection />
        
        <FeatureCards />
        
        {/* Name Management Section */}
        <div className="grid md:grid-cols-2 gap-8">
          <NameRegistrationWagmi
            swnsService={swnsService}
            registrationFee={registrationFee}
            updateBalance={updateBalance}
            chainId={chainId || 9924}
          />
          
          <NameDirectory 
            registeredNames={registeredNames}
          />
        </div>
        
        {/* Transfer Section */}
        <SendTokensWagmi
          swnsService={swnsService}
          updateBalance={updateBalance}
          chainId={chainId || 9924}
        />
        
        {/* Donation Section */}
        <DonationSectionWagmi />
      </main>
    </div>
  );
};

export default IndexWagmi;
