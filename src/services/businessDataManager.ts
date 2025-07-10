// Business Data Management
// Karena smart contract belum mendukung penyimpanan nama bisnis,
// kita akan menggunakan localStorage untuk menyimpan informasi bisnis

export interface BusinessInfo {
  vaultAddress: string;
  businessName: string;
  category: string;
  description: string;
  ownerName: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: number;
  chainId: number;
}

export interface PaymentRequest {
  id: string;
  businessVaultAddress: string;
  businessName: string;
  amount: string;
  currency: 'ETH' | 'IDRT';
  description: string;
  isBusinessTransaction: boolean;
  tokenAddress?: string; // tambahkan untuk pembayaran token
  transactionRecorded?: boolean; // flag untuk menandai apakah transaksi sudah tercatat di blockchain
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  productInfo?: {
    name: string;
    quantity: number;
    price: string;
  }[];
  createdAt: number;
  expiresAt: number;
  status: 'pending' | 'processing' | 'success' | 'failed';
}

const BUSINESS_STORAGE_KEY = 'smartverse_business_info';
const PAYMENT_REQUESTS_KEY = 'smartverse_payment_requests';

export class BusinessDataManager {
  
  // Business Info Management
  static saveBusinessInfo(info: BusinessInfo): void {
    const existingData = this.getAllBusinessInfo();
    const key = `${info.vaultAddress}_${info.chainId}`;
    existingData[key] = info;
    localStorage.setItem(BUSINESS_STORAGE_KEY, JSON.stringify(existingData));
  }

  static getBusinessInfo(vaultAddress: string, chainId: number): BusinessInfo | null {
    const key = `${vaultAddress}_${chainId}`;
    const data = this.getAllBusinessInfo();
    return data[key] || null;
  }

  static getAllBusinessInfo(): Record<string, BusinessInfo> {
    const data = localStorage.getItem(BUSINESS_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }

  static updateBusinessInfo(vaultAddress: string, chainId: number, updates: Partial<BusinessInfo>): void {
    const existing = this.getBusinessInfo(vaultAddress, chainId);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.saveBusinessInfo(updated);
    }
  }

  // Payment Request Management
  static createPaymentRequest(request: PaymentRequest): string {
    const requests = this.getAllPaymentRequests();
    requests[request.id] = request;
    localStorage.setItem(PAYMENT_REQUESTS_KEY, JSON.stringify(requests));
    return request.id;
  }

  static getAllPaymentRequests(): Record<string, PaymentRequest> {
    try {
      const data = localStorage.getItem(PAYMENT_REQUESTS_KEY);
      if (!data) {
        return {};
      }
      
      const parsedData = JSON.parse(data);
      
      // Validate data structure
      if (typeof parsedData !== 'object' || parsedData === null) {
        console.error('Payment requests data is not an object:', parsedData);
        return {};
      }
      
      return parsedData;
    } catch (error) {
      console.error('Error getting payment requests:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
      }
      
      // Reset storage if corrupted
      if (error instanceof SyntaxError) {
        console.warn('Payment requests data corrupted, resetting storage');
        localStorage.removeItem(PAYMENT_REQUESTS_KEY);
      }
      
      return {};
    }
  }

  static getPaymentRequest(id: string): PaymentRequest | null {
    const requests = this.getAllPaymentRequests();
    return requests[id] ?? null;
  }

  // Generate unique payment ID
  static generatePaymentId(): string {
    return 'pay_' + Math.random().toString(36).substr(2, 9) + Date.now();
  }

  // Generate QR data string (bisa diubah sesuai kebutuhan encoding)
  static generatePaymentQRData(request: PaymentRequest): string {
    return JSON.stringify(request);
  }

  // Update payment request (status, dsb)
  static updatePaymentRequest(id: string, updates: Partial<PaymentRequest>): boolean {
    try {
      const requests = this.getAllPaymentRequests();
      if (!requests[id]) {
        console.error(`Payment request with ID ${id} not found`);
        return false;
      }
      
      // Log status transition for debugging
      if (updates.status && updates.status !== requests[id].status) {
        console.log(`Payment status transition for ${id}: ${requests[id].status} -> ${updates.status}`);
      }
      
      // If status is changing to success, mark as recorded on blockchain
      if (updates.status === 'success' && requests[id].status !== 'success') {
        updates.transactionRecorded = true;
      }
      
      requests[id] = { ...requests[id], ...updates };
      localStorage.setItem(PAYMENT_REQUESTS_KEY, JSON.stringify(requests));
      return true;
    } catch (error) {
      console.error('Error updating payment request:', error);
      console.error('Request ID:', id);
      console.error('Updates:', updates);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
      }
      return false;
    }
  }

  // Cleanup expired requests
  static cleanupExpiredRequests(): void {
    const requests = this.getAllPaymentRequests();
    const now = Date.now();
    Object.keys(requests).forEach(id => {
      if (requests[id].expiresAt < now) {
        delete requests[id];
      }
    });
    localStorage.setItem(PAYMENT_REQUESTS_KEY, JSON.stringify(requests));
  }

  // Get payment statistics (contoh: total, completed, expired)
  static getPaymentStatistics(): { total: number; completed: number; expired: number } {
    const requests = this.getAllPaymentRequests();
    let total = 0, completed = 0, expired = 0;
    Object.values(requests).forEach(req => {
      total++;
      if (req.status === 'success') completed++;
      // expired status sudah tidak ada, bisa dihapus atau diganti jika perlu
    });
    return { total, completed, expired: 0 };
  }
}
