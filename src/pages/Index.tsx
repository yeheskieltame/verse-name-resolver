import { useState, useEffect } from 'react';
import { toast } from "@/hooks/use-toast";
import { useWeb3 } from '@/hooks/useWeb3';
import { SWNSService } from '@/services/swnsService';
import { ethers } from 'ethers';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { NameRegistration } from '@/components/NameRegistration';
import { SendTokens } from '@/components/SendTokens';
import { NameDirectory } from '@/components/NameDirectory';
import { FeatureCards } from '@/components/FeatureCards';
import { DonationSection } from '@/components/DonationSection';

interface RegisteredName {
  name: string;
  address: string;
  owner: string;
}

const Index = () => {
  const { 
    provider, 
    signer, 
    account, 
    balance, 
    isConnected, 
    chainId,
    connectWallet: connectWeb3Wallet, 
    disconnectWallet,
    updateBalance 
  } = useWeb3();
  
  const [registeredNames, setRegisteredNames] = useState<RegisteredName[]>([]);
  const [userNames, setUserNames] = useState<string[]>([]);
  const [swnsService, setSWNSService] = useState<SWNSService | null>(null);
  const [registrationFee, setRegistrationFee] = useState<string>('0');

  // Initialize SWNS service when signer is available
  useEffect(() => {
    if (signer) {
      const service = new SWNSService(signer);
      setSWNSService(service);

      // Get registration fee
      service.getRegistrationFee().then(fee => {
        setRegistrationFee(ethers.formatEther(fee));
      });

      // Listen to name registration events
      service.onNameRegistered((name, owner, tokenId) => {
        if (owner.toLowerCase() === account.toLowerCase()) {
          setUserNames(prev => [...prev, name]);
        }
        
        setRegisteredNames(prev => [...prev, {
          name,
          address: owner,
          owner
        }]);
      });

      return () => {
        service.removeAllListeners();
      };
    }
  }, [signer, account]);

  const handleDisconnect = () => {
    disconnectWallet();
    setUserNames([]);
    setSWNSService(null);
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-6">
        <Header 
          isConnected={isConnected}
          account={account}
          balance={balance}
          chainId={chainId}
          connectWallet={connectWeb3Wallet}
          handleDisconnect={handleDisconnect}
        />

        <HeroSection />

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <NameRegistration 
            swnsService={swnsService}
            isConnected={isConnected}
            registrationFee={registrationFee}
            userNames={userNames}
            setUserNames={setUserNames}
            updateBalance={updateBalance}
          />

          <SendTokens 
            swnsService={swnsService}
            isConnected={isConnected}
            signer={signer}
            updateBalance={updateBalance}
          />
        </div>

        <NameDirectory registeredNames={registeredNames} />

        <DonationSection />

        <FeatureCards />
      </div>
    </div>
  );
};

export default Index;
