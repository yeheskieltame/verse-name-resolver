/**
 * Business QR Test Utility
 * Generate sample business QR codes for testing
 */

import { BusinessQRParser } from '@/utils/qrParser';

export const generateTestBusinessQRs = () => {
  const testAddress = '0x742e8e01A034e15344878B72fE411fCcDB3d7F99';
  
  const samples = [
    {
      name: 'Coffee Shop Payment',
      data: BusinessQRParser.generateBusinessQR({
        recipientAddress: testAddress,
        amount: '0.005',
        category: 'Coffee & Beverage',
        message: 'Order #12345 - Cappuccino Large',
        businessName: 'SmartCafe',
        format: 'url'
      })
    },
    {
      name: 'Restaurant Bill',
      data: BusinessQRParser.generateBusinessQR({
        recipientAddress: testAddress,
        amount: '0.025',
        category: 'Restaurant',
        message: 'Table 7 - Dinner for 2',
        businessName: 'The Digital Diner',
        format: 'url'
      })
    },
    {
      name: 'Retail Purchase',
      data: BusinessQRParser.generateBusinessQR({
        recipientAddress: testAddress,
        amount: '0.15',
        category: 'Retail',
        message: 'SKU: TS001 - T-Shirt Medium',
        businessName: 'CryptoClothes',
        format: 'json'
      })
    },
    {
      name: 'Service Payment',
      data: BusinessQRParser.generateBusinessQR({
        recipientAddress: testAddress,
        amount: '0.1',
        category: 'Professional Services',
        message: 'Web Design Consultation - 1 hour',
        businessName: 'DigitalCraft Studios',
        format: 'url'
      })
    },
    {
      name: 'Donation (No Amount)',
      data: BusinessQRParser.generateBusinessQR({
        recipientAddress: testAddress,
        category: 'Donation',
        message: 'Support our cause',
        businessName: 'Crypto Charity Foundation',
        format: 'url'
      })
    }
  ];
  
  return samples;
};

export const logTestQRs = () => {
  console.group('🧪 Business QR Test Samples');
  console.log('Copy these URLs or JSON data to test the QR scanner:');
  console.log('');
  
  const samples = generateTestBusinessQRs();
  
  samples.forEach((sample, index) => {
    console.log(`${index + 1}. ${sample.name}:`);
    console.log(sample.data);
    console.log('');
  });
  
  console.log('📱 To test: Copy any of the above data and use it as QR content');
  console.log('🔗 For URL format: Open in browser to see the payment page');
  console.log('📄 For JSON format: Use as-is in QR code generators');
  console.groupEnd();
};

// Auto-run in development
if (import.meta.env.DEV) {
  // Delay to let other logs finish first
  setTimeout(logTestQRs, 2000);
}
