import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Camera, CameraOff, Scan, AlertCircle, CheckCircle, Send, X } from 'lucide-react';
import QrScanner from 'qr-scanner';
import { useAccount, useChainId, useSendTransaction, useWriteContract } from 'wagmi';
import { parseEther, type Address } from 'viem';
import { crossChainNameService } from "@/services/crossChainNameService";

interface PaymentDetails {
  recipientAddress: string;
  amount?: string;
  amountFormatted?: string;
  tokenAddress?: string;
  chainId?: number;
}

export const QRScanner = () => {
  const { address: userAddress, isConnected } = useAccount();
  const chainId = useChainId();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  const { sendTransaction, isPending: isSendingTx } = useSendTransaction();
  const { writeContract, isPending: isWritingContract } = useWriteContract();

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
    try {
      setError('');
      
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

      console.log('📱 QR Scanner started successfully');

      toast({
        title: "Camera Started 📷",
        description: "Point your camera at a QR code to scan",
      });

    } catch (error) {
      console.error('Error starting camera:', error);
      setError(`Camera error: ${error}`);
      toast({
        title: "Camera Error",
        description: "Failed to access camera. Please check permissions.",
        variant: "destructive",
      });
    } finally {
      setIsStartingCamera(false);
    }
  };

  const stopScanning = () => {
    if (qrScanner) {
      qrScanner.stop();
      qrScanner.destroy();
      setQrScanner(null);
    }
    setIsScanning(false);

    toast({
      title: "Camera Stopped 📷",
      description: "QR scanning stopped",
    });
  };

  const handleQRResult = (data: string) => {
    setScannedData(data);
    
    // Parse the QR data
    const parsed = crossChainNameService.parsePaymentQR(data);
    
    if (parsed) {
      setPaymentDetails(parsed);
      toast({
        title: "QR Code Detected! 🎯",
        description: `Payment request for ${parsed.amountFormatted || 'unknown amount'}`,
      });
    } else {
      // Check if it's a plain address
      if (data.match(/^0x[a-fA-F0-9]{40}$/)) {
        setPaymentDetails({
          recipientAddress: data
        });
        toast({
          title: "Address Detected! 📍",
          description: "Plain wallet address scanned",
        });
      } else {
        setError('Invalid QR code format');
        toast({
          title: "Invalid QR Code",
          description: "This QR code is not a valid payment request",
          variant: "destructive",
        });
      }
    }
  };

  const executePayment = async () => {
    if (!paymentDetails || !isConnected) return;

    setIsProcessing(true);
    
    try {
      const { recipientAddress, amount, tokenAddress, chainId: targetChainId } = paymentDetails;

      // Check if we need to switch chains
      if (targetChainId && targetChainId !== chainId) {
        toast({
          title: "Chain Mismatch",
          description: `Please switch to chain ID ${targetChainId} to complete this payment`,
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      if (tokenAddress && tokenAddress !== '0x0000000000000000000000000000000000000000') {
        // ERC20 Token Transfer
        toast({
          title: "Token Transfer",
          description: "ERC20 token transfers not implemented yet",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      } else {
        // Native ETH Transfer
        if (!amount || amount === '0') {
          toast({
            title: "Missing Amount",
            description: "Please enter an amount to send",
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }

        // Send native token transaction
        const txHash = await sendTransaction({
          to: recipientAddress as Address,
          value: BigInt(amount), // amount is already in wei from QR parsing
        });

        toast({
          title: "Payment Sent! 🚀",
          description: `Transaction: ${txHash}`,
        });

        // Clear payment details after successful transaction
        setPaymentDetails(null);
        setScannedData('');
      }

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: `Error: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearScannedData = () => {
    setScannedData('');
    setPaymentDetails(null);
    setError('');
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5" />
            QR Payment Scanner
          </CardTitle>
          <CardDescription>
            Scan QR codes to make instant payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to use the QR scanner
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="w-5 h-5" />
          QR Payment Scanner
        </CardTitle>
        <CardDescription>
          Scan payment QR codes and execute transactions directly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Camera Controls */}
        <div className="space-y-4">
          <div className="flex gap-2">
            {!isScanning && !isStartingCamera ? (
              <Button onClick={startScanning} className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Start Camera
              </Button>
            ) : isStartingCamera ? (
              <Button disabled className="flex items-center gap-2">
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
                Starting Camera...
              </Button>
            ) : (
              <Button onClick={stopScanning} variant="destructive" className="flex items-center gap-2">
                <CameraOff className="w-4 h-4" />
                Stop Camera
              </Button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Camera Video */}
        {(isScanning || isStartingCamera) && (
          <div className="space-y-2">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%' }}
              />
              {isScanning && (
                <>
                  <div className="absolute inset-0 border-2 border-blue-500 opacity-50" />
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary">Scanning...</Badge>
                  </div>
                </>
              )}
              {isStartingCamera && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="text-white text-center">
                    <div className="w-8 h-8 animate-spin rounded-full border-2 border-transparent border-t-white mx-auto mb-2" />
                    <p>Initializing camera...</p>
                  </div>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {isStartingCamera ? "Setting up camera..." : "Point your camera at a payment QR code"}
            </p>
          </div>
        )}

        {/* Scanned Data Display */}
        {scannedData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                QR Code Scanned
              </h3>
              <Button variant="ghost" size="sm" onClick={clearScannedData}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Raw Data */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Raw Data:</label>
              <div className="p-3 bg-muted rounded-lg text-sm font-mono break-all">
                {scannedData}
              </div>
            </div>

            {/* Parsed Payment Details */}
            {paymentDetails && (
              <div className="space-y-3">
                <h4 className="font-medium">Payment Details:</h4>
                
                <div className="grid gap-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Recipient:</label>
                    <p className="font-mono text-sm break-all">{paymentDetails.recipientAddress}</p>
                  </div>

                  {paymentDetails.amountFormatted && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Amount:</label>
                      <p className="text-lg font-semibold">{paymentDetails.amountFormatted} ETH</p>
                    </div>
                  )}

                  {paymentDetails.tokenAddress && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Token:</label>
                      <p className="font-mono text-sm break-all">{paymentDetails.tokenAddress}</p>
                    </div>
                  )}

                  {paymentDetails.chainId && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Chain ID:</label>
                      <p>{paymentDetails.chainId}</p>
                      {paymentDetails.chainId !== chainId && (
                        <Badge variant="destructive">Different Chain</Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Payment Action */}
                {paymentDetails.amount && paymentDetails.amount !== '0' ? (
                  <Button 
                    onClick={executePayment} 
                    disabled={isProcessing || isSendingTx || paymentDetails.chainId !== chainId}
                    className="w-full flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {isProcessing || isSendingTx ? 'Processing...' : `Send ${paymentDetails.amountFormatted} ETH`}
                  </Button>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This QR contains an address but no amount. You can copy the address to send a custom amount.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {!isScanning && !scannedData && (
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Tap "Start Camera" to begin scanning QR codes
            </p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>✅ Payment QR codes (EIP-681 format)</p>
              <p>✅ Wallet addresses</p>
              <p>✅ SmartVerse Pay QR codes</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
