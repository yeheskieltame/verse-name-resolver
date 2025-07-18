/**
 * QR Test Generator for SmartVerse
 * Generate test QR codes for all 4 types to validate Universal QR Scanner
 */

import { parseUnits } from 'viem';

export class QRTestGenerator {
  
  static generateTestQRs() {
    const testRecipient = '0x742d35Cc6634C0532925a3b8D2431Fb7a8E2d89d';
    const testBusinessVault = '0x1234567890123456789012345678901234567890';
    const testMockIDRT = '0x0987654321098765432109876543210987654321';
    
    return {
      
      // 1. Business Token QR (MockIDRT)
      businessToken: `ethereum:${testMockIDRT}/transfer?address=${testBusinessVault}&uint256=${parseUnits('100', 18).toString()}&data=${encodeURIComponent(JSON.stringify({
        type: 'business',
        category: 'Food',
        businessName: 'Warung Nasi Padang',
        tokenSymbol: 'IDRT'
      }))}`,
      
      // 2. Business Native ETH QR
      businessNative: `ethereum:${testBusinessVault}?value=${parseUnits('0.01', 18).toString()}&data=${encodeURIComponent(JSON.stringify({
        type: 'business',
        category: 'Services',
        businessName: 'Digital Printing Shop'
      }))}`,
      
      // 3. Personal Static QR (plain address)
      personalStatic: testRecipient,
      
      // 4. Personal Dynamic QR (with amount)
      personalDynamic: `ethereum:${testRecipient}?value=${parseUnits('0.005', 18).toString()}&chainId=11155111`,
      
      // 5. Business DApp URL Format
      businessDAppURL: `https://smartverse-id.vercel.app/pay?type=business&address=${testBusinessVault}&amount=0.01&category=Food&business=Warung%20Mie%20Ayam`,
      
      // 6. Personal DApp URL Format  
      personalDAppURL: `https://smartverse-id.vercel.app/pay?address=${testRecipient}&amount=0.005`,
      
      // 7. Business JSON Format
      businessJSON: JSON.stringify({
        type: 'business',
        recipientAddress: testBusinessVault,
        amount: parseUnits('0.02', 18).toString(),
        category: 'Retail',
        businessName: 'Toko Kelontong Berkah',
        tokenAddress: null,
        message: 'Payment for groceries'
      })
    };
  }
  
  static printTestQRs() {
    const qrs = this.generateTestQRs();
    
    console.log('\n=== SMARTVERSE QR TEST CODES ===\n');
    
    console.log('1. BUSINESS TOKEN QR (MockIDRT 100 tokens):');
    console.log(qrs.businessToken);
    console.log('\n');
    
    console.log('2. BUSINESS NATIVE ETH QR (0.01 ETH):');
    console.log(qrs.businessNative);
    console.log('\n');
    
    console.log('3. PERSONAL STATIC QR (address only):');
    console.log(qrs.personalStatic);
    console.log('\n');
    
    console.log('4. PERSONAL DYNAMIC QR (0.005 ETH):');
    console.log(qrs.personalDynamic);
    console.log('\n');
    
    console.log('5. BUSINESS DAPP URL:');
    console.log(qrs.businessDAppURL);
    console.log('\n');
    
    console.log('6. PERSONAL DAPP URL:');
    console.log(qrs.personalDAppURL);
    console.log('\n');
    
    console.log('7. BUSINESS JSON FORMAT:');
    console.log(qrs.businessJSON);
    console.log('\n');
    
    console.log('=== READY FOR TESTING ===');
    console.log('Copy any of the above codes and paste into Universal QR Scanner for testing');
    
    return qrs;
  }
  
  static getQRDescription(qrCode: string) {
    const qrs = this.generateTestQRs();
    
    if (qrCode === qrs.businessToken) return 'Business Token Payment (MockIDRT)';
    if (qrCode === qrs.businessNative) return 'Business Native ETH Payment';
    if (qrCode === qrs.personalStatic) return 'Personal Static Transfer (Address Only)';
    if (qrCode === qrs.personalDynamic) return 'Personal Dynamic Request (With Amount)';
    if (qrCode === qrs.businessDAppURL) return 'Business DApp URL Format';
    if (qrCode === qrs.personalDAppURL) return 'Personal DApp URL Format';
    if (qrCode === qrs.businessJSON) return 'Business JSON Format';
    
    return 'Unknown QR Code';
  }
}

// Auto-run when imported in development
if (typeof window !== 'undefined') {
  console.log('🧪 QR Test Generator loaded - call QRTestGenerator.printTestQRs() to see test codes');
}
