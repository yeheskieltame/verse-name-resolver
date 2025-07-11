import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { QrCode, Smartphone, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Scanner as QrScanner } from '@yudiel/react-qr-scanner';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useChainId } from 'wagmi';
import { toast } from '@/hooks/use-toast';
import { formatEther, parseEther } from 'viem';
import { crossChainNameService } from '@/services/crossChainNameService';
import { 
  getContractAddress, 
  isSupportedChain, 
  getNetworkInfo, 
  BUSINESS_CONTRACTS,
  BusinessVault_ABI,
  MockIDRT_ABI
} from '@/contracts/BusinessContracts';

export const UnifiedQRScanner = () => {
  const { address: userAddress, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: userBalance } = useBalance({ address: userAddress });
  
  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scannedUrl, setScannedUrl] = useState<string>('');
  
  // Payment processing state
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [processingMessage, setProcessingMessage] = useState('');
  const [paymentDetails, setPaymentDetails] = useState<{
    type: 'personal' | 'business';
    recipient: string;
    amount?: string;
    category?: string;
    tokenAddress?: string;
    tokenSymbol?: string;
  } | null>(null);
  
  // Get account and chain information
  const { address, chain } = useAccount();
  const chainId = useChainId();
  
  // Wagmi hooks for transaction handling
  const { writeContractAsync, isPending: isContractWritePending, error: contractWriteError } = useWriteContract();
  
  // Transaction receipt tracking
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const { isLoading: isWaitingForTx, isSuccess: txSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  
  // Reset state when component unmounts
  useEffect(() => {
    return () => {
      setIsScanning(false);
      setScannedUrl('');
      setProcessingStatus('idle');
    };
  }, []);
  
  // Handle QR code detection
  const handleQRDetection = (result: string) => {
    setIsScanning(false);
    setScannedUrl(result);
    parseQRData(result);
  };
  
  // Monitor transaction status
  useEffect(() => {
    if (isContractWritePending || isWaitingForTx) {
      setProcessingStatus('loading');
      setProcessingMessage('Menunggu konfirmasi transaksi...');
    } else if (contractWriteError) {
      setProcessingStatus('error');
      setProcessingMessage(`Error: ${contractWriteError.message}`);
    } else if (txSuccess && txHash) {
      verifyTransaction(txHash).then(success => {
        if (success) {
          setProcessingStatus('success');
          setProcessingMessage('Pembayaran berhasil dikonfirmasi!');
          
          toast({
            title: '✅ Pembayaran Berhasil!',
            description: paymentDetails?.type === 'business' 
              ? `Pembayaran ${paymentDetails.amount || '0'} ${paymentDetails.tokenSymbol || (paymentDetails.tokenAddress ? 'IDRT' : getNativeCurrencySymbol())} ke vault bisnis untuk kategori "${paymentDetails.category}" telah dikonfirmasi.`
              : `Pembayaran ke ${paymentDetails?.recipient.slice(0, 8)}... telah dikonfirmasi.`,
          });
        } else {
          setProcessingStatus('error');
          setProcessingMessage('Transaksi terkirim tetapi tidak dapat diverifikasi');
        }
      });
    }
  }, [isContractWritePending, isWaitingForTx, contractWriteError, txSuccess, txHash, paymentDetails]);
  
  // Parse QR data to determine payment type and details
  const parseQRData = async (url: string) => {
    console.log('Parsing QR data:', url);
    setProcessingStatus('loading');
    setProcessingMessage('Menganalisis QR code...');
    
    try {
      // Extra direct check for IDRT in QR URL 
      if (url.includes('IDRT') || url.includes('idrt') || url.includes('token=0x')) {
        console.log('Detected potential IDRT token reference in QR code');
        
        // Try to extract amount directly from the QR string
        const amountMatch = url.match(/amount=(\d+\.?\d*)/i);
        const valueMatch = url.match(/value=(\d+\.?\d*)/i);
        const numberMatch = url.match(/(\d{5,})/); // Look for numbers with at least 5 digits (likely amounts)
        
        const extractedAmount = amountMatch?.[1] || valueMatch?.[1] || (numberMatch?.[1] && !url.includes(numberMatch[1] + '.')) ? numberMatch?.[1] : null;
        
        if (extractedAmount) {
          console.log('Extracted potential IDRT amount from QR:', extractedAmount);
          
          // Create a business payment with IDRT token if we can find a recipient address
          const addressMatch = url.match(/(?:address|recipient|to)=([0-9a-fx]+)/i);
          const recipient = addressMatch?.[1];
          
          if (recipient) {
            console.log('Found recipient address in QR:', recipient);
            
            // Try to get token address
            const tokenAddressMatch = url.match(/(?:token|contract)=([0-9a-fx]+)/i);
            const tokenAddress = tokenAddressMatch?.[1] || getNetworkToken();
            
            if (tokenAddress) {
              const categoryMatch = url.match(/(?:category|desc)=([^&# ]+)/i);
              const category = categoryMatch?.[1] ? decodeURIComponent(categoryMatch[1]) : 'Pembayaran IDRT QR';
              
              setPaymentDetails({
                type: 'business',
                recipient: recipient,
                amount: extractedAmount,
                category: category,
                tokenAddress: tokenAddress as string,
                tokenSymbol: 'IDRT'
              });
              
              setProcessingStatus('idle');
              setProcessingMessage(`Siap melakukan pembayaran IDRT ke Vault Bisnis`);
              return;
            }
          }
        }
      }
      
      // Check if this is a DApp URL for business payment
      if (url.includes('/pay?') && url.includes('address=')) {
        // Parse business payment URL
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);
        
        const recipientAddress = params.get('address');
        const amount = params.get('amount');
        const category = params.get('category');
        const tokenAddress = params.get('token');
        const tokenSymbol = params.get('tokenSymbol') || (tokenAddress ? 'IDRT' : undefined);
        const tokenAmount = params.get('tokenAmount'); // Get token amount specifically
        
        // If scanner detects IDRT format but no tokenAmount
        // Try to extract amount from URL fragment if it's in a special format
        let extractedTokenAmount = tokenAmount;
        
        if (tokenAddress && !extractedTokenAmount) {
          // Look for patterns like #amount=100000 in the URL
          if (urlObj.hash && urlObj.hash.includes('amount=')) {
            const hashParams = new URLSearchParams(urlObj.hash.substring(1));
            extractedTokenAmount = hashParams.get('amount');
            console.log('Extracted amount from URL hash:', extractedTokenAmount);
          }
          
          // Check if there's a specific format in the path that might contain the amount
          const pathParts = urlObj.pathname.split('/');
          for (const part of pathParts) {
            if (part.includes('idrt') && part.match(/\d+/)) {
              // Extract numbers from path containing 'idrt'
              const match = part.match(/(\d+)/);
              if (match && match[1]) {
                extractedTokenAmount = match[1];
                console.log('Extracted amount from path:', extractedTokenAmount);
                break;
              }
            }
          }
        }
        
        if (!recipientAddress) {
          throw new Error('QR code tidak berisi alamat penerima yang valid');
        }
        
        // If token address exists, prioritize tokenAmount
        const finalAmount = tokenAddress ? (extractedTokenAmount || tokenAmount || amount) : amount;
        
        // Parse any data from the URL path - sometimes QR codes have embedded data
        if (tokenAddress && !finalAmount && urlObj.pathname) {
          // Additional fallback - try to find numbers in the URL path
          const pathMatch = urlObj.pathname.match(/(\d+)/);
          if (pathMatch && pathMatch[1]) {
            console.log('Found potential amount in path:', pathMatch[1]);
            setPaymentDetails({
              type: 'business',
              recipient: recipientAddress,
              amount: pathMatch[1],
              category: category || 'Pembayaran QR',
              tokenAddress: tokenAddress,
              tokenSymbol: tokenSymbol
            });
            
            setProcessingStatus('idle');
            setProcessingMessage(`Siap melakukan pembayaran token ke Vault Bisnis`);
            return;
          }
        }
        
        setPaymentDetails({
          type: 'business',
          recipient: recipientAddress,
          amount: finalAmount || undefined,
          category: category || 'Pembayaran QR',
          tokenAddress: tokenAddress || undefined,
          tokenSymbol: tokenSymbol
        });
        
        console.log('Final QR Code Data:', {
          recipientAddress,
          amount: finalAmount,
          category,
          tokenAddress,
          tokenSymbol,
          originalTokenAmount: tokenAmount,
          extractedTokenAmount,
          url
        });
        
        setProcessingStatus('idle');
        if (tokenAddress) {
          setProcessingMessage(`Siap melakukan pembayaran token ${tokenSymbol || 'IDRT'} ke Vault Bisnis`);
        } else {
          setProcessingMessage(`Siap melakukan pembayaran ${getNativeCurrencySymbol()} ke Vault Bisnis`);
        }
      } else if (url.startsWith('ethereum:')) {
        // Parse as Ethereum URI (EIP-681) for personal payment
        const addressPart = url.replace('ethereum:', '').split('?')[0];
        const params = new URLSearchParams(url.split('?')[1] || '');
        
        const recipient = addressPart;
        const amount = params.get('value') 
          ? formatEther(BigInt(params.get('value') || '0'))
          : undefined;
        
        // Check if recipient is a name
        if (recipient.endsWith('.sw')) {
          const resolvedAddress = await crossChainNameService.resolveNameToAddress(recipient);
          
          if (resolvedAddress) {
            setPaymentDetails({
              type: 'personal',
              recipient: resolvedAddress,
              amount: amount
            });
            
            setProcessingStatus('idle');
            setProcessingMessage(`Siap melakukan pembayaran ke ${recipient}`);
          } else {
            throw new Error(`Nama ${recipient} tidak dapat diresolve`);
          }
        } else {
          // Direct address
          setPaymentDetails({
            type: 'personal',
            recipient,
            amount
          });
          
          setProcessingStatus('idle');
          setProcessingMessage(`Siap melakukan pembayaran ke ${recipient.slice(0, 8)}...`);
        }
      } else if (url.startsWith('0x')) {
        // Direct address (no scheme)
        setPaymentDetails({
          type: 'personal',
          recipient: url,
        });
        
        setProcessingStatus('idle');
        setProcessingMessage(`Siap melakukan pembayaran ke ${url.slice(0, 8)}...`);
      } else {
        throw new Error('Format QR code tidak valid. Pastikan QR code berisi alamat Ethereum atau URL pembayaran.');
      }
    } catch (error) {
      console.error('Error parsing QR data:', error);
      setProcessingStatus('error');
      setProcessingMessage(error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses QR code');
    }
  };
  
  // Process payment based on type (personal or business)
  const processPayment = async () => {
    if (!paymentDetails || !isConnected) return;
    
    try {
      if (paymentDetails.type === 'personal') {
        await processPersonalPayment();
      } else {
        await processBusinessPayment();
      }
    } catch (error) {
      console.error('Payment error:', error);
      setProcessingStatus('error');
      setProcessingMessage(error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses pembayaran');
    }
  };
  
  const processPersonalPayment = async () => {
    if (!paymentDetails || !isConnected) return;
    
    const amount = paymentDetails.amount ? parseEther(paymentDetails.amount) : 0n;
    
    // Validate amount
    if (amount <= 0n) {
      throw new Error('Jumlah pembayaran harus lebih dari 0');
    }
    
    // Check balance
    if (userBalance && amount > userBalance.value) {
      throw new Error('Saldo tidak mencukupi untuk transaksi ini');
    }
    
    try {
      // Use wagmi to send the transaction
      const hash = await writeContractAsync({
        abi: [
          {
            name: 'transfer',
            type: 'function',
            stateMutability: 'payable',
            inputs: [],
            outputs: [],
          },
        ],
        address: paymentDetails.recipient as `0x${string}`,
        functionName: 'transfer',
        value: amount,
        account: address,
        chain: chain
      });
      
      setTxHash(hash);
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
    }
  };
  
  const processBusinessPayment = async () => {
    if (!paymentDetails || !isConnected) return;
    
    try {
      const vaultAddress = paymentDetails.recipient as `0x${string}`;
      const category = paymentDetails.category || 'Pembayaran QR';
      
      // Parse amount string with validation
      let amount: bigint;
      if (paymentDetails.amount) {
        try {
          // Clean up the amount string (remove any non-numeric/decimal characters)
          const cleanAmount = paymentDetails.amount.replace(/[^\d.]/g, '');
          amount = parseEther(cleanAmount);
          console.log(`Amount parsed: ${cleanAmount} -> ${amount.toString()}`);
        } catch (error) {
          console.error('Error parsing amount:', error);
          throw new Error(`Gagal memproses jumlah pembayaran: ${paymentDetails.amount}`);
        }
      } else {
        amount = 0n;
      }
      
      // Validate amount
      if (amount <= 0n) {
        throw new Error('Jumlah pembayaran harus lebih dari 0');
      }
      
      // Check balance
      if (userBalance && amount > userBalance.value) {
        throw new Error('Saldo tidak mencukupi untuk transaksi ini');
      }
      
      // Check if this is a token payment (IDRT) or a native (ETH) payment
      if (paymentDetails.tokenAddress) {
        // Token payment (IDRT)
        let tokenAddress = paymentDetails.tokenAddress as `0x${string}`;
        
        // Auto-detect token address based on current network
        const networkTokenAddress = getNetworkToken();
        if (networkTokenAddress) {
          // Use network-specific token address instead of the one from the QR code
          tokenAddress = networkTokenAddress;
          console.log('Using network-specific token address:', tokenAddress);
        } else {
          console.warn('Current network does not have a MockIDRT contract, using address from QR code');
        }
        
        // Check if we're on a supported chain
        if (!isSupportedChain(chainId)) {
          throw new Error(`Jaringan ${chain?.name || chainId} tidak didukung untuk transaksi bisnis. Silakan beralih ke Sepolia atau jaringan lain yang didukung.`);
        }
        
        console.log('Processing token payment (IDRT):', {
          network: currentNetwork?.name || chainId.toString(),
          chainId,
          vaultAddress,
          tokenAddress,
          category,
          amount: amount.toString()
        });
        
        // First approve the vault to spend tokens
        setProcessingStatus('loading');
        setProcessingMessage('Meminta izin penggunaan token IDRT...');
        
        const approvalSuccess = await approveToken(tokenAddress, vaultAddress, amount);
        
        if (!approvalSuccess) {
          throw new Error('Gagal mendapatkan approval untuk token IDRT');
        }
        
        // Then call depositToken on the vault contract
        setProcessingStatus('loading');
        setProcessingMessage('Mengirim token ke vault bisnis...');
        
        console.log('Calling depositToken with:', {
          vaultAddress,
          tokenAddress,
          amount: amount.toString(),
          category
        });
        
        const hash = await writeContractAsync({
          address: vaultAddress,
          abi: BUSINESS_ABI.BusinessVault,
          functionName: 'depositToken',
          args: [tokenAddress, amount, category],
          account: address,
          chain: chain
        });
        
        setTxHash(hash);
      } else {
        // Native payment (ETH)
        // Check if we're on a supported chain
        if (!isSupportedChain(chainId)) {
          throw new Error(`Jaringan ${chain?.name || chainId} tidak didukung untuk transaksi bisnis. Silakan beralih ke Sepolia atau jaringan lain yang didukung.`);
        }
        
        console.log('Processing native payment (ETH):', {
          network: currentNetwork?.name || chainId.toString(),
          chainId,
          currency: getNativeCurrencySymbol(),
          vaultAddress,
          category,
          amount: amount.toString()
        });
        
        // Call depositNative on the vault contract
        const hash = await writeContractAsync({
          address: vaultAddress,
          abi: BUSINESS_ABI.BusinessVault,
          functionName: 'depositNative',
          args: [category],
          value: amount,
          account: address,
          chain: chain
        });
        
        setTxHash(hash);
      }
    } catch (error) {
      console.error('Business transaction error:', error);
      throw error;
    }
  };
  
  // Approve token sebelum melakukan depositToken
  const approveToken = async (tokenAddress: `0x${string}`, spender: `0x${string}`, amount: bigint): Promise<boolean> => {
    try {
      console.log('🔄 Approving token transfer...');
      console.log('Token:', tokenAddress);
      console.log('Spender (BusinessVault):', spender);
      console.log('Amount:', formatEther(amount), '(', amount.toString(), 'wei)');
      
      // Approve token spending
      const hash = await writeContractAsync({
        address: tokenAddress,
        abi: BUSINESS_ABI.MockIDRT,
        functionName: 'approve',
        args: [spender, amount],
        account: address,
        chain: chain
      });
      
      // Wait for approval transaction to complete
      setProcessingStatus('loading');
      setProcessingMessage('Menunggu konfirmasi approval token...');
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'success') {
        console.log('✅ Token approval successful:', hash);
        return true;
      } else {
        console.error('❌ Token approval failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Error approving token:', error);
      return false;
    }
  };

  const verifyTransaction = async (hash: `0x${string}`) => {
    try {
      if (!paymentDetails) return false;
      
      // Get transaction receipt
      const receipt = await publicClient.getTransactionReceipt({ hash });
      
      if (paymentDetails.type === 'business') {
        // For business payments, look for TransactionRecorded event
        const transactionRecordedEvents = receipt.logs.filter(log => {
          // Check if the log is from the vault contract
          return log.address.toLowerCase() === paymentDetails.recipient.toLowerCase();
        });
        
        return transactionRecordedEvents.length > 0;
      } else {
        // For personal payments, just check if the transaction succeeded
        return receipt.status === 'success';
      }
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return false;
    }
  };
  
  // Reset the scanner and state
  const resetScanner = () => {
    setScannedUrl('');
    setPaymentDetails(null);
    setProcessingStatus('idle');
    setProcessingMessage('');
    setIsScanning(false);
    setTxHash(undefined);
  };
  
  // UI for payment confirmation
  const renderPaymentConfirmation = () => {
    if (!paymentDetails) return null;
    
    // Update payment details to show native currency symbol
    const { type, recipient, amount, category, tokenAddress, tokenSymbol } = paymentDetails;
    
    // Display currency based on chain connection
    const displayAmount = amount 
      ? `${formatAmountForDisplay(amount, !!tokenAddress)} ${tokenSymbol || (tokenAddress ? 'IDRT' : getNativeCurrencySymbol())}` 
      : '';
    
    const networkNotice = !isSupportedChain(chainId) 
      ? `⚠️ Jaringan ${chain?.name || chainId} tidak didukung. Harap beralih ke jaringan yang didukung.` 
      : '';
    
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Detail Pembayaran</h3>
          
          {networkNotice && (
            <Alert className="bg-orange-50 border-orange-200">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-600">
                {networkNotice}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm text-gray-500">Jenis:</div>
            <div className="text-sm font-medium">
              {type === 'personal' ? 'Pembayaran Personal' : 'Pembayaran ke Bisnis'}
            </div>
            
            <div className="text-sm text-gray-500">Penerima:</div>
            <div className="text-sm font-mono break-all">
              {recipient.slice(0, 6)}...{recipient.slice(-4)}
            </div>
            
            {amount && (
              <>
                <div className="text-sm text-gray-500">Jumlah:</div>
                <div className="text-sm font-bold text-green-600">
                  {displayAmount}
                </div>
              </>
            )}
            
            {tokenAddress && (
              <>
                <div className="text-sm text-gray-500">Token:</div>
                <div className="text-sm font-mono break-all">
                  {tokenAddress.slice(0, 6)}...{tokenAddress.slice(-4)}
                </div>
              </>
            )}
            
            {type === 'business' && category && (
              <>
                <div className="text-sm text-gray-500">Kategori:</div>
                <div className="text-sm font-medium">
                  {category}
                </div>
              </>
            )}
            
            <div className="text-sm text-gray-500">Jaringan:</div>
            <div className="text-sm font-medium">
              {currentNetwork?.name || `Chain ID: ${chainId}`}
            </div>
          </div>
          
          {type === 'business' && (
            <Alert className="mt-2 bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-600">
                {tokenAddress ? (
                  <>
                    Pembayaran akan menggunakan token {tokenSymbol || 'IDRT'} melalui fungsi <code className="font-mono">depositToken</code> ke dalam vault bisnis dengan kategori "{category}".
                  </>
                ) : (
                  <>
                    Pembayaran akan menggunakan fungsi <code className="font-mono">depositNative</code> ke dalam vault bisnis dengan kategori "{category}".
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          <Button 
            onClick={processPayment}
            disabled={isContractWritePending || isWaitingForTx || processingStatus === 'success' || (!isSupportedChain(chainId) && type === 'business')}
            className="w-full"
          >
            {isContractWritePending || isWaitingForTx ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : processingStatus === 'success' ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Pembayaran Berhasil
              </>
            ) : (!isSupportedChain(chainId) && type === 'business') ? (
              'Jaringan Tidak Didukung'
            ) : (
              'Konfirmasi Pembayaran'
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={resetScanner}
            disabled={isContractWritePending || isWaitingForTx}
          >
            Scan QR Code Lain
          </Button>
        </div>
      </div>
    );
  };  // Network detection and contract address helper
  const currentNetwork = getNetworkInfo(chainId);
  const isHubChain = currentNetwork?.isHub || false;
  
  // Get network-specific contract addresses
  const getNetworkToken = (): `0x${string}` | undefined => {
    if (!currentNetwork) return undefined;
    return getContractAddress(chainId, 'MockIDRT') as `0x${string}` | undefined;
  };
  
  // Display currency based on current network
  const getNativeCurrencySymbol = (): string => {
    if (!currentNetwork) return 'ETH';
    // Different networks may have different native currencies
    if (chainId === 11155111) return 'ETH'; // Sepolia
    if (chainId === 13000) return 'TARA'; // Taranium
    if (chainId === 17000) return 'ETH'; // Holesky
    if (chainId === 1115) return 'CORE'; // Core DAO
    if (chainId === 80002) return 'MATIC'; // Polygon Amoy
    return 'ETH'; // Default
  };
  
  // Create a helper function to format amounts
  const formatAmountForDisplay = (amount: string | undefined, isToken: boolean): string => {
    if (!amount) return '0';
    
    // For IDRT or other tokens, we might need to handle different decimal formats
    try {
      // Remove any non-numeric characters except decimal point
      const cleanAmount = amount.replace(/[^\d.]/g, '');
      
      // For display purposes, we can format it with commas for thousands
      const num = parseFloat(cleanAmount);
      return num.toLocaleString('id-ID', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: isToken ? 2 : 6  // IDRT typically has 2 decimals, ETH has 18
      });
    } catch (e) {
      console.error('Error formatting amount:', e);
      return amount; // Return original if parsing fails
    }
  };
  
  // Get the business ABI for interactions
  const BUSINESS_ABI = {
    BusinessVault: BusinessVault_ABI,
    MockIDRT: MockIDRT_ABI,
  };
  
  // UI based on scanning state
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          Scan QR Pembayaran
        </CardTitle>
        <CardDescription>
          Pindai QR code untuk melakukan pembayaran personal atau bisnis
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isConnected ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Silahkan hubungkan wallet Anda terlebih dahulu
            </AlertDescription>
          </Alert>
        ) : !isScanning && !scannedUrl ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex justify-center items-center w-64 h-64 bg-gray-100 rounded-lg">
              <Smartphone className="w-16 h-16 text-gray-400" />
            </div>
            <Button onClick={() => setIsScanning(true)}>
              Mulai Scan QR
            </Button>
          </div>
        ) : isScanning ? (
          <div className="relative">
            <div className="aspect-square overflow-hidden rounded-lg">
              <QrScanner
                onScan={(result) => {
                  if (result && result.length > 0) {
                    handleQRDetection(result[0].rawValue);
                  }
                }}
                onError={(error) => {
                  console.error(error);
                  toast({
                    title: "Error",
                    description: "Tidak dapat mengakses kamera: " + (error instanceof Error ? error.message : 'Unknown error'),
                    variant: "destructive",
                  });
                  setIsScanning(false);
                }}
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4" 
              onClick={() => setIsScanning(false)}
            >
              Batalkan Scan
            </Button>
          </div>
        ) : processingStatus === 'loading' ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-center">{processingMessage}</p>
          </div>
        ) : processingStatus === 'error' ? (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-600">
              {processingMessage}
            </AlertDescription>
          </Alert>
        ) : processingStatus === 'success' ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle className="w-12 h-12 text-green-600" />
            <p className="text-center font-medium text-green-600">{processingMessage}</p>
            <Button 
              variant="outline" 
              onClick={resetScanner}
            >
              Scan QR Code Lain
            </Button>
          </div>
        ) : (
          renderPaymentConfirmation()
        )}
      </CardContent>
    </Card>
  );
};
