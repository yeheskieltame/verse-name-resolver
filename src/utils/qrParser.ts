/**
 * Business QR Parser - SmartVerse Payment System
 * Focused only on business payment QR codes for reliability
 */

import { formatUnits, parseUnits, isAddress } from 'viem';

export interface BusinessQRPayment {
  type: 'business';
  recipientAddress: string;
  businessName?: string;
  amount?: string;  // Amount in wei
  amountFormatted?: string;  // Human readable amount
  category: string;
  message?: string;
  format: 'business-url' | 'business-json';
  raw: string;
  isValid: boolean;
}

export class BusinessQRParser {
  
  /**
   * Parse business QR code and return payment details
   * Only supports SmartVerse business payment formats
   */
  static parseBusinessQR(qrData: string): BusinessQRPayment | null {
    try {
      console.log('🏢 Parsing Business QR code:', qrData.substring(0, 100) + (qrData.length > 100 ? '...' : ''));
      
      // Clean the data
      const cleanedData = qrData.trim();
      
      // Try business URL format first
      const urlResult = this.parseBusinessURL(cleanedData);
      if (urlResult) {
        console.log('✅ Successfully parsed business URL format');
        return urlResult;
      }
      
      // Try business JSON format
      const jsonResult = this.parseBusinessJSON(cleanedData);
      if (jsonResult) {
        console.log('✅ Successfully parsed business JSON format');
        return jsonResult;
      }
      
      console.warn('❌ Not a valid business payment QR code');
      return null;
      
    } catch (error) {
      console.error('❌ Error parsing business QR code:', error);
      return null;
    }
  }
  
  /**
   * Parse business payment URL format
   * Format: https://smartverse.app/pay/{address}?amount=1.5&category=Product&message=Order123
   */
  private static parseBusinessURL(qrData: string): BusinessQRPayment | null {
    try {
      // Check if it's a business payment URL
      if (!qrData.includes('/pay/') && !qrData.includes('business-payment')) {
        return null;
      }
      
      const url = new URL(qrData);
      const pathParts = url.pathname.split('/');
      const recipientAddress = pathParts[pathParts.length - 1];
      
      if (!isAddress(recipientAddress)) {
        console.warn('Invalid recipient address in URL:', recipientAddress);
        return null;
      }
      
      const amount = url.searchParams.get('amount');
      const category = url.searchParams.get('category') || 'Payment';
      const message = url.searchParams.get('message');
      const businessName = url.searchParams.get('business') || url.searchParams.get('name');
      
      let amountWei: string | undefined;
      let amountFormatted: string | undefined;
      
      if (amount && amount !== '0') {
        try {
          // Assume amount is in ETH, convert to wei
          amountWei = parseUnits(amount, 18).toString();
          amountFormatted = amount;
        } catch (error) {
          console.warn('Invalid amount format:', amount);
          return null;
        }
      }
      
      const result: BusinessQRPayment = {
        type: 'business',
        recipientAddress,
        businessName,
        amount: amountWei,
        amountFormatted,
        category,
        message,
        format: 'business-url',
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
