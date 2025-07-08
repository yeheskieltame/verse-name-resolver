
import { Shield, Zap, Globe, Users, Lock, Rocket } from 'lucide-react';

export const FeatureCards = () => {
  const features = [
    {
      icon: Shield,
      title: "Secure & Decentralized",
      description: "Your names are stored on-chain, fully owned by you with complete control",
      gradient: "from-green-400 to-emerald-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-700"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Instant name resolution and seamless transactions with minimal fees",
      gradient: "from-yellow-400 to-orange-500",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-700"
    },
    {
      icon: Globe,
      title: "Universal Access",
      description: "Works with any wallet, any blockchain, anywhere in the decentralized world",
      gradient: "from-blue-400 to-cyan-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-700"
    }
  ];

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Section Header */}
      <div className="text-center space-y-4 sm:space-y-6 animate-fade-in">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
          Why Choose SmartVerse?
        </h2>
        <p className="text-gray-600 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
          Built for the future of web3 with cutting-edge technology and user-first design
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 max-w-7xl mx-auto">
        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <div 
              key={index}
              className={`group relative bg-white border ${feature.borderColor} rounded-3xl p-8 sm:p-10 hover:scale-105 transition-all duration-300 hover:shadow-lg animate-scale-in`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className={`w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 bg-gradient-to-r ${feature.gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm`}>
                <IconComponent className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 text-white" />
              </div>
              
              {/* Content */}
              <div className="text-center space-y-3 sm:space-y-4">
                <h3 className={`${feature.textColor} font-bold text-lg sm:text-xl lg:text-2xl group-hover:scale-105 transition-transform`}>
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base lg:text-lg leading-relaxed group-hover:text-gray-700 transition-colors">
                  {feature.description}
                </p>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gray-50/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          );
        })}
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 max-w-5xl mx-auto pt-8 sm:pt-12 animate-fade-in">
        <div className="text-center space-y-2 sm:space-y-3 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-600">1000+</div>
          <div className="text-sm sm:text-base text-gray-600">Names Registered</div>
        </div>
        <div className="text-center space-y-2 sm:space-y-3 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600">16+</div>
          <div className="text-sm sm:text-base text-gray-600">Networks Supported</div>
        </div>
        <div className="text-center space-y-2 sm:space-y-3 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600">24/7</div>
          <div className="text-sm sm:text-base text-gray-600">Uptime</div>
        </div>
        <div className="text-center space-y-2 sm:space-y-3 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange-600">0.01 ETH</div>
          <div className="text-sm sm:text-base text-gray-600">Starting Fee</div>
        </div>
      </div>
    </div>
  );
};
