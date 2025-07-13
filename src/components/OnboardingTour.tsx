import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Wallet, 
  QrCode, 
  Building2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign,
  Smartphone,
  Shield,
  Zap,
  Globe,
  CreditCard,
  PieChart,
  History,
  Settings,
  Users,
  Star
} from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  targetElement?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  highlight?: boolean;
  actionText?: string;
  category: 'general' | 'business' | 'advanced';
}

const TOUR_STEPS: TourStep[] = [
  // General App Features
  {
    id: 'welcome',
    title: 'Selamat Datang di SmartVerse!',
    description: 'Platform Web3 terlengkap untuk transaksi cryptocurrency dengan teknologi blockchain terdepan. Mari jelajahi semua fitur yang tersedia.',
    icon: <Star className="w-6 h-6 text-yellow-500" />,
    category: 'general'
  },
  {
    id: 'wallet-connection',
    title: 'Koneksi Wallet',
    description: 'Hubungkan wallet Anda untuk mulai bertransaksi. Kami mendukung MetaMask, WalletConnect, dan berbagai wallet populer lainnya.',
    icon: <Wallet className="w-6 h-6 text-blue-500" />,
    targetElement: '.wallet-connect-button',
    category: 'general'
  },
  {
    id: 'multi-chain',
    title: 'Multi-Chain Support',
    description: 'SmartVerse mendukung multiple blockchain: Ethereum Sepolia, Taranium Testnet, dan Holesky. Ganti network sesuai kebutuhan Anda.',
    icon: <Globe className="w-6 h-6 text-green-500" />,
    category: 'general'
  },
  {
    id: 'idrt-currency',
    title: 'Mata Uang Utama: IDRT',
    description: 'Indonesian Rupiah Token (IDRT) adalah mata uang utama untuk semua transaksi. Stabil, aman, dan mudah digunakan.',
    icon: <DollarSign className="w-6 h-6 text-green-600" />,
    category: 'general'
  },
  
  // Core Features
  {
    id: 'name-registration',
    title: 'Registrasi Nama Domain',
    description: 'Daftarkan nama domain blockchain Anda sendiri. Mudah diingat, mudah digunakan untuk menerima pembayaran.',
    icon: <Shield className="w-6 h-6 text-purple-500" />,
    targetElement: '.name-registration-section',
    category: 'general'
  },
  {
    id: 'send-tokens',
    title: 'Kirim Token',
    description: 'Kirim IDRT atau cryptocurrency lainnya ke alamat wallet atau nama domain dengan mudah dan aman.',
    icon: <ArrowUpRight className="w-6 h-6 text-red-500" />,
    targetElement: '.send-tokens-section',
    category: 'general'
  },
  {
    id: 'qr-scanner',
    title: 'QR Scanner',
    description: 'Scan QR code untuk pembayaran instan. Cukup arahkan kamera ke QR code dan transaksi siap diproses.',
    icon: <QrCode className="w-6 h-6 text-blue-600" />,
    targetElement: '.qr-scanner-section',
    category: 'general'
  },

  // Business Features
  {
    id: 'business-intro',
    title: 'Fitur Bisnis SmartVerse',
    description: 'Kelola bisnis Anda dengan SmartVerse Business. Terima pembayaran, kelola keuangan, dan pantau transaksi dengan mudah.',
    icon: <Building2 className="w-6 h-6 text-indigo-600" />,
    category: 'business'
  },
  {
    id: 'business-vault',
    title: 'Business Vault',
    description: 'Vault bisnis adalah dompet khusus untuk menyimpan dana bisnis Anda. Aman, terpisah dari dompet pribadi, dan mudah dikelola.',
    icon: <Shield className="w-6 h-6 text-green-600" />,
    targetElement: '.business-info-card',
    category: 'business'
  },
  {
    id: 'payment-qr',
    title: 'Generate QR Pembayaran',
    description: 'Buat QR code pembayaran untuk pelanggan. Atur jumlah, kategori, dan pesan untuk setiap transaksi.',
    icon: <QrCode className="w-6 h-6 text-blue-600" />,
    targetElement: '.payment-qr-card',
    category: 'business'
  },
  {
    id: 'direct-payment',
    title: 'Pembayaran Langsung',
    description: 'Fitur baru! Proses pembayaran langsung tanpa perlu QR code. Cocok untuk transaksi cepat dan pembayaran internal.',
    icon: <CreditCard className="w-6 h-6 text-purple-600" />,
    category: 'business',
    highlight: true
  },
  {
    id: 'deposit-funds',
    title: 'Deposit Dana',
    description: 'Tambahkan dana IDRT ke vault bisnis Anda. Proses otomatis dengan sistem approval yang aman.',
    icon: <ArrowDownLeft className="w-6 h-6 text-green-600" />,
    targetElement: '.deposit-card',
    category: 'business'
  },
  {
    id: 'withdraw-funds',
    title: 'Tarik Dana',
    description: 'Tarik dana dari vault bisnis ke wallet pribadi Anda. Hanya owner yang dapat melakukan penarikan.',
    icon: <ArrowUpRight className="w-6 h-6 text-red-600" />,
    targetElement: '.withdraw-card',
    category: 'business'
  },
  {
    id: 'quick-actions',
    title: 'Aksi Cepat',
    description: 'Shortcut untuk aksi yang sering digunakan. QR 25K, QR 50K, Deposit 100K, dan Tarik Semua dengan satu klik.',
    icon: <Zap className="w-6 h-6 text-yellow-600" />,
    targetElement: '.quick-actions-card',
    category: 'business'
  },

  // Advanced Features
  {
    id: 'transaction-history',
    title: 'Riwayat Transaksi',
    description: 'Pantau semua transaksi bisnis Anda. Filter berdasarkan kategori, tanggal, dan jenis transaksi.',
    icon: <History className="w-6 h-6 text-gray-600" />,
    category: 'advanced'
  },
  {
    id: 'financial-reports',
    title: 'Laporan Keuangan',
    description: 'Dapatkan insight mendalam tentang performa bisnis Anda dengan laporan keuangan otomatis.',
    icon: <PieChart className="w-6 h-6 text-indigo-600" />,
    category: 'advanced'
  },
  {
    id: 'mobile-responsive',
    title: 'Mobile Friendly',
    description: 'Akses SmartVerse dari mana saja. Interface responsive yang optimal untuk desktop, tablet, dan smartphone.',
    icon: <Smartphone className="w-6 h-6 text-pink-600" />,
    category: 'advanced'
  },
  {
    id: 'security',
    title: 'Keamanan Tingkat Tinggi',
    description: 'Transaksi diamankan dengan teknologi blockchain. Smart contract audited dan sistem multi-signature untuk keamanan maksimal.',
    icon: <Shield className="w-6 h-6 text-red-700" />,
    category: 'advanced'
  },
  {
    id: 'completion',
    title: 'Siap Memulai!',
    description: 'Anda telah menyelesaikan tour SmartVerse. Mulai eksplorasi dan manfaatkan semua fitur yang tersedia. Selamat berbisnis!',
    icon: <Star className="w-6 h-6 text-yellow-500" />,
    category: 'general'
  }
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  tourType: 'full' | 'business' | 'general';
  isBusinessUser?: boolean;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onClose,
  tourType,
  isBusinessUser = false
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showCategories, setShowCategories] = useState(true);

  // Filter steps based on tour type
  const getFilteredSteps = () => {
    switch (tourType) {
      case 'business':
        return TOUR_STEPS.filter(step => 
          step.category === 'business' || 
          step.id === 'welcome' || 
          step.id === 'completion'
        );
      case 'general':
        return TOUR_STEPS.filter(step => step.category === 'general');
      case 'full':
      default:
        return TOUR_STEPS;
    }
  };

  const filteredSteps = getFilteredSteps();
  const totalSteps = filteredSteps.length;
  const currentStepData = filteredSteps[currentStep];
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    onClose();
  };

  const startSpecificTour = (type: 'full' | 'business' | 'general') => {
    setShowCategories(false);
    setCurrentStep(0);
  };

  // Reset when tour type changes
  useEffect(() => {
    setCurrentStep(0);
    setShowCategories(tourType === 'full');
  }, [tourType, isOpen]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white border border-gray-200 shadow-2xl">
        {showCategories && tourType === 'full' ? (
          // Category Selection Screen
          <div className="p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
                <Star className="w-8 h-8 text-yellow-500" />
                Selamat Datang di SmartVerse!
              </DialogTitle>
              <DialogDescription className="text-center text-lg">
                Pilih jenis tour yang ingin Anda ikuti
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                onClick={() => startSpecificTour('general')}
              >
                <CardHeader className="text-center pb-3">
                  <Wallet className="w-12 h-12 mx-auto text-blue-600 mb-2" />
                  <CardTitle className="text-lg">Tour Umum</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Fitur dasar SmartVerse: wallet, kirim token, QR scanner
                  </p>
                  <Badge variant="secondary">5 menit</Badge>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                onClick={() => startSpecificTour('business')}
              >
                <CardHeader className="text-center pb-3">
                  <Building2 className="w-12 h-12 mx-auto text-indigo-600 mb-2" />
                  <CardTitle className="text-lg">Tour Bisnis</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Khusus fitur bisnis: vault, QR pembayaran, deposit, withdraw
                  </p>
                  <Badge variant="secondary">7 menit</Badge>
                  {isBusinessUser && (
                    <Badge variant="default" className="ml-2">Recommended</Badge>
                  )}
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                onClick={() => startSpecificTour('full')}
              >
                <CardHeader className="text-center pb-3">
                  <Star className="w-12 h-12 mx-auto text-yellow-600 mb-2" />
                  <CardTitle className="text-lg">Tour Lengkap</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Semua fitur SmartVerse dari dasar hingga advanced
                  </p>
                  <Badge variant="secondary">12 menit</Badge>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Button variant="outline" onClick={skipTour}>
                Lewati Tour
              </Button>
            </div>
          </div>
        ) : (
          // Tour Content
          <div className="p-6">
            <DialogHeader className="mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentStepData.icon}
                  <div>
                    <DialogTitle className="text-xl font-bold">
                      {currentStepData.title}
                      {currentStepData.highlight && (
                        <Badge className="ml-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                          BARU!
                        </Badge>
                      )}
                    </DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {currentStep + 1} dari {totalSteps}
                      </Badge>
                      <Badge 
                        variant={currentStepData.category === 'business' ? 'default' : 
                                currentStepData.category === 'advanced' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {currentStepData.category === 'business' ? 'Bisnis' :
                         currentStepData.category === 'advanced' ? 'Advanced' : 'Umum'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={skipTour}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogHeader>

            <div className="mb-6">
              <Progress value={progress} className="mb-2" />
              <p className="text-xs text-muted-foreground text-center">
                Progress: {Math.round(progress)}%
              </p>
            </div>

            <div className="min-h-[300px] flex items-center justify-center">
              <div className="text-center max-w-lg">
                <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                  <div className="flex justify-center mb-4">
                    {React.cloneElement(currentStepData.icon as React.ReactElement, {
                      className: "w-16 h-16"
                    })}
                  </div>
                  <DialogDescription className="text-lg leading-relaxed text-gray-700">
                    {currentStepData.description}
                  </DialogDescription>
                </div>

                {currentStepData.actionText && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">
                      💡 Tip: {currentStepData.actionText}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Sebelumnya
                </Button>
                <Button variant="ghost" onClick={skipTour} size="sm">
                  Lewati
                </Button>
              </div>
              
              {currentStep === totalSteps - 1 ? (
                <Button onClick={onClose} className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                  <Star className="w-4 h-4 mr-2" />
                  Selesai
                </Button>
              ) : (
                <Button onClick={nextStep}>
                  Selanjutnya
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingTour;
