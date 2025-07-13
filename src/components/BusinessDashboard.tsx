import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Dialog, DialogContent } from './ui/dialog';
import OnboardingTour from './OnboardingTour';
import { useTourManager } from '../hooks/useTourManager';
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
  QrCode,
  Search,
  Filter,
  FileText
} from 'lucide-react';
import { useAccount, useChainId, useReadContract } from 'wagmi';
import { BUSINESS_CONTRACTS, getContractAddress, isSupportedChain, BusinessVault_ABI, MockIDRT_ABI } from '../contracts/BusinessContracts';
import { SmartVerseBusinessService, BusinessTransaction } from '../services/smartVerseBusiness';
import FinancialReport from './FinancialReport';
import BusinessPayment from './BusinessPayment';
import BusinessActions from './BusinessActions';
import TransactionInvoice from './TransactionInvoice';
import { useReactToPrint } from 'react-to-print';
import { formatAddress, formatTimestamp, formatTimeAgo, formatCurrency, getTransactionBadgeColor } from '../utils/formatters';
import { formatUnits, type Address } from 'viem';

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
  const isMountedRef = useRef(true);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Tour manager
  const {
    showTour,
    tourType,
    tourSettings,
    startTour,
    completeTour,
    setBusinessUser,
    shouldShowBusinessTourForNewFeatures,
    closeTour
  } = useTourManager();
  
  const [businessVaults, setBusinessVaults] = useState<BusinessVault[]>([]);
  
  // Get current network IDRT contract address
  const currentNetwork = Object.values(BUSINESS_CONTRACTS).find(n => n.chainId === chainId);
  const idrtContractAddress = currentNetwork?.contracts?.MockIDRT as Address;
  
  // Read IDRT balance for the first business vault
  const firstVaultAddress = businessVaults.length > 0 ? businessVaults[0].address : null;
  const { data: idrtBalance, refetch: refetchIdrtBalance } = useReadContract({
    address: idrtContractAddress,
    abi: MockIDRT_ABI,
    functionName: 'balanceOf',
    args: firstVaultAddress ? [firstVaultAddress as Address] : undefined,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState('0');
  const [monthlyIncome, setMonthlyIncome] = useState('0');
  const [monthlyExpense, setMonthlyExpense] = useState('0');
  const [loading, setLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [vaultAddress, setVaultAddress] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [businessService] = useState(new SmartVerseBusinessService());
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedVaultForPayment, setSelectedVaultForPayment] = useState<BusinessVault | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<BusinessTransaction | null>(null);
  
  // For invoice printing
  const invoiceRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    documentTitle: 'Business Transaction Invoice',
  });

  // Helper functions for formatting
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

  // Load real data from blockchain
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    try {
      if (isConnected && address && !isDataLoading) {
        loadBusinessData();
        // Mark user as business user when they access business dashboard
        setBusinessUser(true);
      } else if (!isConnected && isMountedRef.current) {
        // Ensure loading is set to false even if we don't proceed
        setLoading(false);
        setIsDataLoading(false);
      }
    } catch (e) {
      console.error('Error in dashboard useEffect:', e);
      if (isMountedRef.current) {
        setLoading(false);
        setIsDataLoading(false);
      }
    }
  }, [isConnected, address, chainId]);

  // Check for new business features tour
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    if (isConnected && shouldShowBusinessTourForNewFeatures()) {
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          startTour('business');
        }
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isConnected]);

  const loadBusinessData = async () => {
    try {
      // Prevent multiple simultaneous calls
      if (isDataLoading || !isMountedRef.current) {
        return;
      }
      
      setIsDataLoading(true);
      setLoading(true);
      setRefreshing(true);
      
      if (chainId !== 11155111) {
        // Tetap lanjut, hanya tampilkan warning di UI
      }

      if (!address) {
        if (isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
          setIsDataLoading(false);
        }
        return;
      }

      // Get user's business vault address first
      const addrTyped = address as `0x${string}`;
      try {
        const userVaultAddress = await businessService.getUserVault(addrTyped);
        setVaultAddress(userVaultAddress);
        
        // Now process the vault data if we have a valid vault address
        if (userVaultAddress && userVaultAddress !== '0x0000000000000000000000000000000000000000') {
          // Pastikan vaultAddress valid dan bukan address kosong
          const vaultAddrTyped = userVaultAddress as `0x${string}`;
          
          // Get business summary (balance, income, expense)
          let summary;
          try {
            summary = await businessService.getBusinessSummary(vaultAddrTyped);
            setTotalBalance(summary.tokenBalance || summary.balance);
            setMonthlyIncome(summary.tokenIncome || summary.totalIncome);
            setMonthlyExpense(summary.tokenExpense || summary.totalExpenses);
          } catch (error) {
            console.error('Error getting business summary:', error);
          }
          
          // Get business transactions
          let txs;
          try {
            txs = await businessService.getBusinessTransactions(vaultAddrTyped);
            
            // Create proper Transaction objects for UI
            const uiTransactions: Transaction[] = txs.map(tx => ({
              id: tx.id,
              type: tx.isIncome ? 'deposit' : 'withdraw',
              amount: tx.amount,
              currency: tx.isToken ? 'IDRT' : 'ETH',
              from: tx.from,
              to: tx.to,
              timestamp: new Date(tx.timestamp * 1000).toLocaleString(),
              chainId: tx.chainId,
              chainName: getChainName(tx.chainId),
              status: tx.status,
              hash: tx.txHash || '',
              category: tx.category,
              description: tx.description
            }));
            
            setAllTransactions(uiTransactions);
            
            // Set only 5 most recent transactions for the overview tab
            setRecentTransactions(uiTransactions.slice(0, 5));
          } catch (error) {
            console.error('Error getting business transactions:', error);
          }
          
          // Get vault details
          const businessName = await businessService.getBusinessName(vaultAddrTyped);
          // Fallback values jika API tidak tersedia
          const owner = address;
          const category = "Umum";
          const tokenBalance = "0";
          
          // Create business vault object for UI
          const vault: BusinessVault = {
            address: userVaultAddress,
            name: businessName,
            owner: owner,
            balance: summary?.balance || '0',
            tokenBalance: tokenBalance || '0', // IDRT balance
            chainId: chainId,
            chainName: getChainName(chainId),
            transactions: txs?.length || 0,
            lastActivity: txs && txs.length > 0 ? formatDate(txs[0].timestamp) : 'Belum ada',
            category: category || 'Umum'
          };
          
          setBusinessVaults([vault]);
        } else {
          // No business vault found
          setBusinessVaults([]);
          setRecentTransactions([]);
          setAllTransactions([]);
        }
      } catch (error) {
        console.error('Error getting user vault:', error);
      }
      
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
        setIsDataLoading(false);
      }
    } catch (error) {
      console.error('Error loading business data:', error);
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
        setIsDataLoading(false);
      }
    }
  };

  // Update IDRT balance when it changes
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    if (idrtBalance && businessVaults.length > 0) {
      const formattedBalance = formatUnits(idrtBalance, 18);
      setBusinessVaults(prevVaults => 
        prevVaults.map((vault, index) => 
          index === 0 
            ? { ...vault, tokenBalance: formattedBalance }
            : vault
        )
      );
      setTotalBalance(formattedBalance);
    }
  }, [idrtBalance, businessVaults.length]);

  const handleCreatePayment = (vault: BusinessVault) => {
    setSelectedVaultForPayment(vault);
    setShowPaymentModal(true);
  };

  // Helper function for transaction status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Sukses</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Diproses</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Gagal</Badge>;
      default:
        return null;
    }
  };

  // Helper function for transaction icon
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <div className="p-2 bg-green-100 rounded-full">
          <ArrowDownLeft className="h-4 w-4 text-green-600" />
        </div>;
      case 'withdraw':
        return <div className="p-2 bg-red-100 rounded-full">
          <ArrowUpRight className="h-4 w-4 text-red-600" />
        </div>;
      case 'transfer':
        return <div className="p-2 bg-blue-100 rounded-full">
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </div>;
      default:
        return null;
    }
  };

  // Show error state if address is connected but not on the right chain
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 mt-8">
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button variant="default" className="mt-4" onClick={loadBusinessData}>
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 mt-8">
        <Card className="w-full shadow-sm">
          <CardHeader>
            <CardTitle>Business Dashboard</CardTitle>
            <CardDescription>Memuat data bisnis Anda...</CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show empty state if no wallet connected
  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 mt-8">
        <Card className="w-full shadow-sm">
          <CardHeader>
            <CardTitle>Business Dashboard</CardTitle>
            <CardDescription>Connect your wallet to manage your business</CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <div className="text-center py-8">
              <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Wallet Not Connected
              </h3>
              <p className="text-gray-500 mb-6">
                Please connect your wallet to view your business details
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Jika belum punya bisnis, tampilkan create business modal */}
        {businessVaults.length === 0 && (
          <Card className="bg-blue-50 border border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Buat Bisnis Pertama Anda</h3>
                    <p className="text-gray-600">Mulai transaksi bisnis dengan blockchain</p>
                  </div>
                </div>
                <Button 
                  onClick={onCreateNewBusiness}
                  className="tour-create-business"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Buat Bisnis
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header with Tour Button */}
        {businessVaults.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Business Dashboard</h1>
              <p className="text-gray-600 mt-1">Kelola bisnis Anda dengan mudah</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => startTour('business')}
                className="tour-help-button"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Panduan Fitur
              </Button>
              {shouldShowBusinessTourForNewFeatures() && (
                <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-pink-500">
                  Fitur Baru!
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Dashboard content */}
        <Tabs 
          defaultValue="overview" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid grid-cols-4 mb-4 tour-tabs">
            <TabsTrigger value="overview" className="tour-overview">Ringkasan</TabsTrigger>
            <TabsTrigger value="actions" className="tour-actions">Aksi</TabsTrigger>
            <TabsTrigger value="transactions" className="tour-transactions">Transaksi</TabsTrigger>
            <TabsTrigger value="reports" className="tour-reports">Laporan</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Balance Card */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-muted-foreground truncate">
                        Total Saldo IDRT
                      </p>
                      <h2 className="text-xl sm:text-2xl font-bold truncate">
                        {businessVaults.length > 0 && businessVaults[0].tokenBalance
                          ? `Rp ${parseFloat(businessVaults[0].tokenBalance).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : 'Rp 0,00'}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        Indonesian Rupiah Token
                      </p>
                    </div>
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 ml-3">
                      <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Progress value={businessVaults.length > 0 ? 75 : 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Income Card */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-muted-foreground truncate">
                        Pemasukan Bulan Ini
                      </p>
                      <h2 className="text-xl sm:text-2xl font-bold truncate">
                        {parseFloat(monthlyIncome) > 0 
                          ? `Rp ${parseFloat(monthlyIncome).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : 'Rp 0,00'}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        Token IDRT
                      </p>
                    </div>
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 ml-3">
                      <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                    <span className="text-green-500 font-medium">+22%</span>
                    <span className="text-muted-foreground ml-2 truncate">dari bulan lalu</span>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Expense Card */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-muted-foreground truncate">
                        Pengeluaran Bulan Ini
                      </p>
                      <h2 className="text-xl sm:text-2xl font-bold truncate">
                        {parseFloat(monthlyExpense) > 0 
                          ? `Rp ${parseFloat(monthlyExpense).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : 'Rp 0,00'}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        Token IDRT
                      </p>
                    </div>
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 ml-3">
                      <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <ArrowDownLeft className="mr-1 h-4 w-4 text-red-500" />
                    <span className="text-red-500 font-medium">+12%</span>
                    <span className="text-muted-foreground ml-2 truncate">dari bulan lalu</span>
                  </div>
                </CardContent>
              </Card>

              {/* Business Status Card */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-muted-foreground truncate">
                        Status Bisnis
                      </p>
                      <h2 className="text-xl sm:text-2xl font-bold truncate">
                        {businessVaults.length > 0 ? 'Aktif' : 'Tidak Ada'}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {businessVaults.length > 0 
                          ? `${businessVaults[0].name || 'Bisnis Utama'}`
                          : 'Buat bisnis pertama'}
                      </p>
                    </div>
                    <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center flex-shrink-0 ml-3 ${
                      businessVaults.length > 0 ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      <Building2 className={`h-5 w-5 sm:h-6 sm:w-6 ${
                        businessVaults.length > 0 ? 'text-purple-600' : 'text-gray-400'
                      }`} />
                    </div>
                  </div>
                  <div className="mt-4">
                    {businessVaults.length > 0 ? (
                      <div className="flex items-center text-sm text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 flex-shrink-0"></div>
                        <span className="truncate">Online & Siap Menerima</span>
                      </div>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={onCreateNewBusiness}
                        className="p-0 h-8 text-purple-600 hover:text-purple-800 hover:bg-purple-50 truncate"
                      >
                        <PlusCircle className="mr-1 h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Mulai Bisnis</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Business Vaults */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Brankas Bisnis Aktif</CardTitle>
                      <CardDescription>
                        {businessVaults.length} bisnis terdaftar
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={onCreateNewBusiness}
                      className="tour-create-business"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Baru
                    </Button>
                  </div>
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
                        <div key={vault.address} className="flex items-center justify-between p-3 sm:p-4 border rounded-lg tour-business-card hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <Building2 className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{vault.name}</p>
                              <p className="text-sm text-gray-600 truncate">{vault.chainName}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="font-semibold text-sm sm:text-base">
                              {parseFloat(vault.tokenBalance) > 0 
                                ? `Rp ${parseFloat(vault.tokenBalance).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : 'Rp 0,00'}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600">
                              IDRT Token
                            </p>
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
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Transaksi Terbaru</CardTitle>
                      <CardDescription>
                        Aktivitas terkini dari semua bisnis
                      </CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setActiveTab('transactions')}
                    >
                      Lihat Semua
                    </Button>
                  </div>
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
                        <div 
                          key={tx.id} 
                          className="flex items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            // Convert Transaction to BusinessTransaction
                            const btx: BusinessTransaction = {
                              id: tx.id,
                              timestamp: new Date(tx.timestamp).getTime() / 1000,
                              isIncome: tx.type === 'deposit',
                              category: tx.category || (tx.type === 'deposit' ? 'Pendapatan' : 'Pengeluaran'),
                              amount: tx.amount,
                              from: tx.from,
                              to: tx.to,
                              txHash: tx.hash,
                              status: tx.status,
                              chainId: tx.chainId,
                              isToken: tx.currency === 'IDRT',
                              tokenSymbol: tx.currency === 'IDRT' ? 'IDRT' : 'ETH',
                              description: tx.description
                            };
                            setSelectedTransaction(btx);
                          }}
                        >
                          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                            <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center flex-shrink-0 ${tx.type === 'deposit' ? 'bg-green-100' : 'bg-red-100'}`}>
                              {tx.type === 'deposit' 
                                ? <ArrowDownLeft className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" /> 
                                : <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm sm:text-base truncate">
                                {tx.type === 'deposit' ? 'Pemasukan' : tx.type === 'withdraw' ? 'Pengeluaran' : 'Transfer'}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600 truncate">
                                {new Date(tx.timestamp).toLocaleDateString('id-ID')} • {tx.category || 'Umum'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className={`font-semibold text-sm sm:text-base ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.type === 'deposit' ? '+' : '-'}
                              {tx.currency === 'IDRT' || !tx.currency
                                ? `Rp ${parseFloat(tx.amount).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : tx.currency === 'ETH'
                                ? `${parseFloat(tx.amount).toFixed(4)} ETH`
                                : `${parseFloat(tx.amount).toFixed(4)} ${tx.currency}`}
                            </p>
                            {tx.currency === 'ETH' && (
                              <p className="text-xs text-gray-500">
                                ≈ ${(parseFloat(tx.amount) * 2000).toFixed(2)}
                              </p>
                            )}
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

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-6">
            {businessVaults.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Belum Ada Bisnis
                </h3>
                <p className="text-gray-500 mb-6">
                  Mulai perjalanan bisnis Anda dengan membuat vault digital pertama
                </p>
                <Button onClick={onCreateNewBusiness}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Buat Bisnis Baru
                </Button>
              </div>
            ) : (
              <BusinessActions
                vaultAddress={businessVaults[0]?.address}
                businessName={businessVaults[0]?.name}
                balance={businessVaults[0]?.tokenBalance || '0'}
              />
            )}
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Riwayat Transaksi</CardTitle>
                  <CardDescription>
                    Semua transaksi bisnis Anda tercatat secara permanen di blockchain
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Cari transaksi..."
                      className="pl-8 h-9 w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={loadBusinessData} disabled={refreshing}>
                    <Download className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {allTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Belum Ada Transaksi
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Transaksi akan muncul di sini setelah Anda melakukan aktivitas bisnis
                    </p>
                    <p className="text-gray-500 text-sm">
                      Setiap transaksi bisnis Anda akan tercatat secara permanen di blockchain
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border">
                    <div className="flex items-center justify-between bg-gray-50 px-4 py-3 text-sm font-medium">
                      <div className="w-1/4">Tanggal & Waktu</div>
                      <div className="w-1/4">Jenis & Kategori</div>
                      <div className="w-1/4">Jumlah</div>
                      <div className="w-1/4 text-right">Status</div>
                    </div>
                    <div className="divide-y">
                      {allTransactions.map((tx) => (
                        <div 
                          key={tx.id} 
                          className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            // Convert Transaction to BusinessTransaction
                            const btx: BusinessTransaction = {
                              id: tx.id,
                              timestamp: new Date(tx.timestamp).getTime() / 1000,
                              isIncome: tx.type === 'deposit',
                              category: tx.category || (tx.type === 'deposit' ? 'Pendapatan' : 'Pengeluaran'),
                              amount: tx.amount,
                              from: tx.from,
                              to: tx.to,
                              txHash: tx.hash,
                              status: tx.status,
                              chainId: tx.chainId,
                              isToken: tx.currency === 'IDRT',
                              tokenSymbol: tx.currency === 'IDRT' ? 'IDRT' : 'ETH',
                              description: tx.description
                            };
                            setSelectedTransaction(btx);
                          }}
                        >
                          <div className="w-1/4">
                            <div className="font-medium">
                              {new Date(tx.timestamp).toLocaleDateString('id-ID')}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(tx.timestamp).toLocaleTimeString('id-ID')}
                            </div>
                          </div>
                          <div className="w-1/4">
                            <div className="flex items-center">
                              <Badge className={tx.type === 'deposit' 
                                ? "bg-green-100 text-green-800 mr-2" 
                                : "bg-red-100 text-red-800 mr-2"}>
                                {tx.type === 'deposit' ? 'Masuk' : 'Keluar'}
                              </Badge>
                            </div>
                            {tx.category && (
                              <div className="text-sm text-gray-600 mt-1">
                                {tx.category}
                              </div>
                            )}
                          </div>
                          <div className="w-1/4">
                            <div className={`font-semibold ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.type === 'deposit' ? '+' : '-'}
                              {tx.currency === 'IDRT' 
                                ? `Rp ${parseFloat(tx.amount).toLocaleString()}`
                                : `${parseFloat(tx.amount).toLocaleString()} ${tx.currency}`}
                            </div>
                          </div>
                          <div className="w-1/4 text-right">
                            {getStatusBadge(tx.status)}
                            {tx.hash && (
                              <a 
                                href={`https://sepolia.etherscan.io/tx/${tx.hash}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center justify-end mt-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span>Lihat di Explorer</span>
                                <ArrowUpRight className="ml-1 h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Invoice Dialog */}
            {selectedTransaction && (
              <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
                <DialogContent className="max-w-4xl p-0 bg-white border border-gray-200 shadow-xl" onInteractOutside={(e) => e.preventDefault()}>
                  <div ref={invoiceRef}>
                    <TransactionInvoice 
                      transaction={selectedTransaction} 
                      onClose={() => setSelectedTransaction(null)}
                      onPrint={handlePrint}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <FinancialReport businessVaults={businessVaults} transactions={allTransactions} />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Payment Modal */}
      {showPaymentModal && selectedVaultForPayment && (
        <BusinessPayment
          onClose={() => setShowPaymentModal(false)}
          vaultAddress={selectedVaultForPayment.address}
          businessName={selectedVaultForPayment.name}
        />
      )}

      {/* Onboarding Tour */}
      <OnboardingTour
        isOpen={showTour}
        onClose={() => completeTour(tourType)}
        tourType={tourType}
        isBusinessUser={tourSettings.isBusinessUser}
      />
    </div>
  );
};

export default BusinessDashboard;
