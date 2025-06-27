
import { Shield, Globe, Zap, Sparkles } from 'lucide-react';

export const HeroSection = () => {
  return (
    <div className="text-center max-w-5xl mx-auto space-y-6 sm:space-y-8 lg:space-y-10">
      {/* Main Title */}
      <div className="space-y-4 sm:space-y-6">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
          Web3 Made{' '}
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Simple
          </span>
        </h1>
        <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-purple-200 max-w-4xl mx-auto leading-relaxed px-2">
          Send crypto using simple names like{' '}
          <span className="text-purple-300 font-mono bg-purple-900/40 px-2 sm:px-3 py-1 rounded-lg border border-purple-500/30">
            yourname.sw
          </span>{' '}
          instead of complex wallet addresses
        </p>
      </div>
      
      {/* Feature Badges */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 lg:gap-6">
        <div className="flex items-center gap-2 text-purple-200 bg-white/10 hover:bg-white/15 transition-colors px-3 sm:px-4 py-2 sm:py-3 rounded-full backdrop-blur-sm border border-white/10">
          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
          <span className="font-medium text-sm sm:text-base">Secure</span>
        </div>
        <div className="flex items-center gap-2 text-purple-200 bg-white/10 hover:bg-white/15 transition-colors px-3 sm:px-4 py-2 sm:py-3 rounded-full backdrop-blur-sm border border-white/10">
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
          <span className="font-medium text-sm sm:text-base">Fast</span>
        </div>
        <div className="flex items-center gap-2 text-purple-200 bg-white/10 hover:bg-white/15 transition-colors px-3 sm:px-4 py-2 sm:py-3 rounded-full backdrop-blur-sm border border-white/10">
          <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          <span className="font-medium text-sm sm:text-base">Decentralized</span>
        </div>
      </div>
      
      {/* Call to Action Card */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 backdrop-blur-sm border border-white/20 rounded-2xl lg:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
            <span className="text-white font-semibold text-lg sm:text-xl">Ready to get started?</span>
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
          </div>
          <p className="text-white/90 text-sm sm:text-base lg:text-lg leading-relaxed">
            Connect your wallet and register your first <span className="text-purple-300 font-semibold">.sw</span> name in minutes!<br />
            <span className="text-purple-200 text-xs sm:text-sm mt-2 block">
              Works on Taranium Network, Ethereum, and more
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
