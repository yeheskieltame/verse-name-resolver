import React from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  CalendarIcon, 
  ArrowUpRight, 
  ArrowDownRight,
  ExternalLink,
  CheckCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { BusinessTransaction } from '../services/smartVerseBusiness';
import { BUSINESS_CONTRACTS } from '../contracts/BusinessContracts';

interface TransactionInvoiceProps {
  transaction: BusinessTransaction;
  onClose: () => void;
  onPrint?: () => void;
}

const TransactionInvoice: React.FC<TransactionInvoiceProps> = ({ 
  transaction, 
  onClose,
  onPrint
}) => {
  // Format timestamp ke format yang mudah dibaca
  const formattedDate = format(new Date(transaction.timestamp * 1000), 'dd MMMM yyyy, HH:mm', { locale: id });
  const timeAgo = formatDistanceToNow(new Date(transaction.timestamp * 1000), { addSuffix: true, locale: id });
  
  // Cari explorer URL berdasarkan chainId
  const getExplorerUrl = (chainId: number, txHash: string) => {
    const chainConfig = Object.values(BUSINESS_CONTRACTS).find(c => c.chainId === chainId);
    if (!chainConfig || !txHash) return '#';
    return `${chainConfig.explorer}/tx/${txHash}`;
  };

  // Format address untuk tampilan
  const formatAddress = (address: string) => {
    if (!address) return '-';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Card className="max-w-3xl mx-auto border-2 shadow-lg print:shadow-none print:border">
      <CardHeader className="bg-gray-50 border-b print:bg-white">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">
            BUKTI TRANSAKSI #{transaction.id.padStart(4, '0')}
          </CardTitle>
          <div className="flex items-center gap-2 print:hidden">
            {onPrint && (
              <Button variant="outline" size="sm" onClick={onPrint}>
                Cetak
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Untuk Akun Bisnis Anda
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Status & Waktu */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-500 h-5 w-5" />
            <span className="font-medium">Status:</span>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              ✅ Berhasil di Blockchain
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-gray-500" />
            <span className="font-medium">Waktu:</span>
            <span>{formattedDate}</span>
            <span className="text-sm text-muted-foreground">({timeAgo})</span>
          </div>
          
          {transaction.txHash && (
            <div className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-gray-500" />
              <span className="font-medium">Hash Transaksi:</span>
              <a 
                href={getExplorerUrl(transaction.chainId, transaction.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center"
              >
                {formatAddress(transaction.txHash)} 
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </a>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="border-t border-dashed my-4"></div>
        
        {/* Jenis & Kategori */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-medium">Jenis:</span>
            <Badge className={transaction.isIncome ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
              {transaction.isIncome ? 'PEMASUKAN' : 'PENGELUARAN'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="font-medium">Kategori:</span>
            <span>{transaction.category || 'Umum'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {transaction.isIncome ? 'Dari:' : 'Kepada:'}
            </span>
            <a 
              href={getExplorerUrl(transaction.chainId, transaction.isIncome ? transaction.from : transaction.to)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {formatAddress(transaction.isIncome ? transaction.from : transaction.to)}
            </a>
          </div>
        </div>
        
        {/* Rincian Pembayaran */}
        <div className="mt-6">
          <h3 className="text-md font-semibold mb-3">Rincian Pembayaran</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Aset:</span>
              <span className="font-medium">
                {transaction.isToken ? transaction.tokenSymbol : 'ETH (Native)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Jumlah:</span>
              <span className="text-xl font-bold">
                {transaction.isToken ? 'Rp ' : ''}{transaction.amount}
              </span>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-6 pt-4 border-t">
          Invoice ini dibuat secara otomatis dari data blockchain dan merupakan bukti transaksi yang valid.
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionInvoice;
