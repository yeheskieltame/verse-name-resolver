
import { ethers } from 'ethers';
import { 
  SWNS_ABI, 
  TARANIUM_NETWORK, 
  SEPOLIA_NETWORK,
  getContractAddress,
  getNetworkConfig 
} from '@/contracts/swnsContract';

export class SWNSService {
  private contract: ethers.Contract;
  private readOnlyContract: ethers.Contract | null = null;
  private chainId: number;
  private pendingEventCallbacks: Array<(name: string, owner: string, tokenId: string) => void> = [];

  // Create read-only contract for view functions
  private async createReadOnlyContract(chainId: number, contractAddress: string) {
    const networkConfig = getNetworkConfig(chainId);
    
    try {
      console.log(`Connecting to RPC: ${networkConfig.rpcUrl}`);
      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      
      // Test the connection with a simple call
      await provider.getNetwork();
      
      console.log(`Successfully connected to RPC: ${networkConfig.rpcUrl}`);
      return new ethers.Contract(contractAddress, SWNS_ABI, provider);
    } catch (error) {
      console.error(`Failed to connect to RPC: ${networkConfig.rpcUrl}`, error);
      throw new Error(`Unable to connect to RPC for chain ${chainId}: ${error}`);
    }
  }

  constructor(signerOrProvider: ethers.Signer | ethers.Provider, chainId?: number) {
    // Determine chainId
    if (chainId) {
      this.chainId = chainId;
    } else if (signerOrProvider instanceof ethers.JsonRpcSigner) {
      // Try to get chainId from provider
      this.chainId = TARANIUM_NETWORK.chainId; // default fallback
    } else {
      this.chainId = TARANIUM_NETWORK.chainId; // default fallback
    }

    const contractAddress = getContractAddress(this.chainId);
    this.contract = new ethers.Contract(contractAddress, SWNS_ABI, signerOrProvider);
    
    // Create read-only contract for view functions (async)
    this.initReadOnlyContract();
  }

  private async initReadOnlyContract() {
    try {
      const contractAddress = getContractAddress(this.chainId);
      this.readOnlyContract = await this.createReadOnlyContract(this.chainId, contractAddress);
      
      // Setup pending event listeners
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize read-only contract:', error);
      // Fallback to using the main contract for read operations
      this.readOnlyContract = this.contract;
      this.setupEventListeners();
    }
  }

  private setupEventListeners() {
    if (this.readOnlyContract && this.pendingEventCallbacks.length > 0) {
      // Setup all pending event listeners
      this.pendingEventCallbacks.forEach(callback => {
        this.readOnlyContract!.on('NameRegistered', (name, owner, tokenId, expires) => {
          console.log('Name registered event:', { name, owner, tokenId });
          // Add .sw suffix for display purposes
          callback(name + '.sw', owner, tokenId.toString());
        });
      });
    }
  }

  // Update chainId and recreate contracts
  async updateNetwork(chainId: number, signerOrProvider: ethers.Signer | ethers.Provider) {
    // Remove existing listeners
    this.removeAllListeners();
    
    this.chainId = chainId;
    const contractAddress = getContractAddress(chainId);
    this.contract = new ethers.Contract(contractAddress, SWNS_ABI, signerOrProvider);
    
    try {
      this.readOnlyContract = await this.createReadOnlyContract(chainId, contractAddress);
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to update read-only contract:', error);
      this.readOnlyContract = this.contract;
      this.setupEventListeners();
    }
  }

  async checkNameAvailability(name: string): Promise<{ available: boolean; error?: string }> {
    try {
      // Remove .sw if user added it, we only need the username
      const cleanName = name.endsWith('.sw') ? name.slice(0, -3) : name;
      
      if (cleanName.length < 3) {
        return { available: false, error: 'Name must be at least 3 characters' };
      }

      // Wait for readOnlyContract to be initialized if needed
      if (!this.readOnlyContract) {
        await this.initReadOnlyContract();
      }

      // If still no readOnlyContract, try using the main contract
      const contractToUse = this.readOnlyContract || this.contract;
      
      await contractToUse.resolve(cleanName);
      
      // If resolve doesn't throw, name is taken
      return { available: false };
    } catch (error: any) {
      console.error('Error checking name availability:', error);
      
      // If resolve throws "ERC721NonexistentToken", name is available
      if (error.reason?.includes('ERC721NonexistentToken') || 
          error.message?.includes('nonexistent') ||
          error.code === 'CALL_EXCEPTION') {
        return { available: true };
      }
      
      // Network or connection errors
      if (error.code === 'NETWORK_ERROR' || 
          error.code === 'SERVER_ERROR' ||
          error.message?.includes('fetch') ||
          error.message?.includes('CORS')) {
        return { available: false, error: 'Network connection failed. Please try again.' };
      }
      
      return { available: false, error: 'Error checking availability. Please try again.' };
    }
  }

  async registerName(name: string): Promise<ethers.ContractTransactionResponse> {
    // Remove .sw if user added it, we only need the clean username
    const cleanName = name.endsWith('.sw') ? name.slice(0, -3) : name;
    const fee = await this.getRegistrationFee();
    
    console.log('Registering name:', cleanName, 'with fee:', fee);
    
    return await this.contract.register(cleanName, { value: fee });
  }

  async resolveName(name: string): Promise<string | null> {
    try {
      // Remove .sw if user added it, we only need the clean username
      const cleanName = name.endsWith('.sw') ? name.slice(0, -3) : name;
      const address = await this.readOnlyContract.resolve(cleanName);
      return address;
    } catch (error) {
      console.log('Name not found:', name);
      return null;
    }
  }

  async getRegistrationFee(): Promise<bigint> {
    try {
      // Wait for readOnlyContract to be initialized if needed
      if (!this.readOnlyContract) {
        await this.initReadOnlyContract();
      }

      const contractToUse = this.readOnlyContract || this.contract;
      return await contractToUse.registrationFee();
    } catch (error) {
      console.error('Error getting registration fee:', error);
      return BigInt(0);
    }
  }

  async getUserNames(address: string): Promise<string[]> {
    try {
      // Wait for readOnlyContract to be initialized if needed
      if (!this.readOnlyContract) {
        await this.initReadOnlyContract();
      }

      const contractToUse = this.readOnlyContract || this.contract;
      
      // Get balance to know how many names user has
      const balance = await contractToUse.balanceOf(address);
      console.log('User has', balance.toString(), 'names');
      
      // For now, return empty array as we'd need to implement more complex indexing
      // In a real implementation, you'd want to listen to NameRegistered events
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
      // Wait for readOnlyContract to be initialized if needed
      if (!this.readOnlyContract) {
        await this.initReadOnlyContract();
      }

      const contractToUse = this.readOnlyContract || this.contract;
      
      // Check if user has any names
      const balance = await contractToUse.balanceOf(address);
      
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
    
    // If contract is already ready, setup listener immediately
    if (this.readOnlyContract) {
      this.readOnlyContract.on('NameRegistered', (name, owner, tokenId, expires) => {
        console.log('Name registered event:', { name, owner, tokenId });
        // Add .sw suffix for display purposes
        callback(name + '.sw', owner, tokenId.toString());
      });
    }
  }

  removeAllListeners() {
    if (this.readOnlyContract) {
      this.readOnlyContract.removeAllListeners();
    }
  }
}
