import React, { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ArrowDownUp, ArrowDown, ArrowUp, RefreshCcw, FileCheck } from 'lucide-react';
import { QRBusinessGenerator } from './QRBusinessGenerator';

interface BusinessPaymentProcessorProps {
  vaultAddress: `0x${string}`;
  businessName: string;
  refreshData?: () => Promise<void>;
}

const BusinessPaymentProcessor: React.FC<BusinessPaymentProcessorProps> = ({
  vaultAddress,
  businessName,
  refreshData
}) => {
  const { address } = useAccount();
  const chainId = useChainId();
  
  // UI State
  const [activeTab, setActiveTab] = useState('receive');
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDownUp className="w-5 h-5" />
          Pembayaran Bisnis
        </CardTitle>
        <CardDescription>
          Terima dan kirim pembayaran untuk bisnis Anda
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="receive" className="flex items-center gap-2">
              <ArrowDown className="w-4 h-4" />
              Terima Pembayaran
            </TabsTrigger>
            <TabsTrigger value="send" className="flex items-center gap-2">
              <ArrowUp className="w-4 h-4" />
              Kirim Pembayaran
            </TabsTrigger>
          </TabsList>
          
          {/* Tab Terima Pembayaran */}
          <TabsContent value="receive" className="space-y-4 pt-4">
            <Alert className="bg-blue-50">
              <AlertDescription className="text-blue-700">
                Buat QR code untuk menerima pembayaran dari pelanggan
              </AlertDescription>
            </Alert>
            
            <QRBusinessGenerator 
              vaultAddress={vaultAddress} 
              businessName={businessName} 
            />
            
            {/* Refresh Button */}
            {refreshData && (
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={refreshData}
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Muat Ulang Data Bisnis
              </Button>
            )}
          </TabsContent>
          
          {/* Tab Kirim Pembayaran */}
          <TabsContent value="send" className="space-y-4 pt-4">
            <Alert className="bg-amber-50">
              <AlertDescription className="text-amber-700">
                Pindai QR code bisnis lain untuk mengirim pembayaran
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-center">
              <Button 
                className="flex items-center gap-2"
                onClick={() => window.location.href = `/pay`}
              >
                <FileCheck className="w-4 h-4" />
                Pindai QR Code Pembayaran
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BusinessPaymentProcessor;
