
import { Shield, Globe, Zap, Sparkles, ArrowRight } from 'lucide-react';

export const HeroSection = () => {
  return (
    <div className="text-center max-w-6xl mx-auto space-y-8 sm:space-y-12 lg:space-y-16 tour-hero-section">
      {/* Logo Hero */}
      <div className="flex justify-center animate-fade-in">
        <img 
          src="/smartverse.svg" 
          alt="Platform Logo" 
          className="h-20 w-auto sm:h-24 lg:h-32 xl:h-40"
        />
      </div>
      
      {/* Main Title */}
      <div className="space-y-6 sm:space-y-8 animate-fade-in">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-tight">
          UMKM Digital{' '}
          <span className="gradient-text">
            Terpercaya
          </span>
        </h1>
        <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl text-gray-600 max-w-5xl mx-auto leading-relaxed px-4">
          Bangun kredibilitas bisnis dengan identitas{' '}
          <span className="text-purple-700 font-mono bg-purple-50 px-3 sm:px-4 py-2 rounded-xl border border-purple-200 shadow-sm">
            bisnis.sw
          </span>{' '}
          dan analisis on-chain yang transparan
        </p>
      </div>
      
      {/* Feature Badges */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 lg:gap-8 animate-scale-in">
        <div className="flex items-center gap-3 text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:scale-105">
          <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
          <span className="font-semibold text-sm sm:text-base">Aman</span>
        </div>
        <div className="flex items-center gap-3 text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:scale-105">
          <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
          <span className="font-semibold text-sm sm:text-base">Transparan</span>
        </div>
        <div className="flex items-center gap-3 text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:scale-105">
          <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
          <span className="font-semibold text-sm sm:text-base">Kredibel</span>
        </div>
      </div>
      
      {/* Call to Action Card */}
      <div className="max-w-4xl mx-auto animate-scale-in">
        <div className="bg-white border border-gray-200 rounded-3xl lg:rounded-4xl p-8 sm:p-10 lg:p-12 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-purple-500" />
            <span className="text-gray-900 font-bold text-xl sm:text-2xl">Ready to get started?</span>
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-purple-500" />
          </div>
          <p className="text-gray-700 text-base sm:text-lg lg:text-xl leading-relaxed mb-6">
            Hubungkan wallet dan daftarkan <span className="text-purple-700 font-bold">.sw</span> bisnis Anda dalam hitungan menit!
          </p>
          <div className="inline-flex items-center gap-2 text-gray-600 text-sm sm:text-base bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
            <Globe className="w-4 h-4" />
            <span>Kompatible dengan Taranium Network, Ethereum, dan lainnya</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
