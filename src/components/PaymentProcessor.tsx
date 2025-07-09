import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  CreditCard, 
  Store, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ArrowLeft,
  Wallet
} from 'lucide-react';
import { BusinessDataManager, PaymentRequest } from '../services/businessDataManager';
import { smartVerseBusiness } from '../services/smartVerseBusiness';
import { useAccount, useBalance } from 'wagmi';
import { parseEther } from 'viem';

const PaymentProcessor: React.FC = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  // Get ETH balance
  const { data: balance } = useBalance({
    address: address,
  });

  useEffect(() => {
    if (paymentId) {
      loadPaymentRequest();
    }
  }, [paymentId]);

  useEffect(() => {
    // Check if payment is expired
    if (paymentRequest) {
      const checkExpiry = () => {
        const now = Date.now();
        setIsExpired(now > paymentRequest.expiresAt);
      };
      
      checkExpiry();
      const interval = setInterval(checkExpiry, 1000);
      return () => clearInterval(interval);
    }
  }, [paymentRequest]);

  const loadPaymentRequest = () => {
    if (!paymentId) return;
    
    const request = BusinessDataManager.getPaymentRequest(paymentId);
    if (request) {
      setPaymentRequest(request);
      setPaymentStatus(request.status as any);
    } else {
      setErrorMessage('Payment request tidak ditemukan');
    }
  };

  const processPayment = async () => {
    if (!paymentRequest || !address || !isConnected) return;
    
    try {
      setIsProcessing(true);
      setPaymentStatus('processing');
      setErrorMessage('');

      const amountInWei = parseEther(paymentRequest.amount);

      let txHash: string;
      
      if (paymentRequest.isBusinessTransaction) {
        // Business transaction - deposit to vault
        txHash = await smartVerseBusiness.depositToVault(
          paymentRequest.businessVaultAddress,
          amountInWei,
          `Pembayaran: ${paymentRequest.description}`
        );
      } else {
        // Regular transfer - send directly to vault
        txHash = await smartVerseBusiness.sendToVault(
          paymentRequest.businessVaultAddress,
          amountInWei,
          `Transfer: ${paymentRequest.description}`
        );
      }

      // Update payment request status
      BusinessDataManager.updatePaymentRequest(paymentId!, {
        status: 'completed'
      });

      setPaymentStatus('success');
      
      console.log('Payment processed successfully:', {
        paymentId: paymentRequest.id,
        txHash,
        amount: paymentRequest.amount,
        isBusinessTransaction: paymentRequest.isBusinessTransaction
      });

    } catch (error) {
      console.error('Payment processing failed:', error);
      setPaymentStatus('failed');
      setErrorMessage(error instanceof Error ? error.message : 'Pembayaran gagal');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTimeRemaining = (expiresAt: number) => {
    const now = Date.now();
    const remaining = expiresAt - now;
    
    if (remaining <= 0) return 'Sudah expired';
    
    const minutes = Math.floor(remaining / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };

  if (!paymentRequest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Payment Not Found</h2>
            <p className="text-gray-600 mb-4">
              {errorMessage || 'Payment request tidak ditemukan atau sudah expired'}
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Pembayaran Berhasil!</h2>
            <p className="text-gray-600 mb-4">
              Terima kasih sudah melakukan pembayaran ke {paymentRequest.businessName}
            </p>
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <div className="text-sm text-green-800">
                <div className="flex justify-between mb-1">
                  <span>Jumlah:</span>
                  <span className="font-semibold">{paymentRequest.amount} {paymentRequest.currency}</span>
                </div>
                {paymentRequest.description && (
                  <div className="flex justify-between">
                    <span>Deskripsi:</span>
                    <span>{paymentRequest.description}</span>
                  </div>
                )}
              </div>
            </div>
            <Button onClick={() => navigate('/')} className="w-full">
              Selesai
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <Button 
            onClick={() => navigate('/')} 
            variant="outline" 
            size="sm"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pembayaran UMKM
          </h1>
          <p className="text-gray-600">
            Lakukan pembayaran ke {paymentRequest.businessName}
          </p>
        </div>

        <div className="space-y-6">
          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                Detail Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Bisnis:</span>
                <span className="font-semibold">{paymentRequest.businessName}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Jumlah:</span>
                <span className="font-bold text-xl text-green-600">
                  {paymentRequest.amount} {paymentRequest.currency}
                </span>
              </div>
              
              {paymentRequest.description && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Deskripsi:</span>
                  <span className="font-medium">{paymentRequest.description}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Jenis Transaksi:</span>
                <Badge variant={paymentRequest.isBusinessTransaction ? 'default' : 'secondary'}>
                  {paymentRequest.isBusinessTransaction ? 'Transaksi Bisnis' : 'Transfer Biasa'}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Berlaku hingga:</span>
                <span className={`font-medium ${isExpired ? 'text-red-600' : 'text-orange-600'}`}>
                  {isExpired ? 'Expired' : formatTimeRemaining(paymentRequest.expiresAt)}
                </span>
              </div>
              
              {paymentRequest.productInfo && paymentRequest.productInfo.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Detail Produk:</h4>
                  {paymentRequest.productInfo.map((product, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span>{product.name} (x{product.quantity})</span>
                      <span>{product.price} {paymentRequest.currency}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Status */}
          {isExpired ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Payment request sudah expired. Silakan minta QR code baru kepada merchant.
              </AlertDescription>
            </Alert>
          ) : paymentStatus === 'failed' ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Pembayaran gagal: {errorMessage}
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Wallet Connection */}
          {!isConnected ? (
            <Card>
              <CardContent className="text-center py-8">
                <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Hubungkan Wallet</h3>
                <p className="text-gray-600 mb-4">
                  Untuk melakukan pembayaran, hubungkan wallet Anda terlebih dahulu
                </p>
                <Button onClick={() => {/* Connect wallet logic */}} className="w-full">
                  Hubungkan Wallet
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Proses Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Saldo ETH:</span>
                    <span className="font-semibold">
                      {balance ? `${parseFloat(balance.formatted).toFixed(4)} ETH` : 'Loading...'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Alamat Wallet:</span>
                    <span className="text-sm font-mono">
                      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                    </span>
                  </div>
                </div>

                <Button 
                  onClick={processPayment}
                  disabled={isProcessing || isExpired || paymentStatus === 'success'}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Memproses Pembayaran...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Bayar {paymentRequest.amount} {paymentRequest.currency}
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Pastikan Anda terhubung ke jaringan Sepolia dan memiliki saldo ETH yang cukup
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessor;
