/**
 * SWNSServiceWagmi - Modern web3 service using Viem/Wagmi
 * 
 * This service replaces the legacy ethers.js-based SWNSService with a modern 
 * implementation using Viem for low-level blockchain interactions and Wagmi 
 * for React integration.
 * 
 * Features:
 * - Multi-network support (Taranium, Sepolia, Ethereum Mainnet)
 * - Type-safe contract interactions with Viem
 * - Real-time event listening for NameRegistered events
 * - Automatic network switching and error handling
 * - Optimized for performance with public/wallet client separation
 * 
 * Usage:
 * ```typescript
 * const service = new SWNSServiceWagmi(walletClient, publicClient, chainId);
 * const isAvailable = await service.checkNameAvailability('alice');
 * const txHash = await service.registerName('alice');
 * ```
 */

import { 
  type Address,
  type WalletClient,
  type PublicClient
} from 'viem';
import { 
  SWNS_ABI, 
  getContractAddress
} from '@/contracts/swnsContract';

export class SWNSServiceWagmi {
  private walletClient: WalletClient | null = null;
  private publicClient: PublicClient | null = null;
  private chainId: number;
  private contractAddress: Address;
  private pendingEventCallbacks: Array<(name: string, owner: string, tokenId: string) => void> = [];
  private eventUnwatchers: Array<() => void> = [];

  constructor(walletClient: WalletClient | null, publicClient: PublicClient | null, chainId: number) {
    this.walletClient = walletClient;
    this.publicClient = publicClient;
    this.chainId = chainId;
    this.contractAddress = getContractAddress(chainId) as Address;
    
    // Setup event listeners
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (this.pendingEventCallbacks.length > 0 && 
        this.publicClient && 
        this.contractAddress !== '0x0000000000000000000000000000000000000000') {
      // Setup event watchers for NameRegistered events
      this.pendingEventCallbacks.forEach(callback => {
        const unwatch = this.publicClient!.watchContractEvent({
          address: this.contractAddress,
          abi: SWNS_ABI,
          eventName: 'NameRegistered',
          onLogs: (logs) => {
            logs.forEach((log) => {
              // Parse the event data
              const { args } = log;
              if (args && args.name && args.owner && args.tokenId) {
                console.log('Name registered event:', { 
                  name: args.name, 
                  owner: args.owner, 
                  tokenId: args.tokenId 
                });
                // Add .sw suffix for display purposes
                callback(args.name + '.sw', args.owner as string, args.tokenId.toString());
              }
            });
          },
        });
        
        // Store unwatch function for cleanup
        this.eventUnwatchers.push(unwatch);
      });
    }
  }

  // Update network and recreate clients
  async updateNetwork(chainId: number, walletClient: WalletClient | null, publicClient: PublicClient | null) {
    this.chainId = chainId;
    this.walletClient = walletClient;
    this.publicClient = publicClient;
    this.contractAddress = getContractAddress(chainId) as Address;
    
    this.setupEventListeners();
  }

  async checkNameAvailability(name: string): Promise<{ available: boolean; error?: string }> {
    try {
      // Remove .sw if user added it
      const cleanName = name.endsWith('.sw') ? name.slice(0, -3) : name;
      
      if (cleanName.length < 3) {
        return { available: false, error: 'Name must be at least 3 characters' };
      }

      // Skip if no contract on this chain (e.g., mainnet)
      if (this.contractAddress === '0x0000000000000000000000000000000000000000') {
        return { available: false, error: 'SWNS not available on this network' };
      }

      if (!this.publicClient) {
        return { available: false, error: 'No public client available' };
      }

      try {
        // Use publicClient for read operations
        const result = await this.publicClient.readContract({
          address: this.contractAddress,
          abi: SWNS_ABI,
          functionName: 'resolve',
          args: [cleanName],
        });
        
        // If resolve doesn't throw, name is taken
        return { available: false };
      } catch (error: any) {
        // If resolve throws, check if it's because name doesn't exist
        if (error.message?.includes('ERC721NonexistentToken') || 
            error.message?.includes('nonexistent') ||
            error.name === 'ContractFunctionExecutionError') {
          return { available: true };
        }
        throw error;
      }
      
    } catch (error: any) {
      console.error('Error checking name availability:', error);
      
      // Network or connection errors
      if (error.message?.includes('fetch') || 
          error.message?.includes('CORS') ||
          error.name === 'HttpRequestError') {
        return { available: false, error: 'Network connection failed. Please try again.' };
      }
      
      return { available: false, error: 'Error checking availability. Please try again.' };
    }
  }

  async registerName(name: string): Promise<string> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    // Remove .sw if user added it
    const cleanName = name.endsWith('.sw') ? name.slice(0, -3) : name;
    const fee = await this.getRegistrationFee();
    
    console.log('Registering name:', cleanName, 'with fee:', fee);
    
    // Use walletClient for write operations
    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: SWNS_ABI,
      functionName: 'register',
      args: [cleanName],
      value: fee,
      account: this.walletClient.account,
      chain: this.walletClient.chain,
    });

    return hash;
  }

  async resolveName(name: string): Promise<string | null> {
    try {
      // Skip if no contract on this chain
      if (this.contractAddress === '0x0000000000000000000000000000000000000000') {
        return null;
      }

      if (!this.publicClient) {
        return null;
      }

      const cleanName = name.endsWith('.sw') ? name.slice(0, -3) : name;
      
      const address = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: SWNS_ABI,
        functionName: 'resolve',
        args: [cleanName],
      });

      return address as string;
    } catch (error) {
      console.log('Name not found:', name);
      return null;
    }
  }

  async getRegistrationFee(): Promise<bigint> {
    try {
      // Skip if no contract on this chain
      if (this.contractAddress === '0x0000000000000000000000000000000000000000') {
        return BigInt(0);
      }

      if (!this.publicClient) {
        return BigInt(0);
      }

      const fee = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: SWNS_ABI,
        functionName: 'registrationFee',
        args: [],
      });

      return fee as bigint;
    } catch (error) {
      console.error('Error getting registration fee:', error);
      return BigInt(0);
    }
  }

  async getUserNames(address: string): Promise<string[]> {
    try {
      // Skip if no contract on this chain
      if (this.contractAddress === '0x0000000000000000000000000000000000000000') {
        return [];
      }

      if (!this.publicClient) {
        return [];
      }
      
      // Get balance to know how many names user has
      const balance = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: SWNS_ABI,
        functionName: 'balanceOf',
        args: [address as Address],
      });

      console.log('User has', balance.toString(), 'names');
      
      // For now, return empty array as we'd need to implement more complex indexing
      // Users can check their NFTs in MetaMask to see their registered names
      return [];
    } catch (error) {
      console.error('Error getting user names:', error);
      return [];
    }
  }

  // Get the primary name for an address (simplified version)
  async getPrimaryName(address: string): Promise<string | null> {
    try {
      // Skip if no contract on this chain
      if (this.contractAddress === '0x0000000000000000000000000000000000000000') {
        return null;
      }

      if (!this.publicClient) {
        return null;
      }
      
      // Check if user has any names
      const balance = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: SWNS_ABI,
        functionName: 'balanceOf',
        args: [address as Address],
      });
      
      if (Number(balance) > 0) {
        // User can check their registered names in MetaMask NFT section
        console.log(`User has ${balance.toString()} names. Check MetaMask NFT section to see them.`);
        return null;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting primary name:', error);
      return null;
    }
  }

  // Listen to NameRegistered events
  onNameRegistered(callback: (name: string, owner: string, tokenId: string) => void) {
    // Store callback for later setup
    this.pendingEventCallbacks.push(callback);
    
    // If contract is ready, setup listener immediately
    if (this.publicClient && this.contractAddress !== '0x0000000000000000000000000000000000000000') {
      const unwatch = this.publicClient.watchContractEvent({
        address: this.contractAddress,
        abi: SWNS_ABI,
        eventName: 'NameRegistered',
        onLogs: (logs) => {
          logs.forEach((log) => {
            // Parse the event data
            const { args } = log;
            if (args && args.name && args.owner && args.tokenId) {
              console.log('Name registered event:', { 
                name: args.name, 
                owner: args.owner, 
                tokenId: args.tokenId 
              });
              // Add .sw suffix for display purposes
              callback(args.name + '.sw', args.owner as string, args.tokenId.toString());
            }
          });
        },
      });
      
      // Store unwatch function for cleanup
      this.eventUnwatchers.push(unwatch);
    }
  }

  removeAllListeners() {
    // Clear callbacks
    this.pendingEventCallbacks = [];
    
    // Unwatch all event listeners
    this.eventUnwatchers.forEach(unwatch => {
      try {
        unwatch();
      } catch (error) {
        console.error('Error unwatching event:', error);
      }
    });
    this.eventUnwatchers = [];
    
    console.log('Event listeners removed');
  }
}