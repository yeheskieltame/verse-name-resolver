# 🔧 Setup & Configuration Guide

## Quick Start

1. **Install dependencies:**
```bash
npm install
# or
bun install
```

2. **Start development server:**
```bash
npm run dev
# or
bun dev
```

3. **Open in browser:**
```
http://localhost:8080
```

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the root directory:

```env
# WalletConnect Project ID (get from https://cloud.walletconnect.com)
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# RPC URLs (optional, uses public RPCs by default)
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_key
VITE_TARANIUM_RPC_URL=https://testnet-rpc.taranium.com
VITE_POLYGON_RPC_URL=https://polygon-rpc.com
VITE_BASE_RPC_URL=https://mainnet.base.org
```

### Network Configuration

The app automatically configures these networks:

| Network | Chain ID | RPC | Explorer |
|---------|----------|-----|----------|
| Sepolia | 11155111 | Public | etherscan.io |
| Taranium | 9924 | testnet-rpc.taranium.com | testnet-explorer.taranium.com |
| Holesky | 17000 | Public | holesky.etherscan.io |
| Polygon | 137 | Public | polygonscan.com |
| Base | 8453 | Public | basescan.org |

## Smart Contract Configuration

### Hub Chain (Sepolia)
```typescript
SEPOLIA_CONTRACT = "0x6716724D0C2cD0F60A1455e96f5Edb66C2d3124E"
```

### Spoke Chains
```typescript
TARANIUM_CONTRACT = "0x80DC4e49A04f58611A95cD515a45F8d9C4631203"
// Other chains: No contracts needed (transaction only)
```

## Development Configuration

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Tailwind Configuration
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## Wallet Configuration

### MetaMask Setup

1. **Add Networks to MetaMask:**

**Sepolia Testnet:**
```
Network Name: Sepolia
RPC URL: https://eth-sepolia.g.alchemy.com/v2/demo
Chain ID: 11155111
Currency Symbol: ETH
Block Explorer: https://sepolia.etherscan.io
```

**Taranium Testnet:**
```
Network Name: Taranium Testnet
RPC URL: https://testnet-rpc.taranium.com
Chain ID: 9924
Currency Symbol: TARAN
Block Explorer: https://testnet-explorer.taranium.com
```

**Holesky Testnet:**
```
Network Name: Holesky
RPC URL: https://ethereum-holesky.publicnode.com
Chain ID: 17000
Currency Symbol: ETH
Block Explorer: https://holesky.etherscan.io
```

2. **Get Test Tokens:**
- Sepolia: https://sepoliafaucet.com
- Holesky: https://holesky-faucet.pk910.de
- Taranium: Contact team for test tokens

## Build Configuration

### Production Build
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```

### Deployment
```bash
# Build for production
npm run build

# Deploy to your hosting service
# (Vercel, Netlify, etc.)
```

## Troubleshooting

### Common Issues

1. **"Network not supported"**
   - Check if wallet is connected to supported network
   - Verify chain ID matches configuration

2. **"Contract not found"**
   - Ensure contract addresses are correct
   - Check network configuration

3. **"Transaction failed"**
   - Verify sufficient gas/tokens
   - Check contract function names in ABI

4. **"Name resolution failed"**
   - Verify Hub Chain connection
   - Check contract is deployed on Sepolia

### Debug Mode

Enable debug logs:
```typescript
// In crossChainNameService.ts
const DEBUG = true;
```

### Performance Optimization

1. **RPC Optimization:**
```typescript
// Use faster RPC providers
const hubPublicClient = createPublicClient({
  chain: sepolia,
  transport: http('https://eth-sepolia.g.alchemy.com/v2/your_key'),
});
```

2. **Caching:**
```typescript
// Cache resolved names
const nameCache = new Map<string, Address>();
```

## Support

- 📧 Email: support@smartverse.io
- 💬 Discord: https://discord.gg/smartverse
- 📚 Docs: https://docs.smartverse.io
- 🐛 Issues: https://github.com/smartverse/issues
