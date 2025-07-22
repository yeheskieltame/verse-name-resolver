import { HeroSection } from '@/components/HeroSection';
import { FeatureCards } from '@/components/FeatureCards';
import { CrossChainStatus } from '@/components/CrossChainStatus';
import { DonationSectionWagmi } from '@/components/DonationSectionWagmi';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Globe, 
  QrCode, 
  ArrowRight, 
  Zap, 
  Shield, 
  Users, 
  TrendingUp, 
  PieChart, 
  BarChart3, 
  Briefcase,
  CheckCircle,
  Target,
  Building2,
  CreditCard,
  LineChart
} from 'lucide-react';

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
      
      {/* UMKM Credibility & On-Chain Analytics Section */}
      <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center space-y-4 mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              Membangun Kredibilitas UMKM
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Melalui <span className="text-purple-600 font-semibold">Identitas Digital</span> dan{' '}
              <span className="text-blue-600 font-semibold">Analisis On-Chain</span> yang Transparan
            </p>
          </div>

          {/* Three Pillars */}
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 mb-16">
            {/* Pillar 1: Digital Identity */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Identitas Digital .sw
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-center leading-relaxed">
                  Bangun kepercayaan dengan identitas digital yang unik dan mudah diingat
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Nama bisnis yang profesional</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Mudah diingat pelanggan</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Terverifikasi blockchain</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pillar 2: Business Management */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Manajemen Bisnis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-center leading-relaxed">
                  Kelola keuangan bisnis dengan sistem payment dan vault yang aman
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Business Vault terintegrasi</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>QR Payment system</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Category management</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pillar 3: On-Chain Analytics */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Analisis On-Chain
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-center leading-relaxed">
                  Dapatkan insights bisnis real-time dengan analisis blockchain yang transparan
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Business health scoring</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Revenue trend analysis</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Transparent reporting</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Features Showcase */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12">
            <div className="text-center mb-10">
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                Analisis Bisnis Tingkat Lanjut
              </h3>
              <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                Platform pertama di Indonesia yang memberikan analisis kredibilitas bisnis 
                berdasarkan data on-chain yang transparan dan terverifikasi
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {/* Health Score */}
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto bg-gradient-to-r from-green-400 to-green-500 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900">Health Score</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Skor kredibilitas 0-100 berdasarkan kinerja bisnis real-time
                </p>
              </div>

              {/* Financial Trends */}
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900">Trend Keuangan</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Analisis pertumbuhan revenue dan profit margin otomatis
                </p>
              </div>

              {/* Category Insights */}
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto bg-gradient-to-r from-purple-400 to-purple-500 rounded-xl flex items-center justify-center">
                  <PieChart className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900">Category Insights</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Breakdown pengeluaran dan pemasukan per kategori bisnis
                </p>
              </div>

              {/* Compliance Ready */}
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900">OJK/BI Ready</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Laporan siap untuk submission ke regulator keuangan
                </p>
              </div>
            </div>

            {/* CTA for Business */}
            <div className="text-center mt-10">
              <Link to="/business">
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  Mulai Analisis Bisnis
                  <LineChart className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Cross-Chain Status */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <CrossChainStatus />
      </section>

      {/* Quick Start Actions */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              🚀 Mulai Perjalanan UMKM Digital Anda
            </h2>
            <p className="text-gray-600 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
              Pilih langkah pertama: Daftar identitas digital, kelola bisnis, atau analisis keuangan
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {/* Digital Identity Card */}
            <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6 sm:p-8 hover:shadow-xl hover:scale-105 transition-all duration-300 group">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Identitas Digital</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Daftarkan nama bisnis .sw Anda. Gateway menuju kredibilitas digital yang profesional.
                </p>
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-2 text-purple-600">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">Registrasi nama aman</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-600">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm">Manajemen perpanjangan</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-600">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Multi-network support</span>
                  </div>
                </div>
                <Link to="/dashboard">
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0 text-white font-semibold py-3 group-hover:shadow-lg transition-all duration-300">
                    Daftar Identitas
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Business Management Card */}
            <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6 sm:p-8 hover:shadow-xl hover:scale-105 transition-all duration-300 group">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Kelola Bisnis</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Business vault dan payment system untuk operasional UMKM yang efisien.
                </p>
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-2 text-green-600">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-sm">QR Payment system</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">Business vault aman</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <Target className="w-4 h-4" />
                    <span className="text-sm">Category management</span>
                  </div>
                </div>
                <Link to="/business">
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 border-0 text-white font-semibold py-3 group-hover:shadow-lg transition-all duration-300">
                    Mulai Bisnis
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Cross-Chain Pay Card */}
            <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6 sm:p-8 hover:shadow-xl hover:scale-105 transition-all duration-300 group">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <QrCode className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Cross-Chain Pay</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Kirim token menggunakan nama atau QR code. Pembayaran web3 yang mudah.
                </p>
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm">Transfer token instan</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600">
                    <QrCode className="w-4 h-4" />
                    <span className="text-sm">QR code payments</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600">
                    <Globe className="w-4 h-4" />
                    <span className="text-sm">Cross-chain support</span>
                  </div>
                </div>
                <Link to="/pay">
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border-0 text-white font-semibold py-3 group-hover:shadow-lg transition-all duration-300">
                    Mulai Bayar
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
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              Support Development
            </h2>
            <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Help us continue building amazing web3 tools for the community
            </p>
          </div>
          <DonationSectionWagmi />
        </div>
      </section>
    </>
  );
};
