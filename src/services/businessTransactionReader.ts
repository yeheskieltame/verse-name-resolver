/**
 * Business Transaction Reader Service
 * Membaca data transaksi dari BusinessVault contract denga  static async readRecentTransactions(
    vaultAddress: string,
    chainId: number = 11155111,
    count: number = 10
  ): Promise<TransactionData[]> {
    try {
      const publicClient = getPublicClient(config, { chainId: chainId as any });
      if (!publicClient) {
        throw new Error(`Failed to get public client for chain ${chainId}`);
      }
 */

import { getPublicClient } from '@wagmi/core';
import { config } from '@/wagmi';
import { BusinessVault_ABI } from '@/contracts/BusinessContracts';
import { TransactionData } from './businessAnalyticsService';
import type { Chain } from 'viem';

interface RawTransactionLog {
  id: bigint;
  timestamp: bigint;
  isIncome: boolean;
  category: string;
  tokenAddress: string;
  amount: bigint;
  actor: string;
}

export class BusinessTransactionReader {
  
  /**
   * Baca semua transaksi dari contract dengan pagination
   */
  static async readAllTransactions(
    vaultAddress: string, 
    chainId: number = 11155111,
    startIndex: number = 0,
    batchSize: number = 50
  ): Promise<TransactionData[]> {
    try {
      console.log('📖 Reading transactions from vault:', vaultAddress);
      
      const publicClient = getPublicClient(config, { chainId: chainId as any });
      if (!publicClient) {
        throw new Error(`Failed to get public client for chain ${chainId}`);
      }

      // Get total transaction count
      const totalCount = await publicClient.readContract({
        address: vaultAddress as `0x${string}`,
        abi: BusinessVault_ABI,
        functionName: 'getTransactionLogCount'
      }) as bigint;

      const count = Number(totalCount);
      console.log(`📊 Total transactions in vault: ${count}`);

      if (count === 0) {
        return [];
      }

      const transactions: TransactionData[] = [];
      const maxIndex = Math.min(startIndex + batchSize, count);

      // Read transactions in batches
      for (let i = startIndex; i < maxIndex; i++) {
        try {
          const transaction = await publicClient.readContract({
            address: vaultAddress as `0x${string}`,
            abi: BusinessVault_ABI,
            functionName: 'transactionLog',
            args: [BigInt(i)]
          }) as unknown as RawTransactionLog;

          transactions.push({
            id: transaction.id,
            timestamp: transaction.timestamp,
            isIncome: transaction.isIncome,
            category: transaction.category,
            tokenAddress: transaction.tokenAddress,
            amount: transaction.amount,
            actor: transaction.actor
          });

          console.log(`✅ Loaded transaction ${i}:`, {
            id: Number(transaction.id),
            category: transaction.category,
            isIncome: transaction.isIncome,
            amount: transaction.amount.toString()
          });

        } catch (error) {
          console.warn(`⚠️ Failed to read transaction ${i}:`, error);
          // Continue with next transaction
        }
      }

      console.log(`📈 Successfully loaded ${transactions.length} transactions`);
      return transactions;

    } catch (error) {
      console.error('❌ Error reading transactions:', error);
      throw error;
    }
  }

  /**
   * Baca transaksi terbaru untuk real-time updates
   */
  static async readLatestTransactions(
    vaultAddress: string,
    chainId: number = 11155111,
    count: number = 10
  ): Promise<TransactionData[]> {
    try {
      const publicClient = getPublicClient(config, { chainId: chainId as any });
      if (!publicClient) {
        throw new Error(`Failed to get public client for chain ${chainId}`);
      }

      // Get total transaction count
      const totalCount = await publicClient.readContract({
        address: vaultAddress as `0x${string}`,
        abi: BusinessVault_ABI,
        functionName: 'getTransactionLogCount'
      }) as bigint;

      const totalCountNum = Number(totalCount);
      
      if (totalCountNum === 0) {
        return [];
      }

      const startIndex = Math.max(0, totalCountNum - count);
      return await this.readAllTransactions(vaultAddress, chainId, startIndex, count);

    } catch (error) {
      console.error('❌ Error reading latest transactions:', error);
      return [];
    }
  }

  /**
   * Watch untuk TransactionRecorded events
   */
  static async getTransactionEvents(
    vaultAddress: string,
    chainId: number = 11155111,
    fromBlock: bigint = BigInt(0),
    toBlock?: bigint
  ): Promise<TransactionData[]> {
    try {
      const publicClient = getPublicClient(config, { chainId: chainId as any });
      if (!publicClient) {
        throw new Error(`Failed to get public client for chain ${chainId}`);
      }

      const logs = await publicClient.getLogs({
        address: vaultAddress as `0x${string}`,
        event: {
          type: 'event',
          name: 'TransactionRecorded',
          inputs: [
            { type: 'uint256', name: 'id', indexed: true },
            { type: 'uint256', name: 'timestamp', indexed: false },
            { type: 'bool', name: 'isIncome', indexed: false },
            { type: 'string', name: 'category', indexed: false },
            { type: 'address', name: 'tokenAddress', indexed: true },
            { type: 'uint256', name: 'amount', indexed: false },
            { type: 'address', name: 'actor', indexed: true }
          ]
        },
        fromBlock,
        toBlock: toBlock || 'latest'
      });

      const transactions: TransactionData[] = logs.map(log => {
        const args = log.args as any;
        return {
          id: args.id,
          timestamp: args.timestamp,
          isIncome: args.isIncome,
          category: args.category,
          tokenAddress: args.tokenAddress,
          amount: args.amount,
          actor: args.actor
        };
      });

      console.log(`📡 Found ${transactions.length} transaction events`);
      return transactions;

    } catch (error) {
      console.error('❌ Error reading transaction events:', error);
      return [];
    }
  }

  /**
   * Validasi kategori dari transaksi on-chain
   */
  static validateTransactionCategories(transactions: TransactionData[]): {
    validCategories: string[];
    invalidCount: number;
    categoryStats: Record<string, { count: number; isIncome: boolean; totalAmount: bigint }>;
  } {
    const categoryStats: Record<string, { count: number; isIncome: boolean; totalAmount: bigint }> = {};
    const validCategories: string[] = [];
    let invalidCount = 0;

    transactions.forEach(tx => {
      if (!tx.category || tx.category.trim() === '') {
        invalidCount++;
        return;
      }

      const category = tx.category.trim();
      if (!validCategories.includes(category)) {
        validCategories.push(category);
      }

      if (!categoryStats[category]) {
        categoryStats[category] = {
          count: 0,
          isIncome: tx.isIncome,
          totalAmount: BigInt(0)
        };
      }

      categoryStats[category].count++;
      categoryStats[category].totalAmount += tx.amount;
    });

    return {
      validCategories,
      invalidCount,
      categoryStats
    };
  }

  /**
   * Get summary statistics
   */
  static getTransactionSummary(transactions: TransactionData[]): {
    totalTransactions: number;
    incomeTransactions: number;
    expenseTransactions: number;
    totalIncome: bigint;
    totalExpense: bigint;
    uniqueCategories: number;
    dateRange: {
      earliest: Date | null;
      latest: Date | null;
    };
  } {
    if (transactions.length === 0) {
      return {
        totalTransactions: 0,
        incomeTransactions: 0,
        expenseTransactions: 0,
        totalIncome: BigInt(0),
        totalExpense: BigInt(0),
        uniqueCategories: 0,
        dateRange: { earliest: null, latest: null }
      };
    }

    let totalIncome = BigInt(0);
    let totalExpense = BigInt(0);
    let incomeCount = 0;
    let expenseCount = 0;
    const categories = new Set<string>();
    const timestamps: number[] = [];

    transactions.forEach(tx => {
      timestamps.push(Number(tx.timestamp));
      categories.add(tx.category);
      
      if (tx.isIncome) {
        totalIncome += tx.amount;
        incomeCount++;
      } else {
        totalExpense += tx.amount;
        expenseCount++;
      }
    });

    timestamps.sort((a, b) => a - b);

    return {
      totalTransactions: transactions.length,
      incomeTransactions: incomeCount,
      expenseTransactions: expenseCount,
      totalIncome,
      totalExpense,
      uniqueCategories: categories.size,
      dateRange: {
        earliest: new Date(timestamps[0] * 1000),
        latest: new Date(timestamps[timestamps.length - 1] * 1000)
      }
    };
  }
}
