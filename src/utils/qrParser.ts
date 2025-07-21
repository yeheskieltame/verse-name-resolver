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
      if (cleanedData.includes('smartverse.app/pay') || 
          cleanedData.includes('smartverse-id.vercel.app/pay') || 
          cleanedData.includes('/pay?') ||
          cleanedData.includes('/pay/')) {
        console.log('🔗 Attempting to parse as business URL format...');
        const result = this.parseBusinessURL(cleanedData);
        if (result) {
          console.log('✅ Successfully parsed business URL format');
          return result;
        } else {
          console.log('❌ Failed to parse business URL format');
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
      console.log('🏪 Parsing business URL:', qrData);
      
      // Support multiple URL formats:
      // 1. https://smartverse.app/pay/0xAddress?params
      // 2. https://smartverse-id.vercel.app/pay?address=0xAddress&params
      
      let url: URL;
      let recipientAddress: string | null = null;
      
      try {
        url = new URL(qrData);
        console.log('📍 URL parsed successfully:', url.pathname, url.search);
      } catch (error) {
        console.warn('Invalid URL format:', qrData);
        return null;
      }
      
      // Check if it's a business payment URL
      if (!url.pathname.includes('/pay')) {
        console.warn('Not a payment URL - missing /pay in path');
        return null;
      }
      
      // Extract address from URL path or params
      if (url.pathname.includes('/pay/')) {
        // Format: /pay/0xAddress
        const pathParts = url.pathname.split('/pay/');
        if (pathParts.length >= 2) {
          recipientAddress = pathParts[1];
          console.log('📭 Address extracted from path:', recipientAddress);
        }
      } else {
        // Format: /pay?address=0xAddress
        recipientAddress = url.searchParams.get('address');
        console.log('📭 Address extracted from params:', recipientAddress);
      }
      
      if (!recipientAddress || !isAddress(recipientAddress)) {
        console.warn('Invalid address in business URL:', recipientAddress);
        return null;
      }
      
      const params = url.searchParams;
      const amount = params.get('amount');
      const category = params.get('category') || 'Business Payment';
      const tokenAddress = params.get('token');
      const tokenSymbol = params.get('tokenSymbol');
      const businessName = params.get('businessName');
      
      console.log('💰 Payment details:', { amount, category, tokenAddress, tokenSymbol, businessName });
      
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
        recipientAddress: recipientAddress,
        businessName: businessName || undefined,
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
      // Use proper EIP-681 ethereum: protocol format for consistency
      if (amount && amount !== '0') {
        try {
          const ethAmountWei = parseUnits(amount, 18);
          // Format: ethereum:0xAddress?value=amountInWei&message=description
          let url = `ethereum:${recipientAddress}?value=${ethAmountWei.toString()}`;
          
          // Add metadata as query parameters
          const metadata = [];
          if (message) metadata.push(`message=${encodeURIComponent(message)}`);
          if (businessName) metadata.push(`business=${encodeURIComponent(businessName)}`);
          if (category) metadata.push(`category=${encodeURIComponent(category)}`);
          
          if (metadata.length > 0) {
            url += '&' + metadata.join('&');
          }
          
          return url;
        } catch (error) {
          console.error('❌ Error converting amount to wei:', error);
          throw new Error('Invalid amount format');
        }
      } else {
        // Static QR - use DApp URL format for consistency with crossChainNameService
        const baseUrl = 'https://smartverse-id.vercel.app/pay';
        const params = new URLSearchParams();
        
        params.set('address', recipientAddress);
        params.set('category', category);
        params.set('type', 'business');
        
        if (message) params.set('message', message);
        if (businessName) params.set('business', businessName);
        
        return `${baseUrl}?${params.toString()}`;
      }
    }
  }
}
