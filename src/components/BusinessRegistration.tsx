import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Building2, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Store,
  Coffee,
  ShoppingCart,
  Scissors,
  Car,
  Users,
  Wrench
} from 'lucide-react';
import { useAccount, useChainId, useWalletClient } from 'wagmi';
import { BUSINESS_CONTRACTS, BUSINESS_TYPES, getContractAddress, isSupportedChain } from '../contracts/BusinessContracts';
import { SmartVerseBusinessService } from '../services/smartVerseBusiness';

interface BusinessRegistrationProps {
  onSuccess?: (vaultAddress: string) => void;
  onCancel?: () => void;
}

const BusinessRegistration: React.FC<BusinessRegistrationProps> = ({ onSuccess, onCancel }) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  
  const [formData, setFormData] = useState({
    businessName: '',
    category: '',
    description: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    initialDeposit: ''
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [businessService] = useState(new SmartVerseBusinessService());
  
  const totalSteps = 3;
  
  const categoryIcons = {
    'retail': Store,
    'food': Coffee,
    'ecommerce': ShoppingCart,
    'beauty': Scissors,
    'transport': Car,
    'service': Users,
    'manufacturing': Wrench,
    'other': Building2
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.businessName.trim() !== '' && formData.category !== '';
      case 2:
        return formData.ownerName.trim() !== '' && formData.phone.trim() !== '';
      case 3:
        return formData.initialDeposit !== '' && parseFloat(formData.initialDeposit) >= 0;
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      setError('');
    } else {
      setError('Mohon lengkapi semua field yang diperlukan');
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const handleSubmit = async () => {
    if (!isConnected || !address) {
      setError('Silakan hubungkan wallet Anda');
      return;
    }

    if (!isSupportedChain(chainId)) {
      setError('Jaringan tidak didukung. Silakan ganti ke Sepolia (Chain ID: 11155111)');
      return;
    }

    // Business vault hanya bisa dibuat di Sepolia (Hub Chain)
    if (chainId !== 11155111) {
      setError('Business vault hanya dapat dibuat di Sepolia testnet. Silakan ganti jaringan.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Real blockchain implementation
      console.log('Creating business vault with data:', formData);
      
      // Check if wallet client is available
      if (!walletClient) {
        throw new Error('Wallet client not available');
      }
      
      // Create business vault using real smart contract
      const vaultAddress = await businessService.createBusinessVault(
        formData.businessName,
        formData.category,
        formData.description,
        formData.ownerName,
        walletClient,
        formData.initialDeposit
      );
      
      console.log('✅ Business vault created successfully:', vaultAddress);
      
      setSuccess(true);
      
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(vaultAddress);
        }
      }, 2000);
      
    } catch (err: any) {
      console.error('Error creating business vault:', err);
      setError(err.message || 'Terjadi kesalahan saat membuat bisnis. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="businessName">Nama Bisnis *</Label>
              <Input
                id="businessName"
                placeholder="Contoh: Toko Sembako Berkah"
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Kategori Bisnis *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori bisnis" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BUSINESS_TYPES).map(([key, value]) => {
                    const Icon = categoryIcons[key as keyof typeof categoryIcons];
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4" />
                          <span>{value}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi Bisnis</Label>
              <Textarea
                id="description"
                placeholder="Deskripsikan bisnis Anda secara singkat..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="ownerName">Nama Pemilik *</Label>
              <Input
                id="ownerName"
                placeholder="Nama lengkap pemilik bisnis"
                value={formData.ownerName}
                onChange={(e) => handleInputChange('ownerName', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Telepon *</Label>
              <Input
                id="phone"
                placeholder="08123456789"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Alamat Bisnis</Label>
              <Textarea
                id="address"
                placeholder="Alamat lengkap bisnis Anda"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="initialDeposit">Setoran Awal (IDRT)</Label>
              <Input
                id="initialDeposit"
                type="number"
                placeholder="1000000"
                value={formData.initialDeposit}
                onChange={(e) => handleInputChange('initialDeposit', e.target.value)}
                min="0"
                step="1000"
              />
              <p className="text-sm text-gray-600">
                Setoran awal minimal Rp 0 (opsional)
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Ringkasan Bisnis</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nama Bisnis:</span>
                  <span className="font-medium">{formData.businessName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Kategori:</span>
                  <span className="font-medium">
                    {formData.category ? BUSINESS_TYPES[formData.category as keyof typeof BUSINESS_TYPES] : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pemilik:</span>
                  <span className="font-medium">{formData.ownerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Jaringan:</span>
                  <Badge variant="outline">
                    {chainId && isSupportedChain(chainId) 
                      ? Object.values(BUSINESS_CONTRACTS).find(c => c.chainId === chainId)?.name 
                      : 'Unknown'
                    }
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Bisnis Berhasil Dibuat!
            </h2>
            <p className="text-gray-600 mb-6">
              Brankas digital untuk <strong>{formData.businessName}</strong> telah berhasil dibuat.
              Anda dapat mulai mengelola keuangan bisnis Anda sekarang.
            </p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Lihat Dashboard Bisnis
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            <span>Daftar Bisnis Baru</span>
          </CardTitle>
          <CardDescription>
            Buat brankas digital untuk bisnis UMKM Anda
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}
                  `}>
                    {step < currentStep ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      step
                    )}
                  </div>
                  {step < totalSteps && (
                    <div className={`
                      w-16 h-0.5 mx-2
                      ${step < currentStep ? 'bg-blue-600' : 'bg-gray-200'}
                    `} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-600">Info Bisnis</span>
              <span className="text-xs text-gray-600">Data Pemilik</span>
              <span className="text-xs text-gray-600">Konfirmasi</span>
            </div>
          </div>

          {/* Step Content */}
          {renderStepContent()}

          {/* Error Alert */}
          {error && (
            <Alert className="mt-6" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <div>
              {currentStep > 1 && (
                <Button variant="outline" onClick={handlePrevStep}>
                  Sebelumnya
                </Button>
              )}
              {onCancel && (
                <Button 
                  variant="ghost" 
                  onClick={onCancel}
                  className="ml-2"
                >
                  Batal
                </Button>
              )}
            </div>
            
            <div>
              {currentStep < totalSteps ? (
                <Button 
                  onClick={handleNextStep}
                  disabled={!validateStep(currentStep)}
                >
                  Selanjutnya
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={isLoading || !validateStep(currentStep)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Membuat Bisnis...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Buat Bisnis
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessRegistration;
