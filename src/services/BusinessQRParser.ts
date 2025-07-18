/**
 * Business QR Parser - Specialized parser untuk QR code bisnis SmartVerse
 * Handles both ethereum: protocol dan DApp URL formats
 */

import { parseUnits, formatUnits, isAddress } from 'viem';
import { BUSINESS_CONTRACTS } from '@/contracts/BusinessContracts';

export interface BusinessQRPayment {
  isValid: boolean;
  format: 'ethereum-protocol' | 'dapp-url' | 'invalid';
  recipientAddress: string;
  amount?: string;           // Amount in human readable format (e.g., "1.5")
  amountWei?: string;        // Amount in wei for blockchain
  amountFormatted?: string;  // Formatted for display (e.g., "1.50 IDRT")
  category?: string;
  tokenAddress?: string;
  tokenSymbol?: string;
  businessName?: string;
  message?: string;
}

export class BusinessQRParser {
  /**
   * Parse business QR code from various formats
   */
  static parseBusinessQR(qrData: string): BusinessQRPayment {
    console.log('🔍 Parsing Business QR:', qrData);

    // Clean up the QR data
    const cleanData = qrData.trim();

    // Check for ethereum: protocol format (token payments)
    if (cleanData.startsWith('ethereum:')) {
      return this.parseEthereumProtocol(cleanData);
    }

    // Check for DApp URL format (native ETH payments)
    if (cleanData.includes('smartverse-id.vercel.app/pay') || cleanData.includes('/pay?')) {
      return this.parseDAppURL(cleanData);
    }

    // Check for direct address (fallback)
    if (isAddress(cleanData)) {
      return {
        isValid: true,
        format: 'dapp-url',
        recipientAddress: cleanData,
        category: 'Pembayaran QR'
      };
    }

    // Invalid format
    return {
      isValid: false,
      format: 'invalid',
      recipientAddress: '',
      message: 'Format QR code tidak valid atau bukan QR bisnis SmartVerse'
    };
  }

  /**
   * Parse ethereum: protocol format
   * Example: ethereum:0xTokenAddress/transfer?address=0xVault&uint256=1000000000000000000&chainId=11155111
   * Example: ethereum:0xVaultAddress?value=1000000000000000000&chainId=11155111
   */
  private static parseEthereumProtocol(data: string): BusinessQRPayment {
    try {
      console.log('📱 Parsing ethereum: protocol format...');

      // Parse the ethereum: URL
      const urlParts = data.split('?');
      const basePart = urlParts[0]; // ethereum:0xAddress or ethereum:0xTokenAddress/transfer
      const queryPart = urlParts[1]; // Parameters after ?

      if (!queryPart) {
        throw new Error('No query parameters found in ethereum: URL');
      }

      // Parse query parameters
      const params = new URLSearchParams(queryPart);
      const chainId = params.get('chainId');

      // Check if this is a token transfer (contains /transfer)
      if (basePart.includes('/transfer')) {
        // Token transfer format: ethereum:0xTokenAddress/transfer?address=0xVault&uint256=amount
        const tokenMatch = basePart.match(/ethereum:([0-9a-fA-Fx]+)\/transfer/);
        if (!tokenMatch) {
          throw new Error('Invalid ethereum: token transfer format');
        }

        const tokenAddress = tokenMatch[1];
        const vaultAddress = params.get('address');
        const uint256Amount = params.get('uint256');

        if (!vaultAddress || !isAddress(vaultAddress)) {
          throw new Error('Invalid vault address in token QR');
        }

        if (!uint256Amount) {
          throw new Error('No token amount specified in QR');
        }

        if (!isAddress(tokenAddress)) {
          throw new Error('Invalid token address in QR');
        }

        // Convert wei amount to human readable
        const amountWei = uint256Amount;
        const amount = formatUnits(BigInt(amountWei), 18); // Assume 18 decimals for IDRT
        
        // Determine token symbol based on address
        let tokenSymbol = 'IDRT';
        if (tokenAddress === BUSINESS_CONTRACTS.sepolia.contracts.MockIDRT) {
          tokenSymbol = 'IDRT';
        }

        const result: BusinessQRPayment = {
          isValid: true,
          format: 'ethereum-protocol',
          recipientAddress: vaultAddress,
          amount: amount,
          amountWei: amountWei,
          amountFormatted: `${parseFloat(amount).toFixed(2)} ${tokenSymbol}`,
          category: 'Pembayaran Token',
          tokenAddress: tokenAddress,
          tokenSymbol: tokenSymbol
        };

        console.log('✅ Parsed ethereum: token transfer QR:', result);
        return result;
        
      } else {
        // Native ETH transfer format: ethereum:0xVaultAddress?value=amountInWei
        const addressMatch = basePart.match(/ethereum:([0-9a-fA-Fx]+)/);
        if (!addressMatch) {
          throw new Error('Invalid ethereum: native transfer format');
        }

        const vaultAddress = addressMatch[1];
        const valueAmount = params.get('value');

        if (!vaultAddress || !isAddress(vaultAddress)) {
          throw new Error('Invalid vault address in native QR');
        }

        if (!valueAmount) {
          throw new Error('No value amount specified in QR');
        }

        // Convert wei amount to human readable
        const amountWei = valueAmount;
        const amount = formatUnits(BigInt(amountWei), 18); // ETH has 18 decimals

        const result: BusinessQRPayment = {
          isValid: true,
          format: 'ethereum-protocol',
          recipientAddress: vaultAddress,
          amount: amount,
          amountWei: amountWei,
          amountFormatted: `${parseFloat(amount).toFixed(6)} ETH`,
          category: 'Pembayaran ETH'
        };

        console.log('✅ Parsed ethereum: native transfer QR:', result);
        return result;
      }

    } catch (error) {
      console.error('❌ Error parsing ethereum: protocol:', error);
      return {
        isValid: false,
        format: 'invalid',
        recipientAddress: '',
        message: `Error parsing ethereum: protocol: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Parse DApp URL format
   * Example: https://smartverse-id.vercel.app/pay?address=0xVault&amount=1.5&category=Food&type=business
   */
  private static parseDAppURL(data: string): BusinessQRPayment {
    try {
      console.log('🌐 Parsing DApp URL format...');

      const url = new URL(data);
      const params = new URLSearchParams(url.search);

      const address = params.get('address');
      const amount = params.get('amount');
      const category = params.get('category');
      const type = params.get('type');
      const tokenAddress = params.get('token');
      const tokenSymbol = params.get('tokenSymbol');

      if (!address || !isAddress(address)) {
        throw new Error('Invalid address in DApp URL');
      }

      // Validate that this is a business payment
      if (type !== 'business') {
        throw new Error('QR code is not for business payment');
      }

      let amountWei: string | undefined;
      let amountFormatted: string | undefined;

      if (amount) {
        if (tokenAddress) {
          // Token payment
          amountWei = parseUnits(amount, 18).toString();
          amountFormatted = `${parseFloat(amount).toFixed(2)} ${tokenSymbol || 'IDRT'}`;
        } else {
          // Native ETH payment
          amountWei = parseUnits(amount, 18).toString();
          amountFormatted = `${parseFloat(amount).toFixed(6)} ETH`;
        }
      }

      const result: BusinessQRPayment = {
        isValid: true,
        format: 'dapp-url',
        recipientAddress: address,
        amount: amount || undefined,
        amountWei: amountWei,
        amountFormatted: amountFormatted,
        category: category || 'Pembayaran QR',
        tokenAddress: tokenAddress || undefined,
        tokenSymbol: tokenSymbol || undefined
      };

      console.log('✅ Parsed DApp URL QR:', result);
      return result;

    } catch (error) {
      console.error('❌ Error parsing DApp URL:', error);
      return {
        isValid: false,
        format: 'invalid',
        recipientAddress: '',
        message: `Error parsing DApp URL: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get a human-readable description of the payment
   */
  static getPaymentDescription(payment: BusinessQRPayment): string {
    if (!payment.isValid) {
      return payment.message || 'Invalid QR code';
    }

    let description = `Business Payment`;
    
    if (payment.amountFormatted) {
      description += ` • ${payment.amountFormatted}`;
    } else {
      description += ` • Amount to be specified`;
    }

    if (payment.category && payment.category !== 'Pembayaran QR') {
      description += ` • ${payment.category}`;
    }

    if (payment.format === 'ethereum-protocol') {
      description += ` • Token Transfer`;
    } else {
      description += ` • Native Currency`;
    }

    return description;
  }

  /**
   * Validate if QR contains business payment data
   */
  static isValidBusinessQR(qrData: string): boolean {
    const parsed = this.parseBusinessQR(qrData);
    return parsed.isValid;
  }

  /**
   * Extract just the vault address for quick validation
   */
  static extractVaultAddress(qrData: string): string | null {
    const parsed = this.parseBusinessQR(qrData);
    return parsed.isValid ? parsed.recipientAddress : null;
  }
}

export default BusinessQRParser;
