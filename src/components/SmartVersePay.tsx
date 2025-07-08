import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { QrCode, Download, Scan, Copy, Wallet, DollarSign, AlertCircle, CheckCircle, Smartphone } from 'lucide-react';
import { useAccount, useChainId } from 'wagmi';
import { QRCodeSVG } from 'qrcode.react';
import { crossChainNameService, CrossChainNameService } from "@/services/crossChainNameService";
import { QRScanner } from "./QRScanner";

export const SmartVersePay = () => {
  const { address: userAddress, isConnected } = useAccount();
  const chainId = useChainId();
  
  // State untuk Static QR
  const [userNames, setUserNames] = useState<string[]>([]);
  const [selectedName, setSelectedName] = useState<string>('');
  const [staticQRData, setStaticQRData] = useState<string>('');
  
  // State untuk Dynamic QR
  const [dynamicAmount, setDynamicAmount] = useState<string>('');
  const [dynamicRecipient, setDynamicRecipient] = useState<string>('');
  const [dynamicQRData, setDynamicQRData] = useState<string>('');
  const [isGeneratingDynamic, setIsGeneratingDynamic] = useState(false);
  
  const networkInfo = CrossChainNameService.getNetworkInfo(chainId);

  // Load user names saat komponen dimount
  useEffect(() => {
    if (userAddress && isConnected) {
      loadUserNames();
    }
  }, [userAddress, isConnected]);

  // Generate static QR saat nama dipilih
  useEffect(() => {
    if (selectedName) {
      generateStaticQR();
    }
  }, [selectedName]);

  const loadUserNames = async () => {
    if (!userAddress) return;
    
    try {
      const names = await crossChainNameService.getUserNames(userAddress);
      setUserNames(names);
      if (names.length > 0) {
        setSelectedName(names[0]);
      }
    } catch (error) {
      console.error('Error loading user names:', error);
      toast({
        title: "Error",
        description: "Failed to load your registered names",
        variant: "destructive",
      });
    }
  };

  const generateStaticQR = async () => {
    if (!selectedName) return;
    
    try {
      console.log('🔄 Generating static QR for:', selectedName);
      
      const address = await crossChainNameService.generateStaticPaymentQR(selectedName);
      
      if (address) {
        setStaticQRData(address);
        console.log('✅ Static QR generated:', address);
      } else {
        toast({
          title: "Error",
          description: "Failed to generate static QR code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating static QR:', error);
      toast({
        title: "Error",
        description: "Failed to generate static QR code",
        variant: "destructive",
      });
    }
  };

  const generateDynamicQR = async () => {
    if (!dynamicRecipient || !dynamicAmount) {
      toast({
        title: "Missing Information",
        description: "Please enter both recipient and amount",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingDynamic(true);
    
    try {
      console.log('🔄 Generating dynamic QR...');
      
      const qrData = await crossChainNameService.generateDynamicPaymentQR(
        dynamicRecipient,
        dynamicAmount,
        undefined, // native token
        chainId
      );
      
      if (qrData) {
        setDynamicQRData(qrData);
        console.log('✅ Dynamic QR generated:', qrData);
        
        toast({
          title: "QR Generated! 📱",
          description: `Payment QR for ${dynamicAmount} to ${dynamicRecipient}`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to generate dynamic QR code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating dynamic QR:', error);
      toast({
        title: "Error",
        description: "Failed to generate dynamic QR code",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDynamic(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied! 📋",
      description: `${type} copied to clipboard`,
    });
  };

  const downloadQR = (qrData: string, filename: string) => {
    // Get the QR code canvas
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.png`;
      a.click();
      
      toast({
        title: "Downloaded! 💾",
        description: `QR code saved as ${filename}.png`,
      });
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            SmartVerse Pay
          </CardTitle>
          <CardDescription>
            Accept payments easily with QR codes using your .sw name
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to use SmartVerse Pay
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (userNames.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            SmartVerse Pay
          </CardTitle>
          <CardDescription>
            Accept payments easily with QR codes using your .sw name
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need to register a .sw name first to use SmartVerse Pay
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            SmartVerse Pay
            <Badge variant="outline" className="ml-auto">
              {networkInfo.name}
            </Badge>
          </CardTitle>
          <CardDescription>
            Accept payments easily with QR codes. Your customers can scan and pay instantly!
          </CardDescription>
        </CardHeader>
      </Card>

      {/* QR Payment Tabs */}
      <Tabs defaultValue="static" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="static" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Receive
          </TabsTrigger>
          <TabsTrigger value="dynamic" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Request
          </TabsTrigger>
          <TabsTrigger value="scan" className="flex items-center gap-2">
            <Scan className="w-4 h-4" />
            Scan & Pay
          </TabsTrigger>
        </TabsList>

        {/* Static QR Tab */}
        <TabsContent value="static" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📱 Static Payment QR</CardTitle>
              <CardDescription>
                Generate a permanent QR code. Customers scan it and enter the amount themselves.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name Selection */}
              <div className="space-y-2">
                <Label>Select Your Name</Label>
                <Select value={selectedName} onValueChange={setSelectedName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a name" />
                  </SelectTrigger>
                  <SelectContent>
                    {userNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* QR Code Display */}
              {staticQRData && (
                <div className="text-center space-y-4">
                  <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-xl inline-block">
                    <QRCodeSVG 
                      value={staticQRData} 
                      size={256}
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600">Your Payment Address:</p>
                    <code className="text-xs bg-slate-50 border border-slate-200 text-slate-700 p-3 rounded-lg block break-all">
                      {staticQRData}
                    </code>
                  </div>

                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(staticQRData, "Payment address")}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Address
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadQR(staticQRData, `${selectedName}-static-qr`)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download QR
                    </Button>
                  </div>
                </div>
              )}

              {/* Usage Instructions */}
              <Alert>
                <Smartphone className="h-4 w-4" />
                <AlertDescription>
                  <strong>How to use:</strong> Display this QR code to customers. They scan it with their wallet app, enter the amount, and send the payment to your {selectedName} address.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dynamic QR Tab */}
        <TabsContent value="dynamic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💰 Dynamic Payment QR</CardTitle>
              <CardDescription>
                Create a QR code with a specific amount. Customers just scan and confirm the payment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient (.sw name or address)</Label>
                  <Input
                    id="recipient"
                    placeholder="alice.sw or 0x123..."
                    value={dynamicRecipient}
                    onChange={(e) => setDynamicRecipient(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ({networkInfo.symbol})</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.0001"
                    placeholder="0.1"
                    value={dynamicAmount}
                    onChange={(e) => setDynamicAmount(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                onClick={generateDynamicQR} 
                disabled={isGeneratingDynamic || !dynamicRecipient || !dynamicAmount}
                className="w-full"
              >
                {isGeneratingDynamic ? (
                  <>
                    <QrCode className="w-4 h-4 mr-2 animate-spin" />
                    Generating QR...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 mr-2" />
                    Generate Payment QR
                  </>
                )}
              </Button>

              {/* Dynamic QR Display */}
              {dynamicQRData && (
                <div className="text-center space-y-4">
                  <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-xl inline-block">
                    <QRCodeSVG 
                      value={dynamicQRData} 
                      size={256}
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-green-600">
                      ✅ Payment QR Generated!
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-700"><strong>Amount:</strong> {dynamicAmount} {networkInfo.symbol}</p>
                      <p className="text-sm text-green-700"><strong>To:</strong> {dynamicRecipient}</p>
                      <p className="text-sm text-green-700"><strong>Network:</strong> {networkInfo.name}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(dynamicQRData, "Payment URL")}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy URL
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadQR(dynamicQRData, `payment-${dynamicAmount}-${networkInfo.symbol}`)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download QR
                    </Button>
                  </div>
                </div>
              )}

              {/* Usage Instructions */}
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>How to use:</strong> Show this QR code to the customer. When they scan it, their wallet will auto-fill the recipient, amount, and network. They just need to confirm the transaction!
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* QR Scanner Tab */}
        <TabsContent value="scan" className="space-y-4">
          <QRScanner />
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📋 How SmartVerse Pay Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">🔄 Receive (Static QR)</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• One QR code for all payments</li>
                <li>• Customer enters amount manually</li>
                <li>• Perfect for stores, services</li>
                <li>• Works with any wallet app</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">💰 Request (Dynamic QR)</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• Specific amount pre-filled</li>
                <li>• Customer just confirms payment</li>
                <li>• Reduces payment errors</li>
                <li>• Perfect for invoices, bills</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">📷 Scan & Pay</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• Scan any payment QR code</li>
                <li>• Execute payments directly</li>
                <li>• No external wallet needed</li>
                <li>• Built-in camera scanner</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
