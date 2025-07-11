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
import { QrCode, Download, Scan, Copy, Wallet, DollarSign, AlertCircle, CheckCircle, Smartphone, Building } from 'lucide-react';
import { useAccount, useChainId } from 'wagmi';
import { QRCodeSVG } from 'qrcode.react';
import { crossChainNameService, CrossChainNameService } from "@/services/crossChainNameService";
import { UnifiedQRScanner } from "./UnifiedQRScanner";

export const SmartVersePay = () => {
  const { address: userAddress, isConnected } = useAccount();
  const chainId = useChainId();
  
  // State for main tabs
  const [mainTab, setMainTab] = useState<'personal' | 'business'>('personal');
  
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

  // Main component content for connected users
  return (
    <div className="space-y-6">
      {/* Main Tabs: Personal vs Business */}
      <Tabs value={mainTab} onValueChange={(value) => setMainTab(value as 'personal' | 'business')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Personal Pay
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Business Pay
          </TabsTrigger>
        </TabsList>

        {/* Personal Pay Tab Content */}
        <TabsContent value="personal" className="space-y-6">
          {userNames.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Personal QR Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You need to register a .sw name to use SmartVerse Pay. Register a name first.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Generate QR Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="w-5 h-5" />
                    Generate Payment QR
                  </CardTitle>
                  <CardDescription>
                    Create a QR code for receiving payments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="static" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="static">Static QR</TabsTrigger>
                      <TabsTrigger value="dynamic">Payment Request</TabsTrigger>
                    </TabsList>

                    {/* Static QR Tab */}
                    <TabsContent value="static" className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Your .sw Name</Label>
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

                        {staticQRData && (
                          <div className="flex flex-col items-center p-4 border rounded-lg">
                            <div className="mb-3">
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-100">
                                Static Payment QR
                              </Badge>
                            </div>
                            <QRCodeSVG
                              value={staticQRData}
                              size={180}
                              level="H"
                              includeMargin={true}
                              className="mb-3"
                            />
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(staticQRData, 'QR data')}
                              >
                                <Copy className="h-3.5 w-3.5 mr-1.5" />
                                Copy
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadQR(staticQRData, `${selectedName}-static-qr`)}
                              >
                                <Download className="h-3.5 w-3.5 mr-1.5" />
                                Download
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="text-sm text-gray-600 italic">
                          <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
                          Static QR only contains your address. The sender will need to input amount details.
                        </div>
                      </div>
                    </TabsContent>

                    {/* Dynamic QR Tab */}
                    <TabsContent value="dynamic" className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="recipient">Recipient Name</Label>
                          <Select value={dynamicRecipient} onValueChange={setDynamicRecipient}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your name" />
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

                        <div>
                          <Label htmlFor="amount">Amount ({networkInfo?.symbol || 'ETH'})</Label>
                          <Input
                            id="amount"
                            placeholder="0.01"
                            value={dynamicAmount}
                            onChange={(e) => setDynamicAmount(e.target.value)}
                          />
                        </div>

                        <Button
                          className="w-full"
                          onClick={generateDynamicQR}
                          disabled={isGeneratingDynamic || !dynamicRecipient || !dynamicAmount}
                        >
                          {isGeneratingDynamic ? (
                            <>
                              <Smartphone className="mr-2 h-4 w-4 animate-pulse" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <QrCode className="mr-2 h-4 w-4" />
                              Generate Payment QR
                            </>
                          )}
                        </Button>

                        {dynamicQRData && (
                          <div className="flex flex-col items-center p-4 border rounded-lg">
                            <div className="mb-3">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                                Payment Request QR
                              </Badge>
                            </div>
                            <QRCodeSVG
                              value={dynamicQRData}
                              size={180}
                              level="H"
                              includeMargin={true}
                              className="mb-3"
                            />
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(dynamicQRData, 'QR data')}
                              >
                                <Copy className="h-3.5 w-3.5 mr-1.5" />
                                Copy
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadQR(dynamicQRData, `${dynamicRecipient}-payment-qr`)}
                              >
                                <Download className="h-3.5 w-3.5 mr-1.5" />
                                Download
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="text-sm text-gray-600 italic">
                          <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
                          Payment Request QR includes recipient and amount. Sender just needs to scan and confirm.
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Scan QR Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scan className="w-5 h-5" />
                    Scan Payment QR
                  </CardTitle>
                  <CardDescription>
                    Scan a QR code to make a payment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UnifiedQRScanner />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Business Pay Tab Content */}
        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Business QR Payments
              </CardTitle>
              <CardDescription>
                Accept and process business payments via QR codes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Bisnis Anda dapat menerima pembayaran langsung ke vault menggunakan QR code yang berisi alamat vault dan kategori pembayaran.
                </AlertDescription>
              </Alert>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-md font-medium mb-2">Buat QR Code Bisnis</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Buat QR code yang akan mengarahkan pelanggan untuk melakukan deposit ke vault bisnis Anda.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/dashboard/business'}
                    className="w-full"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Buat QR Code Bisnis
                  </Button>
                </div>
                
                <div>
                  <h3 className="text-md font-medium mb-2">Scan QR Code</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Pindai QR code untuk melakukan pembayaran ke bisnis lain.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => setMainTab('personal')}
                    className="w-full"
                  >
                    <Scan className="w-4 h-4 mr-2" />
                    Ke Menu Scan QR
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
