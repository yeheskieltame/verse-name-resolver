import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  QrCode, 
  Copy, 
  Download, 
  Share,
  Check,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { parseUnits } from 'viem';
import QRCode from 'qrcode';
import { BUSINESS_CONTRACTS } from '../contracts/BusinessContracts';
import { crossChainNameService } from '@/services/crossChainNameService';

interface QRBusinessGeneratorProps {
  vaultAddress: `0x${string}`;
  businessName: string;
}

const QRBusinessGenerator: React.FC<QRBusinessGeneratorProps> = ({ 
  vaultAddress, 
  businessName 
}) => {
  // State untuk mode QR
  const [qrMode, setQrMode] = useState<'static' | 'dynamic'>('static');
  
  // State untuk form input
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Pembayaran QR',
    tokenAddress: '',
    currency: 'ETH'
  });
  
  // State untuk QR code yang dihasilkan
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Token list untuk dropdown
  const tokenOptions = [
    {
      label: 'MockIDRT',
      value: BUSINESS_CONTRACTS.sepolia.contracts.MockIDRT,
      currency: 'IDRT'
    }
  ];
  
  // Ref untuk QR Code canvas
  const qrCodeRef = useRef<HTMLDivElement>(null);
  
  // Handler untuk perubahan input form
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Utility: generate URL untuk QR code
  const generateQRUrl = () => {
    try {
      setIsGenerating(true);
      
      // Validasi input
      if (qrMode === 'dynamic' && (!formData.amount || parseFloat(formData.amount) <= 0)) {
        throw new Error('Jumlah pembayaran harus lebih dari 0');
      }
      
      if (!formData.category) {
        throw new Error('Kategori harus diisi');
      }
      
      if (qrMode === 'dynamic' && formData.currency === 'IDRT' && !formData.tokenAddress) {
        throw new Error('Alamat token harus diisi untuk pembayaran token');
      }
      
      let url = '';
      
      // Gunakan service untuk generate URL yang benar
      if (qrMode === 'static') {
        // QR Statis - tanpa amount
        url = crossChainNameService.generateBusinessVaultQR(
          vaultAddress,
          undefined,
          formData.category
        );
      } else {
        // QR Dinamis - dengan amount
        url = crossChainNameService.generateBusinessVaultQR(
          vaultAddress,
          formData.amount,
          formData.category,
          formData.currency === 'IDRT' ? formData.tokenAddress : undefined,
          formData.currency === 'IDRT' ? formData.currency : undefined
        );
      }
      
      return url;
    } catch (error) {
      console.error('Error generating QR URL:', error);
      if (error instanceof Error) {
        alert(error.message);
      }
      return '';
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Generate QR code image dari URL
  const generateQRCode = async () => {
    try {
      setIsGenerating(true);
      
      const url = generateQRUrl();
      if (!url) return;
      
      // Set URL state
      setQrCodeUrl(url);
      
      // Generate QR code image
      const qrCodeDataUrl = await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
        errorCorrectionLevel: 'H' // Higher error correction for better scanning
      });
      
      // Set image state
      setQrCodeImage(qrCodeDataUrl);
      
      console.log('QR code generated successfully:', url);
    } catch (error) {
      console.error('Error generating QR code:', error);
      if (error instanceof Error) {
        alert('Gagal membuat QR code: ' + error.message);
      }
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Copy URL ke clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };
  
  // Download QR code image
  const downloadQRCode = () => {
    if (!qrCodeImage) return;
    
    const link = document.createElement('a');
    link.download = `qr-payment-${businessName.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = qrCodeImage;
    link.click();
  };
  
  // Reset form dan QR code
  const resetForm = () => {
    setFormData({
      amount: '',
      category: 'Pembayaran QR',
      tokenAddress: '',
      currency: 'ETH'
    });
    setQrCodeImage('');
    setQrCodeUrl('');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          Buat QR Code Pembayaran
        </CardTitle>
        <CardDescription>
          Buat QR code untuk menerima pembayaran dari pelanggan
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs value={qrMode} onValueChange={(value) => setQrMode(value as 'static' | 'dynamic')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="static">QR Statis</TabsTrigger>
            <TabsTrigger value="dynamic">QR Dinamis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="static" className="space-y-4 pt-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                QR Statis berisi link ke SmartVerse DApp. Pelanggan akan dipandu untuk melakukan deposit ke Vault Anda.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Alamat Vault</Label>
              <Input
                id="vaultAddress"
                value={vaultAddress}
                readOnly
                className="font-mono text-xs"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="dynamic" className="space-y-4 pt-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                QR Dinamis berisi link ke SmartVerse DApp dengan jumlah dan kategori. Pelanggan hanya perlu memindai dan mengkonfirmasi.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="currency">Jenis Mata Uang</Label>
              <Select value={formData.currency} onValueChange={(value) => {
                handleInputChange('currency', value);
                // Reset token address jika dipilih ETH
                if (value === 'ETH') {
                  handleInputChange('tokenAddress', '');
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis mata uang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ETH">ETH (Native)</SelectItem>
                  <SelectItem value="IDRT">IDRT (Token)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.currency === 'IDRT' && (
              <div className="space-y-2">
                <Label htmlFor="tokenAddress">Pilih Token</Label>
                <Select
                  value={formData.tokenAddress}
                  onValueChange={value => handleInputChange('tokenAddress', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Token" />
                  </SelectTrigger>
                  <SelectContent>
                    {tokenOptions.map(token => (
                      <SelectItem key={token.label} value={token.value}>
                        {token.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah ({formData.currency})</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Kategori/Deskripsi</Label>
              <Input
                id="category"
                placeholder="Contoh: Kopi Susu, Makanan, Jasa"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Generate Button */}
        <Button 
          onClick={generateQRCode}
          disabled={isGenerating || (qrMode === 'dynamic' && (!formData.amount || (formData.currency === 'IDRT' && !formData.tokenAddress)))}
          className="w-full"
        >
          {isGenerating ? 'Membuat QR...' : 'Buat QR Pembayaran'}
          <QrCode className="w-4 h-4 ml-2" />
        </Button>
        
        {/* QR Code Display */}
        {qrCodeImage && (
          <div className="space-y-4 pt-4">
            <div ref={qrCodeRef} className="w-full max-w-[256px] mx-auto bg-white border-2 border-gray-200 rounded-lg p-4">
              <img 
                src={qrCodeImage} 
                alt="QR Code Pembayaran" 
                className="w-full h-auto"
              />
            </div>
            
            {/* Payment Info */}
            <div className="w-full space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Bisnis:</span>
                <span className="font-medium">{businessName}</span>
              </div>
              
              {qrMode === 'dynamic' && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Jumlah:</span>
                    <span className="font-bold text-lg text-green-600">
                      {formData.amount} {formData.currency}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Kategori:</span>
                    <span className="font-medium">{formData.category}</span>
                  </div>
                </>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={copyToClipboard}
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
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                  >
                    <Share className="w-4 h-4 mr-2" />
                    Bagikan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bagikan QR Code</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="flex flex-col items-center gap-4">
                      <img 
                        src={qrCodeImage} 
                        alt="QR Code untuk dibagikan" 
                        className="w-48 h-48 object-contain"
                      />
                      <p className="text-center text-sm text-gray-500">
                        Gunakan QR code ini untuk menerima pembayaran dari pelanggan Anda.
                      </p>
                    </div>
                    <Input
                      value={qrCodeUrl}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button 
                      variant="outline" 
                      onClick={copyToClipboard}
                    >
                      {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      {copied ? 'Disalin!' : 'Salin Link'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Reset Button */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={resetForm}
              className="w-full"
            >
              Buat QR Code Baru
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { QRBusinessGenerator };
