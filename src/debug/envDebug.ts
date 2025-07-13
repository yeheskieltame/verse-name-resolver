// Environment Debug Utility
// Digunakan untuk debug environment variables dan konfigurasi

export const debugEnvironment = () => {
  const env = {
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
    prod: import.meta.env.PROD,
    walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
    alchemySepoliaKey: import.meta.env.VITE_ALCHEMY_SEPOLIA_KEY,
  };

  console.group('🔧 Environment Debug');
  console.log('Mode:', env.mode);
  console.log('Development:', env.dev);
  console.log('Production:', env.prod);
  console.log('WalletConnect Project ID:', env.walletConnectProjectId ? '✅ Set' : '❌ Missing');
  console.log('Alchemy Sepolia Key:', env.alchemySepoliaKey ? '✅ Set' : '❌ Missing');
  
  // Validate keys
  const issues = [];
  
  if (!env.walletConnectProjectId) {
    issues.push('❌ VITE_WALLETCONNECT_PROJECT_ID is missing');
  } else if (env.walletConnectProjectId === 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6') {
    issues.push('⚠️  WalletConnect Project ID is using placeholder value');
  }
  
  if (!env.alchemySepoliaKey) {
    issues.push('❌ VITE_ALCHEMY_SEPOLIA_KEY is missing');
  } else if (env.alchemySepoliaKey.startsWith('-') && env.alchemySepoliaKey.length < 30) {
    issues.push('⚠️  Alchemy API key format looks suspicious (starts with -)');
  }
  
  if (issues.length > 0) {
    console.group('🚨 Issues Found:');
    issues.forEach(issue => console.warn(issue));
    console.groupEnd();
    
    console.group('🔧 How to Fix:');
    console.log('1. Make sure .env.local is in the project root (not in src/)');
    console.log('2. Restart the development server after making changes');
    console.log('3. Check your WalletConnect Cloud dashboard for the correct Project ID');
    console.log('4. Check your Alchemy dashboard for the correct API key');
    console.groupEnd();
  } else {
    console.log('✅ All environment variables look good!');
  }
  
  console.groupEnd();
  
  return {
    env,
    issues,
    isValid: issues.length === 0
  };
};

// Auto-run in development
if (import.meta.env.DEV) {
  debugEnvironment();
}
