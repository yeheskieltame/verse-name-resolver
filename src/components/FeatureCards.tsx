
import { Shield, Zap, Globe } from 'lucide-react';

export const FeatureCards = () => {
  return (
    <div className="grid md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-white font-semibold mb-2">Secure & Decentralized</h3>
        <p className="text-purple-200 text-sm">Your names are stored on-chain, fully owned by you</p>
      </div>
      
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-white font-semibold mb-2">Lightning Fast</h3>
        <p className="text-purple-200 text-sm">Instant name resolution and seamless transactions</p>
      </div>
      
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <Globe className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-white font-semibold mb-2">Universal Access</h3>
        <p className="text-purple-200 text-sm">Works with any wallet, any blockchain, anywhere</p>
      </div>
    </div>
  );
};
