import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { QrCode, Wallet, ArrowUpRight, ArrowDownLeft, DollarSign, Building2, Copy, Check, AlertCircle, Loader2, CreditCard, Tag } from 'lucide-react';
import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits, type Address } from 'viem';
import { toast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { BusinessQRParser } from '@/utils/qrParser';
import { crossChainNameService } from '@/services/crossChainNameService';
import { CategoryManager } from './CategoryManager';
import { BUSINESS_CONTRACTS, MockIDRT_ABI, BusinessVault_ABI } from '@/contracts/BusinessContracts';

interface BusinessActionsProps {
  vaultAddress?: string;
  businessName?: string;
  balance?: string;
}

export const BusinessActions: React.FC<BusinessActionsProps> = ({
  vaultAddress = '0x742e8e01A034e15344878B72fE411fCcDB3d7F99',
  businessName = 'My Business',
  balance = '0'
}) => {
  const { address: userAddress, isConnected, chain } = useAccount();
  const chainId = useChainId();
  const { writeContract, isPending: isSendingTx, data: txHash } = useWriteContract();

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Get current network IDRT contract address
  const currentNetwork = Object.values(BUSINESS_CONTRACTS).find(n => n.chainId === chainId);
  const idrtContractAddress = currentNetwork?.contracts?.MockIDRT as Address;

  // Read IDRT balance for this business vault
  const { data: idrtBalance, refetch: refetchBalance } = useReadContract({
    address: idrtContractAddress,
    abi: MockIDRT_ABI,
    functionName: 'balanceOf',
    args: [vaultAddress as Address],
  });

  // Read user's IDRT balance
  const { data: userIdrtBalance } = useReadContract({
    address: idrtContractAddress,
    abi: MockIDRT_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
  });

  // Read user's IDRT allowance for this vault
  const { data: userAllowance, refetch: refetchAllowance } = useReadContract({
    address: idrtContractAddress,
    abi: MockIDRT_ABI,
    functionName: 'allowance',
    args: userAddress ? [userAddress, vaultAddress as Address] : undefined,
  });

  // Format balance for display
  const formattedBalance = idrtBalance ? formatUnits(idrtBalance, 18) : '0';
  const formattedUserBalance = userIdrtBalance ? formatUnits(userIdrtBalance, 18) : '0';

  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCategory, setPaymentCategory] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [copiedQR, setCopiedQR] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Refresh balance periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (idrtContractAddress && vaultAddress) {
        refetchBalance();
      }
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [idrtContractAddress, vaultAddress, refetchBalance]);

  // Generate QR code data only when needed
  const generatePaymentQR = useCallback(() => {
    if (!paymentAmount || !paymentCategory) {
      return '';
    }

    // Use the proper crossChainNameService for consistent QR format
    try {
      return crossChainNameService.generateBusinessVaultQR(
        vaultAddress,
        paymentAmount,
        paymentCategory,
        undefined, // No token address for native ETH payments
        'ETH',
        18,
        chainId // Use current chain ID
      );
    } catch (error) {
      console.error('Error generating business QR:', error);
      return '';
    }
  }, [paymentAmount, paymentCategory, vaultAddress, chainId]);

  const qrCodeData = generatePaymentQR();

  const copyQRToClipboard = async () => {
    if (!qrCodeData) return;
    
    try {
      await navigator.clipboard.writeText(qrCodeData);
      setCopiedQR(true);
      toast({
        title: "QR Code Disalin!",
        description: "URL pembayaran telah disalin ke clipboard",
      });
      setTimeout(() => setCopiedQR(false), 2000);
    } catch (error) {
      toast({
        title: "Gagal Menyalin",
        description: "Tidak dapat menyalin ke clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || !isConnected || !idrtContractAddress || !userAddress) return;

    setIsProcessing(true);
    try {
      const amountInWei = parseUnits(depositAmount, 18);
      
      // Check if user has enough balance
      if (userIdrtBalance && amountInWei > userIdrtBalance) {
        toast({
          title: "Saldo Tidak Cukup",
          description: `Saldo IDRT Anda: Rp ${parseFloat(formattedUserBalance).toLocaleString('id-ID')}`,
          variant: "destructive",
        });
        return;
      }

      // Check if user has enough allowance
      if (!userAllowance || amountInWei > userAllowance) {
        // Need to approve first
        await writeContract({
          abi: MockIDRT_ABI,
          address: idrtContractAddress,
          functionName: 'approve',
          args: [vaultAddress as Address, amountInWei],
          chain: chain,
          account: userAddress as Address,
        });

        toast({
          title: "Persetujuan Diproses",
          description: "Harap tunggu konfirmasi persetujuan transfer",
        });

        // Wait a bit then refetch allowance
        setTimeout(() => {
          refetchAllowance();
        }, 3000);
        return;
      }

      // Now do the actual deposit using BusinessVault depositToken function
      await writeContract({
        abi: BusinessVault_ABI,
        address: vaultAddress as Address,
        functionName: 'depositToken',
        args: [idrtContractAddress, amountInWei, 'Deposit Manual'],
        chain: chain,
        account: userAddress as Address,
      });

      toast({
        title: "Deposit Diproses!",
        description: `Deposit Rp ${parseFloat(depositAmount).toLocaleString('id-ID')} IDRT sedang diproses`,
      });

      // Refresh balance after transaction
      setTimeout(() => {
        refetchBalance();
        refetchAllowance();
      }, 5000);

      setDepositAmount('');
      setDepositDialogOpen(false);
    } catch (error) {
      toast({
        title: "Deposit Gagal",
        description: `Error: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !isConnected || !idrtContractAddress || !userAddress) return;

    setIsProcessing(true);
    try {
      const amountInWei = parseUnits(withdrawAmount, 18);
      
      // Check if business vault has enough balance
      if (idrtBalance && amountInWei > idrtBalance) {
        toast({
          title: "Saldo Vault Tidak Cukup",
          description: `Saldo Vault: Rp ${formatUnits(idrtBalance, 18)} IDRT`,
          variant: "destructive",
        });
        return;
      }

      // Withdraw from BusinessVault
      await writeContract({
        abi: BusinessVault_ABI,
        address: vaultAddress as Address,
        functionName: 'withdrawToken',
        args: [idrtContractAddress, amountInWei, 'Manual Withdraw'],
        chain: chain,
        account: userAddress as Address,
      });

      toast({
        title: "Penarikan Diproses",
        description: `Permintaan penarikan Rp ${parseFloat(withdrawAmount).toLocaleString('id-ID')} IDRT sedang diproses`,
      });

      // Refresh balance after transaction
      setTimeout(() => {
        refetchBalance();
      }, 5000);

      setWithdrawAmount('');
      setWithdrawDialogOpen(false);
    } catch (error) {
      toast({
        title: "Penarikan Gagal",
        description: `Error: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentAmount || !paymentCategory) {
      toast({
        title: "Informasi Tidak Lengkap",
        description: "Silakan isi jumlah dan kategori pembayaran",
        variant: "destructive",
      });
      return;
    }

    if (!isConnected || !idrtContractAddress || !userAddress) return;

    setIsProcessing(true);
    try {
      const amountInWei = parseUnits(paymentAmount, 18);
      
      // Check if user has enough IDRT balance
      if (userIdrtBalance && amountInWei > userIdrtBalance) {
        toast({
          title: "Saldo Tidak Cukup",
          description: `Saldo IDRT Anda: Rp ${parseFloat(formattedUserBalance).toLocaleString('id-ID')}`,
          variant: "destructive",
        });
        return;
      }

      // Check if user has enough allowance for payment
      if (!userAllowance || amountInWei > userAllowance) {
        // Need to approve first
        await writeContract({
          abi: MockIDRT_ABI,
          address: idrtContractAddress,
          functionName: 'approve',
          args: [vaultAddress as Address, amountInWei],
          chain: chain,
          account: userAddress as Address,
        });

        toast({
          title: "Persetujuan Diproses",
          description: "Harap tunggu konfirmasi persetujuan transfer, lalu coba lagi",
        });

        // Wait a bit then refetch allowance
        setTimeout(() => {
          refetchAllowance();
        }, 3000);
        return;
      }

      // Now do the actual payment using BusinessVault depositToken function
      await writeContract({
        abi: BusinessVault_ABI,
        address: vaultAddress as Address,
        functionName: 'depositToken',
        args: [idrtContractAddress, amountInWei, paymentCategory],
        chain: chain,
        account: userAddress as Address,
      });

      toast({
        title: "Pembayaran Diproses!",
        description: `Pembayaran Rp ${parseFloat(paymentAmount).toLocaleString('id-ID')} IDRT untuk ${paymentCategory} sedang diproses`,
      });

      // Refresh balance after transaction
      setTimeout(() => {
        refetchBalance();
        refetchAllowance();
      }, 5000);

      setPaymentAmount('');
      setPaymentCategory('');
      setPaymentMessage('');
    } catch (error) {
      toast({
        title: "Pembayaran Gagal",
        description: `Error: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Silakan hubungkan wallet untuk menggunakan aksi bisnis
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="actions" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="actions">Aksi Bisnis</TabsTrigger>
        <TabsTrigger value="categories">🏷️ Kategori</TabsTrigger>
      </TabsList>

      <TabsContent value="actions" className="space-y-6">
        {/* Business Info */}
        <Card className="business-info-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {businessName}
            </CardTitle>
            <CardDescription>
              Alamat: {vaultAddress}
            </CardDescription>
          </CardHeader>
          <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saldo IDRT Saat Ini</p>
              <p className="text-2xl font-bold">
                {formattedBalance && parseFloat(formattedBalance) > 0 
                  ? `Rp ${parseFloat(formattedBalance).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : 'Rp 0,00'}
              </p>
              <p className="text-xs text-muted-foreground">
                Token IDRT (Indonesian Rupiah Token)
              </p>
              {!idrtContractAddress && (
                <p className="text-xs text-red-500 mt-1">
                  Kontrak IDRT tidak ditemukan di chain ini
                </p>
              )}
            </div>
            <Badge variant="secondary" className="text-xs">
              Chain ID: {chainId}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Generate Payment QR */}
        <Card className="cursor-pointer hover:shadow-md hover:bg-gray-50 transition-all duration-200 payment-qr-card">
          <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
            <DialogTrigger asChild>
              <CardContent className="p-6 text-center">
                <QrCode className="w-8 h-8 mx-auto mb-3 text-blue-600" />
                <h3 className="font-medium mb-1">Terima Pembayaran</h3>
                <p className="text-sm text-muted-foreground">
                  Buat QR code untuk menerima pembayaran
                </p>
              </CardContent>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white border border-gray-200 shadow-xl">
              <DialogHeader>
                <DialogTitle>Buat QR Pembayaran</DialogTitle>
                <DialogDescription>
                  Isi detail pembayaran untuk menghasilkan QR code
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Jumlah (IDRT)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="1000"
                    placeholder="50000"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Dalam Rupiah (contoh: 50000 untuk Rp 50.000)
                  </p>
                </div>
                <div>
                  <Label htmlFor="category">Kategori</Label>
                  <Select value={paymentCategory} onValueChange={setPaymentCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Product">Produk</SelectItem>
                      <SelectItem value="Service">Layanan</SelectItem>
                      <SelectItem value="Food & Beverage">Makanan & Minuman</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Consultation">Konsultasi</SelectItem>
                      <SelectItem value="Other">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="message">Pesan (Opsional)</Label>
                  <Input
                    id="message"
                    placeholder="Deskripsi pembayaran"
                    value={paymentMessage}
                    onChange={(e) => setPaymentMessage(e.target.value)}
                  />
                </div>
                
                {qrCodeData && paymentAmount && paymentCategory && (
                  <div className="text-center space-y-3">
                    <div className="p-4 bg-white rounded-lg border inline-block">
                      <QRCodeSVG value={qrCodeData} size={200} />
                    </div>
                    <Button
                      onClick={copyQRToClipboard}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      {copiedQR ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Disalin!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Salin URL
                        </>
                      )}
                    </Button>
                    <Separator className="my-3" />
                    <Button
                      onClick={handlePayment}
                      disabled={isProcessing || !paymentAmount || !paymentCategory}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Memproses Pembayaran...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Proses Pembayaran Langsung
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </Card>

        {/* Deposit Funds */}
        <Card className="cursor-pointer hover:shadow-md hover:bg-gray-50 transition-all duration-200 deposit-card">
          <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
            <DialogTrigger asChild>
              <CardContent className="p-6 text-center">
                <ArrowDownLeft className="w-8 h-8 mx-auto mb-3 text-green-600" />
                <h3 className="font-medium mb-1">Deposit Dana</h3>
                <p className="text-sm text-muted-foreground">
                  Tambahkan dana ke vault bisnis
                </p>
              </CardContent>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white border border-gray-200 shadow-xl">
              <DialogHeader>
                <DialogTitle>Deposit Dana</DialogTitle>              <DialogDescription>
                Masukkan jumlah IDRT yang ingin didepositkan ke vault bisnis
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="depositAmount">Jumlah (IDRT)</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  step="1000"
                  placeholder="100000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Dalam Rupiah (contoh: 100000 untuk Rp 100.000)
                </p>
              </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDeposit}
                    disabled={!depositAmount || isProcessing || isSendingTx}
                    className="flex-1"
                  >
                    {isProcessing || isSendingTx ? 'Memproses...' : 'Deposit'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDepositDialogOpen(false)}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </Card>

        {/* Withdraw Funds */}
        <Card className="cursor-pointer hover:shadow-md hover:bg-gray-50 transition-all duration-200 withdraw-card">
          <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
            <DialogTrigger asChild>
              <CardContent className="p-6 text-center">
                <ArrowUpRight className="w-8 h-8 mx-auto mb-3 text-red-600" />
                <h3 className="font-medium mb-1">Tarik Dana</h3>
                <p className="text-sm text-muted-foreground">
                  Tarik dana dari vault bisnis
                </p>
              </CardContent>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white border border-gray-200 shadow-xl">
              <DialogHeader>
                <DialogTitle>Tarik Dana</DialogTitle>              <DialogDescription>
                Masukkan jumlah IDRT yang ingin ditarik dari vault bisnis
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="withdrawAmount">Jumlah (IDRT)</Label>
                <Input
                  id="withdrawAmount"
                  type="number"
                  step="1000"
                  placeholder="50000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}                    max={formattedBalance && parseFloat(formattedBalance) > 0 ? formattedBalance : '0'}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maksimal: {formattedBalance && parseFloat(formattedBalance) > 0 
                      ? `Rp ${parseFloat(formattedBalance).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : 'Rp 0,00'}
                  </p>
              </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleWithdraw}
                    disabled={!withdrawAmount || isProcessing}
                    className="flex-1"
                    variant="destructive"
                  >
                    {isProcessing ? 'Memproses...' : 'Tarik Dana'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setWithdrawDialogOpen(false)}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white border border-gray-200 shadow-sm quick-actions-card">
        <CardHeader>
          <CardTitle className="text-lg">Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPaymentAmount('25000');
                setPaymentCategory('Food & Beverage');
                setQrDialogOpen(true);
              }}
              className="flex flex-col h-16 gap-1 hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              <span className="text-xs">QR Rp 25K</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPaymentAmount('50000');
                setPaymentCategory('Service');
                setQrDialogOpen(true);
              }}
              className="flex flex-col h-16 gap-1 hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              <span className="text-xs">QR Rp 50K</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDepositAmount('100000');
                setDepositDialogOpen(true);
              }}
              className="flex flex-col h-16 gap-1 hover:bg-green-50 hover:border-green-300 transition-colors"
            >
              <Wallet className="w-4 h-4" />
              <span className="text-xs">Deposit 100K</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const maxWithdraw = formattedBalance && parseFloat(formattedBalance) > 0 
                  ? parseFloat(formattedBalance).toFixed(0)
                  : '0';
                setWithdrawAmount(maxWithdraw);
                setWithdrawDialogOpen(true);
              }}
              className="flex flex-col h-16 gap-1 hover:bg-red-50 hover:border-red-300 transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span className="text-xs">Tarik Semua</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="categories" className="space-y-6">
        <CategoryManager 
          vaultAddress={vaultAddress} 
          businessName={businessName}
        />
      </TabsContent>
    </Tabs>
  );
};

export default BusinessActions;
