# SmartVerse Business Service - Real Blockchain Integration

## Overview
Service ini telah diperbarui untuk berinteraksi secara real dengan smart contracts di blockchain. Semua fungsi sekarang menggunakan transaksi blockchain yang sesungguhnya.

## Key Features

### 1. **Real Blockchain Integration**
- Terhubung langsung dengan smart contracts di Sepolia testnet
- Menggunakan viem untuk interaksi blockchain
- Transaksi real dengan gas fees

### 2. **Business Vault Management**
- Membuat business vault baru
- Mencatat pemasukan (income) dan pengeluaran (expense)
- Tracking transaksi real-time
- Cross-chain support (hub & spoke model)

### 3. **Data Consistency**
- Semua data disimpan on-chain
- Tidak ada data mock/simulasi
- Real-time synchronization dengan blockchain

## Usage Examples

### Creating a Business Vault
```typescript
import { smartVerseBusinessService } from '@/services/smartVerseBusiness';

// Create new business vault
const vaultAddress = await smartVerseBusinessService.createBusinessVault(
  'Toko Kue Sederhana',      // businessName
  'Makanan & Minuman',       // category
  'Toko kue online',         // description
  'John Doe',                // ownerName
  walletClient,              // wagmi wallet client
  '0.1'                      // initialDeposit (optional, in ETH)
);
```

### Recording Income
```typescript
// Record income transaction
const txHash = await smartVerseBusinessService.recordIncome(
  vaultAddress,
  '0.05',                    // amount in ETH
  'Penjualan',               // category
  'Penjualan kue coklat',    // description
  walletClient               // wagmi wallet client
);
```

### Recording Expense
```typescript
// Record expense transaction
const txHash = await smartVerseBusinessService.recordExpense(
  vaultAddress,
  '0.02',                    // amount in ETH
  'Bahan Baku',              // category
  'Pembelian tepung',        // description
  '0x1234...5678',           // toAddress (recipient)
  walletClient               // wagmi wallet client
);
```

### Getting Business Summary
```typescript
// Get real-time business summary
const summary = await smartVerseBusinessService.getBusinessSummary(vaultAddress);

console.log(summary);
// {
//   totalIncome: '0.15',
//   totalExpenses: '0.08',
//   netProfit: '0.07',
//   balance: '0.07',
//   transactionCount: 12,
//   vaultAddress: '0x...',
//   lastUpdated: 1704844800000
// }
```

### Getting Transaction History
```typescript
// Get real transaction history from blockchain
const transactions = await smartVerseBusinessService.getTransactionHistory(
  vaultAddress,
  50 // limit
);

transactions.forEach(tx => {
  console.log(`${tx.isIncome ? 'Income' : 'Expense'}: ${tx.amount} ETH`);
  console.log(`Category: ${tx.category}`);
  console.log(`Description: ${tx.description}`);
});
```

## Integration with Frontend Components

### BusinessRegistration Component
```typescript
import { useWalletClient } from 'wagmi';
import { smartVerseBusinessService } from '@/services/smartVerseBusiness';

const BusinessRegistration = () => {
  const { data: walletClient } = useWalletClient();
  
  const handleCreateVault = async (formData: CreateVaultParams) => {
    if (!walletClient) return;
    
    try {
      const vaultAddress = await smartVerseBusinessService.createBusinessVault(
        formData.businessName,
        formData.category,
        formData.description,
        formData.ownerName,
        walletClient,
        formData.initialDeposit
      );
      
      // Handle success
      console.log('Vault created:', vaultAddress);
    } catch (error) {
      // Handle error
      console.error('Failed to create vault:', error);
    }
  };
};
```

### BusinessVault Component
```typescript
import { useAccount, useWalletClient } from 'wagmi';
import { smartVerseBusinessService } from '@/services/smartVerseBusiness';

const BusinessVault = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const handleRecordIncome = async (amount: string, category: string, description: string) => {
    if (!walletClient || !address) return;
    
    try {
      const userVault = await smartVerseBusinessService.getUserVault(address);
      if (!userVault) {
        throw new Error('No business vault found');
      }
      
      const txHash = await smartVerseBusinessService.recordIncome(
        userVault,
        amount,
        category,
        description,
        walletClient
      );
      
      // Handle success
      console.log('Income recorded:', txHash);
    } catch (error) {
      // Handle error
      console.error('Failed to record income:', error);
    }
  };
};
```

## Error Handling

### Common Errors and Solutions

1. **"User already has a business vault"**
   - Check if user already has a vault with `getUserVault()`
   - Each user can only have one business vault

2. **"Insufficient balance"**
   - Ensure user has enough ETH for gas fees
   - Check vault balance before recording expenses

3. **"Contract not found"**
   - Verify contract addresses in `BusinessContracts.ts`
   - Ensure connected to correct network (Sepolia)

4. **"Transaction failed"**
   - Check gas estimation with `estimateGas()`
   - Verify wallet connection and network

## Smart Contract Functions Used

### BusinessFactory Contract
- `createBusinessVault(name, category, description, owner)`
- `getUserVault(userAddress)`

### BusinessVault Contract
- `recordIncome(amount, category, description)`
- `recordExpense(to, amount, category, description)`
- `getTotalIncome()`
- `getTotalExpenses()`
- `getBalance()`
- `getTransactionCount()`
- `getTransaction(index)`

## Network Configuration

### Sepolia Testnet (Hub Chain)
- Chain ID: 11155111
- RPC: Public Sepolia RPC
- Contracts: All business contracts deployed

### Spoke Chains (Future Implementation)
- Taranium (13000)
- Holesky (17000)
- Core DAO (1115)
- Polygon Amoy (80002)

## Security Considerations

1. **Access Control**
   - Only vault owner can record transactions
   - Wallet signature required for all writes

2. **Data Validation**
   - Input validation on frontend
   - Smart contract validation on-chain

3. **Gas Management**
   - Estimate gas before transactions
   - Handle gas price fluctuations

## Next Steps

1. **Relayer Integration**
   - Implement cross-chain message passing
   - Sync data between hub and spoke chains

2. **Enhanced Features**
   - Token payments (IDRT, USDC)
   - Batch transactions
   - Advanced reporting

3. **UI/UX Improvements**
   - Real-time updates
   - Transaction status tracking
   - Better error messages

## Testing

Test on Sepolia testnet:
1. Get testnet ETH from faucet
2. Connect to Sepolia network
3. Create business vault
4. Record sample transactions
5. Verify data consistency

## Support

For technical support:
- Check contract addresses in `BusinessContracts.ts`
- Verify network connection
- Monitor gas prices
- Check blockchain explorer for transaction status
