/**
 * Universal QR Parser for SmartVerse 
 * Handles all 4 types of QR codes with automatic detection
 */

import { formatUnits, parseUnits, isAddress } from 'viem';
import { BusinessQRParser, type BusinessQRPayment } from './qrParser';

export type QRType = 'business-mockidrt' | 'business-native' | 'personal-static' | 'personal-dynamic';

export interface UniversalQRPayment {
  type: QRType;
  recipientAddress: string;
  amount?: string;          // Amount in wei
  amountFormatted?: string; // Human readable
  category?: string;
  tokenAddress?: string;
  tokenSymbol?: string;
  businessName?: string;
  message?: string;
  raw: string;
  isValid: boolean;
}

export class UniversalQRParser {
  
  /**
   * Parse any QR code and automatically detect its type
   */
  static parseQR(qrData: string): UniversalQRPayment | null {
    try {
      console.log('🔍 Universal QR Parser - Analyzing:', qrData.substring(0, 100));
      
      const cleanedData = qrData.trim();
      
      // 1. Try Business QR first (most complex)
      const businessResult = this.parseBusinessQR(cleanedData);
      if (businessResult) {
        console.log('✅ Detected Business QR:', businessResult.type);
        return businessResult;
      }
      
      // 2. Try Personal QR formats
      const personalResult = this.parsePersonalQR(cleanedData);
      if (personalResult) {
        console.log('✅ Detected Personal QR:', personalResult.type);
        return personalResult;
      }
      
      console.warn('❌ Unknown QR format');
      return null;
      
    } catch (error) {
      console.error('❌ Error parsing QR:', error);
      return null;
    }
  }
  
  /**
   * Parse Business QR codes (Token + Native)
   */
  private static parseBusinessQR(qrData: string): UniversalQRPayment | null {
    // Use existing BusinessQRParser
    const businessQR = BusinessQRParser.parseBusinessQR(qrData);
    if (!businessQR || !businessQR.isValid) return null;
    
    // Determine business type based on token presence
    const type: QRType = businessQR.tokenAddress ? 'business-mockidrt' : 'business-native';
    
    return {
      type,
      recipientAddress: businessQR.recipientAddress,
      amount: businessQR.amount,
      amountFormatted: businessQR.amountFormatted,
      category: businessQR.category,
      tokenAddress: businessQR.tokenAddress,
      tokenSymbol: businessQR.tokenSymbol,
      businessName: businessQR.businessName,
      message: businessQR.message,
      raw: qrData,
      isValid: true
    };
  }
  
  /**
   * Parse Personal QR codes (Static + Dynamic)
   */
  private static parsePersonalQR(qrData: string): UniversalQRPayment | null {
    // 1. Check for ethereum: protocol (Dynamic Personal)
    if (qrData.startsWith('ethereum:') && !qrData.includes('/transfer') && !qrData.includes('type=business')) {
      return this.parsePersonalDynamic(qrData);
    }
    
    // 2. Check for plain address (Static Personal)
    if (isAddress(qrData)) {
      return this.parsePersonalStatic(qrData);
    }
    
    // 3. Check for DApp URL without business type
    if (qrData.includes('smartverse-id.vercel.app') && !qrData.includes('type=business')) {
      return this.parsePersonalDAppURL(qrData);
    }
    
    return null;
  }
  
  /**
   * Parse Personal Dynamic QR (ethereum: with value)
   */
  private static parsePersonalDynamic(qrData: string): UniversalQRPayment | null {
    try {
      // Format: ethereum:0xAddress?value=amountInWei&chainId=11155111
      const urlParts = qrData.split('?');
      const addressPart = urlParts[0].replace('ethereum:', '');
      
      if (!isAddress(addressPart)) return null;
      
      const params = new URLSearchParams(urlParts[1] || '');
      const valueWei = params.get('value');
      
      let amount: string | undefined;
      let amountFormatted: string | undefined;
      
      if (valueWei) {
        amount = valueWei;
        amountFormatted = `${parseFloat(formatUnits(BigInt(valueWei), 18)).toFixed(6)} ETH`;
      }
      
      return {
        type: 'personal-dynamic',
        recipientAddress: addressPart,
        amount,
        amountFormatted,
        raw: qrData,
        isValid: true
      };
      
    } catch (error) {
      console.warn('Error parsing personal dynamic QR:', error);
      return null;
    }
  }
  
  /**
   * Parse Personal Static QR (plain address)
   */
  private static parsePersonalStatic(qrData: string): UniversalQRPayment | null {
    if (!isAddress(qrData)) return null;
    
    return {
      type: 'personal-static',
      recipientAddress: qrData,
      raw: qrData,
      isValid: true
    };
  }
  
  /**
   * Parse Personal DApp URL
   */
  private static parsePersonalDAppURL(qrData: string): UniversalQRPayment | null {
    try {
      const url = new URL(qrData);
      const address = url.searchParams.get('address');
      const amount = url.searchParams.get('amount');
      
      if (!address || !isAddress(address)) return null;
      
      const type: QRType = amount ? 'personal-dynamic' : 'personal-static';
      
      let amountWei: string | undefined;
      let amountFormatted: string | undefined;
      
      if (amount) {
        amountWei = parseUnits(amount, 18).toString();
        amountFormatted = `${parseFloat(amount).toFixed(6)} ETH`;
      }
      
      return {
        type,
        recipientAddress: address,
        amount: amountWei,
        amountFormatted,
        raw: qrData,
        isValid: true
      };
      
    } catch (error) {
      console.warn('Error parsing personal DApp URL:', error);
      return null;
    }
  }
  
  /**
   * Get execution strategy based on QR type
   */
  static getExecutionStrategy(qr: UniversalQRPayment): {
    method: 'business-vault' | 'personal-transfer';
    requiresAmount: boolean;
    description: string;
  } {
    switch (qr.type) {
      case 'business-mockidrt':
        return {
          method: 'business-vault',
          requiresAmount: true,
          description: `Token payment to business vault (${qr.tokenSymbol || 'IDRT'})`
        };
        
      case 'business-native':
        return {
          method: 'business-vault',
          requiresAmount: true,
          description: 'Native ETH payment to business vault'
        };
        
      case 'personal-static':
        return {
          method: 'personal-transfer',
          requiresAmount: false,
          description: 'Personal transfer - user will input amount'
        };
        
      case 'personal-dynamic':
        return {
          method: 'personal-transfer',
          requiresAmount: true,
          description: `Personal transfer of ${qr.amountFormatted || 'specified amount'}`
        };
        
      default:
        return {
          method: 'personal-transfer',
          requiresAmount: false,
          description: 'Unknown QR type'
        };
    }
  }
  
  /**
   * Validate QR for execution
   */
  static validateForExecution(qr: UniversalQRPayment): { valid: boolean; error?: string } {
    if (!qr.isValid) return { valid: false, error: 'Invalid QR format' };
    
    if (!isAddress(qr.recipientAddress)) {
      return { valid: false, error: 'Invalid recipient address' };
    }
    
    const strategy = this.getExecutionStrategy(qr);
    
    if (strategy.requiresAmount && (!qr.amount || qr.amount === '0')) {
      return { valid: false, error: 'Amount is required for this QR type' };
    }
    
    // Business specific validations
    if (qr.type.startsWith('business')) {
      if (!qr.category) {
        return { valid: false, error: 'Category is required for business payments' };
      }
    }
    
    return { valid: true };
  }
}
