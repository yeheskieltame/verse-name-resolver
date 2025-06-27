
import { Shield, Globe, Zap } from 'lucide-react';

export const HeroSection = () => {
  return (
    <div className="text-center mb-12">
      <h2 className="text-5xl font-bold text-white mb-4">
        Web3 Made <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Simple</span>
      </h2>
      <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
        Send crypto using simple names like <span className="text-purple-300 font-mono">yourname.sw</span> instead of complex wallet addresses on Taranium Network
      </p>
      
      <div className="flex justify-center gap-8 mb-8">
        <div className="flex items-center gap-2 text-purple-200">
          <Shield className="w-5 h-5" />
          <span>Secure</span>
        </div>
        <div className="flex items-center gap-2 text-purple-200">
          <Zap className="w-5 h-5" />
          <span>Fast</span>
        </div>
        <div className="flex items-center gap-2 text-purple-200">
          <Globe className="w-5 h-5" />
          <span>Decentralized</span>
        </div>
      </div>
    </div>
  );
};
