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
  http,
  type Chain,
  parseUnits,
  formatUnits
} from 'viem';
import { mainnet, sepolia } from 'wagmi/chains';
import { HUB_CHAIN_ID, config } from '@/wagmi';
import { SWNS_ABI, CONTRACTS_BY_CHAIN_ID } from '@/contracts/swnsContract';
import { BUSINESS_CONTRACTS } from '@/contracts/BusinessContracts';
import { getPublicClient } from '@wagmi/core';

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
  
  // ========== NEW SUBSCRIPTION FEATURES ==========
  
  // Get biaya registrasi dan perpanjangan
  getRegistrationFee(): Promise<bigint>;
  getRenewalFee(): Promise<bigint>;
  
  // Get info nama (termasuk tanggal kedaluwarsa)
  getNameInfo(name: string): Promise<{
    owner: Address;
    expiresAt: Date;
    isExpired: boolean;
    isInGracePeriod: boolean;
    daysRemaining: number;
  } | null>;
  
  // Perpanjang nama
  renewName(name: string, walletClient: WalletClient): Promise<string>;
  
  // Get semua nama user dengan status kedaluwarsa
  getUserNamesWithExpiry(userAddress: Address): Promise<Array<{
    name: string;
    expiresAt: Date;
    isExpired: boolean;
    isInGracePeriod: boolean;
    daysRemaining: number;
  }>>;
}

export class CrossChainNameService implements CrossChainNameResolver {
  private hubPublicClient: any; // Using any to avoid complex type issues
  private hubContractAddress: Address;
  private actualHubChainId: number; // Track which chain we're actually using

  constructor() {
    // Check if Hub Chain contract is deployed
    this.hubContractAddress = CONTRACTS_BY_CHAIN_ID[HUB_CHAIN_ID] as Address;
    
    if (!this.hubContractAddress || this.hubContractAddress === '0x0000000000000000000000000000000000000000') {
      console.warn(`⚠️ Hub Chain contract not deployed yet. Chain ID: ${HUB_CHAIN_ID}`);
      console.log('🔄 Falling back to Sepolia testnet for username resolution...');
      
      // For development, fallback to Sepolia
      this.actualHubChainId = 11155111; // Sepolia
      this.hubContractAddress = CONTRACTS_BY_CHAIN_ID[11155111] as Address; // Sepolia
    } else {
      this.actualHubChainId = HUB_CHAIN_ID;
    }
    
    // Buat koneksi read-only permanen ke Hub Chain (atau fallback chain)
    // Menggunakan wagmi's configured client untuk menghindari type conflicts
    const client = getPublicClient(config, { chainId: this.actualHubChainId as any });
    if (!client) {
      throw new Error(`Failed to create public client for Hub Chain (ID: ${this.actualHubChainId})`);
    }
    this.hubPublicClient = client;
    
    console.log(`✅ CrossChainNameService initialized:`)
    console.log(`   - Hub Chain ID: ${this.actualHubChainId}`)
    console.log(`   - Contract Address: ${this.hubContractAddress}`)
  }

  /**
   * Resolve nama username ke alamat wallet
   * Selalu mencari di Hub Chain (Mainnet) terlepas dari jaringan aktif user
   */
  async resolveNameToAddress(name: string): Promise<Address | null> {
    try {
      // Bersihkan nama (hapus .sw jika ada)
      const cleanName = name.endsWith('.sw') ? name.slice(0, -3) : name;
      
      console.log(`🔍 Resolving name "${cleanName}" from Hub Chain (ID: ${this.actualHubChainId})...`);
      console.log(`   - Contract Address: ${this.hubContractAddress}`);
      
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
      console.log(`❌ Failed to resolve name "${name}":`, error);
      return null;
    }
  }

  /**
   * Test function untuk verifikasi koneksi dan contract
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🧪 Testing Hub Chain connection...');
      
      // Test basic connection
      const blockNumber = await this.hubPublicClient.getBlockNumber();
      console.log(`✅ Connected to Hub Chain (ID: ${this.actualHubChainId}), latest block: ${blockNumber}`);
      
      // Test contract connection
      try {
        const fee = await this.hubPublicClient.readContract({
          address: this.hubContractAddress,
          abi: SWNS_ABI,
          functionName: 'registrationFee',
        });
        console.log(`✅ Contract accessible, registration fee: ${fee}`);
        
        return { 
          success: true, 
          message: `Connected to Hub Chain (ID: ${this.actualHubChainId}), contract working, fee: ${fee}` 
        };
      } catch (contractError) {
        console.error('❌ Contract error:', contractError);
        return { 
          success: false, 
          message: `Contract error: ${contractError}` 
        };
      }
      
    } catch (error) {
      console.error('❌ Connection error:', error);
      return { 
        success: false, 
        message: `Connection error: ${error}` 
      };
    }
  }
  async registerNameOnHub(name: string, walletClient: WalletClient): Promise<string> {
    try {
      // Bersihkan nama
      const cleanName = name.endsWith('.sw') ? name.slice(0, -3) : name;
      
      console.log(`📝 Registering name "${cleanName}" on Hub Chain (ID: ${this.actualHubChainId})...`);
      
      // Pastikan wallet terhubung ke Hub Chain yang benar
      if (walletClient.chain?.id !== this.actualHubChainId) {
        throw new Error(`Wallet must be connected to Hub Chain (ID: ${this.actualHubChainId}) to register names. Current chain: ${walletClient.chain?.id}`);
      }
      
      // Dapatkan alamat wallet
      const [userAddress] = await walletClient.getAddresses();
      
      // Hitung biaya registrasi
      const registrationFee = await this.hubPublicClient.readContract({
        address: this.hubContractAddress,
        abi: SWNS_ABI,
        functionName: 'registrationFee',
      }) as bigint;
      
      console.log(`💰 Registration fee: ${registrationFee}, User: ${userAddress}`);
      
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
      
      // Gunakan fungsi isAvailable dari contract untuk check availability
      try {
        const isAvailable = await this.hubPublicClient.readContract({
          address: this.hubContractAddress,
          abi: SWNS_ABI,
          functionName: 'isAvailable',
          args: [cleanName],
        }) as boolean;

        console.log(`📋 Name "${cleanName}" availability check: ${isAvailable}`);
        
        return { 
          available: isAvailable,
          error: !isAvailable ? 'Name already taken or in grace period' : undefined
        };
        
      } catch (contractError) {
        console.error('Contract availability check failed, falling back to resolve method:', contractError);
        
        // Fallback: Check dengan resolve method
        try {
          const address = await this.resolveNameToAddress(cleanName);
          return { 
            available: address === null,
            error: address !== null ? 'Name already taken' : undefined
          };
        } catch (resolveError: any) {
          // Jika error "Name: Expired", berarti nama available untuk re-registrasi
          if (resolveError.message && resolveError.message.includes('Name: Expired')) {
            console.log(`✅ Name "${cleanName}" is expired, available for re-registration`);
            return { available: true };
          }
          
          // Error lain, consider as not available
          console.error('Resolve error:', resolveError);
          return { available: false, error: 'Error checking availability' };
        }
      }
      
    } catch (error) {
      console.error('Error checking name availability:', error);
      return { available: false, error: 'Error checking availability' };
    }
  }

  /**
   * Get semua nama yang dimiliki user di Hub Chain
   */
  async getUserNames(userAddress: Address): Promise<string[]> {
    try {
      console.log(`🔍 Getting user names for ${userAddress} from Hub Chain (ID: ${this.actualHubChainId})...`);
      console.log(`📞 Contract address: ${this.hubContractAddress}`);
      console.log(`📞 Calling getNamesByAddress contract function...`);
      
      // Gunakan fungsi getNamesByAddress dari smart contract
      const names = await this.hubPublicClient.readContract({
        address: this.hubContractAddress,
        abi: SWNS_ABI,
        functionName: 'getNamesByAddress',
        args: [userAddress],
      }) as string[];

      console.log(`📊 Raw contract response:`, names);
      console.log(`📊 User ${userAddress} has ${names.length} names: [${names.join(', ')}]`);
      
      if (names.length === 0) {
        console.log(`⚠️ No names found for user ${userAddress}. Check if:
        1. User has registered any names
        2. Names are not expired beyond grace period
        3. Contract address is correct: ${this.hubContractAddress}
        4. Hub chain ID is correct: ${this.actualHubChainId}`);
      }
      
      // Tambahkan suffix .sw ke setiap nama jika belum ada
      const formattedNames = names.map(name => 
        name.endsWith('.sw') ? name : `${name}.sw`
      );
      
      console.log(`📋 Formatted names with .sw suffix:`, formattedNames);
      
      return formattedNames;
      
    } catch (error) {
      console.error('❌ Error getting user names:', error);
      console.error('❌ Contract address:', this.hubContractAddress);
      console.error('❌ Hub chain ID:', this.actualHubChainId);
      return [];
    }
  }

  /**
   * Get semua nama yang terdaftar dari Hub Chain
   * Untuk sementara return empty array karena butuh fungsi contract tambahan
   */
  async getAllRegisteredNames(): Promise<Array<{ name: string; address: Address; owner: Address; tokenId: string }>> {
    try {
      console.log('🔍 Getting all registered names from Hub Chain...');
      
      // Untuk implementasi yang lengkap, butuh event atau fungsi tambahan di contract
      // Sementara return array kosong
      console.log('ℹ️ getAllRegisteredNames not fully implemented yet - requires contract enhancement');
      return [];
      
    } catch (error) {
      console.error('❌ Error getting all registered names:', error);
      return [];
    }
  }

  /**
   * Get biaya registrasi (untuk nama baru)
   */
  async getRegistrationFee(): Promise<bigint> {
    try {
      console.log('💰 Getting registration fee from Hub Chain...');
      
      const fee = await this.hubPublicClient.readContract({
        address: this.hubContractAddress,
        abi: SWNS_ABI,
        functionName: 'registrationFee',
        args: [],
      }) as bigint;

      console.log(`💰 Registration fee: ${fee}`);
      return fee;
    } catch (error) {
      console.error('❌ Error getting registration fee:', error);
      return BigInt(0);
    }
  }

  /**
   * Get biaya perpanjangan (untuk nama yang sudah ada)
   */
  async getRenewalFee(): Promise<bigint> {
    try {
      console.log('💰 Getting renewal fee from Hub Chain...');
      
      const fee = await this.hubPublicClient.readContract({
        address: this.hubContractAddress,
        abi: SWNS_ABI,
        functionName: 'renewalFee',
        args: [],
      }) as bigint;

      console.log(`💰 Renewal fee: ${fee}`);
      return fee;
    } catch (error) {
      console.error('❌ Error getting renewal fee:', error);
      return BigInt(0);
    }
  }

  /**
   * Get informasi nama termasuk tanggal kedaluwarsa
   */
  async getNameInfo(name: string): Promise<{
    owner: Address;
    expiresAt: Date;
    isExpired: boolean;
    isInGracePeriod: boolean;
    daysRemaining: number;
  } | null> {
    try {
      const cleanName = name.endsWith('.sw') ? name.slice(0, -3) : name;
      
      console.log(`📋 Getting name info for "${cleanName}" from Hub Chain...`);
      
      // Get nama expiration timestamp using getExpirationTime function
      const expirationTimestamp = await this.hubPublicClient.readContract({
        address: this.hubContractAddress,
        abi: SWNS_ABI,
        functionName: 'getExpirationTime',
        args: [cleanName],
      }) as bigint;

      console.log(`📅 Raw expiration timestamp for "${cleanName}":`, expirationTimestamp.toString());

      // Get owner address using resolve function
      const owner = await this.hubPublicClient.readContract({
        address: this.hubContractAddress,
        abi: SWNS_ABI,
        functionName: 'resolve',
        args: [cleanName],
      }) as Address;

      console.log(`👤 Owner of "${cleanName}":`, owner);

      // Convert timestamp to Date
      const expiresAt = new Date(Number(expirationTimestamp) * 1000);
      const now = new Date();
      
      // Calculate days remaining
      const timeRemaining = expiresAt.getTime() - now.getTime();
      const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
      
      // Check if expired (90 days grace period)
      const isExpired = daysRemaining < 0;
      const isInGracePeriod = isExpired && daysRemaining >= -90;

      console.log(`📋 Name "${cleanName}" expires at: ${expiresAt.toISOString()}`);
      console.log(`📋 Days remaining: ${daysRemaining}`);
      console.log(`📋 Is expired: ${isExpired}`);
      console.log(`📋 Is in grace period: ${isInGracePeriod}`);

      return {
        owner,
        expiresAt,
        isExpired,
        isInGracePeriod,
        daysRemaining
      };
    } catch (error) {
      console.error(`❌ Error getting name info for "${name}":`, error);
      return null;
    }
  }

  /**
   * Perpanjang nama yang sudah ada
   */
  async renewName(name: string, walletClient: WalletClient): Promise<string> {
    try {
      const cleanName = name.endsWith('.sw') ? name.slice(0, -3) : name;
      
      console.log(`🔄 Renewing name "${cleanName}" on Hub Chain...`);
      
      // Get renewal fee
      const renewalFee = await this.getRenewalFee();
      
      console.log(`💰 Renewal fee: ${renewalFee}`);
      
      // Panggil fungsi renew di smart contract
      const txHash = await walletClient.writeContract({
        address: this.hubContractAddress,
        abi: SWNS_ABI,
        functionName: 'renew',
        args: [cleanName],
        value: renewalFee,
        account: walletClient.account,
        chain: walletClient.chain,
      });

      console.log(`✅ Renewal transaction sent: ${txHash}`);
      return txHash;
      
    } catch (error: any) {
      console.error(`❌ Error renewing name "${name}":`, error);
      throw new Error(`Failed to renew name: ${error.message || error}`);
    }
  }

  /**
   * Get semua nama user dengan status kedaluwarsa
   */
  async getUserNamesWithExpiry(userAddress: Address): Promise<Array<{
    name: string;
    expiresAt: Date;
    isExpired: boolean;
    isInGracePeriod: boolean;
    daysRemaining: number;
  }>> {
    try {
      console.log(`👤 Getting user names with expiry for ${userAddress}...`);
      
      // Pertama, dapatkan semua nama user
      const userNames = await this.getUserNames(userAddress);
      
      // Kemudian dapatkan info expiry untuk setiap nama
      const namesWithExpiry = [];
      
      for (const name of userNames) {
        const nameInfo = await this.getNameInfo(name);
        if (nameInfo) {
          namesWithExpiry.push({
            name,
            expiresAt: nameInfo.expiresAt,
            isExpired: nameInfo.isExpired,
            isInGracePeriod: nameInfo.isInGracePeriod,
            daysRemaining: nameInfo.daysRemaining
          });
        }
      }
      
      // Sort berdasarkan tanggal kedaluwarsa (yang paling urgent duluan)
      namesWithExpiry.sort((a, b) => a.daysRemaining - b.daysRemaining);
      
      console.log(`👤 Found ${namesWithExpiry.length} names with expiry info`);
      
      return namesWithExpiry;
    } catch (error) {
      console.error(`❌ Error getting user names with expiry:`, error);
      return [];
    }
  }

  // ========== SMARTVERSE PAY FEATURES ==========

  /**
   * Generate static QR code for receiving any amount
   * Returns the wallet address as QR-ready string
   */
  generateStaticPaymentQR(name: string): Promise<string | null> {
    // For static QR, just return the resolved address
    return this.resolveNameToAddress(name);
  }

  /**
   * Generate dynamic QR code for specific payment amount
   * Returns EIP-681 format string for QR code
   */
  async generateDynamicPaymentQR(
    recipientName: string, 
    amount: string, 
    tokenAddress?: string,
    chainId?: number
  ): Promise<string | null> {
    try {
      console.log(`📱 Generating dynamic payment QR for ${recipientName}...`);
      console.log(`💰 Input amount: ${amount}, Token: ${tokenAddress || 'native'}`);
      
      // Resolve nama ke alamat
      const recipientAddress = await this.resolveNameToAddress(recipientName);
      if (!recipientAddress) {
        console.error(`❌ Cannot resolve name: ${recipientName}`);
        return null;
      }

      // Convert amount to wei (assuming input is in human-readable format)
      // For tokens, assume 18 decimals unless specified otherwise
      let amountInWei: string = '0';
      
      if (amount && amount !== '0') {
        try {
          // Convert amount dari input user (e.g., "1.5") ke wei
          const decimals = 18; // Default untuk kebanyakan token dan native ETH
          amountInWei = parseUnits(amount, decimals).toString();
          console.log(`💰 Converted ${amount} to ${amountInWei} wei (${decimals} decimals)`);
        } catch (conversionError) {
          console.error('❌ Error converting amount to wei:', conversionError);
          return null;
        }
      }

      // Generate EIP-681 format payment URL
      let paymentUrl = `ethereum:${recipientAddress}`;
      
      // Add parameters
      const params = [];
      
      if (amountInWei && amountInWei !== '0') {
        if (tokenAddress && tokenAddress !== '0x0000000000000000000000000000000000000000') {
          // For ERC20 tokens - use function call format
          params.push(`functionName=transfer`);
          params.push(`args=${recipientAddress},${amountInWei}`);
        } else {
          // For native ETH transfers
          params.push(`value=${amountInWei}`);
        }
      }
      
      if (chainId) {
        params.push(`chainId=${chainId}`);
      }
      
      if (params.length > 0) {
        paymentUrl += `?${params.join('&')}`;
      }
      
      console.log(`📱 Generated payment URL: ${paymentUrl}`);
      console.log(`📊 Amount in wei: ${amountInWei}`);
      
      return paymentUrl;
    } catch (error) {
      console.error('❌ Error generating dynamic payment QR:', error);
      return null;
    }
  }

  /**
   * Parse payment QR code URL to extract payment details
   */
  parsePaymentQR(qrData: string): {
    recipientAddress: string;
    amount?: string;
    amountFormatted?: string; // Human-readable amount
    tokenAddress?: string;
    chainId?: number;
  } | null {
    try {
      console.log(`🔍 Parsing payment QR: ${qrData}`);
      
      // Handle ethereum: URL format
      if (qrData.startsWith('ethereum:')) {
        const url = new URL(qrData);
        const recipientAddress = url.pathname;
        
        const result: any = { recipientAddress };
        
        // Parse query parameters
        if (url.searchParams.has('value')) {
          const amountWei = url.searchParams.get('value');
          result.amount = amountWei;
          
          // Convert wei to human-readable format
          if (amountWei && amountWei !== '0') {
            try {
              const decimals = 18; // Default untuk ETH dan kebanyakan token
              const formatted = formatUnits(BigInt(amountWei), decimals);
              result.amountFormatted = formatted;
              console.log(`💰 Converted ${amountWei} wei to ${formatted} tokens`);
            } catch (conversionError) {
              console.error('❌ Error converting wei to readable format:', conversionError);
              result.amountFormatted = amountWei; // Fallback ke raw value
            }
          }
        }
        
        if (url.searchParams.has('address')) {
          result.tokenAddress = url.searchParams.get('address');
        }
        
        if (url.searchParams.has('chainId')) {
          result.chainId = parseInt(url.searchParams.get('chainId') || '1');
        }
        
        console.log(`📊 Parsed payment details:`, result);
        return result;
      }
      
      // Handle plain address format
      if (qrData.match(/^0x[a-fA-F0-9]{40}$/)) {
        return { recipientAddress: qrData };
      }
      
      console.error('❌ Invalid QR format');
      return null;
    } catch (error) {
      console.error('❌ Error parsing payment QR:', error);
      return null;
    }
  }

  /**
   * Get network information by chain ID
   */
  static getNetworkInfo(chainId: number): { name: string; symbol: string; isHub: boolean } {
    const networks: Record<number, { name: string; symbol: string; isHub: boolean }> = {
      // Mainnet chains
      1: { name: 'Ethereum', symbol: 'ETH', isHub: true },
      137: { name: 'Polygon', symbol: 'MATIC', isHub: false },
      8453: { name: 'Base', symbol: 'ETH', isHub: false },
      42161: { name: 'Arbitrum', symbol: 'ETH', isHub: false },
      10: { name: 'Optimism', symbol: 'ETH', isHub: false },
      56: { name: 'BSC', symbol: 'BNB', isHub: false },
      43114: { name: 'Avalanche', symbol: 'AVAX', isHub: false },
      250: { name: 'Fantom', symbol: 'FTM', isHub: false },
      100: { name: 'Gnosis', symbol: 'xDAI', isHub: false },
      42220: { name: 'Celo', symbol: 'CELO', isHub: false },
      1284: { name: 'Moonbeam', symbol: 'GLMR', isHub: false },
      25: { name: 'Cronos', symbol: 'CRO', isHub: false },
      1313161554: { name: 'Aurora', symbol: 'ETH', isHub: false },
      
      // Testnet chains
      9924: { name: 'Taranium', symbol: 'TARA', isHub: false },
      11155111: { name: 'Sepolia', symbol: 'ETH', isHub: true }, // Testnet Hub
      17000: { name: 'Holesky', symbol: 'ETH', isHub: false },
    };

    return networks[chainId] || { name: 'Unknown', symbol: 'ETH', isHub: false };
  }

  /**
   * Check if current chain ID is the Hub Chain
   */
  isHubChain(chainId: number): boolean {
    return chainId === this.actualHubChainId;
  }

  /**
   * Get actual Hub Chain ID being used
   */
  getActualHubChainId(): number {
    return this.actualHubChainId;
  }

  /**
   * Generate QR code for business vault payments with dynamic vault resolution
   * Returns proper format for both native and token payments
   */
  generateBusinessVaultQR(
    vaultAddress: string, 
    amount?: string, 
    category: string = 'Pembayaran QR',
    tokenAddress?: string,
    tokenSymbol: string = 'IDRT',
    tokenDecimals: number = 18,
    chainId: number = 11155111 // Sepolia default
  ): string {
    console.log('🔧 Generating Business Vault QR:', {
      vaultAddress,
      amount,
      category,
      tokenAddress,
      tokenSymbol,
      tokenDecimals,
      chainId
    });

    // Validate vault address
    if (!vaultAddress || !vaultAddress.startsWith('0x')) {
      throw new Error('Invalid vault address');
    }

    // Get correct token address for the chain if not provided
    let resolvedTokenAddress = tokenAddress;
    if (!resolvedTokenAddress && tokenSymbol === 'IDRT') {
      // Get MockIDRT address for the current chain
      const chainConfig = Object.values(BUSINESS_CONTRACTS).find(chain => chain.chainId === chainId);
      if (chainConfig?.contracts.MockIDRT) {
        resolvedTokenAddress = chainConfig.contracts.MockIDRT;
        console.log(`🔗 Using MockIDRT address for chain ${chainId}:`, resolvedTokenAddress);
      }
    }

    // For token payments (IDRT), use ethereum: protocol format
    if (resolvedTokenAddress && amount && amount !== '0') {
      try {
        const tokenAmountWei = parseUnits(amount, tokenDecimals);
        
        // EIP-681 format for ERC20 token transfer
        // Format: ethereum:0xTokenAddress/transfer?address=0xVaultAddress&uint256=amountInWei&chainId=chainId
        const url = `ethereum:${resolvedTokenAddress}/transfer?address=${vaultAddress}&uint256=${tokenAmountWei.toString()}&chainId=${chainId}`;
        
        console.log('✅ Generated Token QR (EIP-681):', url);
        return url;
      } catch (error) {
        console.error('❌ Error converting token amount:', error);
        throw new Error('Invalid token amount format');
      }
    }
    
    // For native ETH payments, use ethereum: protocol
    if (amount && amount !== '0' && !resolvedTokenAddress) {
      try {
        const ethAmountWei = parseUnits(amount, 18);
        
        // EIP-681 format for native ETH transfer
        // Format: ethereum:0xVaultAddress?value=amountInWei&chainId=chainId
        const url = `ethereum:${vaultAddress}?value=${ethAmountWei.toString()}&chainId=${chainId}`;
        
        console.log('✅ Generated ETH QR (EIP-681):', url);
        return url;
      } catch (error) {
        console.error('❌ Error converting ETH amount:', error);
        throw new Error('Invalid ETH amount format');
      }
    }
    
    // For static QR (no amount), use DApp URL format
    const baseUrl = 'https://smartverse-id.vercel.app/pay';
    const params = new URLSearchParams();
    
    params.set('address', vaultAddress);
    params.set('category', category);
    params.set('type', 'business'); // Mark as business payment
    params.set('chainId', chainId.toString());
    
    if (resolvedTokenAddress) {
      params.set('token', resolvedTokenAddress);
      params.set('tokenSymbol', tokenSymbol);
    }
    
    const url = `${baseUrl}?${params.toString()}`;
    
    console.log('✅ Generated Static Business QR (DApp URL):', url);
    return url;
  }

  /**
   * Get user's business vault address from BusinessFactory
   */
  async getUserBusinessVault(userAddress: string, chainId: number = 11155111): Promise<string | null> {
    try {
      // Only check on Sepolia (hub chain) where BusinessFactory is deployed
      if (chainId !== 11155111) {
        console.log('⚠️ BusinessFactory only available on Sepolia, redirecting...');
        chainId = 11155111;
      }

      const publicClient = getPublicClient(config, { chainId: 11155111 });
      if (!publicClient) {
        throw new Error('Failed to get public client for Sepolia');
      }

      const factoryAddress = BUSINESS_CONTRACTS.sepolia.contracts.BusinessFactory as `0x${string}`;
      
      // Read user's vault address from BusinessFactory
      const vaultAddress = await publicClient.readContract({
        address: factoryAddress,
        abi: [
          {
            "inputs": [{"internalType": "address", "name": "", "type": "address"}],
            "name": "userToVault",
            "outputs": [{"internalType": "address", "name": "", "type": "address"}],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        functionName: 'userToVault',
        args: [userAddress as `0x${string}`]
      });

      // Check if vault exists (not zero address)
      if (vaultAddress && vaultAddress !== '0x0000000000000000000000000000000000000000') {
        console.log('✅ Found business vault for user:', { userAddress, vaultAddress });
        return vaultAddress;
      }

      console.log('❌ No business vault found for user:', userAddress);
      return null;

    } catch (error) {
      console.error('❌ Error getting user business vault:', error);
      return null;
    }
  }
}

// Singleton instance
export const crossChainNameService = new CrossChainNameService();
