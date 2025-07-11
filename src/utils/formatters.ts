import { format, formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

export const formatAddress = (address: string): string => {
  if (!address) return '-';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return format(date, 'dd MMMM yyyy, HH:mm', { locale: id });
};

export const formatTimeAgo = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return formatDistanceToNow(date, { addSuffix: true, locale: id });
};

export const formatCurrency = (amount: string, isToken: boolean): string => {
  // For IDRT tokens, format with Rp prefix
  if (isToken) {
    return `Rp ${parseFloat(amount).toLocaleString('id-ID', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }
  
  // For ETH, format with ETH suffix
  return `${parseFloat(amount).toLocaleString('id-ID', { 
    minimumFractionDigits: 6, 
    maximumFractionDigits: 6 
  })} ETH`;
};

export const getTransactionIcon = (isIncome: boolean) => {
  return isIncome ? "arrow-down-right" : "arrow-up-right";
};

export const getTransactionTypeLabel = (isIncome: boolean) => {
  return isIncome ? "Pemasukan" : "Pengeluaran";
};

export const getTransactionColor = (isIncome: boolean) => {
  return isIncome ? "text-green-600" : "text-red-600";
};

export const getTransactionBadgeColor = (isIncome: boolean) => {
  return isIncome 
    ? "bg-green-100 text-green-800 hover:bg-green-200" 
    : "bg-red-100 text-red-800 hover:bg-red-200";
};
