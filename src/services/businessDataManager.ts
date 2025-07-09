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
  status: 'pending' | 'completed' | 'expired';
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

  static getPaymentRequest(id: string): PaymentRequest | null {
    const requests = this.getAllPaymentRequests();
    return requests[id] || null;
  }

  static getAllPaymentRequests(): Record<string, PaymentRequest> {
    const data = localStorage.getItem(PAYMENT_REQUESTS_KEY);
    return data ? JSON.parse(data) : {};
  }

  static updatePaymentRequest(id: string, updates: Partial<PaymentRequest>): void {
    const requests = this.getAllPaymentRequests();
    if (requests[id]) {
      requests[id] = { ...requests[id], ...updates };
      localStorage.setItem(PAYMENT_REQUESTS_KEY, JSON.stringify(requests));
    }
  }

  static getBusinessPaymentRequests(vaultAddress: string): PaymentRequest[] {
    const requests = this.getAllPaymentRequests();
    return Object.values(requests).filter(req => req.businessVaultAddress === vaultAddress);
  }

  // Clean up expired payment requests
  static cleanupExpiredRequests(): void {
    const requests = this.getAllPaymentRequests();
    const now = Date.now();
    const active = Object.fromEntries(
      Object.entries(requests).filter(([_, req]) => req.expiresAt > now)
    );
    localStorage.setItem(PAYMENT_REQUESTS_KEY, JSON.stringify(active));
  }

  // Auto cleanup on load
  static initializeCleanup(): void {
    this.cleanupExpiredRequests();
    // Set up periodic cleanup every 5 minutes
    setInterval(() => {
      this.cleanupExpiredRequests();
    }, 5 * 60 * 1000);
  }

  // Get payment statistics for a business
  static getPaymentStatistics(vaultAddress: string): {
    totalPayments: number;
    totalAmount: number;
    completedPayments: number;
    pendingPayments: number;
    recentPayments: PaymentRequest[];
  } {
    const requests = this.getBusinessPaymentRequests(vaultAddress);
    const completed = requests.filter(r => r.status === 'completed');
    const pending = requests.filter(r => r.status === 'pending');
    const recent = requests
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);

    return {
      totalPayments: requests.length,
      totalAmount: completed.reduce((sum, req) => sum + parseFloat(req.amount), 0),
      completedPayments: completed.length,
      pendingPayments: pending.length,
      recentPayments: recent
    };
  }

  // Generate payment request ID
  static generatePaymentId(): string {
    return `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate QR code data for payment
  static generatePaymentQRData(request: PaymentRequest): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/payment/${request.id}`;
  }
}
