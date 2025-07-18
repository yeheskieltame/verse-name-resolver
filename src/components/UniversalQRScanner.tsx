import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Camera, CameraOff, Scan, AlertCircle, CheckCircle, Send, X, Building2, User } from 'lucide-react';
import QrScanner from 'qr-scanner';
import { useAccount, useChainId, useWriteContract, useSendTransaction } from 'wagmi';
import { parseEther, isAddress, type Address, type Abi } from 'viem';
import { UniversalQRParser, type UniversalQRPayment } from "@/utils/UniversalQRParser";
import { BusinessVault_ABI, MockIDRT_ABI } from '@/contracts/BusinessContracts';

// Contract addresses
const BUSINESS_VAULT_ADDRESS = '0x1234567890123456789012345678901234567890';
const MOCKIDRT_ADDRESS = '0x0987654321098765432109876543210987654321';

export const UniversalQRScanner = () => {
  const { address: userAddress, isConnected, chain } = useAccount();
  const chainId = useChainId();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const [qrPayment, setQrPayment] = useState<UniversalQRPayment | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<string>('');

  const { writeContractAsync, isPending: isContractPending } = useWriteContract();
  const { sendTransactionAsync, isPending: isSendingTx } = useSendTransaction();

  // Initialize QR Scanner
  useEffect(() => {
    return () => {
      if (qrScanner) {
        qrScanner.destroy();
      }
    };
  }, [qrScanner]);

  const startScanning = async () => {
    setIsStartingCamera(true);
    setError('');
    
    try {
      // Wait for video element to be available with retry mechanism
      let retries = 0;
      const maxRetries = 10;
      
      while (!videoRef.current && retries < maxRetries) {
        console.log(`📱 Waiting for video element... retry ${retries + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      
      if (!videoRef.current) {
        throw new Error('Video element not available after waiting');
      }

      console.log('📱 Video element ready, requesting camera permission...');

      // Request camera permission with fallback options
      let stream;
      try {
        // First try with back camera (preferred for QR scanning)
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
      } catch (error) {
        console.log('📱 Back camera not available, trying front camera...');
        // Fallback to front camera
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
      }

      console.log('📱 Camera permission granted, initializing QR scanner...');

      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('📱 QR Code scanned:', result.data);
          handleQRResult(result.data);
          stopScanning();
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment',
          maxScansPerSecond: 5,
        }
      );

      await scanner.start();
      setQrScanner(scanner);
      setIsScanning(true);
      setIsStartingCamera(false);

      console.log('✅ QR Scanner started successfully');

      toast({
        title: "📷 Camera Started",
        description: "Point your camera at any SmartVerse QR code",
      });

    } catch (error) {
      console.error('❌ Error starting camera:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start camera';
      setError(`Camera error: ${errorMessage}`);
      setIsStartingCamera(false);
      
      toast({
        title: "Camera Error",
        description: "Failed to access camera. Please check permissions and try again.",
        variant: "destructive",
      });
    }
  };

  const stopScanning = () => {
    if (qrScanner) {
      qrScanner.stop();
      qrScanner.destroy();
      setQrScanner(null);
    }
    setIsScanning(false);
    setIsStartingCamera(false);

    toast({
      title: "📷 Camera Stopped",
      description: "QR scanning has been stopped",
    });
  };

  const handleQRResult = (data: string) => {
    setScannedData(data);
    
    // Use Universal QR Parser for all types
    const parsed = UniversalQRParser.parseQR(data);
    
    if (parsed && parsed.isValid) {
      setQrPayment(parsed);
      
      const strategy = UniversalQRParser.getExecutionStrategy(parsed);
      
      toast({
        title: `🎯 ${parsed.type.replace('-', ' ').toUpperCase()} QR Detected!`,
        description: strategy.description,
      });
      
    } else {
      toast({
        title: "Unknown QR Format",
        description: "This QR code is not recognized as a SmartVerse payment QR.",
        variant: "destructive",
      });
    }
  };

  const executePayment = async () => {
    if (!qrPayment || !isConnected) return;

    setIsProcessing(true);
    
    try {
      // Validate QR for execution
      const validation = UniversalQRParser.validateForExecution(qrPayment);
      if (!validation.valid) {
        toast({
          title: "Invalid QR",
          description: validation.error,
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      const strategy = UniversalQRParser.getExecutionStrategy(qrPayment);
      
      console.log('🔄 Executing payment:', {
        type: qrPayment.type,
        strategy: strategy.method,
        recipientAddress: qrPayment.recipientAddress,
        amount: qrPayment.amount,
        tokenAddress: qrPayment.tokenAddress
      });

      if (strategy.method === 'business-vault') {
        await executeBusinessPayment(qrPayment);
      } else {
        await executePersonalPayment(qrPayment);
      }

      // Clear data after success
      setQrPayment(null);
      setScannedData('');
      setCustomAmount('');

    } catch (error) {
      console.error('❌ Payment execution failed:', error);
      toast({
        title: "Payment Failed",
        description: `Transaction failed: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const executeBusinessPayment = async (payment: UniversalQRPayment) => {
    if (!payment.amount || payment.amount === '0') {
      toast({
        title: "Missing Amount",
        description: "This business payment QR doesn't specify an amount.",
        variant: "destructive",
      });
      return;
    }

    if (!userAddress || !chain) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to proceed.",
        variant: "destructive",
      });
      return;
    }

    if (payment.tokenAddress) {
      // Token payment (IDRT) - use depositToken on BusinessVault
      console.log('💰 Processing token payment to business vault...');
      
      // First approve
      const approveHash = await writeContractAsync({
        abi: MockIDRT_ABI as Abi,
        address: payment.tokenAddress as Address,
        functionName: 'approve',
        args: [BUSINESS_VAULT_ADDRESS, BigInt(payment.amount)],
        chain,
        account: userAddress,
      });
      
      console.log('✅ Token approved:', approveHash);
      
      // Then deposit
      const depositHash = await writeContractAsync({
        abi: BusinessVault_ABI as Abi,
        address: BUSINESS_VAULT_ADDRESS as Address,
        functionName: 'depositToken',
        args: [
          payment.tokenAddress,
          BigInt(payment.amount),
          payment.category || 'General',
          payment.businessName || 'Business'
        ],
        chain,
        account: userAddress,
      });
      
      console.log('✅ Token deposited:', depositHash);
      
    } else {
      // Native ETH payment
      console.log('💰 Processing native ETH payment to business vault...');
      
      const hash = await writeContractAsync({
        abi: BusinessVault_ABI as Abi,
        address: BUSINESS_VAULT_ADDRESS as Address,
        functionName: 'depositETH',
        args: [
          payment.category || 'General',
          payment.businessName || 'Business'
        ],
        value: BigInt(payment.amount),
        chain,
        account: userAddress,
      });
      
      console.log('✅ ETH deposited:', hash);
    }

    toast({
      title: "✅ Business Payment Completed",
      description: `${payment.amountFormatted} deposited to business vault`,
    });
  };

  const executePersonalPayment = async (payment: UniversalQRPayment) => {
    if (!userAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to proceed.",
        variant: "destructive",
      });
      return;
    }

    // For personal payments, use the amount from QR or custom amount
    let amountToSend = payment.amount;
    
    if (payment.type === 'personal-static' && customAmount) {
      amountToSend = parseEther(customAmount).toString();
    }

    if (!amountToSend || amountToSend === '0') {
      toast({
        title: "Amount Required",
        description: "Please enter an amount for this transfer.",
        variant: "destructive",
      });
      return;
    }

    console.log('💰 Processing personal transfer...');
    
    const hash = await sendTransactionAsync({
      to: payment.recipientAddress as Address,
      value: BigInt(amountToSend),
      account: userAddress,
    });
    
    console.log('✅ Personal transfer completed:', hash);

    toast({
      title: "✅ Transfer Completed",
      description: `${payment.amountFormatted || customAmount} ETH sent successfully`,
    });
  };

  const clearScannedData = () => {
    setScannedData('');
    setQrPayment(null);
    setCustomAmount('');
    setError('');
  };

  const getQRTypeIcon = (type: string) => {
    if (type.startsWith('business')) return <Building2 className="h-4 w-4" />;
    return <User className="h-4 w-4" />;
  };

  const getQRTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'business-token': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'business-native': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'personal-static': return 'bg-green-100 text-green-800 border-green-200';
      case 'personal-dynamic': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          Universal QR Scanner
        </CardTitle>
        <CardDescription>
          Scan any SmartVerse QR code - Business or Personal payments
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Camera Controls */}
        <div className="flex gap-2">
          {!isScanning && !isStartingCamera ? (
            <Button 
              onClick={startScanning}
              disabled={!isConnected}
              className="flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              Start Camera
            </Button>
          ) : isStartingCamera ? (
            <Button 
              disabled
              className="flex items-center gap-2"
            >
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
              Starting Camera...
            </Button>
          ) : (
            <Button 
              onClick={stopScanning}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <CameraOff className="h-4 w-4" />
              Stop Camera
            </Button>
          )}
          
          {scannedData && (
            <Button 
              onClick={clearScannedData}
              variant="outline"
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Connection Warning */}
        {!isConnected && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to proceed with payments
            </AlertDescription>
          </Alert>
        )}

        {/* Camera Video */}
        <div className="relative bg-gray-900 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
          {(isScanning || isStartingCamera) ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-64 object-cover"
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%' }}
              />
              
              {isScanning && (
                <>
                  <div className="absolute inset-0 border-2 border-amber-400 opacity-50" />
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300">
                      🔍 Scanning for QR codes...
                    </Badge>
                  </div>
                  {/* Scanning guide overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-amber-400 rounded-lg animate-pulse">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-amber-400 text-sm font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
                          Point camera at QR code
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {isStartingCamera && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70">
                  <div className="text-white text-center">
                    <div className="w-8 h-8 animate-spin rounded-full border-2 border-transparent border-t-amber-400 mx-auto mb-2" />
                    <p>🔄 Initializing camera...</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Camera preview placeholder
            <div className="w-full h-64 flex items-center justify-center bg-gray-100">
              <div className="text-center text-gray-500">
                <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Camera preview will appear here</p>
                <p className="text-xs text-gray-400 mt-1">Click "Start Camera" to begin scanning</p>
              </div>
            </div>
          )}
        </div>

        {/* QR Payment Details */}
        {qrPayment && (
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                QR Code Detected
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* QR Type Badge */}
              <div className="flex items-center gap-2">
                {getQRTypeIcon(qrPayment.type)}
                <Badge 
                  variant="outline" 
                  className={getQRTypeBadgeColor(qrPayment.type)}
                >
                  {qrPayment.type.replace('-', ' ').toUpperCase()}
                </Badge>
              </div>

              {/* Payment Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recipient:</span>
                  <span className="font-mono text-xs">
                    {qrPayment.recipientAddress.slice(0, 6)}...{qrPayment.recipientAddress.slice(-4)}
                  </span>
                </div>
                
                {qrPayment.amountFormatted && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-semibold">{qrPayment.amountFormatted}</span>
                  </div>
                )}
                
                {qrPayment.businessName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Business:</span>
                    <span>{qrPayment.businessName}</span>
                  </div>
                )}
                
                {qrPayment.category && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span>{qrPayment.category}</span>
                  </div>
                )}

                {qrPayment.tokenSymbol && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Token:</span>
                    <span>{qrPayment.tokenSymbol}</span>
                  </div>
                )}
              </div>

              {/* Custom Amount for Static Personal QR */}
              {qrPayment.type === 'personal-static' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Enter Amount (ETH):</label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="0.0"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
              )}

              {/* Execute Payment Button */}
              <Button 
                onClick={executePayment}
                disabled={isProcessing || !isConnected || (qrPayment.type === 'personal-static' && !customAmount)}
                className="w-full flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isProcessing ? 'Processing...' : 'Execute Payment'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Help Text */}
        {!scannedData && !isScanning && (
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">
              Tap "Start Camera" to begin scanning QR codes
            </p>
            <div className="text-sm text-muted-foreground space-y-1 bg-blue-50 p-3 rounded-lg border">
              <p className="font-medium text-blue-800">✅ Supported QR Types:</p>
              <p>• Business Token Payments (MockIDRT)</p>
              <p>• Business Native ETH Payments</p>
              <p>• Personal Static Transfers</p>
              <p>• Personal Dynamic Requests</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
