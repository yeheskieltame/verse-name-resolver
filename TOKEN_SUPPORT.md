# Token Support Documentation

## Overview
The SmartVerse Name Resolver supports sending both native tokens (ETH, MATIC, BNB, etc.) and ERC20 tokens across multiple EVM chains. Users can select any token from their wallet to send to .sw usernames.

## Supported Chains and Native Tokens

| Chain ID | Chain Name | Native Token | Symbol |
|----------|------------|-------------|--------|
| 1 | Ethereum Mainnet | Ethereum | ETH |
| 137 | Polygon | Polygon | MATIC |
| 8453 | Base | Ethereum | ETH |
| 42161 | Arbitrum | Ethereum | ETH |
| 10 | Optimism | Ethereum | ETH |
| 56 | BNB Smart Chain | BNB | BNB |
| 43114 | Avalanche | Avalanche | AVAX |
| 250 | Fantom | Fantom | FTM |
| 100 | Gnosis Chain | xDAI | xDAI |
| 42220 | Celo | Celo | CELO |
| 1284 | Moonbeam | Glimmer | GLMR |
| 25 | Cronos | Cronos | CRO |
| 1313161554 | Aurora | Ethereum | ETH |
| **Testnets** | | | |
| 11155111 | Sepolia | Sepolia ETH | ETH |
| 17000 | Holesky | Holesky ETH | ETH |
| 9924 | Taranium | Taranium | TARAN |

## ERC20 Token Support

### How It Works
- The `useTokenBalances` hook fetches both native and ERC20 token balances
- ERC20 tokens are defined in the `COMMON_TOKENS` object in `/src/hooks/useTokenBalances.ts`
- All available tokens are shown in the TokenSelector, even with 0 balance
- Users can search and select any token to send

### Current ERC20 Tokens by Chain

#### Ethereum Mainnet (1)
- USDT (Tether USD): `0xdAC17F958D2ee523a2206206994597C13D831ec7`
- USDC (USD Coin): `0xA0b86a33E6441b4E1A72FE98bbCC0f7De6E5d6c2`
- LINK (Chainlink): `0x514910771AF9Ca656af840dff83E8264EcF986CA`

#### Polygon (137)
- USDC: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`
- USDT: `0xc2132D05D31c914a87C6611C10748AEb04B58e8F`
- DAI: `0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063`

#### Base (8453)
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- DEGEN: `0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed`

#### Arbitrum (42161)
- USDC: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`
- USDT: `0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9`

#### Optimism (10)
- USDC: `0x7F5c764cBc14f9669B88837ca1490cCa17c31607`
- USDT: `0x94b008aA00579c1307B0EF2c499aD98a8ce58e58`

#### BNB Smart Chain (56)
- USDT: `0x55d398326f99059fF775485246999027B3197955`
- USDC: `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d`
- BUSD: `0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE`

#### Avalanche (43114)
- USDT: `0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7`
- USDC: `0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E`

#### Fantom (250)
- USDT: `0x049d68029688eAbF473097a2fC38ef61633A3C7A`
- USDC: `0x04068DA6C83AFCFA0e13ba15A6696662335D5B75`

#### Gnosis Chain (100)
- USDT: `0x4ECaBa5870353805a9F068101A40E0f32ed605C6`
- USDC: `0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83`

#### Celo (42220)
- cUSD: `0x765DE816845861e75A25fCA122bb6898B8B1282a`
- cEUR: `0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73`

#### Moonbeam (1284)
- USDC: `0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080`
- USDT: `0x8e70cd5b4ff3f62659049e74b6649c6603a0e594`

#### Cronos (25)
- USDT: `0x66e428c3f67a68878562e79A0234c1F83c208770`
- USDC: `0xc21223249CA28397B4B6541dfFaEcC539BfF0c59`

#### Aurora (1313161554)
- USDT: `0x4988a896b1227218e4A686fdE5EabdcAbd91571f`
- USDC: `0xB12BFcA5A55806AaF64E99521918A4bf0fC40802`

#### Testnet Tokens
- **Sepolia (11155111)**: Test USDC, Test USDT
- **Holesky (17000)**: Test USDC, Test USDT
- **Taranium (9924)**: Test USDC, Test USDT, Test Token

## Adding New Tokens

### Step 1: Add to COMMON_TOKENS
Edit `/src/hooks/useTokenBalances.ts` and add the token to the appropriate chain:

```typescript
const COMMON_TOKENS: Record<number, Omit<Token, 'balance' | 'formattedBalance'>[]> = {
  // ... existing chains
  [chainId]: [
    // ... existing tokens
    {
      address: '0x...', // Token contract address
      name: 'Token Name',
      symbol: 'SYMBOL',
      decimals: 18, // Token decimals
      logoURI: 'https://...' // Optional logo URL
    }
  ]
};
```

### Step 2: Add Native Token Info (if new chain)
If adding a new chain, also add the native token info:

```typescript
const nativeTokens: Record<number, Omit<Token, 'address' | 'balance' | 'formattedBalance'>> = {
  // ... existing chains
  [chainId]: { 
    name: 'Native Token Name', 
    symbol: 'SYMBOL', 
    decimals: 18, 
    isNative: true 
  },
};
```

### Step 3: Update Wagmi Config
Add the new chain to `/src/wagmi.ts`:

```typescript
// Add to SPOKE_CHAINS array
export const SPOKE_CHAINS = [
  // ... existing chains
  newChain.id,
];

// Add to config chains
export const config = getDefaultConfig({
  chains: [
    // ... existing chains
    newChain,
  ],
  // ... rest of config
});
```

## Testing New Tokens

1. **Local Testing**: 
   - Use placeholder addresses for development
   - Test with actual deployed contracts on testnets

2. **Mainnet Testing**:
   - Always verify contract addresses
   - Test with small amounts first
   - Ensure contracts are legitimate

## Known Issues and Solutions

### Issue: ERC20 tokens not showing for some chains
**Solution**: Ensure the chain ID is correctly added to `COMMON_TOKENS` and the token contracts are deployed on that chain.

### Issue: Token balance shows 0 but user has tokens
**Solution**: Check if the token contract address is correct and the token is deployed on the current chain.

### Issue: Transaction fails when sending ERC20 tokens
**Solution**: Ensure the user has enough native tokens for gas fees and the ERC20 token address is valid.

## Future Enhancements

1. **Dynamic Token Discovery**: Fetch token lists from external APIs
2. **Custom Token Addition**: Allow users to add custom tokens by address
3. **Token Metadata**: Enhanced token information (price, market cap, etc.)
4. **Token Filtering**: Filter by token type, balance, etc.

## API Reference

### useTokenBalances Hook
```typescript
const { tokens, isLoading, error, refetch } = useTokenBalances();
```

**Returns:**
- `tokens`: Array of Token objects with balance information
- `isLoading`: Boolean indicating if tokens are being fetched
- `error`: Error message if token fetching fails
- `refetch`: Function to manually refresh token balances

### Token Interface
```typescript
interface Token {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  balance: bigint;
  formattedBalance: string;
  logoURI?: string;
  isNative?: boolean;
}
```
