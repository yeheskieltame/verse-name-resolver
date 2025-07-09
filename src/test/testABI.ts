// Test ABI functions directly
import { BusinessVault_ABI } from '../contracts/BusinessContracts';

// Test to verify ABI functions exist
console.log('🔍 Testing ABI functions...');

const functionsInABI = BusinessVault_ABI.map((item) => {
  if (item.type === 'function') {
    return item.name;
  }
  return null;
}).filter(Boolean);

console.log('✅ Available functions in BusinessVault_ABI:', functionsInABI);

// Check specific functions we're using
const requiredFunctions = [
  'totalNativeIncome',
  'totalNativeExpense', 
  'totalTokenIncome',
  'totalTokenExpense',
  'getTransactionLogCount'
];

console.log('🔍 Checking required functions:');
requiredFunctions.forEach(func => {
  const exists = functionsInABI.includes(func as any);
  console.log(`  ${func}: ${exists ? '✅' : '❌'}`);
});

// Also check if old function exists (should not)
const oldFunction = 'getTotalIncome';
const oldExists = functionsInABI.includes(oldFunction as any);
console.log(`🔍 Old function ${oldFunction}: ${oldExists ? '❌ STILL EXISTS' : '✅ NOT FOUND (correct)'}`);
