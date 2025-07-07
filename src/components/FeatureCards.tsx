
import { Shield, Zap, Globe, Users, Lock, Rocket } from 'lucide-react';

export const FeatureCards = () => {
  const features = [
    {
      icon: Shield,
      title: "Secure & Decentralized",
      description: "Your names are stored on-chain, fully owned by you with complete control",
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-500/10 to-pink-500/10",
      borderColor: "border-purple-400/20"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Instant name resolution and seamless transactions with minimal fees",
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-500/10 to-cyan-500/10",
      borderColor: "border-blue-400/20"
    },
    {
      icon: Globe,
      title: "Universal Access",
      description: "Works with any wallet, any blockchain, anywhere in the decentralized world",
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-500/10 to-emerald-500/10",
      borderColor: "border-green-400/20"
    }
  ];

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Section Header */}
      <div className="text-center space-y-3 sm:space-y-4">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
          Why Choose SmartVerse?
        </h2>
        <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Built for the future of web3 with cutting-edge technology and user-first design
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto">
        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <div 
              key={index}
              className={`group relative bg-gradient-to-br ${feature.bgGradient} backdrop-blur-sm border ${feature.borderColor} rounded-2xl p-6 sm:p-8 hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:border-white/30`}
            >
              {/* Icon */}
              <div className={`w-14 h-14 sm:w-16 sm:h-16 lg:w-18 lg:h-18 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                <IconComponent className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 text-white" />
              </div>
              
              {/* Content */}
              <div className="text-center space-y-2 sm:space-y-3">
                <h3 className="text-white font-semibold text-base sm:text-lg lg:text-xl group-hover:text-white transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-300 text-xs sm:text-sm lg:text-base leading-relaxed group-hover:text-gray-200 transition-colors">
                  {feature.description}
                </p>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          );
        })}
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto pt-6 sm:pt-8">
        <div className="text-center space-y-1 sm:space-y-2">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">1000+</div>
          <div className="text-xs sm:text-sm text-gray-400">Names Registered</div>
        </div>
        <div className="text-center space-y-1 sm:space-y-2">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">16+</div>
          <div className="text-xs sm:text-sm text-gray-400">Networks Supported</div>
        </div>
        <div className="text-center space-y-1 sm:space-y-2">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">24/7</div>
          <div className="text-xs sm:text-sm text-gray-400">Uptime</div>
        </div>
        <div className="text-center space-y-1 sm:space-y-2">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">0.01 ETH</div>
          <div className="text-xs sm:text-sm text-gray-400">Starting Fee</div>
        </div>
      </div>
    </div>
  );
};
