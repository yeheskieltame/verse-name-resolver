import { useState, useEffect } from 'react';
import { useAccount, useChainId, usePublicClient } from 'wagmi';
import { type Address, formatUnits, erc20Abi } from 'viem';

export interface Token {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  balance: bigint;
  formattedBalance: string;
  logoURI?: string;
  isNative?: boolean;
}

// Common ERC20 tokens for different chains
const COMMON_TOKENS: Record<number, Omit<Token, 'balance' | 'formattedBalance'>[]> = {
  // Ethereum Mainnet
  1: [
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      name: 'Tether USD',
      symbol: 'USDT',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
    },
    {
      address: '0xA0b86a33E6441b4E1A72FE98bbCC0f7De6E5d6c2',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    },
    {
      address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
      name: 'Chainlink',
      symbol: 'LINK',
      decimals: 18,
      logoURI: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png'
    }
  ],
  // Polygon
  137: [
    {
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    },
    {
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      name: 'Tether USD',
      symbol: 'USDT',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
    },
    {
      address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      name: 'Dai Stablecoin',
      symbol: 'DAI',
      decimals: 18,
      logoURI: 'https://assets.coingecko.com/coins/images/9956/small/4943.png'
    }
  ],
  // Base
  8453: [
    {
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    },
    {
      address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed',
      name: 'Degen',
      symbol: 'DEGEN',
      decimals: 18,
      logoURI: 'https://assets.coingecko.com/coins/images/34515/small/degen.png'
    }
  ],
  // Arbitrum
  42161: [
    {
      address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    },
    {
      address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      name: 'Tether USD',
      symbol: 'USDT',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
    }
  ],
  // Optimism
  10: [
    {
      address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    },
    {
      address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
      name: 'Tether USD',
      symbol: 'USDT',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
    }
  ],
  // BNB Smart Chain
  56: [
    {
      address: '0x55d398326f99059fF775485246999027B3197955',
      name: 'Tether USD',
      symbol: 'USDT',
      decimals: 18,
      logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
    },
    {
      address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 18,
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    },
    {
      address: '0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE',
      name: 'Binance USD',
      symbol: 'BUSD',
      decimals: 18,
      logoURI: 'https://assets.coingecko.com/coins/images/9576/small/BUSD.png'
    }
  ],
  // Avalanche
  43114: [
    {
      address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
      name: 'Tether USD',
      symbol: 'USDT',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
    },
    {
      address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    }
  ],
  // Fantom
  250: [
    {
      address: '0x049d68029688eAbF473097a2fC38ef61633A3C7A',
      name: 'Tether USD',
      symbol: 'USDT',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
    },
    {
      address: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    }
  ],
  // Gnosis Chain
  100: [
    {
      address: '0x4ECaBa5870353805a9F068101A40E0f32ed605C6',
      name: 'Tether USD',
      symbol: 'USDT',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
    },
    {
      address: '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    }
  ],
  // Celo
  42220: [
    {
      address: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
      name: 'Celo Dollar',
      symbol: 'cUSD',
      decimals: 18,
      logoURI: 'https://assets.coingecko.com/coins/images/11090/small/cUSD.png'
    },
    {
      address: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
      name: 'Celo Euro',
      symbol: 'cEUR',
      decimals: 18,
      logoURI: 'https://assets.coingecko.com/coins/images/13441/small/cEUR.png'
    }
  ],
  // Moonbeam
  1284: [
    {
      address: '0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    },
    {
      address: '0x8e70cd5b4ff3f62659049e74b6649c6603a0e594',
      name: 'Tether USD',
      symbol: 'USDT',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
    }
  ],
  // Cronos
  25: [
    {
      address: '0x66e428c3f67a68878562e79A0234c1F83c208770',
      name: 'Tether USD',
      symbol: 'USDT',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
    },
    {
      address: '0xc21223249CA28397B4B6541dfFaEcC539BfF0c59',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    }
  ],
  // Aurora
  1313161554: [
    {
      address: '0x4988a896b1227218e4A686fdE5EabdcAbd91571f',
      name: 'Tether USD',
      symbol: 'USDT',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
    },
    {
      address: '0xB12BFcA5A55806AaF64E99521918A4bf0fC40802',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    }
  ],
  // Sepolia (Testnet)
  11155111: [
    {
      address: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
      name: 'Test USDC',
      symbol: 'USDC',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    },
    {
      address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      name: 'Test USDT',
      symbol: 'USDT',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
    }
  ],
  // Holesky (Testnet)
  17000: [
    {
      address: '0x6f14C02FC1F78322cFd7d707aB90f18baD3B54f5',
      name: 'Test USDC',
      symbol: 'USDC',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    },
    {
      address: '0x5C221E77624690fff6dd741493D735a17716c26B',
      name: 'Test USDT',
      symbol: 'USDT',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
    }
  ],
  // Taranium (Testnet)
  9924: [
    {
      address: '0x1234567890123456789012345678901234567890',
      name: 'Test USDC',
      symbol: 'USDC',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    },
    {
      address: '0x0987654321098765432109876543210987654321',
      name: 'Test USDT',
      symbol: 'USDT',
      decimals: 6,
      logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
    },
    {
      address: '0x1111111111111111111111111111111111111111',
      name: 'Test Token',
      symbol: 'TEST',
      decimals: 18,
      logoURI: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png'
    }
  ]
};

// Get native token info for chain
const getNativeTokenInfo = (chainId: number): Omit<Token, 'address' | 'balance' | 'formattedBalance'> => {
  const nativeTokens: Record<number, Omit<Token, 'address' | 'balance' | 'formattedBalance'>> = {
    1: { name: 'Ethereum', symbol: 'ETH', decimals: 18, isNative: true },
    137: { name: 'Polygon', symbol: 'MATIC', decimals: 18, isNative: true },
    8453: { name: 'Ethereum', symbol: 'ETH', decimals: 18, isNative: true },
    42161: { name: 'Ethereum', symbol: 'ETH', decimals: 18, isNative: true },
    10: { name: 'Ethereum', symbol: 'ETH', decimals: 18, isNative: true },
    56: { name: 'BNB', symbol: 'BNB', decimals: 18, isNative: true },
    43114: { name: 'Avalanche', symbol: 'AVAX', decimals: 18, isNative: true },
    250: { name: 'Fantom', symbol: 'FTM', decimals: 18, isNative: true },
    100: { name: 'xDAI', symbol: 'xDAI', decimals: 18, isNative: true },
    42220: { name: 'Celo', symbol: 'CELO', decimals: 18, isNative: true },
    1284: { name: 'Glimmer', symbol: 'GLMR', decimals: 18, isNative: true },
    25: { name: 'Cronos', symbol: 'CRO', decimals: 18, isNative: true },
    1313161554: { name: 'Ethereum', symbol: 'ETH', decimals: 18, isNative: true },
    // Testnets
    11155111: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18, isNative: true },
    17000: { name: 'Holesky ETH', symbol: 'ETH', decimals: 18, isNative: true },
    9924: { name: 'Taranium', symbol: 'TARAN', decimals: 18, isNative: true },
  };

  return nativeTokens[chainId] || { name: 'Native Token', symbol: 'NATIVE', decimals: 18, isNative: true };
};

export const useTokenBalances = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTokenBalances = async () => {
    if (!address || !publicClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const allTokens: Token[] = [];
      
      // Get native token balance
      const nativeInfo = getNativeTokenInfo(chainId);
      const nativeBalance = await publicClient.getBalance({ address });
      
      allTokens.push({
        ...nativeInfo,
        address: '0x0000000000000000000000000000000000000000' as Address,
        balance: nativeBalance,
        formattedBalance: formatUnits(nativeBalance, nativeInfo.decimals),
      });

      // Get ERC20 token balances
      const commonTokens = COMMON_TOKENS[chainId] || [];
      
      for (const tokenInfo of commonTokens) {
        try {
          // First try to get basic token info to verify contract exists
          const [balance, name, symbol, decimals] = await Promise.all([
            publicClient.readContract({
              address: tokenInfo.address,
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [address],
            }),
            publicClient.readContract({
              address: tokenInfo.address,
              abi: erc20Abi,
              functionName: 'name',
            }),
            publicClient.readContract({
              address: tokenInfo.address,
              abi: erc20Abi,
              functionName: 'symbol',
            }),
            publicClient.readContract({
              address: tokenInfo.address,
              abi: erc20Abi,
              functionName: 'decimals',
            }),
          ]);

          // Add tokens regardless of balance for better UX
          // Users can see all available tokens even if they have 0 balance
          allTokens.push({
            ...tokenInfo,
            name: name as string,
            symbol: symbol as string,
            decimals: decimals as number,
            balance,
            formattedBalance: formatUnits(balance, decimals as number),
          });
        } catch (tokenError) {
          console.log(`Could not load token ${tokenInfo.symbol} on chain ${chainId}:`, tokenError);
          // Continue with other tokens - some might be test tokens that don't exist
        }
      }

      // Sort by balance value (descending)
      allTokens.sort((a, b) => {
        const aValue = parseFloat(a.formattedBalance);
        const bValue = parseFloat(b.formattedBalance);
        return bValue - aValue;
      });

      setTokens(allTokens);
      
    } catch (err) {
      console.error('Error loading token balances:', err);
      setError('Failed to load token balances');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTokenBalances();
  }, [address, chainId, publicClient]);

  return {
    tokens,
    isLoading,
    error,
    refetch: loadTokenBalances,
  };
};
