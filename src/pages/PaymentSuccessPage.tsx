import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { CheckCircle, ArrowLeft, CreditCard } from 'lucide-react';

export const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);

  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  useEffect(() => {
    const confirmPayment = async () => {
      if (!paymentKey || !orderId || !amount) {
        toast({
          title: '오류',
          description: '결제 정보가 올바르지 않습니다.',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }

      try {
        setIsProcessing(true);
        
        // 백엔드에서 결제 승인 처리
        const result = await api.confirmPayment(paymentKey, orderId, parseInt(amount));
        setPaymentData(result);
        
        toast({
          title: '결제 완료',
          description: '벌금 납부가 성공적으로 완료되었습니다.',
        });
        
      } catch (error) {
        console.error('결제 승인 실패:', error);
        toast({
          title: '결제 승인 실패',
          description: '결제 승인에 실패했습니다. 고객센터에 문의해주세요.',
          variant: 'destructive',
        });
      } finally {
        setIsProcessing(false);
      }
    };

    confirmPayment();
  }, [paymentKey, orderId, amount, toast, navigate]);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">결제 처리 중</h3>
              <p className="text-gray-600">결제를 확인하고 있습니다. 잠시만 기다려주세요.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">결제 완료</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {paymentData && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <CreditCard className="h-4 w-4" />
                  <span className="font-medium">결제 정보</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">주문번호:</span>
                    <span className="font-mono">{orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">결제금액:</span>
                    <span className="font-medium">{parseInt(amount || '0').toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">결제일시:</span>
                    <span>{new Date().toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="text-center space-y-4">
            <p className="text-gray-600">
              벌금 납부가 성공적으로 완료되었습니다.
              <br />
              결제 내역은 벌금 납부 페이지에서 확인하실 수 있습니다.
            </p>
            
            <Button onClick={handleBackToDashboard} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              대시보드로 돌아가기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;

