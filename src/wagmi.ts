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

// Validate environment variables
const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
const ALCHEMY_SEPOLIA_KEY = import.meta.env.VITE_ALCHEMY_SEPOLIA_KEY;

if (!WALLETCONNECT_PROJECT_ID) {
  console.error('❌ VITE_WALLETCONNECT_PROJECT_ID is missing in environment variables');
}

if (!ALCHEMY_SEPOLIA_KEY) {
  console.error('❌ VITE_ALCHEMY_SEPOLIA_KEY is missing in environment variables');
}

console.log('🔧 Environment check:', {
  walletConnectProjectId: WALLETCONNECT_PROJECT_ID ? '✅ Set' : '❌ Missing',
  alchemySepoliaKey: ALCHEMY_SEPOLIA_KEY ? '✅ Set' : '❌ Missing',
  nodeEnv: import.meta.env.MODE
});

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
export const HUB_CHAIN_ID = sepolia.id; // Using Sepolia for development/testnet

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
  projectId: WALLETCONNECT_PROJECT_ID || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
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
