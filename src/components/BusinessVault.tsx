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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  Wallet, 
  Plus, 
  Minus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History,
  Settings,
  Copy,
  ExternalLink,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  QrCode
} from 'lucide-react';
import { useAccount, useChainId, useBalance } from 'wagmi';
import { useWalletClient } from 'wagmi';
import { BUSINESS_CONTRACTS, BUSINESS_CATEGORIES, getContractAddress, isSupportedChain } from '../contracts/BusinessContracts';
import { SmartVerseBusinessService } from '../services/smartVerseBusiness';
import PaymentHistory from './PaymentHistory';

interface BusinessVaultProps {
  vaultAddress: string;
  businessName: string;
  chainId: number;
  onClose?: () => void;
  onCreatePayment?: (vault: { 
    address: string, 
    name: string, 
    chainId: number,
    onPaymentSuccess?: (paymentId: string, amount: string) => Promise<void>
  }) => void;
}

interface VaultTransaction {
  id: string;
  type: 'deposit' | 'withdraw';
  amount: string;
  category: string;
  description: string;
  timestamp: string;
  hash: string;
  status: 'completed' | 'pending' | 'failed';
}

const BusinessVault: React.FC<BusinessVaultProps> = (props) => {
  const { vaultAddress, businessName, chainId, onClose, onCreatePayment } = props;
  const { address, isConnected } = useAccount();
  const currentChainId = useChainId();
  const { data: walletClient } = useWalletClient();
  
  // Initialize state variables
  const [vaultBalance, setVaultBalance] = useState('0');
  const [tokenBalance, setTokenBalance] = useState('0');  // Add state for token balance
  const [transactions, setTransactions] = useState<VaultTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [businessService] = useState(new SmartVerseBusinessService());
  
  // Deposit/Withdraw form states
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transactionCategory, setTransactionCategory] = useState('');
  const [transactionDescription, setTransactionDescription] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get wallet balance
  const { data: walletBalance } = useBalance({
    address: address,
    token: getContractAddress(chainId, 'MockIDRT') as `0x${string}`
  });

  // Load real data from blockchain
  useEffect(() => {
    loadVaultData();
  }, [vaultAddress, chainId]);

  const loadVaultData = async () => {
    setLoading(true);
    try {
      // Get vault balance and transactions from blockchain
      const [summary, vaultTransactions] = await Promise.all([
        businessService.getBusinessSummary(vaultAddress as `0x${string}`),
        businessService.getBusinessTransactions(vaultAddress as `0x${string}`)
      ]);

      // Set both native ETH balance and token (IDRT) balance
      setVaultBalance(summary.balance);
      setTokenBalance(summary.tokenBalance || '0');
      
      // Convert blockchain transactions to component format
      const formattedTransactions: VaultTransaction[] = vaultTransactions.map(tx => ({
        id: tx.id,
        type: tx.isIncome ? 'deposit' : 'withdraw',
        amount: tx.amount,
        category: tx.category,
        description: tx.description || '', // Add fallback for description
        timestamp: new Date(tx.timestamp * 1000).toLocaleString(),
        hash: tx.txHash || '',
        // Map the status from business transaction to vault transaction status
        status: tx.status === 'success' ? 'completed' : 
                tx.status === 'pending' || tx.status === 'processing' ? 'pending' : 'failed'
      }));

      setTransactions(formattedTransactions);
    } catch (err) {
      setError('Gagal memuat data vault');
    } finally {
      setLoading(false);
    }
  };
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadVaultData();
    setRefreshing(false);
  };

  const handleDeposit = async () => {
    if (!depositAmount || !transactionCategory || !transactionDescription) {
      setError('Semua field harus diisi');
      return;
    }

    if (parseFloat(depositAmount) <= 0) {
      setError('Jumlah deposit harus lebih dari 0');
      return;
    }

    if (!walletClient) {
      setError('Wallet client tidak tersedia');
      return;
    }

    setIsDepositing(true);
    setError('');

    try {
      // Get token address for IDRT
      const tokenAddress = getContractAddress(chainId, 'MockIDRT') as `0x${string}`;
      
      // Record income using SmartVerse Business Service with IDRT token
      const txHash = await businessService.depositTokenToVault(
        vaultAddress as `0x${string}`,
        tokenAddress,
        depositAmount,
        transactionCategory
      );
      
      setSuccess('Deposit IDRT berhasil! Hash: ' + txHash);
      setShowDepositDialog(false);
      
      // Reset form
      setDepositAmount('');
      setTransactionCategory('');
      setTransactionDescription('');
      
      // Refresh data
      await loadVaultData();
      
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat melakukan deposit');
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !transactionCategory || !transactionDescription) {
      setError('Semua field harus diisi');
      return;
    }

    if (parseFloat(withdrawAmount) <= 0) {
      setError('Jumlah withdraw harus lebih dari 0');
      return;
    }

    if (parseFloat(withdrawAmount) > parseFloat(tokenBalance)) {
      setError('Saldo token tidak mencukupi');
      return;
    }

    if (!walletClient) {
      setError('Wallet client tidak tersedia');
      return;
    }

    setIsWithdrawing(true);
    setError('');

    try {
      // Record expense using SmartVerse Business Service
      const txHash = await businessService.recordExpense(
        vaultAddress as `0x${string}`,
        withdrawAmount,
        transactionCategory,
        address as `0x${string}` // withdraw to user's address
      );
      
      setSuccess('Withdraw berhasil! Hash: ' + txHash);
      setShowWithdrawDialog(false);
      
      // Reset form
      setWithdrawAmount('');
      setTransactionCategory('');
      setTransactionDescription('');
      
      // Refresh data
      await loadVaultData();
      
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat melakukan withdraw');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Alamat berhasil disalin!');
  };

  const getChainInfo = () => {
    return Object.values(BUSINESS_CONTRACTS).find(c => c.chainId === chainId);
  };

  const chainInfo = getChainInfo();

  const getTransactionIcon = (type: string) => {
    return type === 'deposit' ? 
      <ArrowDownLeft className="h-4 w-4 text-green-500" /> : 
      <ArrowUpRight className="h-4 w-4 text-red-500" />;
  };

  const getTransactionColor = (type: string) => {
    return type === 'deposit' ? 'text-green-600' : 'text-red-600';
  };

  const getCategoryOptions = (isIncome: boolean) => {
    const categories = isIncome ? BUSINESS_CATEGORIES.INCOME : BUSINESS_CATEGORIES.EXPENSE;
    return Object.entries(categories).map(([key, value]) => ({
      value: key,
      label: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat data vault...</p>
        </div>
      </div>
    );
  }

  const handleCreatePayment = () => {
    // Gunakan prop onCreatePayment yang sudah diambil dari parameter
    if (onCreatePayment) {
      onCreatePayment({
        address: vaultAddress,
        name: businessName,
        chainId,
        // Tambahkan callback untuk mencatat transaksi
        onPaymentSuccess: async (paymentId, amount) => {
          try {
            // Record to blockchain as business transaction
            const tokenAddress = getContractAddress(chainId, 'MockIDRT') as `0x${string}`;
            const txHash = await businessService.depositTokenToVault(
              vaultAddress as `0x${string}`,
              tokenAddress,
              amount,
              'Sales' // Default category untuk QR payment
            );
            
            // Refresh data setelah pembayaran berhasil direkam
            await loadVaultData();
            
            return Promise.resolve();
          } catch (error) {
            return Promise.reject(error);
          }
        }
      });
    } else {
      // console.log("Payment handler not provided");
      alert("QR Payment feature is coming soon!");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{businessName}</h1>
            <p className="text-gray-600">Brankas Digital</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                Tutup
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <span>Alamat:</span>
            <span className="font-mono">{vaultAddress.substring(0, 10)}...{vaultAddress.substring(vaultAddress.length - 8)}</span>
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(vaultAddress)}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <Badge variant="outline">{chainInfo?.name}</Badge>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="transactions">Transaksi</TabsTrigger>
          <TabsTrigger value="payments">Pembayaran</TabsTrigger>
          <TabsTrigger value="settings">Pengaturan</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Balance Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wallet className="h-5 w-5" />
                  <span>Saldo Vault</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <p className="text-3xl font-bold text-blue-600 mb-2">
                    Rp {parseFloat(tokenBalance).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">IDRT</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Deposit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Deposit Dana</DialogTitle>
                        <DialogDescription>
                          Tambahkan dana ke vault bisnis Anda
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="deposit-amount">Jumlah (IDRT)</Label>
                          <Input
                            id="deposit-amount"
                            type="number"
                            placeholder="1000000"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="deposit-category">Kategori</Label>
                          <Select value={transactionCategory} onValueChange={setTransactionCategory}>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                            <SelectContent>
                              {getCategoryOptions(true).map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="deposit-description">Deskripsi</Label>
                          <Textarea
                            id="deposit-description"
                            placeholder="Deskripsi transaksi"
                            value={transactionDescription}
                            onChange={(e) => setTransactionDescription(e.target.value)}
                          />
                        </div>
                        <Button 
                          onClick={handleDeposit} 
                          disabled={isDepositing}
                          className="w-full"
                        >
                          {isDepositing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Memproses...
                            </>
                          ) : (
                            'Deposit'
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Minus className="h-4 w-4 mr-2" />
                        Withdraw
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Withdraw Dana</DialogTitle>
                        <DialogDescription>
                          Tarik dana dari vault bisnis Anda
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="withdraw-amount">Jumlah (IDRT)</Label>
                          <Input
                            id="withdraw-amount"
                            type="number"
                            placeholder="500000"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                          />
                          <p className="text-sm text-gray-600 mt-1">
                            Saldo tersedia: Rp {parseFloat(vaultBalance).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="withdraw-category">Kategori</Label>
                          <Select value={transactionCategory} onValueChange={setTransactionCategory}>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                            <SelectContent>
                              {getCategoryOptions(false).map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="withdraw-description">Deskripsi</Label>
                          <Textarea
                            id="withdraw-description"
                            placeholder="Deskripsi transaksi"
                            value={transactionDescription}
                            onChange={(e) => setTransactionDescription(e.target.value)}
                          />
                        </div>
                        <Button 
                          onClick={handleWithdraw} 
                          disabled={isWithdrawing}
                          className="w-full"
                        >
                          {isWithdrawing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Memproses...
                            </>
                          ) : (
                            'Withdraw'
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistik</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Transaksi</span>
                    <span className="font-semibold">{transactions.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Deposit</span>
                    <span className="font-semibold text-green-600">
                      {transactions.filter(t => t.type === 'deposit').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Withdraw</span>
                    <span className="font-semibold text-red-600">
                      {transactions.filter(t => t.type === 'withdraw').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Transaksi Terbaru</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(tx.type)}
                      <div>
                        <p className="font-medium capitalize">{tx.type}</p>
                        <p className="text-sm text-gray-600">{tx.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${getTransactionColor(tx.type)}`}>
                        {tx.type === 'deposit' ? '+' : '-'}Rp {parseFloat(tx.amount).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">{tx.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Semua Transaksi</CardTitle>
                <CardDescription>
                  Riwayat lengkap transaksi vault
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Belum ada transaksi yang tercatat
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Buat transaksi bisnis baru untuk melihat riwayat
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getTransactionIcon(tx.type)}
                        <div>
                          <p className="font-medium capitalize">{tx.type}</p>
                          <p className="text-sm text-gray-600">{tx.description || 'No description'}</p>
                          <p className="text-xs text-gray-500">{tx.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${getTransactionColor(tx.type)}`}>
                          {tx.type === 'deposit' ? '+' : '-'}Rp {parseFloat(tx.amount).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">{tx.timestamp}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {tx.status}
                          </Badge>
                          {tx.hash && (
                            <Button variant="ghost" size="sm" onClick={() => window.open(`${chainInfo?.explorer}/tx/${tx.hash}`, '_blank')}>
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold">Pembayaran QR</h2>
              <p className="text-gray-500">Kelola dan pantau pembayaran QR dari pelanggan</p>
            </div>
            <Button onClick={() => handleCreatePayment()} className="tour-qr-payment">
              <QrCode className="mr-2 h-4 w-4" />
              Buat QR Baru
            </Button>
          </div>
          
          <PaymentHistory vaultAddress={vaultAddress} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Vault</CardTitle>
              <CardDescription>
                Kelola pengaturan vault bisnis Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Alamat Vault</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input value={vaultAddress} readOnly />
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(vaultAddress)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Jaringan</Label>
                    <Input value={chainInfo?.name} readOnly className="mt-1" />
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Aksi Berbahaya</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Aksi di bawah ini bersifat permanen dan tidak dapat dibatalkan.
                  </p>
                  <Button variant="destructive" size="sm">
                    Transfer Kepemilikan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessVault;
