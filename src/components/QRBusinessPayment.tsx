import React, { useState, useEffect } from 'react';
import { useAccount, useChainId, useReadContract, useWriteContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { waitForTransactionReceipt } from '@wagmi/core';
import { config } from '@/wagmi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { QrCode, ScanLine, AlertCircle, ChevronRight, Check, Loader2, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { BusinessVault_ABI, MockIDRT_ABI, BUSINESS_CONTRACTS } from '../contracts/BusinessContracts';

// Interface untuk QR Dinamis
interface DynamicQrData {
  address: `0x${string}`;
  amount: string;
  category: string;
  token?: `0x${string}`;
}

// Komponen utama QR Payment yang menangani alur pembayaran
const QRBusinessPayment: React.FC = () => {
  const { address, chain } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  
  // State untuk QR scan
  const [scanMode, setScanMode] = useState<'static' | 'dynamic'>('static');
  const [qrScanActive, setQrScanActive] = useState(false);
  const [scannedVaultAddress, setScannedVaultAddress] = useState<`0x${string}` | null>(null);
  const [scannedQrData, setScannedQrData] = useState<DynamicQrData | null>(null);
  
  // State untuk form pembayaran
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentToken, setPaymentToken] = useState<'native' | 'token'>('native');
  const [selectedTokenAddress, setSelectedTokenAddress] = useState<`0x${string}` | ''>('');
  const [paymentCategory, setPaymentCategory] = useState('Pembayaran QR');
  
  // State untuk dialog konfirmasi dan status transaksi
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'confirming' | 'success' | 'failed'>('idle');
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  
  // Token list options
  const tokenOptions = [
    { id: 'native', name: 'ETH', address: '' },
    { id: 'idrt', name: 'IDRT', address: BUSINESS_CONTRACTS.sepolia.contracts.MockIDRT as `0x${string}` }
  ];
  
  // Helpers untuk format dan validasi
  const formatAmount = (amount: string): string => {
    // Format amount with 2 decimal places
    const value = parseFloat(amount);
    return isNaN(value) ? '0.00' : value.toFixed(2);
  };
  
  const validatePayment = (): boolean => {
    if (!scannedVaultAddress) return false;
    if (paymentToken === 'native' && (!paymentAmount || parseFloat(paymentAmount) <= 0)) return false;
    if (paymentToken === 'token' && (!selectedTokenAddress || !paymentAmount || parseFloat(paymentAmount) <= 0)) return false;
    return true;
  };
  
  // Helpers untuk parsing QR code
  const parseStaticQrCode = (data: string): `0x${string}` | null => {
    // For static QR, we expect either:
    // 1. Direct address: 0x...
    // 2. EIP-681 format: ethereum:0x...
    
    if (data.startsWith('0x')) {
      return data as `0x${string}`;
    } else if (data.startsWith('ethereum:')) {
      const address = data.split(':')[1].split('?')[0];
      return address as `0x${string}`;
    }
    return null;
  };
  
  const parseDynamicQrCode = (data: string): DynamicQrData | null => {
    // For dynamic QR, we expect a URL format:
    // smartverse://pay?address=0x...&amount=0.1&category=Food&token=0x...
    
    try {
      if (data.startsWith('smartverse://pay')) {
        const url = new URL(data.replace('smartverse://', 'https://'));
        const params = new URLSearchParams(url.search);
        
        const address = params.get('address');
        const amount = params.get('amount');
        const category = params.get('category') || 'Pembayaran QR';
        const token = params.get('token');
        
        if (!address || !amount) return null;
        
        return {
          address: address as `0x${string}`,
          amount,
          category,
          token: token ? token as `0x${string}` : undefined
        };
      }
      return null;
    } catch (e) {
      console.error('Error parsing dynamic QR code:', e);
      return null;
    }
  };
  
  // Simulasi scan QR code (akan digantikan dengan library QR scanner)
  const simulateScanQR = () => {
    setQrScanActive(true);
    
    // Dummy data untuk simulasi - dalam implementasi nyata ini akan diganti scanner sesungguhnya
    // Catatan: Di implementasi nyata, gunakan library seperti react-qr-reader atau @zxing/library
    
    setTimeout(() => {
      if (scanMode === 'static') {
        // Contoh static QR (alamat saja)
        // Dalam aplikasi sesungguhnya, ini akan dibaca dari kamera
        const dummyStaticQR = 'ethereum:0x123456789abcdef123456789abcdef123456789a';
        const parsedAddress = parseStaticQrCode(dummyStaticQR);
        
        if (parsedAddress) {
          setScannedVaultAddress(parsedAddress);
        }
      } else {
        // Contoh dynamic QR (semua informasi pembayaran)
        const dummyDynamicQR = 'smartverse://pay?address=0x123456789abcdef123456789abcdef123456789a&amount=0.05&category=Makanan&token=0x0000000000000000000000000000000000000000';
        const parsedData = parseDynamicQrCode(dummyDynamicQR);
        
        if (parsedData) {
          setScannedQrData(parsedData);
          setScannedVaultAddress(parsedData.address);
          setPaymentAmount(parsedData.amount);
          setPaymentCategory(parsedData.category);
          
          if (parsedData.token) {
            setPaymentToken('token');
            setSelectedTokenAddress(parsedData.token);
          } else {
            setPaymentToken('native');
          }
        }
      }
      
      setQrScanActive(false);
    }, 1500);
  };
  
  // Approve token sebelum transfer
  const approveToken = async (tokenAddress: `0x${string}`, spender: `0x${string}`, amount: string): Promise<boolean> => {
    try {
      const amountInWei = parseUnits(amount, 18);
      
      console.log('🔄 Approving token transfer...');
      console.log('Token:', tokenAddress);
      console.log('Spender (BusinessVault):', spender);
      console.log('Amount:', amount, '(', amountInWei.toString(), 'wei)');
      
      // Approve token spending
      const hash = await writeContractAsync({
        address: tokenAddress,
        abi: MockIDRT_ABI,
        functionName: 'approve',
        args: [spender, amountInWei],
        account: address,
        chain: chain
      });
      
      console.log('✅ Token approval successful:', hash);
      return true;
    } catch (error) {
      console.error('❌ Error approving token:', error);
      return false;
    }
  };
  
  // Verify transaction was recorded
  const verifyTransaction = async (vaultAddress: `0x${string}`): Promise<boolean> => {
    try {
      // In a real implementation, we would check the transaction logs or events
      // from the contract to verify the transaction was recorded
      
      // Contoh verifikasi sederhana: periksa balance atau coba baca data transaksi terakhir
      console.log('📊 Verifying transaction in the vault:', vaultAddress);
      
      // Di implementasi nyata, gunakan useReadContract untuk membaca data dari BusinessVault
      // misalnya, getLastTransaction() atau getTransactionCount()
      
      // Contoh: 
      // const result = await readContract({
      //   address: vaultAddress,
      //   abi: BusinessVault_ABI,
      //   functionName: 'getLastTransactionId',
      //   args: [address]
      // });
      
      // if (result) {
      //   console.log('✅ Transaction verified with ID:', result);
      //   return true;
      // }
      
      // Untuk sementara, kita anggap berhasil
      return true;
    } catch (error) {
      console.error('Error verifying transaction recording:', error);
      return false;
    }
  };
  
  // Process payment with confirmation
  const processPayment = async () => {
    if (!scannedVaultAddress || !address) return;
    
    setProcessingPayment(true);
    setPaymentError(null);
    setTransactionStatus('pending');
    
    try {
      let transactionHash;
      
      if (paymentToken === 'native') {
        // Native token payment (ETH)
        const amountInWei = parseUnits(paymentAmount, 18);
        
        console.log('🔄 Processing native token payment...');
        console.log('Receiver (BusinessVault):', scannedVaultAddress);
        console.log('Amount:', paymentAmount, 'ETH (', amountInWei.toString(), 'wei)');
        console.log('Category:', paymentCategory);
        
        // PENTING: Pastikan menggunakan depositNative untuk mencatat transaksi
        // Jangan gunakan transfer biasa karena tidak akan tercatat di vault
        transactionHash = await writeContractAsync({
          address: scannedVaultAddress,
          abi: BusinessVault_ABI,
          functionName: 'depositNative',
          args: [paymentCategory],
          value: amountInWei,
          account: address,
          chain: chain
        });
      } else if (selectedTokenAddress) {
        // ERC20 token payment
        const amountInWei = parseUnits(paymentAmount, 18);
        
        console.log('🔄 Processing ERC20 token payment...');
        console.log('Token:', selectedTokenAddress);
        console.log('Receiver (BusinessVault):', scannedVaultAddress);
        console.log('Amount:', paymentAmount, 'IDRT (', amountInWei.toString(), 'wei)');
        console.log('Category:', paymentCategory);
        
        // Step 1: Approve token spending
        console.log('Step 1: Approving token transfer...');
        const approved = await approveToken(selectedTokenAddress, scannedVaultAddress, paymentAmount);
        if (!approved) throw new Error('Token approval failed');
        
        // Step 2: Call depositToken (PENTING)
        // Ini berbeda dengan transfer() biasa karena fungsi ini akan mencatat transaksi di vault
        console.log('Step 2: Calling depositToken on BusinessVault...');
        transactionHash = await writeContractAsync({
          address: scannedVaultAddress,
          abi: BusinessVault_ABI,
          functionName: 'depositToken',
          args: [selectedTokenAddress, amountInWei, paymentCategory],
          account: address,
          chain: chain
        });
      }
      
      // Simpan hash transaksi
      setTxHash(transactionHash);
      
      console.log('✅ Payment transaction sent:', transactionHash);
      console.log('⏳ Menunggu konfirmasi blockchain...');
      
      // Update status ke confirming
      setTransactionStatus('confirming');
      
      // Tunggu konfirmasi transaksi
      try {
        const receipt = await waitForTransactionReceipt(config, {
          hash: transactionHash,
        });
        
        console.log('📝 Transaction receipt:', receipt);
        
        if (receipt.status === 'success') {
          console.log('✅ Transaction confirmed successfully!');
          setTransactionStatus('success');
          setPaymentSuccess(true);
          
          // Verify transaction record on vault
          const verified = await verifyTransaction(scannedVaultAddress);
          if (!verified) {
            console.warn('⚠️ Transaction may not be properly recorded in vault');
          }
        } else {
          console.error('❌ Transaction failed on blockchain');
          setTransactionStatus('failed');
          setPaymentError('Transaksi gagal di blockchain. Silakan coba lagi.');
        }
      } catch (receiptError) {
        console.error('❌ Error waiting for receipt:', receiptError);
        setTransactionStatus('failed');
        setPaymentError('Tidak dapat mengonfirmasi transaksi. Silakan periksa di block explorer.');
      }
    } catch (error) {
      console.error('❌ Payment error:', error);
      setTransactionStatus('failed');
      setPaymentError('Pembayaran gagal. Silakan coba lagi.');
    } finally {
      setProcessingPayment(false);
    }
  };
  
  // Reset scan state
  const resetScan = () => {
    setScannedVaultAddress(null);
    setScannedQrData(null);
    setPaymentAmount('');
    setPaymentToken('native');
    setSelectedTokenAddress('');
    setPaymentCategory('Pembayaran QR');
    setPaymentSuccess(false);
    setPaymentError(null);
    setTransactionStatus('idle');
    setTxHash(null);
    setConfirmDialogOpen(false);  // Tutup dialog jika terbuka
  };
  
  // Effect untuk menangani auto-close ketika transaksi berhasil
  useEffect(() => {
    let closeTimer: NodeJS.Timeout | null = null;
    
    if (transactionStatus === 'success') {
      closeTimer = setTimeout(() => {
        resetScan();
      }, 5000);
    }
    
    return () => {
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [transactionStatus]);
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Scan QR Bisnis</CardTitle>
          <CardDescription>
            Pindai QR code untuk melakukan pembayaran ke bisnis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={scanMode} onValueChange={(value) => setScanMode(value as 'static' | 'dynamic')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="static">QR Statis</TabsTrigger>
              <TabsTrigger value="dynamic">QR Dinamis</TabsTrigger>
            </TabsList>
            
            <TabsContent value="static">
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  QR Statis hanya berisi alamat. Anda perlu memasukkan jumlah dan detail pembayaran.
                </p>
                
                {scannedVaultAddress && scanMode === 'static' ? (
                  <div className="space-y-4">
                    <Alert className="bg-green-50 border-green-200">
                      <AlertDescription className="text-green-600 flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        QR code terbaca! Masukkan detail pembayaran.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="paymentAmount">Jumlah Pembayaran</Label>
                        <Input
                          id="paymentAmount"
                          placeholder="0.00"
                          type="number"
                          step="0.01"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="paymentToken">Metode Pembayaran</Label>
                        <Select 
                          value={paymentToken} 
                          onValueChange={(value) => {
                            setPaymentToken(value as 'native' | 'token');
                            if (value === 'token') {
                              setSelectedTokenAddress(BUSINESS_CONTRACTS.sepolia.contracts.MockIDRT as `0x${string}`);
                            } else {
                              setSelectedTokenAddress('');
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih metode pembayaran" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="native">ETH (Native)</SelectItem>
                            <SelectItem value="token">IDRT (Token)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="paymentCategory">Kategori</Label>
                        <Input
                          id="paymentCategory"
                          placeholder="Makanan, Retail, dll"
                          value={paymentCategory}
                          onChange={(e) => setPaymentCategory(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={() => setConfirmDialogOpen(true)}
                      disabled={!validatePayment()}
                    >
                      Lanjutkan Pembayaran
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Button 
                      onClick={simulateScanQR} 
                      disabled={qrScanActive}
                      className="mb-4"
                      variant="outline"
                      size="lg"
                    >
                      <ScanLine className="mr-2 h-5 w-5" />
                      {qrScanActive ? 'Memindai...' : 'Pindai QR Code'}
                    </Button>
                    <p className="text-xs text-gray-500 text-center">
                      Arahkan kamera ke QR Code pembayaran
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="dynamic">
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  QR Dinamis berisi semua informasi pembayaran. Anda hanya perlu memindai dan mengkonfirmasi.
                </p>
                
                {scannedQrData && scanMode === 'dynamic' ? (
                  <div className="space-y-4">
                    <Alert className="bg-green-50 border-green-200">
                      <AlertDescription className="text-green-600 flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        QR code terbaca! Konfirmasi detail pembayaran.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-sm text-gray-500">Penerima:</div>
                        <div className="text-sm font-medium truncate">{scannedQrData.address.substring(0, 6)}...{scannedQrData.address.substring(38)}</div>
                        
                        <div className="text-sm text-gray-500">Jumlah:</div>
                        <div className="text-sm font-medium">{scannedQrData.amount} {scannedQrData.token ? 'IDRT' : 'ETH'}</div>
                        
                        <div className="text-sm text-gray-500">Kategori:</div>
                        <div className="text-sm font-medium">{scannedQrData.category}</div>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={() => setConfirmDialogOpen(true)}
                    >
                      Konfirmasi Pembayaran
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Button 
                      onClick={simulateScanQR} 
                      disabled={qrScanActive}
                      className="mb-4"
                      variant="outline"
                      size="lg"
                    >
                      <ScanLine className="mr-2 h-5 w-5" />
                      {qrScanActive ? 'Memindai...' : 'Pindai QR Code'}
                    </Button>
                    <p className="text-xs text-gray-500 text-center">
                      Arahkan kamera ke QR Code pembayaran dinamis
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Reset Button */}
      {(scannedVaultAddress || scannedQrData) && (
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={resetScan}
        >
          Mulai Ulang
        </Button>
      )}
      
      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
            <DialogDescription>
              Pastikan detail pembayaran di bawah ini benar
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-gray-500">Penerima:</div>
              <div className="text-sm font-medium truncate">
                {scannedVaultAddress ? `${scannedVaultAddress.substring(0, 6)}...${scannedVaultAddress.substring(38)}` : '-'}
              </div>
              
              <div className="text-sm text-gray-500">Jumlah:</div>
              <div className="text-sm font-medium">
                {paymentAmount} {paymentToken === 'native' ? 'ETH' : 'IDRT'}
              </div>
              
              <div className="text-sm text-gray-500">Kategori:</div>
              <div className="text-sm font-medium">{paymentCategory}</div>
            </div>
            
            {/* Status Transaksi */}
            {transactionStatus === 'pending' && (
              <Alert className="bg-blue-50 border-blue-200">
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin mr-2" />
                <AlertDescription className="text-blue-600">
                  Memproses transaksi...
                </AlertDescription>
              </Alert>
            )}
            
            {transactionStatus === 'confirming' && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <Loader2 className="h-4 w-4 text-yellow-600 animate-spin mr-2" />
                <AlertDescription className="text-yellow-600">
                  Menunggu konfirmasi blockchain...
                </AlertDescription>
              </Alert>
            )}
            
            {transactionStatus === 'success' && (
              <Alert className="bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-600 mr-2" />
                <AlertDescription className="text-green-600">
                  Pembayaran berhasil! Transaksi tercatat di vault.
                </AlertDescription>
              </Alert>
            )}
            
            {transactionStatus === 'failed' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{paymentError || 'Transaksi gagal. Silakan coba lagi.'}</AlertDescription>
              </Alert>
            )}
            
            {/* Link ke Etherscan */}
            {txHash && (
              <div className="mt-2 text-center">
                <a 
                  href={`https://sepolia.etherscan.io/tx/${txHash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm flex items-center justify-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Lihat di Etherscan
                </a>
              </div>
            )}
            
            {/* Auto-close dialog after success */}
            {transactionStatus === 'success' && (
              <div className="mt-2 text-center text-sm text-gray-500">
                Dialog akan tertutup dalam 5 detik...
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              onClick={processPayment}
              className="w-full"
              disabled={processingPayment || transactionStatus === 'confirming' || transactionStatus === 'success'}
            >
              {transactionStatus === 'pending' && (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              )}
              {transactionStatus === 'confirming' && (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengonfirmasi...
                </>
              )}
              {transactionStatus === 'success' && (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Berhasil
                </>
              )}
              {transactionStatus === 'failed' && 'Coba Lagi'}
              {transactionStatus === 'idle' && 'Bayar Sekarang'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { QRBusinessPayment };
