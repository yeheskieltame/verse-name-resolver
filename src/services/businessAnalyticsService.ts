/**
 * Enhanced Business Analytics Service
 * Menganalisis data transaksi on-chain untuk menghasilkan insights bisnis
 */

import { formatUnits } from 'viem';

// MockIDRT menggunakan 2 decimals seperti mata uang rupiah
const MOCKIDRT_DECIMALS = 2;

export interface TransactionData {
  id: bigint;
  timestamp: bigint;
  isIncome: boolean;
  category: string;
  tokenAddress: string;
  amount: bigint;
  actor: string;
}

export interface FinancialMetrics {
  totalIncome: string;
  totalExpense: string;
  netProfit: string;
  profitMargin: number;
  transactionCount: number;
  avgTransactionValue: string;
  lastTransactionDate: Date | null;
}

export interface CategoryAnalysis {
  category: string;
  totalAmount: string;
  percentage: number;
  transactionCount: number;
  isIncome: boolean;
}

export interface BusinessHealthScore {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: {
    revenueConsistency: number;
    profitRatio: number;
    transactionVolume: number;
    businessAge: number;
  };
  recommendations: string[];
}

export interface TrendData {
  date: string;
  income: number;
  expense: number;
  net: number;
}

export class BusinessAnalyticsService {
  
  /**
   * Hitung metrik keuangan dasar
   */
  static calculateFinancialMetrics(transactions: TransactionData[]): FinancialMetrics {
    let totalIncome = BigInt(0);
    let totalExpense = BigInt(0);
    let lastTransactionTimestamp = BigInt(0);

    transactions.forEach(tx => {
      if (tx.isIncome) {
        totalIncome += tx.amount;
      } else {
        totalExpense += tx.amount;
      }
      
      if (tx.timestamp > lastTransactionTimestamp) {
        lastTransactionTimestamp = tx.timestamp;
      }
    });

    const netProfit = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? Number(netProfit * BigInt(100) / totalIncome) : 0;
    
    const avgTransactionValue = transactions.length > 0 
      ? (totalIncome + totalExpense) / BigInt(transactions.length)
      : BigInt(0);

    return {
      totalIncome: formatUnits(totalIncome, MOCKIDRT_DECIMALS),
      totalExpense: formatUnits(totalExpense, MOCKIDRT_DECIMALS),
      netProfit: formatUnits(netProfit, MOCKIDRT_DECIMALS),
      profitMargin,
      transactionCount: transactions.length,
      avgTransactionValue: formatUnits(avgTransactionValue, MOCKIDRT_DECIMALS),
      lastTransactionDate: lastTransactionTimestamp > 0 
        ? new Date(Number(lastTransactionTimestamp) * 1000) 
        : null
    };
  }

  /**
   * Analisis per kategori
   */
  static analyzeCategoriesBreakdown(transactions: TransactionData[]): {
    incomeCategories: CategoryAnalysis[];
    expenseCategories: CategoryAnalysis[];
  } {
    const incomeMap = new Map<string, { total: bigint; count: number }>();
    const expenseMap = new Map<string, { total: bigint; count: number }>();
    
    let totalIncome = BigInt(0);
    let totalExpense = BigInt(0);

    // Aggregate data per kategori
    transactions.forEach(tx => {
      const map = tx.isIncome ? incomeMap : expenseMap;
      const current = map.get(tx.category) || { total: BigInt(0), count: 0 };
      
      map.set(tx.category, {
        total: current.total + tx.amount,
        count: current.count + 1
      });

      if (tx.isIncome) {
        totalIncome += tx.amount;
      } else {
        totalExpense += tx.amount;
      }
    });

    // Convert to CategoryAnalysis format
    const incomeCategories: CategoryAnalysis[] = Array.from(incomeMap.entries()).map(([category, data]) => ({
      category,
      totalAmount: formatUnits(data.total, MOCKIDRT_DECIMALS),
      percentage: totalIncome > 0 ? Number(data.total * BigInt(100) / totalIncome) : 0,
      transactionCount: data.count,
      isIncome: true
    })).sort((a, b) => b.percentage - a.percentage);

    const expenseCategories: CategoryAnalysis[] = Array.from(expenseMap.entries()).map(([category, data]) => ({
      category,
      totalAmount: formatUnits(data.total, MOCKIDRT_DECIMALS),
      percentage: totalExpense > 0 ? Number(data.total * BigInt(100) / totalExpense) : 0,
      transactionCount: data.count,
      isIncome: false
    })).sort((a, b) => b.percentage - a.percentage);

    return { incomeCategories, expenseCategories };
  }

  /**
   * Hitung Business Health Score berbasis data on-chain
   */
  static calculateBusinessHealthScore(transactions: TransactionData[]): BusinessHealthScore {
    if (transactions.length === 0) {
      return {
        score: 0,
        grade: 'F',
        factors: {
          revenueConsistency: 0,
          profitRatio: 0,
          transactionVolume: 0,
          businessAge: 0
        },
        recommendations: ['Mulai melakukan transaksi untuk mendapatkan skor kesehatan bisnis']
      };
    }

    const metrics = this.calculateFinancialMetrics(transactions);
    
    // 1. Revenue Consistency (0-25 points)
    const revenueConsistency = this.calculateRevenueConsistency(transactions);
    
    // 2. Profit Ratio (0-30 points)
    const profitRatio = Math.max(0, Math.min(30, metrics.profitMargin > 0 ? metrics.profitMargin / 2 : 0));
    
    // 3. Transaction Volume (0-25 points)
    const transactionVolume = Math.min(25, transactions.length);
    
    // 4. Business Age (0-20 points)
    const businessAge = this.calculateBusinessAge(transactions);
    
    const totalScore = revenueConsistency + profitRatio + transactionVolume + businessAge;
    
    // Determine grade
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (totalScore >= 90) grade = 'A';
    else if (totalScore >= 80) grade = 'B';
    else if (totalScore >= 70) grade = 'C';
    else if (totalScore >= 60) grade = 'D';
    else grade = 'F';

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      { revenueConsistency, profitRatio, transactionVolume, businessAge },
      metrics
    );

    return {
      score: Math.round(totalScore),
      grade,
      factors: {
        revenueConsistency: Math.round(revenueConsistency),
        profitRatio: Math.round(profitRatio),
        transactionVolume: Math.round(transactionVolume),
        businessAge: Math.round(businessAge)
      },
      recommendations
    };
  }

  /**
   * Generate trend data untuk grafik
   */
  static generateTrendData(transactions: TransactionData[], days: number = 30): TrendData[] {
    const now = new Date();
    const trends: TrendData[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayStart = Math.floor(date.getTime() / 1000);
      const dayEnd = dayStart + 86400; // 24 hours
      
      let dayIncome = 0;
      let dayExpense = 0;
      
      transactions.forEach(tx => {
        const txTimestamp = Number(tx.timestamp);
        if (txTimestamp >= dayStart && txTimestamp < dayEnd) {
          const amount = Number(formatUnits(tx.amount, MOCKIDRT_DECIMALS));
          if (tx.isIncome) {
            dayIncome += amount;
          } else {
            dayExpense += amount;
          }
        }
      });
      
      trends.push({
        date: dateStr,
        income: dayIncome,
        expense: dayExpense,
        net: dayIncome - dayExpense
      });
    }
    
    return trends;
  }

  // Private helper methods
  
  private static calculateRevenueConsistency(transactions: TransactionData[]): number {
    const incomeTransactions = transactions.filter(tx => tx.isIncome);
    if (incomeTransactions.length < 2) return 0;
    
    // Check if income transactions are spread across multiple days
    const dates = new Set(
      incomeTransactions.map(tx => 
        new Date(Number(tx.timestamp) * 1000).toDateString()
      )
    );
    
    const daysWithIncome = dates.size;
    const totalDays = this.getBusinessAgeDays(transactions);
    
    if (totalDays === 0) return 0;
    
    const consistency = (daysWithIncome / Math.min(totalDays, 30)) * 25;
    return Math.min(25, consistency);
  }

  private static calculateBusinessAge(transactions: TransactionData[]): number {
    const ageDays = this.getBusinessAgeDays(transactions);
    // Max 20 points for 90+ days
    return Math.min(20, (ageDays / 90) * 20);
  }

  private static getBusinessAgeDays(transactions: TransactionData[]): number {
    if (transactions.length === 0) return 0;
    
    const timestamps = transactions.map(tx => Number(tx.timestamp));
    const oldest = Math.min(...timestamps);
    const newest = Math.max(...timestamps);
    
    return Math.floor((newest - oldest) / 86400); // Convert to days
  }

  private static generateRecommendations(
    factors: BusinessHealthScore['factors'],
    metrics: FinancialMetrics
  ): string[] {
    const recommendations: string[] = [];
    
    if (factors.revenueConsistency < 15) {
      recommendations.push('Tingkatkan konsistensi pemasukan dengan diversifikasi sumber pendapatan');
    }
    
    if (factors.profitRatio < 20) {
      recommendations.push('Optimalkan margin keuntungan dengan mengurangi pengeluaran atau meningkatkan harga');
    }
    
    if (factors.transactionVolume < 15) {
      recommendations.push('Tingkatkan volume transaksi untuk memperkuat track record bisnis');
    }
    
    if (factors.businessAge < 10) {
      recommendations.push('Terus jalankan bisnis secara konsisten untuk membangun kredibilitas jangka panjang');
    }
    
    if (parseFloat(metrics.netProfit) < 0) {
      recommendations.push('URGENT: Bisnis mengalami kerugian, segera evaluasi strategi dan kurangi pengeluaran');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Bisnis Anda dalam kondisi baik! Pertahankan kinerja dan terus kembangkan inovasi');
    }
    
    return recommendations;
  }
}
