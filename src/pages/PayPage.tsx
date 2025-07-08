
import { useState } from 'react';
import { CrossChainSendTokens } from '@/components/CrossChainSendTokens';
import { SmartVersePay } from '@/components/SmartVersePay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, QrCode, Info, Zap, Shield, Smartphone } from 'lucide-react';

export const PayPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Page Header */}
        <div className="text-center space-y-6 mb-8 sm:mb-12">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              💰 SmartVerse Pay
            </h1>
            <p className="text-gray-600 text-base sm:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed">
              Send tokens using simple names or QR codes. The easiest way to make crypto payments.
            </p>
          </div>
          
          {/* Info Badge */}
          <div className="flex justify-center">
            <div className="category-badge flex items-center gap-2 text-blue-700">
              <Info className="w-4 h-4" />
              <span className="text-sm font-medium">Payment Features</span>
            </div>
          </div>
        </div>

        {/* Payment Tabs */}
        <Tabs defaultValue="transfer" className="w-full max-w-6xl mx-auto">
          <TabsList className="tabs-main grid w-full grid-cols-2 mb-8 h-auto">
            <TabsTrigger value="transfer" className="flex items-center gap-3 text-gray-700 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 p-4 h-auto flex-col space-y-1">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                <span className="font-semibold">Send Tokens</span>
              </div>
              <span className="text-xs opacity-80">Transfer to .sw names</span>
            </TabsTrigger>
            <TabsTrigger value="qr-pay" className="flex items-center gap-3 text-gray-700 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 p-4 h-auto flex-col space-y-1">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                <span className="font-semibold">QR Payment</span>
              </div>
              <span className="text-xs opacity-80">Generate & scan QR codes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transfer" className="w-full mt-8">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Send Tokens by Name</h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  Send tokens to any .sw name across supported networks
                </p>
              </div>
              <CrossChainSendTokens />
            </div>
          </TabsContent>

          <TabsContent value="qr-pay" className="w-full mt-8">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">QR Code Payments</h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  Generate payment QR codes or scan to pay instantly
                </p>
              </div>
              <SmartVersePay />
            </div>
          </TabsContent>
        </Tabs>

        {/* Payment Features Info */}
        <div className="mt-12 sm:mt-16 space-y-6">
          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <Zap className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="text-gray-900 font-semibold mb-2">Instant Transfers</h3>
              <p className="text-gray-600 text-sm">Send tokens instantly using simple .sw names instead of complex addresses</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <Shield className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <h3 className="text-gray-900 font-semibold mb-2">Secure Payments</h3>
              <p className="text-gray-600 text-sm">All transactions are secured by blockchain technology and smart contracts</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <Smartphone className="w-8 h-8 text-cyan-600 mx-auto mb-3" />
              <h3 className="text-gray-900 font-semibold mb-2">Mobile Friendly</h3>
              <p className="text-gray-600 text-sm">QR codes make payments easy on mobile devices with camera scanning</p>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="text-center space-y-4">
              <QrCode className="w-8 h-8 text-blue-600 mx-auto" />
              <h3 className="text-lg font-semibold text-gray-900">How SmartVerse Pay Works</h3>
              <div className="grid sm:grid-cols-2 gap-6 text-left">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-blue-700 font-medium text-sm">Send Tokens:</div>
                    <div className="text-gray-600 text-sm">
                      • Enter a .sw name as the recipient<br/>
                      • Choose the token and amount<br/>
                      • Select the network and confirm<br/>
                      • Transaction sent instantly
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-cyan-700 font-medium text-sm">QR Payments:</div>
                    <div className="text-gray-600 text-sm">
                      • Generate QR for your address<br/>
                      • Create payment request QRs<br/>
                      • Scan QR codes to pay<br/>
                      • Import custom tokens via QR
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
