import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { 
  Building2, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownLeft,
  PlusCircle,
  Eye,
  Settings,
  Download,
  Upload,
  DollarSign,
  Users,
  Activity,
  QrCode
} from 'lucide-react';
import { useAccount, useChainId } from 'wagmi';
import { BUSINESS_CONTRACTS, getContractAddress, isSupportedChain, BusinessVault_ABI } from '../contracts/BusinessContracts';
import { SmartVerseBusinessService } from '../services/smartVerseBusiness';
import FinancialReport from './FinancialReport';
import BusinessPayment from './BusinessPayment';

// Debug ABI functions
console.log('🔍 ABI Debug - Available functions:', BusinessVault_ABI.map(item => item.type === 'function' ? item.name : null).filter(Boolean));

// Import debug
import '../debug/abiDebug';

interface BusinessDashboardProps {
  onCreateNewBusiness?: () => void;
  onViewVault?: (vaultAddress: string, businessName: string, chainId: number) => void;
}

interface BusinessVault {
  address: string;
  name: string;
  owner: string;
  balance: string;
  tokenBalance: string; // IDRT balance
  chainId: number;
  chainName: string;
  transactions: number;
  lastActivity: string;
  category: string;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'transfer';
  amount: string;
  currency: string;
  from: string;
  to: string;
  timestamp: string;
  chainId: number;
  chainName: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  hash: string;
  category?: string;
  description?: string;
}

const BusinessDashboard: React.FC<BusinessDashboardProps> = ({ onCreateNewBusiness, onViewVault }) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  const [businessVaults, setBusinessVaults] = useState<BusinessVault[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState('0');
  const [monthlyIncome, setMonthlyIncome] = useState('0');
  const [monthlyExpense, setMonthlyExpense] = useState('0');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [businessService] = useState(new SmartVerseBusinessService());
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedVaultForPayment, setSelectedVaultForPayment] = useState<BusinessVault | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load real data from blockchain
  useEffect(() => {
    try {
      if (isConnected && address) {
        console.log('useEffect triggered - loading business data');
        console.log('isConnected:', isConnected, 'address:', address, 'chainId:', chainId);
        loadBusinessData();
      } else {
        console.log('useEffect conditions not met:', { isConnected, address, chainId });
        // Ensure loading is set to false even if we don't proceed
        setLoading(false);
      }
    } catch (e) {
      console.error('Error in dashboard useEffect:', e);
      setLoading(false);
    }
  }, [isConnected, address, chainId]);

  const loadBusinessData = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      console.log('Loading business data for address:', address);
      console.log('Current chain ID:', chainId);
      console.log('Expected chain ID for business (Sepolia):', 11155111);
      if (chainId !== 11155111) {
        console.warn('User not connected to Sepolia. Business features require Sepolia network.');
        // Tetap lanjut, hanya tampilkan warning di UI
      }
      // Get user's business vault
      try {
        const vaultAddress = await businessService.getUserVault(address as `0x${string}`);
        console.log('Vault address found:', vaultAddress);
        if (vaultAddress && vaultAddress !== '0x0000000000000000000000000000000000000000') {
          // Pastikan vaultAddress valid dan bukan address kosong
          const vaultAddrTyped = vaultAddress as `0x${string}`;
          let summary, transactions;
          try {
            summary = await businessService.getBusinessSummary(vaultAddrTyped);
            console.log('Business summary loaded:', summary);
          } catch (summaryError) {
            console.error('Error loading business summary:', summaryError);
            summary = {
              balance: '0',
              totalIncome: '0',
              totalExpenses: '0',
              transactionCount: 0
            };
          }
          try {
            transactions = await businessService.getBusinessTransactions(vaultAddrTyped);
            console.log('Business transactions loaded:', transactions.length, 'transactions');
            console.log('Sample transaction:', transactions.length > 0 ? transactions[0] : 'No transactions');
          } catch (txError) {
            console.error('Error loading business transactions:', txError);
            transactions = [];
          }
          // Get business name dari service/localStorage, jika tidak ada jangan fallback ke nama dummy
          let businessName = '';
          try {
            businessName = await businessService.getBusinessName(vaultAddrTyped);
            console.log('Business name:', businessName);
          } catch (nameError) {
            console.error('Error loading business name:', nameError);
          }
          // Tampilkan vault meskipun nama bisnis kosong
          const vaultData = [{
            address: vaultAddress,
            name: businessName, // tetap tampilkan meskipun kosong
            owner: address,
            balance: summary.balance,
            tokenBalance: summary.tokenBalance || '0',
            chainId: 11155111,
            chainName: 'Sepolia',
            transactions: summary.transactionCount,
            lastActivity: transactions.length > 0 ? formatDate(transactions[0].timestamp) : 'Tidak ada aktivitas',
            category: 'general'
          }];
          setBusinessVaults(vaultData);
          
          // Format all transactions
          const formattedTransactions = transactions.map(tx => ({
            id: tx.id,
            type: (tx.isIncome ? 'deposit' : 'withdraw') as 'deposit' | 'withdraw' | 'transfer',
            amount: tx.amount,
            currency: tx.isToken ? tx.tokenSymbol || 'IDRT' : 'ETH',
            from: tx.from,
            to: tx.to,
            timestamp: formatDate(tx.timestamp),
            chainId: tx.chainId,
            chainName: getChainName(tx.chainId),
            status: tx.status,
            hash: tx.txHash || '',
            category: tx.category || '',
            description: tx.description || ''
          }));
          
          // Sort transactions by timestamp, newest first
          formattedTransactions.sort((a, b) => {
            const dateA = new Date(a.timestamp).getTime();
            const dateB = new Date(b.timestamp).getTime();
            return dateB - dateA;
          });
          
          // Store all transactions
          setAllTransactions(formattedTransactions);
          
          // Set only 5 most recent transactions for the overview tab
          setRecentTransactions(formattedTransactions.slice(0, 5));
          
          // Gunakan tokenBalance sebagai total balance jika tersedia
          if (summary.tokenBalance && parseFloat(summary.tokenBalance) > 0) {
            setTotalBalance(summary.tokenBalance);
            console.log('Using token balance as total balance:', summary.tokenBalance);
          } else {
            setTotalBalance(summary.balance);
            console.log('Using ETH balance as total balance:', summary.balance);
          }
          
          // Gunakan tokenIncome dan tokenExpense jika tersedia
          if (summary.tokenIncome && parseFloat(summary.tokenIncome) > 0) {
            setMonthlyIncome(summary.tokenIncome);
            console.log('Using token income:', summary.tokenIncome);
          } else {
            setMonthlyIncome(summary.totalIncome);
          }
          
          if (summary.tokenExpense && parseFloat(summary.tokenExpense) > 0) {
            setMonthlyExpense(summary.tokenExpense);
            console.log('Using token expense:', summary.tokenExpense);
          } else {
            setMonthlyExpense(summary.totalExpenses);
          }
        } else {
          // No business vault found or not registered
          setBusinessVaults([]);
          setRecentTransactions([]);
          setTotalBalance('0');
          setMonthlyIncome('0');
          setMonthlyExpense('0');
        }
      } catch (vaultError) {
        console.error('Error getting user vault:', vaultError);
        setBusinessVaults([]);
        setTotalBalance('0');
        setMonthlyIncome('0');
        setMonthlyExpense('0');
      }
    } catch (error) {
      console.error('Error loading business data:', error);
      setBusinessVaults([]);
      setRecentTransactions([]);
      setTotalBalance('0');
      setMonthlyIncome('0');
      setMonthlyExpense('0');
      setError('Terjadi kesalahan saat memuat data bisnis. Silakan refresh halaman atau coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  const getChainName = (chainId: number): string => {
    switch (chainId) {
      case 11155111: return 'Sepolia';
      case 13000: return 'Taranium';
      case 1: return 'Ethereum';
      default: return 'Unknown';
    }
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return 'Baru saja';
    if (hours < 24) return `${hours} jam yang lalu`;
    if (days < 30) return `${days} hari yang lalu`;
    return date.toLocaleDateString();
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'withdraw':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case 'transfer':
        return <ArrowUpRight className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-300">Selesai</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Pending</Badge>;
      case 'failed':
        return <Badge variant="outline" className="text-red-600 border-red-300">Gagal</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBusinessData();
    setRefreshing(false);
  };

  const handleCreatePayment = (vault: BusinessVault) => {
    setSelectedVaultForPayment(vault);
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedVaultForPayment(null);
  };

  if (showPaymentModal && selectedVaultForPayment) {
    return (
      <BusinessPayment
        vaultAddress={selectedVaultForPayment.address}
        businessName={selectedVaultForPayment.name}
        onClose={handleClosePaymentModal}
      />
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <CardTitle>SmartVerse Business</CardTitle>
            <CardDescription>
              Kelola bisnis UMKM Anda dengan brankas digital lintas-chain
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Silakan hubungkan wallet Anda untuk mengakses dashboard bisnis
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    console.log('Rendering loading state');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data bisnis Anda...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <Button onClick={() => {
              setError(null);
              setLoading(true);
              loadBusinessData();
            }}>
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('Rendering main dashboard with:', {
    businessVaults: businessVaults.length,
    recentTransactions: recentTransactions.length,
    totalBalance,
    loading
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                SmartVerse Business
              </h1>
              <p className="text-gray-600">
                Kelola bisnis UMKM Anda dengan brankas digital lintas-chain
              </p>
              {chainId !== 11155111 && (
                <div className="mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm">
                  ⚠️ Silakan switch ke Sepolia network untuk menggunakan fitur Business
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <Download className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Ekspor Data
              </Button>
              <Button size="sm" onClick={onCreateNewBusiness}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Buat Bisnis Baru
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Saldo (IDRT)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalBalance === '0' ? 'Rp 0' : `Rp ${parseFloat(totalBalance).toLocaleString()}`}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pendapatan (IDRT)</p>
                  <p className="text-2xl font-bold text-green-600">
                    {monthlyIncome === '0' ? 'Rp 0' : `Rp ${parseFloat(monthlyIncome).toLocaleString()}`}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pengeluaran (IDRT)</p>
                  <p className="text-2xl font-bold text-red-600">
                    {monthlyExpense === '0' ? 'Rp 0' : `Rp ${parseFloat(monthlyExpense).toLocaleString()}`}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bisnis</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {businessVaults.length}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Building2 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Ringkasan</TabsTrigger>
            <TabsTrigger value="vaults">Brankas Bisnis</TabsTrigger>
            <TabsTrigger value="transactions">Transaksi</TabsTrigger>
            <TabsTrigger value="reports">Laporan</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Business Vaults */}
              <Card>
                <CardHeader>
                  <CardTitle>Brankas Bisnis Aktif</CardTitle>
                  <CardDescription>
                    {businessVaults.length} bisnis terdaftar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {businessVaults.length === 0 ? (
                    <div className="text-center py-8">
                      <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">
                        Belum ada bisnis yang terdaftar
                      </p>
                      <Button onClick={onCreateNewBusiness}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Buat Bisnis Pertama
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {businessVaults.map((vault) => (
                        <div key={vault.address} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-full">
                              <Building2 className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{vault.name}</p>
                              <p className="text-sm text-gray-600">{vault.chainName}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {parseFloat(vault.tokenBalance) > 0 
                                ? `Rp ${parseFloat(vault.tokenBalance).toLocaleString()} IDRT` 
                                : parseFloat(vault.balance) > 0 
                                ? `${parseFloat(vault.balance).toLocaleString()} ETH` 
                                : 'Rp 0'}
                            </p>
                            <p className="text-sm text-gray-600">{vault.transactions} transaksi</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle>Transaksi Terbaru</CardTitle>
                  <CardDescription>
                    Aktivitas terkini dari semua bisnis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentTransactions.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        Belum ada transaksi
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentTransactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getTransactionIcon(tx.type)}
                            <div>
                              <p className="font-medium capitalize">{tx.type}</p>
                              <p className="text-sm text-gray-600">{tx.chainName}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {tx.currency === 'IDRT' 
                                ? `Rp ${parseFloat(tx.amount).toLocaleString()} ${tx.currency}`
                                : `${parseFloat(tx.amount).toLocaleString()} ${tx.currency}`}
                            </p>
                            {getStatusBadge(tx.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Vaults Tab */}
          <TabsContent value="vaults" className="space-y-6">
            {businessVaults.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Belum Ada Bisnis
                </h3>
                <p className="text-gray-500 mb-6">
                  Mulai perjalanan bisnis Anda dengan membuat brankas digital pertama
                </p>
                <Button onClick={onCreateNewBusiness}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Buat Bisnis Baru
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {businessVaults.map((vault) => (
                  <Card key={vault.address}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{vault.name}</span>
                        <Badge variant="outline">{vault.chainName}</Badge>
                      </CardTitle>
                      <CardDescription>
                        Kategori: {vault.category}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {vault.balance === '0' ? 'Rp 0' : `Rp ${parseFloat(vault.balance).toLocaleString()}`}
                          </p>
                          <p className="text-sm text-gray-600">Saldo saat ini</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <p className="text-lg font-semibold">{vault.transactions}</p>
                            <p className="text-sm text-gray-600">Transaksi</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{vault.lastActivity}</p>
                            <p className="text-sm text-gray-600">Aktivitas terakhir</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => onViewVault?.(vault.address, vault.name, vault.chainId)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Lihat Detail
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCreatePayment(vault)}
                          >
                            <QrCode className="h-4 w-4 mr-2" />
                            Terima Pembayaran
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Riwayat Transaksi</CardTitle>
                  <CardDescription>
                    Semua transaksi dari seluruh bisnis dan jaringan
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadBusinessData} disabled={refreshing}>
                  <Download className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh Data
                </Button>
              </CardHeader>
              <CardContent>
                {allTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Belum Ada Transaksi
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Transaksi akan muncul di sini setelah Anda melakukan aktivitas bisnis
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allTransactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          {getTransactionIcon(tx.type)}
                          <div>
                            <p className="font-medium capitalize">{tx.type}</p>
                            <p className="text-sm text-gray-600">
                              {tx.timestamp} • {tx.chainName}
                            </p>
                            {tx.description && (
                              <p className="text-sm text-gray-700">{tx.description}</p>
                            )}
                            {tx.category && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {tx.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.type === 'deposit' ? '+' : '-'}
                            {tx.currency === 'IDRT' 
                              ? `Rp ${parseFloat(tx.amount).toLocaleString()}`
                              : `${parseFloat(tx.amount).toLocaleString()} ${tx.currency}`}
                          </p>
                          {getStatusBadge(tx.status)}
                          {tx.hash && (
                            <a 
                              href={`https://sepolia.etherscan.io/tx/${tx.hash}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center justify-end mt-1"
                            >
                              <span>View on Etherscan</span>
                              <ArrowUpRight className="ml-1 h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <FinancialReport businessVaults={businessVaults} transactions={allTransactions} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BusinessDashboard;
