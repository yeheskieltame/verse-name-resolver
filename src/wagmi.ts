import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { 
  mainnet, 
  sepolia, 
  holesky, 
  polygon, 
  base, 
  arbitrum, 
  optimism, 
  bsc, 
  avalanche, 
  fantom,
  gnosis,
  celo,
  moonbeam,
  cronos,
  aurora
} from 'wagmi/chains';

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

// Hub Chain - tempat penyimpanan nama username (Single Source of Truth)
// For mainnet: use mainnet, for testnet: use sepolia
export const HUB_CHAIN_ID = mainnet.id; // Changed to mainnet for production

// Spoke Chains - tempat transaksi aktual terjadi (All popular EVM chains)
export const SPOKE_CHAINS = [
  mainnet.id,      // Ethereum
  polygon.id,      // Polygon
  base.id,         // Base
  arbitrum.id,     // Arbitrum
  optimism.id,     // Optimism
  bsc.id,          // BNB Smart Chain
  avalanche.id,    // Avalanche
  fantom.id,       // Fantom
  gnosis.id,       // Gnosis Chain
  celo.id,         // Celo
  moonbeam.id,     // Moonbeam
  cronos.id,       // Cronos
  aurora.id,       // Aurora
  // Keep testnet chains for development
  sepolia.id,      // Sepolia (testnet)
  holesky.id,      // Holesky (testnet)
  taranium.id,     // Taranium (testnet)
];

export const config = getDefaultConfig({
  appName: 'SmartVerse Name Service',
  projectId: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', // Placeholder - get real one from WalletConnect Cloud
  chains: [
    // Mainnet chains first
    mainnet,
    polygon,
    base,
    arbitrum,
    optimism,
    bsc,
    avalanche,
    fantom,
    gnosis,
    celo,
    moonbeam,
    cronos,
    aurora,
    // Testnet chains
    sepolia,
    holesky,
    taranium,
  ],
  ssr: false, // If using Next.js SSR
});
