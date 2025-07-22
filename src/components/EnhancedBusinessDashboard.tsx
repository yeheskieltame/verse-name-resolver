import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  BarChart3,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Target,
  Zap
} from 'lucide-react';
import { useAccount, useChainId, useReadContract, useWatchContractEvent } from 'wagmi';
import { formatUnits } from 'viem';
import { BusinessVault_ABI } from '@/contracts/BusinessContracts';
import { 
  BusinessAnalyticsService, 
  TransactionData, 
  FinancialMetrics, 
  CategoryAnalysis,
  BusinessHealthScore,
  TrendData
} from '@/services/businessAnalyticsService';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface EnhancedBusinessDashboardProps {
  vaultAddress: string;
  businessName: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

export const EnhancedBusinessDashboard: React.FC<EnhancedBusinessDashboardProps> = ({
  vaultAddress,
  businessName
}) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  // State untuk analytics data
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Read contract data
  const { data: transactionCount } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: BusinessVault_ABI,
    functionName: 'getTransactionLogCount',
    query: {
      enabled: !!vaultAddress && isConnected
    }
  });

  // Watch for new transactions
  useWatchContractEvent({
    address: vaultAddress as `0x${string}`,
    abi: BusinessVault_ABI,
    eventName: 'TransactionRecorded',
    onLogs(logs) {
      console.log('📊 New transaction detected:', logs);
      setRefreshTrigger(prev => prev + 1);
    },
  });

  // Load transaction data
  useEffect(() => {
    const loadTransactions = async () => {
      if (!transactionCount || !isConnected) return;
      
      setIsLoading(true);
      try {
        const txList: TransactionData[] = [];
        const count = Number(transactionCount);
        
        // Fetch all transactions - in production, consider pagination
        for (let i = 0; i < Math.min(count, 1000); i++) {
          try {
            // This would need to be implemented with proper contract reading
            // For now, we'll simulate with the event watching
            // In real implementation, you'd read from transactionLog mapping
          } catch (error) {
            console.warn(`Failed to load transaction ${i}:`, error);
          }
        }
        
        setTransactions(txList);
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactions();
  }, [transactionCount, isConnected, refreshTrigger]);

  // Calculate analytics
  const analytics = useMemo(() => {
    if (transactions.length === 0) {
      return {
        metrics: {
          totalIncome: '0',
          totalExpense: '0',
          netProfit: '0',
          profitMargin: 0,
          transactionCount: 0,
          avgTransactionValue: '0',
          lastTransactionDate: null
        } as FinancialMetrics,
        categories: {
          incomeCategories: [],
          expenseCategories: []
        },
        healthScore: {
          score: 0,
          grade: 'F' as const,
          factors: {
            revenueConsistency: 0,
            profitRatio: 0,
            transactionVolume: 0,
            businessAge: 0
          },
          recommendations: ['Mulai melakukan transaksi untuk mendapatkan analisis']
        } as BusinessHealthScore,
        trends: [] as TrendData[]
      };
    }

    return {
      metrics: BusinessAnalyticsService.calculateFinancialMetrics(transactions),
      categories: BusinessAnalyticsService.analyzeCategoriesBreakdown(transactions),
      healthScore: BusinessAnalyticsService.calculateBusinessHealthScore(transactions),
      trends: BusinessAnalyticsService.generateTrendData(transactions, 30)
    };
  }, [transactions]);

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 80) return 'bg-blue-100';
    if (score >= 70) return 'bg-yellow-100';
    if (score >= 60) return 'bg-orange-100';
    return 'bg-red-100';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header dengan Business Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {businessName} - Dashboard Analitik
            </CardTitle>
            <CardDescription>
              Analisis keuangan berbasis data on-chain • Vault: {vaultAddress.slice(0, 6)}...{vaultAddress.slice(-4)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  Rp {parseFloat(analytics.metrics.totalIncome).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-gray-500">Total Pemasukan</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  Rp {parseFloat(analytics.metrics.totalExpense).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-gray-500">Total Pengeluaran</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${parseFloat(analytics.metrics.netProfit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Rp {parseFloat(analytics.metrics.netProfit).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-gray-500">Laba Bersih</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Health Score Card */}
        <Card className={getHealthScoreBgColor(analytics.healthScore.score)}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Skor Kesehatan Bisnis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-3">
              <div className={`text-4xl font-bold ${getHealthScoreColor(analytics.healthScore.score)}`}>
                {analytics.healthScore.score}
              </div>
              <Badge variant={analytics.healthScore.grade === 'A' ? 'default' : 'secondary'} className="text-lg px-3 py-1">
                Grade {analytics.healthScore.grade}
              </Badge>
              <Progress value={analytics.healthScore.score} className="w-full" />
              <div className="text-sm text-gray-600">
                Berdasarkan {analytics.metrics.transactionCount} transaksi on-chain
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs untuk berbagai analisis */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">📊 Overview</TabsTrigger>
          <TabsTrigger value="trends">📈 Trend</TabsTrigger>
          <TabsTrigger value="categories">🏷️ Kategori</TabsTrigger>
          <TabsTrigger value="health">💚 Kesehatan</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Margin Keuntungan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${analytics.metrics.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.metrics.profitMargin.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Transaksi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.metrics.transactionCount}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Rata-rata Transaksi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  Rp {parseFloat(analytics.metrics.avgTransactionValue).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Transaksi Terakhir</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  {analytics.metrics.lastTransactionDate 
                    ? analytics.metrics.lastTransactionDate.toLocaleDateString('id-ID')
                    : 'Belum ada transaksi'
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Recommendations */}
          {analytics.healthScore.recommendations.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Rekomendasi untuk Meningkatkan Bisnis:</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {analytics.healthScore.recommendations.slice(0, 3).map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trend Arus Kas (30 Hari Terakhir)</CardTitle>
              <CardDescription>
                Analisis performa keuangan harian berdasarkan data on-chain
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString('id-ID')}
                      formatter={(value: number, name: string) => [
                        `Rp ${value.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        name === 'income' ? 'Pemasukan' : name === 'expense' ? 'Pengeluaran' : 'Laba Bersih'
                      ]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#10b981" name="Pemasukan" strokeWidth={2} />
                    <Line type="monotone" dataKey="expense" stroke="#ef4444" name="Pengeluaran" strokeWidth={2} />
                    <Line type="monotone" dataKey="net" stroke="#3b82f6" name="Laba Bersih" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Kategori Pemasukan</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.categories.incomeCategories.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.categories.incomeCategories.map((category, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{category.category}</div>
                          <div className="text-sm text-gray-500">{category.transactionCount} transaksi</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">Rp {parseFloat(category.totalAmount).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          <div className="text-sm text-gray-500">{category.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    Belum ada data pemasukan
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expense Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Kategori Pengeluaran</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.categories.expenseCategories.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.categories.expenseCategories.map((category, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{category.category}</div>
                          <div className="text-sm text-gray-500">{category.transactionCount} transaksi</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">Rp {parseFloat(category.totalAmount).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          <div className="text-sm text-gray-500">{category.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    Belum ada data pengeluaran
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Health Score Detail Tab */}
        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Score Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Detail Skor Kesehatan</CardTitle>
                <CardDescription>
                  Analisis berbasis data blockchain untuk penilaian kredit
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Konsistensi Pendapatan</span>
                    <span className="font-bold">{analytics.healthScore.factors.revenueConsistency}/25</span>
                  </div>
                  <Progress value={(analytics.healthScore.factors.revenueConsistency / 25) * 100} />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Rasio Keuntungan</span>
                    <span className="font-bold">{analytics.healthScore.factors.profitRatio}/30</span>
                  </div>
                  <Progress value={(analytics.healthScore.factors.profitRatio / 30) * 100} />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Volume Transaksi</span>
                    <span className="font-bold">{analytics.healthScore.factors.transactionVolume}/25</span>
                  </div>
                  <Progress value={(analytics.healthScore.factors.transactionVolume / 25) * 100} />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Usia Bisnis</span>
                    <span className="font-bold">{analytics.healthScore.factors.businessAge}/20</span>
                  </div>
                  <Progress value={(analytics.healthScore.factors.businessAge / 20) * 100} />
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Rekomendasi Perbaikan</CardTitle>
                <CardDescription>
                  Saran untuk meningkatkan skor kesehatan bisnis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.healthScore.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <Target className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">{recommendation}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Credit Rating Preview */}
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-purple-800 flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Preview: Potensi Credit Rating
              </CardTitle>
              <CardDescription className="text-purple-600">
                Simulasi penilaian kredit berdasarkan data on-chain saat ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-700">
                    {analytics.healthScore.grade}
                  </div>
                  <div className="text-sm text-purple-600">Credit Grade</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-700">
                    {analytics.healthScore.score >= 80 ? 'Tinggi' : analytics.healthScore.score >= 60 ? 'Sedang' : 'Rendah'}
                  </div>
                  <div className="text-sm text-purple-600">Risk Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-700">
                    {analytics.healthScore.score >= 80 ? '✓' : '⚠️'}
                  </div>
                  <div className="text-sm text-purple-600">Loan Eligibility</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
