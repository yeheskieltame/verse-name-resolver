/**
 * useWeb3Wagmi - Modern Web3 React Hook
 * 
 * This hook provides a complete interface for web3 interactions using Wagmi.
 * It replaces the legacy useWeb3 hook with modern, type-safe alternatives.
 * 
 * Features:
 * - Account management with RainbowKit integration
 * - Real-time balance tracking
 * - Network switching with error handling
 * - Type-safe contract interactions
 * - Automatic connection state management
 */

import { useAccount, useBalance, useChainId, useDisconnect, useSwitchChain, useWalletClient, usePublicClient } from 'wagmi';
import { formatEther } from 'viem';
import { toast } from './use-toast';

export function useWeb3Wagmi() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  // Get balance for current account
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address: address,
  });

  // Format balance or return '0'
  const balance = balanceData ? formatEther(balanceData.value) : '0';

  // Switch to a specific network
  const switchToNetwork = async (targetNetwork: { chainId: number; name: string }) => {
    try {
      await switchChain({ chainId: targetNetwork.chainId });
      toast({
        title: "Network Switched! 🎉",
        description: `Successfully switched to ${targetNetwork.name}`,
      });
    } catch (error: any) {
      console.error('Network switch error:', error);
      toast({
        title: "Network Switch Failed", 
        description: error.message || "Failed to switch network",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    disconnect();
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  // Update balance (with wagmi, this refetches)
  const updateBalance = async () => {
    try {
      await refetchBalance();
    } catch (error) {
      console.error('Failed to update balance:', error);
    }
  };

  // Connect wallet (handled by RainbowKit)
  const connectWallet = () => {
    toast({
      title: "Use Connect Button",
      description: "Please use the Connect Wallet button in the header",
      variant: "default"
    });
  };

  return {
    // Account info
    address: address || '',
    account: address || '', // Legacy compatibility
    isConnected,
    balance,
    balanceData, // Raw balance data for components that need bigint
    chainId,
    
    // Clients
    walletClient,
    publicClient,
    
    // Actions
    connectWallet,
    disconnectWallet,
    switchToNetwork,
    updateBalance,
    refetchBalance,
    
    // Network switching shorthand
    switchChain,
    
    // Legacy compatibility (deprecated)
    provider: publicClient,
    signer: walletClient,
  };
}

// Legacy export for backward compatibility
export const useWeb3 = useWeb3Wagmi;
