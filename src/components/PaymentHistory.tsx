import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  QrCode, 
  Download, 
  Clock, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink
} from 'lucide-react';
import { BusinessDataManager, PaymentRequest } from '../services/businessDataManager';
import { formatDistanceToNow } from 'date-fns';
import { SmartVerseBusinessService, BusinessTransaction } from '../services/smartVerseBusiness';

interface PaymentHistoryProps {
  vaultAddress: string;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ vaultAddress }) => {
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [blockchainTxs, setBlockchainTxs] = useState<BusinessTransaction[]>([]);
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalAmount: 0,
    completedPayments: 0,
    pendingPayments: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [businessService] = useState(new SmartVerseBusinessService());

  useEffect(() => {
    loadPaymentData();
  }, [vaultAddress]);

  const loadPaymentData = async () => {
    setIsLoading(true);
    try {
      console.log('Loading payment history for vault:', vaultAddress);
      
      // Cleanup expired requests first
      BusinessDataManager.cleanupExpiredRequests();
      
      // Load QR payment requests from local storage
      const allPayments = Object.values(BusinessDataManager.getAllPaymentRequests())
        .filter(p => p.businessVaultAddress === vaultAddress);
      
      console.log(`Found ${allPayments.length} QR payment requests for vault ${vaultAddress}`);
      
      // Load all blockchain transactions
      const blockchainTransactions = await businessService.getBusinessTransactions(vaultAddress as `0x${string}`);
      console.log(`Found ${blockchainTransactions.length} blockchain transactions for vault ${vaultAddress}`);
      
      // Store blockchain transactions for display
      setBlockchainTxs(blockchainTransactions);
      
      // Normalize payment statuses
      const normalizedPayments = allPayments.map(payment => {
        // Ensure payment has valid status
        if (!payment.status || !['pending', 'processing', 'success', 'failed'].includes(payment.status)) {
          console.warn(`Payment ${payment.id} has invalid status: ${payment.status}, setting to pending`);
          payment.status = 'pending';
        }
        
        // Map old 'completed' status to 'success'
        if ((payment.status as string) === 'completed') {
          payment.status = 'success';
        }
        
        // Check if this payment has a matching blockchain transaction
        // This helps update the payment status if it's been completed on chain
        const matchingTx = blockchainTransactions.find(tx => 
          tx.isIncome && 
          tx.description && 
          tx.description.includes(payment.id)
        );
        
        if (matchingTx && payment.status !== 'success') {
          console.log(`Found matching blockchain tx for payment ${payment.id}, updating status to success`);
          payment.status = 'success';
          BusinessDataManager.updatePaymentRequest(payment.id, { status: 'success', transactionRecorded: true });
        }
        
        return payment;
      });
      
      // Calculate statistics
      const totalPayments = normalizedPayments.length;
      let totalAmount = 0;
      
      try {
        totalAmount = normalizedPayments.reduce((sum, p) => {
          const amount = parseFloat(p.amount);
          return isNaN(amount) ? sum : sum + amount;
        }, 0);
      } catch (error) {
        console.error('Error calculating total amount:', error);
        totalAmount = 0;
      }
      
      const completedPayments = normalizedPayments.filter(p => p.status === 'success').length;
      const pendingPayments = normalizedPayments.filter(p => p.status === 'pending').length;
      
      setStats({
        totalPayments,
        totalAmount,
        completedPayments,
        pendingPayments
      });
      
      // Sort by created date, newest first
      const sortedPayments = [...normalizedPayments].sort((a, b) => b.createdAt - a.createdAt);
      setPayments(sortedPayments.slice(0, 10)); // recent 10 payments
      
      console.log('Payment history loaded successfully');
    } catch (error) {
      console.error('Error loading payment data:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
      }
      
      // Set empty state to prevent UI from breaking
      setPayments([]);
      setBlockchainTxs([]);
      setStats({
        totalPayments: 0,
        totalAmount: 0,
        completedPayments: 0,
        pendingPayments: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentStatusBadge = (status: string, expiresAt: number) => {
    const now = Date.now();
    const isExpired = now > expiresAt && status === 'pending';
    
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'completed': // Legacy status
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTimeLabel = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Unknown';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Riwayat Transaksi
            </CardTitle>
            <CardDescription>
              Riwayat permintaan pembayaran QR dan transaksi blockchain
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadPaymentData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Total QR</p>
            <p className="text-xl font-bold">{stats.totalPayments}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Completed</p>
            <p className="text-xl font-bold">{stats.completedPayments}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-600 font-medium">Pending</p>
            <p className="text-xl font-bold">{stats.pendingPayments}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">Blockchain Tx</p>
            <p className="text-xl font-bold">{blockchainTxs.length}</p>
          </div>
        </div>

        {/* Tabs for QR Payments and Blockchain Transactions */}
        <div className="mb-6">
          <Tabs defaultValue="qr-payments">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qr-payments">QR Payments</TabsTrigger>
              <TabsTrigger value="blockchain-tx">Blockchain Transactions</TabsTrigger>
            </TabsList>
            
            {/* QR Payment Requests Tab */}
            <TabsContent value="qr-payments">
              {payments.length === 0 ? (
                <div className="text-center py-8">
                  <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Belum ada permintaan pembayaran QR yang dibuat
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Buat QR pembayaran baru untuk pelanggan Anda
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">
                            {payment.amount} {payment.currency}
                          </p>
                          <p className="text-sm text-gray-600">
                            {payment.description || 'No description'}
                          </p>
                        </div>
                        {getPaymentStatusBadge(payment.status, payment.expiresAt)}
                      </div>
                      
                      <div className="flex justify-between items-center mt-3 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {getTimeLabel(payment.createdAt)}
                        </div>
                        
                        <div>
                          {payment.isBusinessTransaction ? (
                            <Badge variant="outline" className="text-xs">Transaksi Bisnis</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Transfer Biasa</Badge>
                          )}
                        </div>
                      </div>
                      
                      {payment.productInfo && payment.productInfo.length > 0 && (
                        <div className="mt-2 pt-2 border-t text-sm">
                          <p className="font-medium text-xs text-gray-500 mb-1">Produk:</p>
                          {payment.productInfo.map((product, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>{product.name} x{product.quantity}</span>
                              <span>{product.price} {payment.currency}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {payment.customerInfo && payment.customerInfo.name && (
                        <div className="mt-2 pt-2 border-t text-xs text-gray-500">
                          <p>Customer: {payment.customerInfo.name}</p>
                        </div>
                      )}
                      
                      {payment.transactionRecorded && (
                        <div className="mt-2 pt-2 border-t">
                          <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Recorded on Blockchain
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            {/* Blockchain Transactions Tab */}
            <TabsContent value="blockchain-tx">
              {blockchainTxs.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Belum ada transaksi blockchain yang tercatat
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Transaksi akan muncul setelah tercatat di blockchain
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {blockchainTxs.map((tx) => (
                    <div key={tx.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center">
                            {tx.isIncome ? (
                              <ArrowDownLeft className="w-4 h-4 text-green-600 mr-1" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4 text-red-600 mr-1" />
                            )}
                            <p className="font-medium">
                              {tx.amount} {tx.isToken ? tx.tokenSymbol : 'ETH'}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600">
                            {tx.description || `Category: ${tx.category}`}
                          </p>
                        </div>
                        <Badge 
                          className={tx.isIncome ? 
                            "bg-green-100 text-green-800" : 
                            "bg-red-100 text-red-800"
                          }
                        >
                          {tx.isIncome ? 'Income' : 'Expense'}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center mt-3 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(tx.timestamp * 1000).toLocaleString()}
                        </div>
                        
                        <div>
                          <Badge variant="outline" className="text-xs">{tx.category}</Badge>
                        </div>
                      </div>
                      
                      {tx.txHash && (
                        <div className="mt-2 pt-2 border-t text-xs text-gray-500">
                          <a 
                            href={`https://sepolia.etherscan.io/tx/${tx.txHash}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View Transaction
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};
export default PaymentHistory;
