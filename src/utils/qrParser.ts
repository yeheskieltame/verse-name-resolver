/**
 * Business QR Parser - SmartVerse Payment System
 * Enhanced parser for both ethereum: protocol and DApp URL formats
 */

import { formatUnits, parseUnits, isAddress } from 'viem';
import { BUSINESS_CONTRACTS } from '@/contracts/BusinessContracts';

export interface BusinessQRPayment {
  type: 'business';
  recipientAddress: string;
  businessName?: string;
  amount?: string;  // Amount in wei for blockchain transactions
  amountFormatted?: string;  // Human readable amount for display
  amountEther?: string;  // Amount in ether format for transactions
  category: string;
  message?: string;
  format: 'ethereum-protocol' | 'dapp-url' | 'business-json';
  tokenAddress?: string;
  tokenSymbol?: string;
  raw: string;
  isValid: boolean;
}

export class BusinessQRParser {
  
  /**
   * Parse business QR code and return payment details
   * Supports ethereum: protocol, DApp URLs, and JSON formats
   */
  static parseBusinessQR(qrData: string): BusinessQRPayment | null {
    try {
      console.log('🏢 Parsing Business QR code:', qrData.substring(0, 100) + (qrData.length > 100 ? '...' : ''));
      
      // Clean the data
      const cleanedData = qrData.trim();
      
      // Try ethereum: protocol format first (for token payments)
      if (cleanedData.startsWith('ethereum:')) {
        const result = this.parseEthereumProtocol(cleanedData);
        if (result) {
          console.log('✅ Successfully parsed ethereum: protocol format');
          return result;
        }
      }
      
      // Try business URL format
      if (cleanedData.includes('smartverse-id.vercel.app/pay') || cleanedData.includes('/pay?')) {
        const result = this.parseBusinessURL(cleanedData);
        if (result) {
          console.log('✅ Successfully parsed business URL format');
          return result;
        }
      }
      
      // Try business JSON format
      if (cleanedData.startsWith('{')) {
        const result = this.parseBusinessJSON(cleanedData);
        if (result) {
          console.log('✅ Successfully parsed business JSON format');
          return result;
        }
      }
      
      console.warn('❌ Not a valid business payment QR code');
      return null;
      
    } catch (error) {
      console.error('❌ Error parsing business QR code:', error);
      return null;
    }
  }
  
  /**
   * Parse ethereum: protocol format for token payments
   * Format: ethereum:0xTokenAddress/transfer?address=0xVault&uint256=amountInWei
   */
  private static parseEthereumProtocol(qrData: string): BusinessQRPayment | null {
    try {
      console.log('🔗 Parsing ethereum: protocol format...');
      
      // Parse the ethereum: URL
      const urlParts = qrData.split('?');
      const basePart = urlParts[0]; // ethereum:0xTokenAddress/transfer
      const queryPart = urlParts[1]; // address=0xVault&uint256=amount
      
      if (!queryPart) {
        console.warn('No query parameters in ethereum: URL');
        return null;
      }
      
      // Extract token address from base part
      const tokenMatch = basePart.match(/ethereum:([0-9a-fA-Fx]+)\/transfer/);
      if (!tokenMatch) {
        console.warn('Invalid ethereum: protocol format');
        return null;
      }
      
      const tokenAddress = tokenMatch[1];
      if (!isAddress(tokenAddress)) {
        console.warn('Invalid token address:', tokenAddress);
        return null;
      }
      
      // Parse query parameters
      const params = new URLSearchParams(queryPart);
      const vaultAddress = params.get('address');
      const uint256Amount = params.get('uint256');
      const category = params.get('data') || 'Token Payment';
      
      if (!vaultAddress || !isAddress(vaultAddress)) {
        console.warn('Invalid vault address:', vaultAddress);
        return null;
      }
      
      if (!uint256Amount) {
        console.warn('No amount specified in ethereum: URL');
        return null;
      }
      
      // Convert wei amount to human readable
      const amountWei = uint256Amount;
      const amountEther = formatUnits(BigInt(amountWei), 18);
      
      // Determine token symbol
      let tokenSymbol = 'IDRT';
      if (tokenAddress === BUSINESS_CONTRACTS.sepolia.contracts.MockIDRT) {
        tokenSymbol = 'IDRT';
      }
      
      const result: BusinessQRPayment = {
        type: 'business',
        recipientAddress: vaultAddress,
        amount: amountWei,
        amountEther: amountEther,
        amountFormatted: `${parseFloat(amountEther).toFixed(2)} ${tokenSymbol}`,
        category,
        format: 'ethereum-protocol',
        tokenAddress,
        tokenSymbol,
        raw: qrData,
        isValid: true
      };
      
      console.log('✅ Parsed ethereum: protocol QR:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Error parsing ethereum: protocol:', error);
      return null;
    }
  }
  
  /**
   * Parse business payment URL format  
   * Format: https://smartverse-id.vercel.app/pay?address=0x...&amount=1.5&category=Product&type=business
   */
  private static parseBusinessURL(qrData: string): BusinessQRPayment | null {
    try {
      // Check if it's our DApp URL with pay endpoint
      if (!qrData.includes('/pay?') && !qrData.includes('smartverse-id.vercel.app')) {
        return null;
      }
      
      const url = new URL(qrData);
      const params = new URLSearchParams(url.search);
      
      const address = params.get('address');
      const amount = params.get('amount');
      const category = params.get('category') || 'Pembayaran QR';
      const type = params.get('type');
      const tokenAddress = params.get('token');
      const tokenSymbol = params.get('tokenSymbol');
      
      if (!address || !isAddress(address)) {
        console.warn('Invalid address in DApp URL:', address);
        return null;
      }
      
      // Validate that this is a business payment
      if (type !== 'business') {
        console.warn('QR code is not marked as business payment');
        return null;
      }
      
      let amountWei: string | undefined;
      let amountEther: string | undefined;
      let amountFormatted: string | undefined;
      
      if (amount && amount !== '0') {
        try {
          if (tokenAddress) {
            // Token payment
            amountWei = parseUnits(amount, 18).toString();
            amountEther = amount;
            amountFormatted = `${parseFloat(amount).toFixed(2)} ${tokenSymbol || 'IDRT'}`;
          } else {
            // Native ETH payment
            amountWei = parseUnits(amount, 18).toString();
            amountEther = amount;
            amountFormatted = `${parseFloat(amount).toFixed(6)} ETH`;
          }
        } catch (error) {
          console.warn('Invalid amount format:', amount);
          return null;
        }
      }
      
      const result: BusinessQRPayment = {
        type: 'business',
        recipientAddress: address,
        amount: amountWei,
        amountEther: amountEther,
        amountFormatted: amountFormatted,
        category: category,
        format: 'dapp-url',
        tokenAddress: tokenAddress || undefined,
        tokenSymbol: tokenSymbol || undefined,
        raw: qrData,
        isValid: true
      };
      
      // Validate the result
      const validation = this.validateBusinessQR(result);
      result.isValid = validation.valid;
      
      if (!validation.valid) {
        console.warn('Business QR validation failed:', validation.error);
      }
      
      return result;
      
    } catch (error) {
      console.warn('Error parsing business URL:', error);
      return null;
    }
  }
  
  /**
   * Parse business payment JSON format
   * Format: {"type":"business","address":"0x...","amount":"1.5","category":"Product","message":"Order123"}
   */
  private static parseBusinessJSON(qrData: string): BusinessQRPayment | null {
    try {
      const data = JSON.parse(qrData);
      
      // Must be explicitly marked as business type
      if (data.type !== 'business') {
        return null;
      }
      
      // Extract address
      const address = data.address || data.to || data.recipient;
      if (!address || !isAddress(address)) {
        console.warn('Invalid or missing address in JSON:', address);
        return null;
      }
      
      const category = data.category || 'Payment';
      let amountWei: string | undefined;
      let amountFormatted: string | undefined;
      
      if (data.amount && data.amount !== '0') {
        try {
          if (typeof data.amount === 'string') {
            // Try to parse as ETH amount first
            if (data.amount.includes('.') || parseFloat(data.amount) < 1000) {
              // Likely ETH amount
              amountWei = parseUnits(data.amount, 18).toString();
              amountFormatted = data.amount;
            } else {
              // Likely wei amount
              amountWei = data.amount;
              amountFormatted = formatUnits(BigInt(data.amount), 18);
            }
          } else {
            // Numeric amount, assume ETH
            amountFormatted = data.amount.toString();
            amountWei = parseUnits(amountFormatted, 18).toString();
          }
        } catch (error) {
          console.warn('Invalid amount in JSON:', data.amount);
          return null;
        }
      }
      
      const result: BusinessQRPayment = {
        type: 'business',
        recipientAddress: address,
        businessName: data.businessName || data.name,
        amount: amountWei,
        amountFormatted,
        category,
        message: data.message,
        format: 'business-json',
        raw: qrData,
        isValid: true
      };
      
      // Validate the result
      const validation = this.validateBusinessQR(result);
      result.isValid = validation.valid;
      
      if (!validation.valid) {
        console.warn('Business QR validation failed:', validation.error);
      }
      
      return result;
      
    } catch (error) {
      console.warn('Error parsing business JSON:', error);
      return null;
    }
  }
  
  /**
   * Validate business QR payment data
   */
  static validateBusinessQR(payment: BusinessQRPayment): { valid: boolean; error?: string } {
    // Check recipient address
    if (!isAddress(payment.recipientAddress)) {
      return { valid: false, error: 'Invalid recipient address' };
    }
    
    // Check amount if provided
    if (payment.amount && payment.amount !== '0') {
      try {
        const amountBigInt = BigInt(payment.amount);
        if (amountBigInt <= 0n) {
          return { valid: false, error: 'Amount must be greater than 0' };
        }
      } catch {
        return { valid: false, error: 'Invalid amount format' };
      }
    }
    
    // Check category
    if (!payment.category || payment.category.trim() === '') {
      return { valid: false, error: 'Category is required for business payments' };
    }
    
    return { valid: true };
  }
  
  /**
   * Get human-readable description of the business payment
   */
  static getPaymentDescription(payment: BusinessQRPayment): string {
    let description = 'Business payment';
    
    if (payment.category) {
      description += ` for ${payment.category}`;
    }
    
    if (payment.amountFormatted) {
      description += ` of ${payment.amountFormatted} ETH`;
    }
    
    if (payment.businessName) {
      description += ` to ${payment.businessName}`;
    } else {
      description += ` to ${payment.recipientAddress.slice(0, 6)}...${payment.recipientAddress.slice(-4)}`;
    }
    
    if (payment.message) {
      description += ` (${payment.message})`;
    }
    
    return description;
  }
  
  /**
   * Generate business QR code data (for testing/demo)
   */
  static generateBusinessQR(params: {
    recipientAddress: string;
    amount?: string;
    category: string;
    message?: string;
    businessName?: string;
    format?: 'url' | 'json';
  }): string {
    const { recipientAddress, amount, category, message, businessName, format = 'url' } = params;
    
    if (!isAddress(recipientAddress)) {
      throw new Error('Invalid recipient address');
    }
    
    if (format === 'json') {
      const jsonData: any = {
        type: 'business',
        address: recipientAddress,
        category
      };
      
      if (amount) jsonData.amount = amount;
      if (message) jsonData.message = message;
      if (businessName) jsonData.businessName = businessName;
      
      return JSON.stringify(jsonData);
    } else {
      // URL format
      const baseUrl = 'https://smartverse.app/pay';
      const url = new URL(`${baseUrl}/${recipientAddress}`);
      
      url.searchParams.set('category', category);
      if (amount) url.searchParams.set('amount', amount);
      if (message) url.searchParams.set('message', message);
      if (businessName) url.searchParams.set('business', businessName);
      
      return url.toString();
    }
  }
}
