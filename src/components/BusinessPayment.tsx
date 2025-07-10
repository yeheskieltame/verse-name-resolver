import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  QrCode, 
  Copy, 
  Download, 
  Share,
  Store,
  CreditCard,
  Send,
  ArrowRight,
  Check,
  AlertCircle
} from 'lucide-react';
import { BusinessDataManager, PaymentRequest } from '../services/businessDataManager';
import { useAccount } from 'wagmi';
import QRCode from 'qrcode';
import { BUSINESS_CONTRACTS } from '../contracts/BusinessContracts';
import { parseUnits } from 'viem';

interface BusinessPaymentProps {
  vaultAddress: string;
  businessName: string;
  onClose?: () => void;
}

const BusinessPayment: React.FC<BusinessPaymentProps> = ({ 
  vaultAddress, 
  businessName, 
  onClose 
}) => {
  const { address } = useAccount();
  
  const [paymentAsset, setPaymentAsset] = useState<'native' | 'token'>('native');
  const [formData, setFormData] = useState({
    amount: '',
    tokenAddress: '', // only for token
    category: '',
    currency: 'ETH', // ETH or IDRT
    expiryMinutes: '30'
  });
  
  const [generatedQR, setGeneratedQR] = useState<string>('');
  const [qrCodeImage, setQRCodeImage] = useState<string>('');
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Token list for dropdown
  const tokenOptions = [
    {
      label: 'MockIDRT',
      value: BUSINESS_CONTRACTS.sepolia.contracts.MockIDRT,
      currency: 'IDRT'
    },
    {
      label: 'IDRT (soon)',
      value: '',
      currency: 'IDRT'
    },
    {
      label: 'USDC (soon)',
      value: '',
      currency: 'USDC'
    }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Utility: generate EIP-681 payment URL
  function generateEIP681PaymentUrl({
    vaultAddress,
    amount,
    currency,
    tokenAddress,
    chainId = 11155111
  }: {
    vaultAddress: string;
    amount: string;
    currency: 'ETH' | 'IDRT';
    tokenAddress?: string;
    chainId?: number;
  }) {
    const amountInWei = amount ? parseUnits(amount, 18).toString() : '0';
    if (currency === 'ETH') {
      return `ethereum:${vaultAddress}?value=${amountInWei}&chainId=${chainId}`;
    } else if (currency === 'IDRT' && tokenAddress) {
      // EIP-681 for ERC20 transfer
      return `ethereum:${tokenAddress}/transfer?address=${vaultAddress}&uint256=${amountInWei}&chainId=${chainId}`;
    }
    return '';
  }

  const generatePaymentQR = async () => {
    try {
      setIsGenerating(true);
      const total = formData.amount;
      if (!total || parseFloat(total) <= 0) {
        throw new Error('Jumlah pembayaran harus lebih dari 0');
      }
      if (!formData.category) {
        throw new Error('Kategori harus diisi');
      }
      if (paymentAsset === 'token' && !formData.tokenAddress) {
        throw new Error('Alamat token harus diisi');
      }
      // Create payment request sesuai ABI
      const request: any = {
        id: BusinessDataManager.generatePaymentId(),
        businessVaultAddress: vaultAddress,
        businessName,
        paymentAsset,
        amount: total,
        tokenAddress: paymentAsset === 'token' ? formData.tokenAddress : undefined,
        category: formData.category,
        currency: paymentAsset === 'token' ? 'IDRT' : 'ETH',
        createdAt: Date.now(),
        expiresAt: Date.now() + (parseInt(formData.expiryMinutes) * 60 * 1000),
        status: 'pending'
      };
      BusinessDataManager.createPaymentRequest(request);
      // --- Ganti: generate QR pakai EIP-681 ---
      const qrData = generateEIP681PaymentUrl({
        vaultAddress,
        amount: total,
        currency: request.currency,
        tokenAddress: request.tokenAddress,
        chainId: 11155111
      });
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      });
      setPaymentRequest(request);
      setGeneratedQR(qrData);
      setQRCodeImage(qrCodeDataUrl);
      console.log('Payment QR generated:', { paymentId: request.id, qrData, request });
    } catch (error) {
      console.error('Error generating payment QR:', error);
      alert('Gagal membuat QR pembayaran: ' + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeImage || !paymentRequest) return;
    
    const link = document.createElement('a');
    link.download = `qr-pembayaran-${paymentRequest.id}.png`;
    link.href = qrCodeImage;
    link.click();
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      tokenAddress: '', // only for token
      category: '',
      currency: 'ETH', // ETH or IDRT
      expiryMinutes: '30'
    });
    setGeneratedQR('');
    setQRCodeImage('');
    setPaymentRequest(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pembayaran UMKM - {businessName}
          </h1>
          <p className="text-gray-600">
            Buat QR Code untuk menerima pembayaran dari pelanggan
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Buat Pembayaran Baru
                </CardTitle>
                <CardDescription>
                  Pilih jenis pembayaran dan isi detail yang diperlukan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pilih Aset Pembayaran */}
                <div className="space-y-3">
                  <Label>Jenis Aset</Label>
                  <Tabs value={paymentAsset} onValueChange={(value) => setPaymentAsset(value as 'native' | 'token')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="native">ETH (Native)</TabsTrigger>
                      <TabsTrigger value="token">IDRT (Token)</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Input sesuai ABI */}
                {paymentAsset === 'native' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Jumlah (ETH)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Kategori</Label>
                      <Input
                        id="category"
                        placeholder="Contoh: penjualan, donasi"
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                      />
                    </div>
                  </>
                )}
                {paymentAsset === 'token' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="tokenAddress">Pilih Token</Label>
                      <Select
                        value={formData.tokenAddress}
                        onValueChange={value => {
                          handleInputChange('tokenAddress', value);
                          // Set currency otomatis sesuai pilihan
                          const selected = tokenOptions.find(t => t.value === value);
                          handleInputChange('currency', selected?.currency || 'IDRT');
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Token" />
                        </SelectTrigger>
                        <SelectContent>
                          {tokenOptions.filter(token => token.value).map(token => (
                            <SelectItem key={token.label} value={token.value}>
                              {token.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Jumlah ({formData.currency})</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Kategori</Label>
                      <Input
                        id="category"
                        placeholder="Contoh: penjualan, donasi"
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* Expiry for Dynamic QR */}
                {paymentAsset === 'token' && (
                  <div className="space-y-2">
                    <Label htmlFor="expiryMinutes">Berlaku Selama (Menit)</Label>
                    <Select value={formData.expiryMinutes} onValueChange={(value) => handleInputChange('expiryMinutes', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 Menit</SelectItem>
                        <SelectItem value="30">30 Menit</SelectItem>
                        <SelectItem value="60">1 Jam</SelectItem>
                        <SelectItem value="180">3 Jam</SelectItem>
                        <SelectItem value="1440">24 Jam</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Generate Button */}
                <Button 
                  onClick={generatePaymentQR}
                  disabled={isGenerating || !formData.amount || !formData.category || (paymentAsset === 'token' && !formData.tokenAddress)}
                  className="w-full"
                >
                  {isGenerating ? 'Membuat QR...' : 'Buat QR Pembayaran'}
                  <QrCode className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* QR Code Panel */}
          <div className="space-y-6">
            {generatedQR && paymentRequest ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="w-5 h-5" />
                    QR Code Pembayaran
                  </CardTitle>
                  <CardDescription>
                    Tunjukkan QR Code ini kepada pelanggan untuk melakukan pembayaran
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* QR Code Display */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-64 h-64 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center p-4">
                      {qrCodeImage ? (
                        <img 
                          src={qrCodeImage} 
                          alt="QR Code Pembayaran" 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center">
                          <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                          <div className="text-xs text-gray-500">
                            QR Code sedang dimuat...
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Payment Info */}
                    <div className="w-full space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Bisnis:</span>
                        <span className="font-medium">{businessName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Jumlah:</span>
                        <span className="font-bold text-lg text-green-600">
                          {paymentRequest.amount} {paymentRequest.currency}
                        </span>
                      </div>
                      {paymentRequest.description && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Deskripsi:</span>
                          <span className="font-medium">{paymentRequest.description}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Berlaku hingga:</span>
                        <span className="text-sm text-red-600">
                          {new Date(paymentRequest.expiresAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(generatedQR)}
                      className="flex-1"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Disalin!' : 'Salin Link'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={downloadQRCode}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(generatedQR, '_blank')}
                      className="flex-1"
                    >
                      <Share className="w-4 h-4 mr-2" />
                      Bagikan
                    </Button>
                  </div>

                  {/* Payment Instructions */}
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {paymentAsset === 'token' 
                        ? 'Pelanggan dapat memindai QR code ini untuk melakukan pembayaran langsung ke brankas bisnis Anda.'
                        : 'QR code ini dapat digunakan untuk menerima pembayaran melalui transfer biasa.'
                      }
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <QrCode className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-center">
                    Isi form di sebelah kiri untuk membuat QR Code pembayaran
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessPayment;
