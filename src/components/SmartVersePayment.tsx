import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { QrCode, Camera, Copy, Download, Smartphone, Monitor, Wallet } from 'lucide-react';
import { useAccount, useChainId } from 'wagmi';
import { crossChainNameService } from "@/services/crossChainNameService";
import { useTokenBalances, type Token } from '@/hooks/useTokenBalances';

// Simple QR Code component placeholder
const SimpleQRCode = ({ value, size = 150 }: { value: string; size?: number }) => {
  return (
    <div 
      className="flex items-center justify-center border-2 border-gray-300 rounded-lg"
      style={{ width: size, height: size }}
    >
      <div className="text-center p-4">
        <QrCode className="w-8 h-8 mx-auto mb-2 text-gray-600" />
        <div className="text-xs text-gray-600 break-all">
          {value.length > 20 ? `${value.substring(0, 20)}...` : value}
        </div>
      </div>
    </div>
  );
};

export const SmartVersePayment = () => {
  const { address: userAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const { tokens } = useTokenBalances();
  
  // Static QR State
  const [userName, setUserName] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [isResolvingStatic, setIsResolvingStatic] = useState(false);
  
  // Dynamic QR State
  const [recipientName, setRecipientName] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [dynamicQRData, setDynamicQRData] = useState<string | null>(null);
  const [isGeneratingDynamic, setIsGeneratingDynamic] = useState(false);
  
  // QR Scanner State (for receiving payments)
  const [isScanning, setIsScanning] = useState(false);
  const [scannedPayment, setScannedPayment] = useState<any>(null);
  const qrScannerRef = useRef<HTMLDivElement>(null);

  // Auto-select first token when available
  useEffect(() => {
    if (tokens.length > 0 && !selectedToken) {
      setSelectedToken(tokens[0]);
    }
  }, [tokens, selectedToken]);

  // Generate static QR (for receiving any amount)
  const handleGenerateStaticQR = async () => {
    if (!userName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your SmartVerse name",
        variant: "destructive",
      });
      return;
    }

    setIsResolvingStatic(true);
    try {
      const address = await crossChainNameService.generateStaticPaymentQR(userName);
      if (address) {
        setResolvedAddress(address);
        toast({
          title: "QR Generated! 📱",
          description: `Static payment QR ready for ${userName}.sw`,
        });
      } else {
        toast({
          title: "Name Not Found",
          description: `Cannot resolve ${userName}.sw. Make sure it's registered.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating static QR:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResolvingStatic(false);
    }
  };

  // Generate dynamic QR (for specific amount)
  const handleGenerateDynamicQR = async () => {
    if (!recipientName.trim()) {
      toast({
        title: "Recipient Required",
        description: "Please enter recipient's SmartVerse name",
        variant: "destructive",
      });
      return;
    }

    if (!paymentAmount.trim() || parseFloat(paymentAmount) <= 0) {
      toast({
        title: "Amount Required",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingDynamic(true);
    try {
      const qrData = await crossChainNameService.generateDynamicPaymentQR(
        recipientName,
        paymentAmount,
        selectedToken?.address !== '0x0000000000000000000000000000000000000000' ? selectedToken?.address : undefined,
        chainId
      );
      
      if (qrData) {
        setDynamicQRData(qrData);
        toast({
          title: "Payment QR Generated! 📱",
          description: `QR ready for ${paymentAmount} ${selectedToken?.symbol} to ${recipientName}.sw`,
        });
      } else {
        toast({
          title: "Generation Failed",
          description: `Cannot resolve ${recipientName}.sw or generate payment URL`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating dynamic QR:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate payment QR. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDynamic(false);
    }
  };

  // Copy QR data to clipboard
  const handleCopyQR = async (data: string, label: string) => {
    try {
      await navigator.clipboard.writeText(data);
      toast({
        title: "Copied! 📋",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Download QR as image (simplified)
  const handleDownloadQR = (qrData: string, filename: string) => {
    // For now, just copy the data since we don't have QR generation library
    handleCopyQR(qrData, `${filename} data`);
    toast({
      title: "Note",
      description: "QR download feature requires additional setup. Data copied to clipboard instead.",
    });
  };

  // Simulate QR scanner (in real implementation, you'd use camera)
  const handleStartScanning = () => {
    toast({
      title: "QR Scanner",
      description: "In a real implementation, this would open camera to scan QR codes from other devices",
    });
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>💳 SmartVerse Pay</CardTitle>
          <CardDescription>
            Generate QR codes for receiving payments or scan to send payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Wallet className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to use SmartVerse Pay
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
          💳 SmartVerse Pay
          <Badge variant="outline" className="ml-auto">
            Beta
          </Badge>
        </CardTitle>
        <CardDescription>
          Revolutionary payment system: Generate QR codes or scan to pay with SmartVerse names
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="receive" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="receive">📱 Receive</TabsTrigger>
            <TabsTrigger value="send">💸 Send</TabsTrigger>
            <TabsTrigger value="scan">📷 Scan</TabsTrigger>
          </TabsList>
          
          {/* Receive Payments Tab */}
          <TabsContent value="receive" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Static QR - Any Amount */}
              <Card className="bg-gray-800/30 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    Static QR (Any Amount)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Show this QR to customers who will enter the amount manually
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="static-name" className="text-sm">Your SmartVerse Name</Label>
                    <div className="flex gap-2">
                      <Input
                        id="static-name"
                        placeholder="e.g., warung-jaya"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white text-sm"
                      />
                      <div className="flex items-center px-3 bg-gray-700 rounded-md">
                        <span className="text-sm text-gray-300">.sw</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleGenerateStaticQR}
                    disabled={isResolvingStatic}
                    className="w-full"
                    size="sm"
                  >
                    {isResolvingStatic ? 'Generating...' : 'Generate Static QR'}
                  </Button>
                  
                  {resolvedAddress && (
                    <div className="space-y-3">
                      <div className="flex justify-center">
                        <div className="bg-white p-3 rounded-lg">
                          <SimpleQRCode value={resolvedAddress} size={150} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleCopyQR(resolvedAddress, 'Address')}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleDownloadQR(resolvedAddress, `${userName}-static-qr`)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dynamic QR - Specific Amount */}
              <Card className="bg-gray-800/30 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Dynamic QR (Specific Amount)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Create QR for exact amount - customer just scans and confirms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient-name" className="text-sm">Recipient Name</Label>
                    <div className="flex gap-2">
                      <Input
                        id="recipient-name"
                        placeholder="e.g., customer-name"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white text-sm"
                      />
                      <div className="flex items-center px-3 bg-gray-700 rounded-md">
                        <span className="text-sm text-gray-300">.sw</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-sm">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="token" className="text-sm">Token</Label>
                    <Select onValueChange={(value) => {
                      const token = tokens.find(t => t.symbol === value);
                      setSelectedToken(token || null);
                    }}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white text-sm">
                        <SelectValue placeholder="Select token">
                          {selectedToken?.symbol}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {tokens.map((token) => (
                          <SelectItem key={token.address} value={token.symbol}>
                            <div className="flex items-center gap-2">
                              <span>{token.symbol}</span>
                              {token.isNative && (
                                <Badge variant="outline" className="text-xs">Native</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    onClick={handleGenerateDynamicQR}
                    disabled={isGeneratingDynamic}
                    className="w-full"
                    size="sm"
                  >
                    {isGeneratingDynamic ? 'Generating...' : 'Generate Payment QR'}
                  </Button>
                  
                  {dynamicQRData && (
                    <div className="space-y-3">
                      <div className="flex justify-center">
                        <div className="bg-white p-3 rounded-lg">
                          <SimpleQRCode value={dynamicQRData} size={150} />
                        </div>
                      </div>
                      <div className="text-center text-xs text-gray-400">
                        {paymentAmount} {selectedToken?.symbol} to {recipientName}.sw
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleCopyQR(dynamicQRData, 'Payment URL')}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleDownloadQR(dynamicQRData, `payment-${paymentAmount}-${selectedToken?.symbol}`)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Send Payment Tab */}
          <TabsContent value="send" className="space-y-4">
            <Alert>
              <QrCode className="h-4 w-4" />
              <AlertDescription>
                <strong>How to Send Payments:</strong>
                <br />1. Ask recipient to show their SmartVerse Pay QR code
                <br />2. Use the Scan tab to scan their QR code
                <br />3. Or use our regular transfer feature with their .sw name
              </AlertDescription>
            </Alert>
          </TabsContent>
          
          {/* Scan QR Tab */}
          <TabsContent value="scan" className="space-y-4">
            <Card className="bg-gray-800/30 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm">QR Code Scanner</CardTitle>
                <CardDescription className="text-xs">
                  Scan QR codes from other SmartVerse users to make payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div 
                  ref={qrScannerRef}
                  className="w-full h-64 bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600"
                >
                  <div className="text-center space-y-3">
                    <Camera className="w-12 h-12 mx-auto text-gray-500" />
                    <p className="text-sm text-gray-400">Camera view will appear here</p>
                    <Button 
                      onClick={handleStartScanning}
                      disabled={isScanning}
                      size="sm"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {isScanning ? 'Scanning...' : 'Start Scanning'}
                    </Button>
                  </div>
                </div>
                
                <Alert>
                  <Camera className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Note:</strong> QR scanning requires camera permissions. 
                    Alternatively, you can use your mobile wallet app to scan QR codes displayed on this screen.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
