import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export const PaymentFailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const orderId = searchParams.get('orderId');
  const errorCode = searchParams.get('errorCode');
  const errorMessage = searchParams.get('errorMessage');

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleRetryPayment = () => {
    // 결제 페이지로 다시 이동 (실제 구현에서는 결제 정보를 유지하여 재시도)
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">결제 실패</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-700 mb-2">
                <span className="font-medium">결제가 실패했습니다</span>
              </div>
              <div className="space-y-2 text-sm text-red-600">
                {orderId && (
                  <div className="flex justify-between">
                    <span>주문번호:</span>
                    <span className="font-mono">{orderId}</span>
                  </div>
                )}
                {errorCode && (
                  <div className="flex justify-between">
                    <span>오류코드:</span>
                    <span>{errorCode}</span>
                  </div>
                )}
                {errorMessage && (
                  <div>
                    <span className="font-medium">오류 메시지:</span>
                    <p className="mt-1">{errorMessage}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <p className="text-gray-600">
              결제 처리 중 오류가 발생했습니다.
              <br />
              잠시 후 다시 시도해주시거나 다른 결제 방법을 이용해주세요.
            </p>
            
            <div className="space-y-2">
              <Button onClick={handleRetryPayment} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                다시 결제하기
              </Button>
              
              <Button onClick={handleBackToDashboard} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                대시보드로 돌아가기
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentFailPage;

