// SmartVerse Business Service
// Layanan untuk integrasi dengan kontrak bisnis di blockchain

import { Contract, JsonRpcProvider, formatEther, ZeroAddress } from 'ethers';
import {
  BUSINESS_CONTRACTS,
  getContractAddress,
  BusinessFactory_ABI,
  BusinessVault_ABI
} from '../contracts/BusinessContracts';
import { BusinessDataManager } from './businessDataManager';

// Cache keys
const CACHE_KEYS = {
  VAULT_ADDRESS: 'smartverse_vault_address_',
  BUSINESS_SUMMARY: 'smartverse_business_summary_',
  TRANSACTIONS: 'smartverse_transactions_',
};

export interface BusinessSummary {
  balance: string;
  totalIncome: string;
  totalExpenses: string;
  transactionCount: number;
}

export interface BusinessTransaction {
  id: string;
  timestamp: number;
  isIncome: boolean;
  category: string;
  amount: string;
  from: string;
  to: string;
  txHash?: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  chainId: number;
}

export class SmartVerseBusinessService {
  private cache: Map<string, any>;
  private cacheExpiry: Map<string, number>;
  private cacheDuration = 5 * 60 * 1000; // 5 menit

  // Debug check for service instantiation
  constructor() {
    console.log('SmartVerseBusinessService constructor called');
    
    // Initialize cache
    this.cache = new Map<string, any>();
    this.cacheExpiry = new Map<string, number>();
    
    // Load cache from sessionStorage
    this.loadCacheFromStorage();
  }
  
  // Cache handling methods
  private loadCacheFromStorage() {
    try {
      const storedCache = sessionStorage.getItem('smartverse_business_cache');
      if (storedCache) {
        const parsed = JSON.parse(storedCache);
        Object.keys(parsed.data).forEach(key => {
          this.cache.set(key, parsed.data[key]);
        });
        Object.keys(parsed.expiry).forEach(key => {
          this.cacheExpiry.set(key, parsed.expiry[key]);
        });
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }
  
  private saveCache() {
    try {
      const cacheData = Object.fromEntries(this.cache.entries());
      const cacheExpiry = Object.fromEntries(this.cacheExpiry.entries());
      sessionStorage.setItem('smartverse_business_cache', JSON.stringify({
        data: cacheData,
        expiry: cacheExpiry
      }));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }
  
  private getCacheKey(type: string, id: string): string {
    return `${type}_${id}`;
  }
  
  private getFromCache<T>(type: string, id: string): T | null {
    const key = this.getCacheKey(type, id);
    const expiry = this.cacheExpiry.get(key);
    
    if (expiry && expiry > Date.now()) {
      return this.cache.get(key) as T;
    }
    
    // Clean expired cache
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
    return null;
  }
  
  private setCache<T>(type: string, id: string, data: T): void {
    const key = this.getCacheKey(type, id);
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.cacheDuration);
    this.saveCache();
  }
  
  // Clear specific cache
  public clearCache(type?: string, id?: string): void {
    if (type && id) {
      const key = this.getCacheKey(type, id);
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
    } else if (type) {
      // Clear all cache of this type
      const keysToDelete: string[] = [];
      this.cache.forEach((_, key) => {
        if (key.startsWith(type)) keysToDelete.push(key);
      });
      
      keysToDelete.forEach(key => {
        this.cache.delete(key);
        this.cacheExpiry.delete(key);
      });
    } else {
      // Clear all cache
      this.cache.clear();
      this.cacheExpiry.clear();
    }
    
    this.saveCache();
  }

  /**
   * Membuat business vault baru untuk user
   */
  async createBusinessVault(ownerAddress: `0x${string}`) {
    try {
      // Simulasi vault creation
      const mockVaultAddress = '0x1234567890123456789012345678901234567890';
      
      // Simpan status "memiliki vault" di localStorage
      localStorage.setItem('has_business_vault', 'true');
      
      // Clear cache
      this.clearCache(CACHE_KEYS.VAULT_ADDRESS, ownerAddress);
      
      return mockVaultAddress;
    } catch (error) {
      console.error('Error creating business vault:', error);
      throw error;
    }
  }

  /**
   * Mendapatkan alamat vault bisnis dari user
   */
  async getUserVault(ownerAddress: `0x${string}`) {
    try {
      const alchemyKey = import.meta.env.VITE_ALCHEMY_SEPOLIA_KEY;
      const provider = new JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`);
      const factoryAddress = BUSINESS_CONTRACTS.sepolia.contracts.BusinessFactory;
      const factory = new Contract(factoryAddress, BusinessFactory_ABI, provider);
      // Sesuai ABI, gunakan userToVault(address)
      const vaultAddress = await factory.userToVault(ownerAddress);
      if (vaultAddress && vaultAddress !== ZeroAddress) {
        return vaultAddress;
      }
      return null;
    } catch (error) {
      console.error('Error getting user vault from blockchain:', error);
      return null;
    }
  }

  /**
   * Mendapatkan ringkasan data bisnis dari vault
   */
  async getBusinessSummary(vaultAddress: `0x${string}`): Promise<BusinessSummary> {
    try {
      const alchemyKey = import.meta.env.VITE_ALCHEMY_SEPOLIA_KEY;
      const provider = new JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`);
      const vault = new Contract(vaultAddress, BusinessVault_ABI, provider);
      const balance = await provider.getBalance(vaultAddress);
      const totalNativeIncome = await vault.totalNativeIncome();
      const totalNativeExpense = await vault.totalNativeExpense();
      const txCount = await vault.getTransactionLogCount();
      // Tambahkan log debug
      console.log('[DEBUG] getBusinessSummary raw:', {
        balance,
        totalNativeIncome,
        totalNativeExpense,
        txCount
      });
      return {
        balance: formatEther(balance),
        totalIncome: formatEther(totalNativeIncome),
        totalExpenses: formatEther(totalNativeExpense),
        transactionCount: Number(txCount)
      };
    } catch (error) {
      console.error('Error getting business summary from blockchain:', error);
      return {
        balance: '0',
        totalIncome: '0',
        totalExpenses: '0',
        transactionCount: 0
      };
    }
  }

  /**
   * Mendapatkan riwayat transaksi bisnis
   */
  async getBusinessTransactions(vaultAddress: `0x${string}`): Promise<BusinessTransaction[]> {
    try {
      const alchemyKey = import.meta.env.VITE_ALCHEMY_SEPOLIA_KEY;
      const provider = new JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`);
      const vault = new Contract(vaultAddress, BusinessVault_ABI, provider);
      const txCount = await vault.getTransactionLogCount();
      // Tambahkan log debug
      console.log('[DEBUG] getBusinessTransactions txCount:', txCount);
      const txs: BusinessTransaction[] = [];
      for (let i = 0; i < txCount; i++) {
        const tx = await vault.transactionLog(i);
        console.log(`[DEBUG] transactionLog[${i}]:`, tx);
        txs.push({
          id: i.toString(),
          timestamp: Number(tx.timestamp),
          isIncome: tx.isIncome,
          category: tx.category,
          amount: formatEther(tx.amount),
          from: tx.from,
          to: tx.to,
          txHash: tx.txHash,
          status: 'success',
          chainId: 11155111
        });
      }
      return txs.reverse();
    } catch (error) {
      console.error('Error getting business transactions from blockchain:', error);
      return [];
    }
  }

  /**
   * Mencatat pemasukan bisnis
   */
  async recordIncome(
    vaultAddress: `0x${string}`,
    amount: string,
    category: string
  ) {
    try {
      // Simulasi pencatatan pemasukan
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      
      // Invalidate cache after recording income
      this.clearCache(CACHE_KEYS.BUSINESS_SUMMARY, vaultAddress);
      this.clearCache(CACHE_KEYS.TRANSACTIONS, vaultAddress);
      
      return mockTxHash;
    } catch (error) {
      console.error('Error recording income:', error);
      throw error;
    }
  }

  /**
   * Mencatat pengeluaran bisnis
   */
  async recordExpense(
    vaultAddress: `0x${string}`,
    amount: string,
    category: string,
    recipientAddress: `0x${string}`
  ) {
    try {
      // Simulasi pencatatan pengeluaran
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      
      // Invalidate cache after recording expense
      this.clearCache(CACHE_KEYS.BUSINESS_SUMMARY, vaultAddress);
      this.clearCache(CACHE_KEYS.TRANSACTIONS, vaultAddress);
      
      return mockTxHash;
    } catch (error) {
      console.error('Error recording expense:', error);
      throw error;
    }
  }

  /**
   * Mendapatkan nama bisnis asli dari localStorage
   */
  async getBusinessName(vaultAddress: `0x${string}`): Promise<string> {
    try {
      const info = BusinessDataManager.getBusinessInfo(vaultAddress, 11155111);
      if (info && info.businessName) return info.businessName;
      return '';
    } catch (error) {
      console.error('Error getting business name:', error);
      return '';
    }
  }
  
  /**
   * Refresh data dari blockchain (invalidate cache)
   */
  async refreshBusinessData(vaultAddress: string): Promise<void> {
    this.clearCache(CACHE_KEYS.BUSINESS_SUMMARY, vaultAddress);
    this.clearCache(CACHE_KEYS.TRANSACTIONS, vaultAddress);
    console.log('Business data cache cleared for vault:', vaultAddress);
  }

  /**
   * Deposit native (ETH) ke vault bisnis
   */
  async depositNativeToVault(
    vaultAddress: `0x${string}`,
    amountWei: bigint,
    category: string
  ): Promise<string> {
    try {
      const alchemyKey = import.meta.env.VITE_ALCHEMY_SEPOLIA_KEY;
      const provider = new JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`);
      // User harus sign transaksi, jadi perlu signer dari wallet (harus diimplementasikan di frontend, ini hanya contoh call contract)
      // const signer = provider.getSigner();
      // const vault = new Contract(vaultAddress, BusinessVault_ABI, signer);
      // const tx = await vault.depositNative(category, { value: amountWei });
      // await tx.wait();
      // return tx.hash;
      // Untuk mock/testing:
      return '0x' + Math.random().toString(16).substr(2, 64);
    } catch (error) {
      console.error('Error deposit native to vault:', error);
      throw error;
    }
  }

  /**
   * Deposit token ke vault bisnis
   */
  async depositTokenToVault(
    vaultAddress: `0x${string}`,
    tokenAddress: `0x${string}`,
    amount: string,
    category: string
  ): Promise<string> {
    try {
      // Sama seperti di atas, harus pakai signer dan approve token dulu
      // const signer = provider.getSigner();
      // const vault = new Contract(vaultAddress, BusinessVault_ABI, signer);
      // const tx = await vault.depositToken(tokenAddress, amount, category);
      // await tx.wait();
      // return tx.hash;
      // Untuk mock/testing:
      return '0x' + Math.random().toString(16).substr(2, 64);
    } catch (error) {
      console.error('Error deposit token to vault:', error);
      throw error;
    }
  }
}

export const smartVerseBusiness = new SmartVerseBusinessService();
