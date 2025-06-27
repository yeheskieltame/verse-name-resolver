import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia } from 'wagmi/chains';

// Define custom Taranium chain
export const taranium = {
  id: 9924,
  name: 'Taranium Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'TARAN',
    symbol: 'TARAN',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.taranium.com'],
    },
  },
  blockExplorers: {
    default: { name: 'Taranium Explorer', url: 'https://testnet-explorer.taranium.com' },
  },
} as const;

export const config = getDefaultConfig({
  appName: 'SmartVerse Name Service',
  projectId: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', // Placeholder - get real one from WalletConnect Cloud
  chains: [taranium, sepolia, mainnet],
  ssr: false, // If using Next.js SSR
});
