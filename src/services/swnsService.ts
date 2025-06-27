
import { ethers } from 'ethers';
import { SWNS_CONTRACT_ADDRESS, SWNS_ABI, TARANIUM_NETWORK } from '@/contracts/swnsContract';

export class SWNSService {
  private contract: ethers.Contract;
  private readOnlyContract: ethers.Contract;

  constructor(signerOrProvider: ethers.Signer | ethers.Provider) {
    this.contract = new ethers.Contract(SWNS_CONTRACT_ADDRESS, SWNS_ABI, signerOrProvider);
    
    // Create read-only contract for view functions
    const provider = new ethers.JsonRpcProvider(TARANIUM_NETWORK.rpcUrl);
    this.readOnlyContract = new ethers.Contract(SWNS_CONTRACT_ADDRESS, SWNS_ABI, provider);
  }

  async checkNameAvailability(name: string): Promise<{ available: boolean; error?: string }> {
    try {
      if (!name.endsWith('.sw')) {
        return { available: false, error: 'Name must end with .sw' };
      }

      const cleanName = name.slice(0, -3); // Remove .sw suffix for contract call
      await this.readOnlyContract.resolve(cleanName);
      
      // If resolve doesn't throw, name is taken
      return { available: false };
    } catch (error: any) {
      // If resolve throws "ERC721NonexistentToken", name is available
      if (error.reason?.includes('ERC721NonexistentToken') || error.message?.includes('nonexistent')) {
        return { available: true };
      }
      
      console.error('Error checking name availability:', error);
      return { available: false, error: 'Error checking availability' };
    }
  }

  async registerName(name: string): Promise<ethers.ContractTransactionResponse> {
    const cleanName = name.slice(0, -3); // Remove .sw suffix
    const fee = await this.getRegistrationFee();
    
    console.log('Registering name:', cleanName, 'with fee:', fee);
    
    return await this.contract.register(cleanName, { value: fee });
  }

  async resolveName(name: string): Promise<string | null> {
    try {
      const cleanName = name.slice(0, -3); // Remove .sw suffix
      const address = await this.readOnlyContract.resolve(cleanName);
      return address;
    } catch (error) {
      console.log('Name not found:', name);
      return null;
    }
  }

  async getRegistrationFee(): Promise<bigint> {
    try {
      return await this.readOnlyContract.registrationFee();
    } catch (error) {
      console.error('Error getting registration fee:', error);
      return BigInt(0);
    }
  }

  async getUserNames(address: string): Promise<string[]> {
    try {
      // Get balance to know how many names user has
      const balance = await this.readOnlyContract.balanceOf(address);
      console.log('User has', balance.toString(), 'names');
      
      // For now, return empty array as we'd need to implement more complex indexing
      // In a real implementation, you'd want to listen to NameRegistered events
      return [];
    } catch (error) {
      console.error('Error getting user names:', error);
      return [];
    }
  }

  // Listen to NameRegistered events
  onNameRegistered(callback: (name: string, owner: string, tokenId: string) => void) {
    this.readOnlyContract.on('NameRegistered', (name, owner, tokenId, expires) => {
      console.log('Name registered event:', { name, owner, tokenId });
      callback(name + '.sw', owner, tokenId.toString());
    });
  }

  removeAllListeners() {
    this.readOnlyContract.removeAllListeners();
  }
}
