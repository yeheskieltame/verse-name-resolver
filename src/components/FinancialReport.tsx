import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  BarChart3,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  Layers
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { BUSINESS_CONTRACTS, BUSINESS_CATEGORIES } from '../contracts/BusinessContracts';
import { SmartVerseBusinessService } from '../services/smartVerseBusiness';

interface FinancialReportProps {
  businessVaults: Array<{
    address: string;
    name: string;
    chainId: number;
    chainName: string;
    balance: string;
  }>;
}

interface ChainSummary {
  chainId: number;
  chainName: string;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  transactionCount: number;
}

interface CategorySummary {
  category: string;
  amount: number;
  percentage: number;
  transactions: number;
}

const FinancialReport: React.FC<FinancialReportProps> = ({ businessVaults }) => {
  const { address } = useAccount();
  
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedChain, setSelectedChain] = useState<number | 'all'>('all');
  const [chainSummaries, setChainSummaries] = useState<ChainSummary[]>([]);
  const [incomeSummary, setIncomeSummary] = useState<CategorySummary[]>([]);
  const [expenseSummary, setExpenseSummary] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessService] = useState(new SmartVerseBusinessService());

  // Summary metrics
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [profitMargin, setProfitMargin] = useState(0);

  useEffect(() => {
    if (businessVaults.length > 0) {
      loadFinancialData();
    } else {
      // No business vaults available - show empty state
      setChainSummaries([]);
      setIncomeSummary([]);
      setExpenseSummary([]);
      setTotalIncome(0);
      setTotalExpense(0);
      setNetProfit(0);
      setProfitMargin(0);
      setLoading(false);
    }
  }, [businessVaults, selectedPeriod, selectedChain]);

  const loadFinancialData = async () => {
    setLoading(true);
    
    try {
      // Load real financial data for each vault
      const summaries: ChainSummary[] = [];
      let totalIncomeSum = 0;
      let totalExpenseSum = 0;
      let totalTransactionCount = 0;
      
      for (const vault of businessVaults) {
        try {
          // Get financial summary for this vault
          const summary = await businessService.getBusinessSummary(vault.address as `0x${string}`);
          const transactions = await businessService.getBusinessTransactions(vault.address as `0x${string}`);
          
          const income = parseFloat(summary.totalIncome);
          const expense = parseFloat(summary.totalExpenses);
          const profit = income - expense;
          
          summaries.push({
            chainId: vault.chainId,
            chainName: vault.chainName,
            totalIncome: income,
            totalExpense: expense,
            netProfit: profit,
            transactionCount: transactions.length
          });
          
          totalIncomeSum += income;
          totalExpenseSum += expense;
          totalTransactionCount += transactions.length;
        } catch (error) {
          console.error(`Error loading data for vault ${vault.address}:`, error);
        }
      }
      
      setChainSummaries(summaries);
      setTotalIncome(totalIncomeSum);
      setTotalExpense(totalExpenseSum);
      setNetProfit(totalIncomeSum - totalExpenseSum);
      setProfitMargin(totalIncomeSum > 0 ? ((totalIncomeSum - totalExpenseSum) / totalIncomeSum) * 100 : 0);
      
      // Set empty category summaries for now (could be enhanced to analyze categories)
      setIncomeSummary([]);
      setExpenseSummary([]);
      
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString()}`;
  };

  const getChainColor = (chainId: number) => {
    const colors = {
      11155111: 'bg-blue-100 text-blue-800',
      13000: 'bg-green-100 text-green-800',
      17000: 'bg-purple-100 text-purple-800',
      1115: 'bg-yellow-100 text-yellow-800',
      80002: 'bg-pink-100 text-pink-800'
    };
    return colors[chainId as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const exportReport = () => {
    // Implementasi ekspor laporan
    console.log('Exporting financial report...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat laporan keuangan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Laporan Keuangan</h2>
          <p className="text-gray-600">Analisis keuangan lintas-chain untuk semua bisnis</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Harian</SelectItem>
              <SelectItem value="weekly">Mingguan</SelectItem>
              <SelectItem value="monthly">Bulanan</SelectItem>
              <SelectItem value="yearly">Tahunan</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedChain.toString()} onValueChange={(value) => setSelectedChain(value === 'all' ? 'all' : parseInt(value))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Chain</SelectItem>
              {Object.values(BUSINESS_CONTRACTS).map((chain) => (
                <SelectItem key={chain.chainId} value={chain.chainId.toString()}>
                  {chain.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pendapatan</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalIncome)}
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
                <p className="text-sm font-medium text-gray-600">Total Pengeluaran</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalExpense)}
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
                <p className="text-sm font-medium text-gray-600">Laba Bersih</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(netProfit)}
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
                <p className="text-sm font-medium text-gray-600">Margin Keuntungan</p>
                <p className="text-2xl font-bold text-purple-600">
                  {profitMargin.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chain Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Layers className="h-5 w-5" />
              <span>Performa per Chain</span>
            </CardTitle>
            <CardDescription>
              Pendapatan dan pengeluaran per jaringan blockchain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chainSummaries.map((chain) => (
                <div key={chain.chainId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className={getChainColor(chain.chainId)} variant="outline">
                      {chain.chainName}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {chain.transactionCount} transaksi
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Pendapatan</span>
                      <span className="font-medium">{formatCurrency(chain.totalIncome)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600">Pengeluaran</span>
                      <span className="font-medium">{formatCurrency(chain.totalExpense)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-1">
                      <span className="font-medium">Laba Bersih</span>
                      <span className="font-bold text-blue-600">{formatCurrency(chain.netProfit)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Income Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ArrowDownLeft className="h-5 w-5 text-green-600" />
              <span>Kategori Pendapatan</span>
            </CardTitle>
            <CardDescription>
              Breakdown pendapatan berdasarkan kategori
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {incomeSummary.map((item) => (
                <div key={item.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {BUSINESS_CATEGORIES.INCOME[item.category as keyof typeof BUSINESS_CATEGORIES.INCOME]}
                    </span>
                    <span className="text-sm text-gray-600">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">{formatCurrency(item.amount)}</span>
                    <span className="text-gray-600">{item.transactions} transaksi</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ArrowUpRight className="h-5 w-5 text-red-600" />
              <span>Kategori Pengeluaran</span>
            </CardTitle>
            <CardDescription>
              Breakdown pengeluaran berdasarkan kategori
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expenseSummary.map((item) => (
                <div key={item.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {BUSINESS_CATEGORIES.EXPENSE[item.category as keyof typeof BUSINESS_CATEGORIES.EXPENSE]}
                    </span>
                    <span className="text-sm text-gray-600">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">{formatCurrency(item.amount)}</span>
                    <span className="text-gray-600">{item.transactions} transaksi</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Business Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Distribusi Bisnis</span>
            </CardTitle>
            <CardDescription>
              Saldo dan performa per bisnis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {businessVaults.map((vault) => (
                <div key={vault.address} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Building2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{vault.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {vault.chainName}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(parseFloat(vault.balance))}</p>
                    <p className="text-sm text-gray-600">Saldo</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinancialReport;
