import { loadTossPayments } from '@tosspayments/payment-sdk';

export interface PaymentRequest {
  amount: number;
  orderName: string;
  customerName?: string;
  customerEmail?: string;
  orderId: string;
  successUrl: string;
  failUrl: string;
}

export interface PaymentMethod {
  method: '카드' | '계좌이체' | '가상계좌' | '휴대폰';
  label: string;
}

export class PaymentService {
  private clientKey: string;
  private tossPayments: any;

  constructor() {
    // 환경변수에서 클라이언트 키를 가져옵니다
    this.clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY || 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm';
  }

  private async initializeTossPayments() {
    if (!this.tossPayments) {
      this.tossPayments = await loadTossPayments(this.clientKey);
    }
    return this.tossPayments;
  }

  async requestPayment(paymentRequest: PaymentRequest) {
    try {
      const tossPayments = await this.initializeTossPayments();

      await tossPayments.requestPayment('카드', {
        amount: paymentRequest.amount,
        orderId: paymentRequest.orderId,
        orderName: paymentRequest.orderName,
        customerName: paymentRequest.customerName || '고객',
        customerEmail: paymentRequest.customerEmail || 'customer@example.com',
        successUrl: paymentRequest.successUrl,
        failUrl: paymentRequest.failUrl,
      });
    } catch (error) {
      console.error('결제 요청 실패:', error);
      throw error;
    }
  }

  async requestBankTransfer(paymentRequest: PaymentRequest) {
    try {
      const tossPayments = await this.initializeTossPayments();

      await tossPayments.requestPayment('계좌이체', {
        amount: paymentRequest.amount,
        orderId: paymentRequest.orderId,
        orderName: paymentRequest.orderName,
        customerName: paymentRequest.customerName || '고객',
        customerEmail: paymentRequest.customerEmail || 'customer@example.com',
        successUrl: paymentRequest.successUrl,
        failUrl: paymentRequest.failUrl,
        bank: '국민은행', // 기본 은행
      });
    } catch (error) {
      console.error('계좌이체 요청 실패:', error);
      throw error;
    }
  }

  async requestVirtualAccount(paymentRequest: PaymentRequest) {
    try {
      const tossPayments = await this.initializeTossPayments();

      await tossPayments.requestPayment('가상계좌', {
        amount: paymentRequest.amount,
        orderId: paymentRequest.orderId,
        orderName: paymentRequest.orderName,
        customerName: paymentRequest.customerName || '고객',
        customerEmail: paymentRequest.customerEmail || 'customer@example.com',
        successUrl: paymentRequest.successUrl,
        failUrl: paymentRequest.failUrl,
        validHours: 24, // 24시간 유효
        cashReceipt: {
          type: '소득공제',
        },
      });
    } catch (error) {
      console.error('가상계좌 요청 실패:', error);
      throw error;
    }
  }

  async requestMobilePayment(paymentRequest: PaymentRequest) {
    try {
      const tossPayments = await this.initializeTossPayments();

      await tossPayments.requestPayment('휴대폰', {
        amount: paymentRequest.amount,
        orderId: paymentRequest.orderId,
        orderName: paymentRequest.orderName,
        customerName: paymentRequest.customerName || '고객',
        customerEmail: paymentRequest.customerEmail || 'customer@example.com',
        successUrl: paymentRequest.successUrl,
        failUrl: paymentRequest.failUrl,
      });
    } catch (error) {
      console.error('휴대폰 결제 요청 실패:', error);
      throw error;
    }
  }

  // 결제 승인 (백엔드에서 호출)
  async confirmPayment(paymentKey: string, orderId: string, amount: number) {
    try {
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
        }),
      });

      if (!response.ok) {
        throw new Error('결제 승인 실패');
      }

      return await response.json();
    } catch (error) {
      console.error('결제 승인 실패:', error);
      throw error;
    }
  }

  // 주문 ID 생성
  generateOrderId(): string {
    return `penalty_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 성공/실패 URL 생성
  generateUrls(orderId: string) {
    const baseUrl = window.location.origin;
    return {
      successUrl: `${baseUrl}/payment/success?orderId=${orderId}`,
      failUrl: `${baseUrl}/payment/fail?orderId=${orderId}`,
    };
  }
}

export const paymentService = new PaymentService();

