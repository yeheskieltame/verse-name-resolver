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
import { BUSINESS_ABI } from '@/contracts/BusinessContracts';

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
              ? `Pembayaran ke vault bisnis untuk kategori "${paymentDetails.category}" telah dikonfirmasi.`
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
      // Check if this is a DApp URL for business payment
      if (url.includes('/pay?') && url.includes('address=')) {
        // Parse business payment URL
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);
        
        const recipientAddress = params.get('address');
        const amount = params.get('amount');
        const category = params.get('category');
        const tokenAddress = params.get('token');
        
        if (!recipientAddress) {
          throw new Error('QR code tidak berisi alamat penerima yang valid');
        }
        
        setPaymentDetails({
          type: 'business',
          recipient: recipientAddress,
          amount: amount || undefined,
          category: category || 'Pembayaran QR',
          tokenAddress: tokenAddress || undefined
        });
        
        setProcessingStatus('idle');
        setProcessingMessage(`Siap melakukan pembayaran ke Vault Bisnis`);
        
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
    
    // For business payments, we use the depositNative function
    try {
      const vaultAddress = paymentDetails.recipient as `0x${string}`;
      const category = paymentDetails.category || 'Pembayaran QR';
      const amount = paymentDetails.amount ? parseEther(paymentDetails.amount) : 0n;
      
      // Validate amount
      if (amount <= 0n) {
        throw new Error('Jumlah pembayaran harus lebih dari 0');
      }
      
      // Check balance
      if (userBalance && amount > userBalance.value) {
        throw new Error('Saldo tidak mencukupi untuk transaksi ini');
      }
      
      console.log('Calling depositNative with:', {
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
    } catch (error) {
      console.error('Business transaction error:', error);
      throw error;
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
    
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Detail Pembayaran</h3>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm text-gray-500">Jenis:</div>
            <div className="text-sm font-medium">
              {paymentDetails.type === 'personal' ? 'Pembayaran Personal' : 'Pembayaran ke Bisnis'}
            </div>
            
            <div className="text-sm text-gray-500">Penerima:</div>
            <div className="text-sm font-mono break-all">
              {paymentDetails.recipient.slice(0, 6)}...{paymentDetails.recipient.slice(-4)}
            </div>
            
            {paymentDetails.amount && (
              <>
                <div className="text-sm text-gray-500">Jumlah:</div>
                <div className="text-sm font-bold text-green-600">
                  {paymentDetails.amount} ETH
                </div>
              </>
            )}
            
            {paymentDetails.type === 'business' && paymentDetails.category && (
              <>
                <div className="text-sm text-gray-500">Kategori:</div>
                <div className="text-sm font-medium">
                  {paymentDetails.category}
                </div>
              </>
            )}
          </div>
          
          {paymentDetails.type === 'business' && (
            <Alert className="mt-2 bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-600">
                Pembayaran akan menggunakan fungsi <code className="font-mono">depositNative</code> ke dalam vault bisnis dengan kategori "{paymentDetails.category}".
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          <Button 
            onClick={processPayment}
            disabled={isContractWritePending || isWaitingForTx || processingStatus === 'success'}
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
