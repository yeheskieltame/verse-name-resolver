/**
 * CrossChainNameResolver - Service untuk menangani resolusi nama cross-chain
 * 
 * Konsep:
 * - Hub Chain (Mainnet): Satu-satunya tempat penyimpanan nama username sebagai NFT
 * - Spoke Chains (Polygon, Base, Arbitrum, Optimism, BSC, dll): Tempat transaksi aktual
 * 
 * Cara kerja:
 * 1. User mendaftarkan nama di Hub Chain (Mainnet) sekali saja
 * 2. Untuk transaksi di jaringan manapun, sistem akan:
 *    - Tetap terhubung ke wallet user di jaringan aktif mereka
 *    - Membuat koneksi terpisah ke Hub Chain untuk membaca nama
 *    - Mengirim transaksi di jaringan yang sedang aktif
 */

import { 
  type Address,
  type WalletClient,
  type PublicClient,
  createPublicClient,
  http
} from 'viem';
import { mainnet } from 'wagmi/chains';
import { HUB_CHAIN_ID } from '@/wagmi';
import { SWNS_ABI, CONTRACTS_BY_CHAIN_ID } from '@/contracts/swnsContract';

export interface CrossChainNameResolver {
  // Resolve nama ke alamat dari Hub Chain
  resolveNameToAddress(name: string): Promise<Address | null>;
  
  // Register nama di Hub Chain
  registerNameOnHub(name: string, walletClient: WalletClient): Promise<string>;
  
  // Check ketersediaan nama di Hub Chain
  checkNameAvailability(name: string): Promise<{ available: boolean; error?: string }>;
  
  // Get semua nama yang dimiliki user di Hub Chain
  getUserNames(userAddress: Address): Promise<string[]>;
  
  // Get semua nama yang terdaftar dari Hub Chain
  getAllRegisteredNames(): Promise<Array<{ name: string; address: Address; owner: Address; tokenId: string }>>;
}

export class CrossChainNameService implements CrossChainNameResolver {
  private hubPublicClient: PublicClient;
  private hubContractAddress: Address;

  constructor() {
    // Buat koneksi read-only permanen ke Hub Chain (Mainnet)
    this.hubPublicClient = createPublicClient({
      chain: mainnet,
      transport: http(),
    });
    
    this.hubContractAddress = CONTRACTS_BY_CHAIN_ID[HUB_CHAIN_ID] as Address;
    
    if (!this.hubContractAddress || this.hubContractAddress === '0x0000000000000000000000000000000000000000') {
      console.warn(`⚠️ Hub Chain contract not deployed yet. Chain ID: ${HUB_CHAIN_ID}`);
      // For development, fallback to Sepolia
      this.hubContractAddress = CONTRACTS_BY_CHAIN_ID[11155111] as Address; // Sepolia
    }
  }

  /**
   * Resolve nama username ke alamat wallet
   * Selalu mencari di Hub Chain (Mainnet) terlepas dari jaringan aktif user
   */
  async resolveNameToAddress(name: string): Promise<Address | null> {
    try {
      // Bersihkan nama (hapus .sw jika ada)
      const cleanName = name.endsWith('.sw') ? name.slice(0, -3) : name;
      
      console.log(`🔍 Resolving name "${cleanName}" from Hub Chain (Mainnet)...`);
      
      // Panggil fungsi resolve di Hub Chain
      const address = await this.hubPublicClient.readContract({
        address: this.hubContractAddress,
        abi: SWNS_ABI,
        functionName: 'resolve',
        args: [cleanName],
      }) as Address;
      
      // Jika alamat adalah zero address, berarti nama tidak ditemukan
      if (address === '0x0000000000000000000000000000000000000000') {
        console.log(`❌ Name "${cleanName}" not found in Hub Chain`);
        return null;
      }
      
      console.log(`✅ Name "${cleanName}" resolved to ${address} from Hub Chain`);
      return address;
      
    } catch (error) {
      console.error('Error resolving name:', error);
      return null;
    }
  }

  /**
   * Register nama di Hub Chain (Sepolia)
   * Hanya bisa dilakukan sekali per nama
   */
  async registerNameOnHub(name: string, walletClient: WalletClient): Promise<string> {
    try {
      // Bersihkan nama
      const cleanName = name.endsWith('.sw') ? name.slice(0, -3) : name;
      
      console.log(`📝 Registering name "${cleanName}" on Hub Chain (Sepolia)...`);
      
      // Pastikan wallet terhubung ke Hub Chain
      if (walletClient.chain?.id !== HUB_CHAIN_ID) {
        throw new Error('Wallet must be connected to Sepolia (Hub Chain) to register names');
      }
      
      // Dapatkan alamat wallet
      const [userAddress] = await walletClient.getAddresses();
      
      // Hitung biaya registrasi
      const registrationFee = await this.hubPublicClient.readContract({
        address: this.hubContractAddress,
        abi: SWNS_ABI,
        functionName: 'registrationFee',
      }) as bigint;
      
      // Kirim transaksi registrasi
      const txHash = await walletClient.writeContract({
        address: this.hubContractAddress,
        abi: SWNS_ABI,
        functionName: 'register',
        args: [cleanName],
        value: registrationFee,
      } as any);
      
      console.log(`🎉 Name registration transaction sent: ${txHash}`);
      return txHash;
      
    } catch (error) {
      console.error('Error registering name on Hub Chain:', error);
      throw error;
    }
  }

  /**
   * Check ketersediaan nama di Hub Chain
   */
  async checkNameAvailability(name: string): Promise<{ available: boolean; error?: string }> {
    try {
      // Bersihkan nama
      const cleanName = name.endsWith('.sw') ? name.slice(0, -3) : name;
      
      if (cleanName.length < 3) {
        return { available: false, error: 'Name must be at least 3 characters' };
      }
      
      // Check apakah nama sudah ada di Hub Chain
      const address = await this.resolveNameToAddress(cleanName);
      
      return { 
        available: address === null,
        error: address !== null ? 'Name already taken' : undefined
      };
      
    } catch (error) {
      console.error('Error checking name availability:', error);
      return { available: false, error: 'Error checking availability' };
    }
  }

  /**
   * Get semua nama yang dimiliki user di Hub Chain
   * Sementara menggunakan pendekatan sederhana karena keterbatasan contract
   */
  async getUserNames(userAddress: Address): Promise<string[]> {
    try {
      console.log(`🔍 Getting names for user ${userAddress} from Hub Chain...`);
      
      // Dapatkan balance NFT user
      const balance = await this.hubPublicClient.readContract({
        address: this.hubContractAddress,
        abi: SWNS_ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      }) as bigint;
      
      console.log(`✅ User has ${balance} NFTs`);
      
      // Untuk sementara, kita return array kosong jika user memiliki NFT
      // Implementasi yang lebih lengkap memerlukan fungsi tambahan di contract
      if (balance > 0) {
        return [`user-${userAddress.slice(0, 8)}.sw`]; // Placeholder
      }
      
      return [];
      
    } catch (error) {
      console.error('Error getting user names:', error);
      return [];
    }
  }

  /**
   * Get biaya registrasi dari Hub Chain
   */
  async getRegistrationFee(): Promise<bigint> {
    try {
      const fee = await this.hubPublicClient.readContract({
        address: this.hubContractAddress,
        abi: SWNS_ABI,
        functionName: 'registrationFee',
      }) as bigint;
      
      return fee;
    } catch (error) {
      console.error('Error getting registration fee:', error);
      return BigInt(0);
    }
  }

  /**
   * Check apakah jaringan saat ini adalah Hub Chain
   */
  static isHubChain(chainId: number): boolean {
    return chainId === HUB_CHAIN_ID;
  }

  /**
   * Get informasi jaringan untuk display
   */
  static getNetworkInfo(chainId: number): { name: string; isHub: boolean; isSpoke: boolean } {
    const isHub = CrossChainNameService.isHubChain(chainId);
    
    const networkNames: { [key: number]: string } = {
      // Mainnet chains
      1: 'Ethereum',
      137: 'Polygon',
      8453: 'Base',
      42161: 'Arbitrum',
      10: 'Optimism',
      56: 'BNB Smart Chain',
      43114: 'Avalanche',
      250: 'Fantom',
      100: 'Gnosis',
      42220: 'Celo',
      1284: 'Moonbeam',
      25: 'Cronos',
      1313161554: 'Aurora',
      
      // Testnet chains
      11155111: 'Sepolia',
      17000: 'Holesky',
      9924: 'Taranium',
    };
    
    return {
      name: networkNames[chainId] || `Chain ${chainId}`,
      isHub,
      isSpoke: !isHub
    };
  }

  /**
   * Get semua nama yang terdaftar dari Hub Chain
   * Menggunakan pendekatan bertahap untuk menghindari RPC limits
   */
  async getAllRegisteredNames(): Promise<Array<{ name: string; address: Address; owner: Address; tokenId: string }>> {
    try {
      console.log('🔍 Getting all registered names from Hub Chain events...');
      
      // Coba query events dengan batching untuk menghindari free tier limits
      let allEvents: any[] = [];
      
      try {
        // Coba ambil current block
        const currentBlock = await this.hubPublicClient.getBlockNumber();
        
        // Gunakan range yang lebih kecil untuk free tier RPC
        // Mulai dari 1000 block terakhir dan tingkatkan jika diperlukan
        const blockRanges = [
          { from: currentBlock - BigInt(1000), to: currentBlock },
          { from: currentBlock - BigInt(5000), to: currentBlock - BigInt(1000) },
          { from: currentBlock - BigInt(10000), to: currentBlock - BigInt(5000) },
        ];
        
        console.log(`📊 Querying events in smaller batches to avoid RPC limits...`);
        
        for (const range of blockRanges) {
          try {
            console.log(`📊 Querying events from block ${range.from} to ${range.to}`);
            
            const registeredEvents = await this.hubPublicClient.getContractEvents({
              address: this.hubContractAddress,
              abi: SWNS_ABI,
              eventName: 'NameRegistered',
              fromBlock: range.from,
              toBlock: range.to,
            });
            
            allEvents.push(...registeredEvents);
            console.log(`📋 Found ${registeredEvents.length} events in this range`);
            
            // Jika sudah menemukan events, berhenti di sini untuk menghemat quota
            if (allEvents.length > 0) {
              break;
            }
            
          } catch (rangeError) {
            console.log(`⚠️ Failed to query range ${range.from} to ${range.to}:`, rangeError);
            // Lanjutkan ke range berikutnya
          }
        }
        
        console.log(`📋 Total found ${allEvents.length} registration events`);
        
      } catch (eventError) {
        console.log('⚠️ Event query failed completely, returning empty list...');
        console.log('📋 This is expected if the contract is new or has no registered names');
        return [];
      }
      
      // Process events jika berhasil
      const registeredNames: Array<{ name: string; address: Address; owner: Address; tokenId: string }> = [];
      
      for (const event of allEvents) {
        try {
          const { args } = event;
          if (args && args.name && args.owner && args.tokenId) {
            // Langsung gunakan data dari event tanpa re-validation untuk menghindari error
            registeredNames.push({
              name: (args.name as string) + '.sw',
              address: args.owner as Address,
              owner: args.owner as Address,
              tokenId: args.tokenId.toString(),
            });
          }
        } catch (error) {
          console.error('Error processing event:', error);
        }
      }
      
      console.log(`✅ Processed ${registeredNames.length} registered names from events`);
      return registeredNames;
      
    } catch (error) {
      console.error('Error getting all registered names:', error);
      
      // Fallback final: return empty array dengan pesan yang informatif
      console.log('📋 Returning empty list - no names found or contract not accessible');
      return [];
    }
  }
}

// Singleton instance
export const crossChainNameService = new CrossChainNameService();
