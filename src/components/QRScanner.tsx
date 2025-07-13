import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Camera, CameraOff, Scan, AlertCircle, CheckCircle, Send, X, Building2 } from 'lucide-react';
import QrScanner from 'qr-scanner';
import { useAccount, useChainId, useSendTransaction } from 'wagmi';
import { parseEther, type Address } from 'viem';
import { BusinessQRParser, type BusinessQRPayment } from "@/utils/qrParser";

export const QRScanner = () => {
  const { address: userAddress, isConnected } = useAccount();
  const chainId = useChainId();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const [businessPayment, setBusinessPayment] = useState<BusinessQRPayment | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  const { sendTransaction, isPending: isSendingTx } = useSendTransaction();

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
    
    // Parse the QR data with business parser only
    const parsed = BusinessQRParser.parseBusinessQR(data);
    
    if (parsed && parsed.isValid) {
      setBusinessPayment(parsed);
      
      // Show success toast
      const description = BusinessQRParser.getPaymentDescription(parsed);
      
      toast({
        title: "🏢 Business Payment QR Detected!",
        description: description,
      });
      
    } else {
      // Not a valid business QR code
      setError('This QR code is not a valid SmartVerse business payment QR. Please scan a business payment QR code.');
      toast({
        title: "Invalid QR Code",
        description: 'This app only supports SmartVerse business payment QR codes. For personal transfers, please use the Send Tokens feature.',
        variant: "destructive",
      });
    }
  };

  const executePayment = async () => {
    if (!businessPayment || !isConnected) return;

    setIsProcessing(true);
    
    try {
      const { recipientAddress, amount } = businessPayment;

      // Only support native ETH transfers for business payments
      if (!amount || amount === '0') {
        toast({
          title: "Missing Amount",
          description: "This business payment QR doesn't specify an amount. Please contact the business.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Send native ETH transaction
      const txHash = await sendTransaction({
        to: recipientAddress as Address,
        value: BigInt(amount), // amount is already in wei from QR parsing
      });

      toast({
        title: "Business Payment Sent! 🚀",
        description: `Transaction hash: ${txHash}`,
      });

      // Clear payment details after successful transaction
      setBusinessPayment(null);
      setScannedData('');

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
    setBusinessPayment(null);
    setError('');
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Business QR Payment Scanner
          </CardTitle>
          <CardDescription>
            Scan SmartVerse business payment QR codes to make instant payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to use the business QR payment scanner
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
          <Building2 className="w-5 h-5" />
          Business QR Payment Scanner
        </CardTitle>
        <CardDescription>
          Scan SmartVerse business payment QR codes to make instant payments. 
          For personal transfers, please use the Send Tokens feature.
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
            <div className="relative bg-gray-900 border-2 border-amber-200 rounded-lg overflow-hidden aspect-video shadow-lg">
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
                  <div className="absolute inset-0 border-2 border-amber-400 opacity-50" />
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300">Scanning...</Badge>
                  </div>
                </>
              )}
              {isStartingCamera && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70">
                  <div className="text-white text-center">
                    <div className="w-8 h-8 animate-spin rounded-full border-2 border-transparent border-t-amber-400 mx-auto mb-2" />
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
              <label className="text-sm font-medium text-gray-700">Raw Data:</label>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm font-mono break-all text-blue-800">
                {scannedData}
              </div>
            </div>

            {/* Parsed Business Payment Details */}
            {businessPayment && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Business Payment Details:
                  <Badge variant="secondary">Business</Badge>
                  <Badge variant="secondary" className="text-xs">{businessPayment.format}</Badge>
                </h4>
                
                <div className="grid gap-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Business Address:</label>
                    <p className="font-mono text-sm break-all">{businessPayment.recipientAddress}</p>
                  </div>

                  {businessPayment.businessName && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Business Name:</label>
                      <p>{businessPayment.businessName}</p>
                    </div>
                  )}

                  {businessPayment.amountFormatted && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Amount:</label>
                      <p className="text-lg font-semibold text-green-600">
                        {businessPayment.amountFormatted} ETH
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Category:</label>
                    <p>{businessPayment.category}</p>
                  </div>

                  {businessPayment.message && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Message:</label>
                      <p className="text-sm">{businessPayment.message}</p>
                    </div>
                  )}
                </div>

                {/* Payment Action */}
                {businessPayment.amount && businessPayment.amount !== '0' ? (
                  <Button 
                    onClick={executePayment} 
                    disabled={isProcessing || isSendingTx}
                    className="w-full flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Send className="w-4 h-4" />
                    {isProcessing || isSendingTx ? 'Processing Payment...' : `Pay ${businessPayment.amountFormatted} ETH`}
                  </Button>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This business QR doesn't specify an amount. Please contact the business for the correct amount.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {!isScanning && !scannedData && (
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">
              Tap "Start Camera" to begin scanning business payment QR codes
            </p>
            <div className="text-sm text-muted-foreground space-y-1 bg-blue-50 p-3 rounded-lg border">
              <p className="font-medium text-blue-800">✅ Supported QR Codes:</p>
              <p>• SmartVerse business payment URLs</p>
              <p>• Business payment JSON format</p>
              <p>• Contains amount, category, and business info</p>
            </div>
            <div className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
              <p className="font-medium">ℹ️ For Personal Transfers:</p>
              <p>Use the "Send Tokens" feature instead of QR scanner</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
