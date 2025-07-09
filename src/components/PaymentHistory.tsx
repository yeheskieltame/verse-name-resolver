import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  QrCode, 
  Download, 
  Clock, 
  CheckCircle, 
  XCircle,
  RefreshCw
} from 'lucide-react';
import { BusinessDataManager, PaymentRequest } from '../services/businessDataManager';
import { formatDistanceToNow } from 'date-fns';

interface PaymentHistoryProps {
  vaultAddress: string;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ vaultAddress }) => {
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalAmount: 0,
    completedPayments: 0,
    pendingPayments: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPaymentData();
  }, [vaultAddress]);

  const loadPaymentData = () => {
    setIsLoading(true);
    try {
      // Cleanup expired requests first
      BusinessDataManager.cleanupExpiredRequests();
      
      // Get statistics
      const statistics = BusinessDataManager.getPaymentStatistics(vaultAddress);
      setStats({
        totalPayments: statistics.totalPayments,
        totalAmount: statistics.totalAmount,
        completedPayments: statistics.completedPayments,
        pendingPayments: statistics.pendingPayments
      });
      
      // Get recent payments
      setPayments(statistics.recentPayments);
    } catch (error) {
      console.error('Error loading payment data:', error);
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
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
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
              Riwayat Pembayaran QR
            </CardTitle>
            <CardDescription>
              Riwayat permintaan pembayaran QR yang telah dibuat
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
            <p className="text-sm text-purple-600 font-medium">Total Amount</p>
            <p className="text-xl font-bold">{stats.totalAmount.toFixed(4)} ETH</p>
          </div>
        </div>

        {/* Payment List */}
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
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentHistory;
