
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { TARANIUM_NETWORK } from '@/contracts/swnsContract';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface Web3State {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  account: string;
  balance: string;
  isConnected: boolean;
  chainId: number | null;
}

export const useWeb3 = () => {
  const [web3State, setWeb3State] = useState<Web3State>({
    provider: null,
    signer: null,
    account: '',
    balance: '0',
    isConnected: false,
    chainId: null,
  });

  const connectWallet = async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      
      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      const balance = await provider.getBalance(account);
      const network = await provider.getNetwork();

      // Switch to Taranium network if not already
      if (Number(network.chainId) !== TARANIUM_NETWORK.chainId) {
        await switchToTaraniumNetwork();
      }

      setWeb3State({
        provider,
        signer,
        account,
        balance: ethers.formatEther(balance),
        isConnected: true,
        chainId: Number(network.chainId),
      });

    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  const switchToTaraniumNetwork = async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${TARANIUM_NETWORK.chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // Network not added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${TARANIUM_NETWORK.chainId.toString(16)}`,
              chainName: TARANIUM_NETWORK.name,
              rpcUrls: [TARANIUM_NETWORK.rpcUrl],
              nativeCurrency: {
                name: 'TARAN',
                symbol: 'TARAN',
                decimals: 18,
              },
            }],
          });
        } catch (addError) {
          console.error('Failed to add network:', addError);
          throw addError;
        }
      } else {
        throw switchError;
      }
    }
  };

  const disconnectWallet = () => {
    setWeb3State({
      provider: null,
      signer: null,
      account: '',
      balance: '0',
      isConnected: false,
      chainId: null,
    });
  };

  const updateBalance = async () => {
    if (web3State.provider && web3State.account) {
      const balance = await web3State.provider.getBalance(web3State.account);
      setWeb3State(prev => ({
        ...prev,
        balance: ethers.formatEther(balance)
      }));
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        }
      });

      window.ethereum.on('chainChanged', (chainId: string) => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  return {
    ...web3State,
    connectWallet,
    disconnectWallet,
    updateBalance,
    switchToTaraniumNetwork,
  };
};
