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

// Validate environment variables
const validateEnvironment = () => {
  const alchemyKey = import.meta.env.VITE_ALCHEMY_SEPOLIA_KEY;
  
  if (!alchemyKey) {
    throw new Error('❌ VITE_ALCHEMY_SEPOLIA_KEY is missing. Please check your .env.local file.');
  }
  
  if (alchemyKey.startsWith('-') && alchemyKey.length < 30) {
    throw new Error('❌ VITE_ALCHEMY_SEPOLIA_KEY appears to be invalid. Please check your Alchemy API key.');
  }
  
  console.log('✅ Environment variables validated for blockchain service');
  return alchemyKey;
};

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
  // Tambahkan field untuk token
  tokenBalance?: string;
  tokenIncome?: string;
  tokenExpense?: string;
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
  // Tambahkan field untuk token
  isToken?: boolean;
  tokenAddress?: string;
  tokenSymbol?: string;
  description?: string;
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
      const alchemyKey = validateEnvironment();
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
      console.error('Owner address:', ownerAddress);
      
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
          code: (error as any).code,
          reason: (error as any).reason
        });
        
        // Jika error terkait RPC, log info lebih detail
        if ((error as any).code && (error as any).code.includes('CALL_EXCEPTION')) {
          console.error('Possible contract error - check if factory implements userToVault method');
        } else if ((error as any).code && (error as any).code.includes('NETWORK_ERROR')) {
          console.error('Network error - check RPC provider connection and Alchemy API key');
          const currentAlchemyKey = import.meta.env.VITE_ALCHEMY_SEPOLIA_KEY;
          console.log('Using Alchemy endpoint:', `https://eth-sepolia.g.alchemy.com/v2/${currentAlchemyKey ? '[API KEY SET]' : '[MISSING API KEY]'}`);
        }
      }
      
      return null;
    }
  }

  /**
   * Mendapatkan ringkasan data bisnis dari vault
   */
  async getBusinessSummary(vaultAddress: `0x${string}`): Promise<BusinessSummary> {
    try {
      const alchemyKey = validateEnvironment();
      const provider = new JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`);
      const vault = new Contract(vaultAddress, BusinessVault_ABI, provider);
      
      // Native ETH balance dan transaksi
      const balance = await provider.getBalance(vaultAddress);
      const totalNativeIncome = await vault.totalNativeIncome();
      const totalNativeExpense = await vault.totalNativeExpense();
      
      // Token IDRT balance dan transaksi
      const tokenAddress = BUSINESS_CONTRACTS.sepolia.contracts.MockIDRT;
      const token = new Contract(tokenAddress, [
        'function balanceOf(address account) view returns (uint256)'
      ], provider);
      const tokenBalance = await token.balanceOf(vaultAddress);
      const totalTokenIncome = await vault.totalTokenIncome(tokenAddress);
      const totalTokenExpense = await vault.totalTokenExpense(tokenAddress);
      
      const txCount = await vault.getTransactionLogCount();
      
      // Tambahkan log debug
      console.log('[DEBUG] getBusinessSummary raw:', {
        balance,
        totalNativeIncome,
        totalNativeExpense,
        tokenBalance,
        totalTokenIncome,
        totalTokenExpense,
        txCount
      });
      
      return {
        balance: formatEther(balance),
        totalIncome: formatEther(totalNativeIncome),
        totalExpenses: formatEther(totalNativeExpense),
        tokenBalance: formatEther(tokenBalance),
        tokenIncome: formatEther(totalTokenIncome),
        tokenExpense: formatEther(totalTokenExpense),
        transactionCount: Number(txCount)
      };
    } catch (error) {
      console.error('Error getting business summary from blockchain:', error);
      // Log detail tambahan untuk membantu debugging
      console.error('Vault address:', vaultAddress);
      
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
          code: (error as any).code,
          reason: (error as any).reason
        });
        
        // Jika error terkait RPC, log info lebih detail
        if ((error as any).code && (error as any).code.includes('CALL_EXCEPTION')) {
          console.error('Possible contract error - check if vault implements required methods');
        } else if ((error as any).code && (error as any).code.includes('NETWORK_ERROR')) {
          console.error('Network error - check RPC provider connection');
        }
      }
      
      // Return nilai default agar UI tetap berfungsi
      return {
        balance: '0',
        totalIncome: '0',
        totalExpenses: '0',
        tokenBalance: '0',
        tokenIncome: '0',
        tokenExpense: '0',
        transactionCount: 0
      };
    }
  }

  /**
   * Mendapatkan riwayat transaksi bisnis
   */
  async getBusinessTransactions(vaultAddress: `0x${string}`): Promise<BusinessTransaction[]> {
    try {
      const alchemyKey = validateEnvironment();
      const provider = new JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`);
      const vault = new Contract(vaultAddress, BusinessVault_ABI, provider);
      const txCount = await vault.getTransactionLogCount();
      
      // Tambahkan log debug
      console.log('[DEBUG] getBusinessTransactions txCount:', txCount);
      
      const txs: BusinessTransaction[] = [];
      for (let i = 0; i < txCount; i++) {
        const tx = await vault.transactionLog(i);
        console.log(`[DEBUG] transactionLog[${i}]:`, tx);
        
        // Cek apakah ini transaksi token atau native
        const isTokenTransaction = tx.tokenAddress && tx.tokenAddress !== ZeroAddress;
        const tokenSymbol = isTokenTransaction ? 'IDRT' : 'ETH'; // Asumsi semua token adalah IDRT
        
        txs.push({
          id: i.toString(),
          timestamp: Number(tx.timestamp),
          isIncome: tx.isIncome,
          category: tx.category || (tx.isIncome ? 'Sales' : 'Operational'),  // Default categories
          amount: formatEther(tx.amount),
          from: tx.from,
          to: tx.to,
          txHash: tx.txHash,
          isToken: isTokenTransaction,
          tokenAddress: tx.tokenAddress,
          tokenSymbol: tokenSymbol,
          status: 'success',
          chainId: 11155111,
          description: tx.description || ''  // Make sure description is included
        });
      }
      return txs.reverse();
    } catch (error) {
      console.error('Error getting business transactions from blockchain:', error);
      console.error('Vault address:', vaultAddress);
      
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
          code: (error as any).code,
          reason: (error as any).reason
        });
        
        // Jika error terkait RPC, log info lebih detail
        if ((error as any).code && (error as any).code.includes('CALL_EXCEPTION')) {
          console.error('Possible contract error - check if vault implements getTransactionLogCount or transactionLog methods');
        } else if ((error as any).code && (error as any).code.includes('NETWORK_ERROR')) {
          console.error('Network error - check RPC provider connection');
        }
      }
      
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
      console.log(`Depositing ${amountWei} wei to vault ${vaultAddress} with category "${category}"`);
      
      const alchemyKey = validateEnvironment();
      const provider = new JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`);
      
      // User harus sign transaksi, jadi perlu signer dari wallet
      // Ini hanya contoh call contract untuk testing dan development
      // TODO: Implementasi dengan signer dari frontend wallet provider
      // const signer = provider.getSigner();
      // const vault = new Contract(vaultAddress, BusinessVault_ABI, signer);
      // const tx = await vault.depositNative(category, { value: amountWei });
      // await tx.wait();
      // return tx.hash;
      
      // Untuk simulasi transaksi berhasil
      console.log('Transaction successful (simulated)');
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      
      // Invalidate cache after deposit
      this.clearCache(CACHE_KEYS.BUSINESS_SUMMARY, vaultAddress);
      this.clearCache(CACHE_KEYS.TRANSACTIONS, vaultAddress);
      
      return mockTxHash;
    } catch (error) {
      return this.handleBlockchainError(
        error, 
        'depositNativeToVault', 
        { vaultAddress, amountWei: amountWei.toString(), category }
      );
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
      console.log(`Depositing ${amount} of token ${tokenAddress} to vault ${vaultAddress} with category "${category}"`);
      
      const alchemyKey = validateEnvironment();
      
      // Validasi input
      if (!tokenAddress || tokenAddress === ZeroAddress) {
        return this.handleBlockchainError(
          new Error('Invalid token address'), 
          'depositTokenToVault', 
          { vaultAddress, tokenAddress, amount, category }
        );
      }
      
      // Pastikan amount valid
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return this.handleBlockchainError(
          new Error('Invalid amount'), 
          'depositTokenToVault', 
          { vaultAddress, tokenAddress, amount, category }
        );
      }
      
      // Harus pakai signer dan approve token dulu
      // Ini hanya contoh call contract untuk testing dan development
      // TODO: Implementasi dengan signer dari frontend wallet provider
      // const signer = provider.getSigner();
      // const tokenContract = new Contract(tokenAddress, [
      //   'function approve(address spender, uint256 amount) returns (bool)'
      // ], signer);
      // const amountWei = parseEther(amount);
      // await tokenContract.approve(vaultAddress, amountWei);
      // const vault = new Contract(vaultAddress, BusinessVault_ABI, signer);
      // const tx = await vault.depositToken(tokenAddress, amountWei, category);
      // await tx.wait();
      // return tx.hash;
      
      // Untuk simulasi transaksi berhasil
      console.log('Token deposit transaction successful (simulated)');
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      
      // Invalidate cache after deposit
      this.clearCache(CACHE_KEYS.BUSINESS_SUMMARY, vaultAddress);
      this.clearCache(CACHE_KEYS.TRANSACTIONS, vaultAddress);
      
      return mockTxHash;
    } catch (error) {
      return this.handleBlockchainError(
        error, 
        'depositTokenToVault', 
        { vaultAddress, tokenAddress, amount, category }
      );
    }
  }

  /**
   * Helper method untuk error handling pada blockchain calls
   */
  private handleBlockchainError(error: unknown, operation: string, context: Record<string, any> = {}): never {
    console.error(`Error in ${operation}:`, error);
    
    let errorMessage = 'Blockchain operation failed';
    let errorCode = 'UNKNOWN_ERROR';
    
    // Log context to help debugging
    console.error('Operation context:', context);
    
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        code: (error as any).code,
        reason: (error as any).reason
      });
      
      errorMessage = error.message;
      
      // Common error patterns
      if ((error as any).code) {
        errorCode = (error as any).code;
        
        if (errorCode.includes('CALL_EXCEPTION')) {
          errorMessage = 'Contract call exception - check if contract implements required methods';
        } else if (errorCode.includes('NETWORK_ERROR')) {
          errorMessage = 'Network error - check RPC provider connection';
        } else if (errorCode.includes('INSUFFICIENT_FUNDS')) {
          errorMessage = 'Insufficient funds for transaction';
        } else if (errorCode.includes('UNPREDICTABLE_GAS_LIMIT')) {
          errorMessage = 'Cannot estimate gas - transaction may revert';
        } else if (errorCode.includes('USER_REJECTED')) {
          errorMessage = 'Transaction rejected by user';
        }
      }
      
      // Handle revert errors
      if (error.message.includes('reverted') || error.message.includes('revert')) {
        errorMessage = `Transaction reverted: ${(error as any).reason || 'unknown reason'}`;
      }
    }
    
    // Create enhanced error
    const enhancedError = new Error(errorMessage);
    (enhancedError as any).code = errorCode;
    (enhancedError as any).context = context;
    (enhancedError as any).originalError = error;
    
    throw enhancedError;
  }
}

export const smartVerseBusiness = new SmartVerseBusinessService();

// Validate environment variables
validateEnvironment();
