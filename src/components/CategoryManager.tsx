import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Check, 
  AlertCircle, 
  Loader2, 
  Tag,
  TrendingUp,
  TrendingDown,
  Plus
} from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseUnits } from 'viem';
import { BusinessVault_ABI } from '@/contracts/BusinessContracts';
import { BusinessTransactionReader } from '@/services/businessTransactionReader';
import { toast } from '@/hooks/use-toast';

interface CategoryManagerProps {
  vaultAddress: string;
  businessName: string;
}

interface CategoryStat {
  name: string;
  count: number;
  totalAmount: string;
  isIncome: boolean;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  vaultAddress,
  businessName
}) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [depositForm, setDepositForm] = useState({
    amount: '',
    category: ''
  });
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    category: ''
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Load categories dari blockchain
  useEffect(() => {
    const loadCategories = async () => {
      if (!vaultAddress || !isConnected) return;
      
      setIsLoading(true);
      try {
        // Baca semua transaksi untuk mendapatkan kategori
        const transactions = await BusinessTransactionReader.readAllTransactions(vaultAddress);
        
        // Validasi dan kelompokkan berdasarkan kategori
        const { categoryStats } = BusinessTransactionReader.validateTransactionCategories(transactions);
        
        // Convert ke format CategoryStat
        const categoryList: CategoryStat[] = Object.entries(categoryStats).map(([name, stats]) => ({
          name,
          count: stats.count,
          totalAmount: (Number(stats.totalAmount) / 1e18).toFixed(4),
          isIncome: stats.isIncome
        }));

        // Sort berdasarkan jumlah transaksi
        categoryList.sort((a, b) => b.count - a.count);
        
        setCategories(categoryList);
        console.log('📊 Loaded categories from blockchain:', categoryList);
        
      } catch (error) {
        console.error('❌ Error loading categories:', error);
        toast({
          title: "Error",
          description: "Gagal memuat kategori dari blockchain",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, [vaultAddress, isConnected, isSuccess]);

  const handleDeposit = async () => {
    if (!depositForm.amount || !depositForm.category) {
      toast({
        title: "Error",
        description: "Silakan isi amount dan kategori",
        variant: "destructive"
      });
      return;
    }

    try {
      const amountWei = parseUnits(depositForm.amount, 18);
      
      writeContract({
        address: vaultAddress as `0x${string}`,
        abi: BusinessVault_ABI,
        functionName: 'depositNative',
        args: [depositForm.category],
        value: amountWei,
        chain: undefined,
        account: address
      });

      toast({
        title: "Transaksi Dikirim",
        description: `Menyimpan Rp ${parseFloat(depositForm.amount).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} dengan kategori "${depositForm.category}"`,
      });
      
    } catch (error) {
      console.error('Error depositing:', error);
      toast({
        title: "Error",
        description: "Gagal mengirim transaksi deposit",
        variant: "destructive"
      });
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawForm.amount || !withdrawForm.category) {
      toast({
        title: "Error", 
        description: "Silakan isi amount dan kategori",
        variant: "destructive"
      });
      return;
    }

    try {
      const amountWei = parseUnits(withdrawForm.amount, 18);
      
      writeContract({
        address: vaultAddress as `0x${string}`,
        abi: BusinessVault_ABI,
        functionName: 'withdrawNative',
        args: [amountWei, withdrawForm.category],
        chain: undefined,
        account: address
      });

      toast({
        title: "Transaksi Dikirim",
        description: `Menarik Rp ${parseFloat(withdrawForm.amount).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} dengan kategori "${withdrawForm.category}"`,
      });
      
    } catch (error) {
      console.error('Error withdrawing:', error);
      toast({
        title: "Error",
        description: "Gagal mengirim transaksi withdraw",
        variant: "destructive"
      });
    }
  };

  // Success effect
  useEffect(() => {
    if (isSuccess) {
      setDepositForm({ amount: '', category: '' });
      setWithdrawForm({ amount: '', category: '' });
      toast({
        title: "✅ Transaksi Berhasil",
        description: "Kategori telah tersimpan di blockchain",
      });
    }
  }, [isSuccess]);

  const commonCategories = [
    'Penjualan Produk',
    'Jasa Layanan',
    'Pembelian Stok',
    'Biaya Operasional',
    'Gaji Karyawan',
    'Marketing',
    'Utilitas',
    'Transportasi',
    'Maintenance',
    'Lainnya'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Manajemen Kategori Transaksi
          </CardTitle>
          <CardDescription>
            Kelola kategori untuk pencatatan keuangan yang akurat di blockchain
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Category Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Kategori yang Tersimpan di Blockchain</CardTitle>
          <CardDescription>
            Data kategori yang telah tercatat dalam smart contract
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Memuat data dari blockchain...</span>
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{category.name}</h4>
                      {category.isIncome ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div>{category.count} transaksi</div>
                      <div className={`font-medium ${category.isIncome ? 'text-green-600' : 'text-red-600'}`}>
                        Rp {parseFloat(category.totalAmount).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <Badge variant={category.isIncome ? "default" : "secondary"} className="text-xs">
                        {category.isIncome ? 'Pemasukan' : 'Pengeluaran'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Tag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Belum ada kategori yang tercatat</p>
              <p className="text-sm">Lakukan transaksi pertama untuk mulai mencatat kategori</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deposit Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Test Deposit dengan Kategori</CardTitle>
            <CardDescription>
              Tambahkan pemasukan dengan kategori yang akan tersimpan di blockchain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="deposit-amount">Jumlah (IDRT)</Label>
              <Input
                id="deposit-amount"
                type="number"
                step="0.001"
                placeholder="0.001"
                value={depositForm.amount}
                onChange={(e) => setDepositForm(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="deposit-category">Kategori</Label>
              <Input
                id="deposit-category"
                placeholder="Contoh: Penjualan Produk"
                value={depositForm.category}
                onChange={(e) => setDepositForm(prev => ({ ...prev, category: e.target.value }))}
                list="common-categories"
              />
              <datalist id="common-categories">
                {commonCategories.map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            <Button 
              onClick={handleDeposit}
              disabled={!depositForm.amount || !depositForm.category || isPending || isConfirming}
              className="w-full"
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isConfirming ? 'Mengkonfirmasi...' : 'Mengirim...'}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Deposit & Simpan Kategori
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Withdraw Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Test Withdraw dengan Kategori</CardTitle>
            <CardDescription>
              Lakukan pengeluaran dengan kategori yang akan tersimpan di blockchain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="withdraw-amount">Jumlah (IDRT)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                step="0.001"
                placeholder="0.001"
                value={withdrawForm.amount}
                onChange={(e) => setWithdrawForm(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="withdraw-category">Kategori</Label>
              <Input
                id="withdraw-category"
                placeholder="Contoh: Biaya Operasional"
                value={withdrawForm.category}
                onChange={(e) => setWithdrawForm(prev => ({ ...prev, category: e.target.value }))}
                list="expense-categories"
              />
              <datalist id="expense-categories">
                {commonCategories.filter(cat => 
                  cat.includes('Biaya') || 
                  cat.includes('Pembelian') || 
                  cat.includes('Gaji') ||
                  cat.includes('Marketing') ||
                  cat.includes('Utilitas') ||
                  cat.includes('Transportasi') ||
                  cat.includes('Maintenance')
                ).map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            <Button 
              onClick={handleWithdraw}
              disabled={!withdrawForm.amount || !withdrawForm.category || isPending || isConfirming}
              className="w-full"
              variant="destructive"
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isConfirming ? 'Mengkonfirmasi...' : 'Mengirim...'}
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Withdraw & Simpan Kategori
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Tentang Kategori On-Chain:</strong> Setiap transaksi yang Anda lakukan akan menyimpan 
          kategori langsung ke blockchain. Data ini immutable dan dapat diverifikasi oleh pihak ketiga 
          untuk audit keuangan yang transparan.
        </AlertDescription>
      </Alert>
    </div>
  );
};
