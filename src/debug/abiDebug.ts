// Debug test untuk memastikan tidak ada fungsi getTotalIncome
import { SmartVerseBusinessService } from '../services/smartVerseBusiness';
import { BusinessVault_ABI } from '../contracts/BusinessContracts';

// Tampilkan semua fungsi yang ada di ABI
const abieFunctions = BusinessVault_ABI.filter(item => item.type === 'function').map(item => item.name);

console.log('======= ABI DEBUG =======');
console.log('🔍 All functions in BusinessVault_ABI:', abieFunctions);

// Periksa apakah fungsi yang kita pakai ada
const requiredFunctions = [
  'totalNativeIncome',
  'totalNativeExpense',
  'totalTokenIncome',
  'totalTokenExpense',
  'getTransactionLogCount'
];

console.log('🔍 Required functions check:');
requiredFunctions.forEach(func => {
  const exists = abieFunctions.includes(func);
  console.log(`  ✅ ${func}: ${exists ? 'FOUND' : 'NOT FOUND'}`);
});

// Periksa fungsi yang tidak boleh ada
const forbiddenFunctions = ['getTotalIncome', 'getTotalExpense'];
console.log('🔍 Forbidden functions check:');
forbiddenFunctions.forEach(func => {
  const exists = abieFunctions.includes(func);
  console.log(`  ${exists ? '❌' : '✅'} ${func}: ${exists ? 'FOUND (BAD)' : 'NOT FOUND (GOOD)'}`);
});

// Test service instance
try {
  const service = new SmartVerseBusinessService();
  console.log('✅ SmartVerseBusinessService instance created successfully');
} catch (error) {
  console.error('❌ Error creating SmartVerseBusinessService:', error);
}

console.log('======= END DEBUG =======');
