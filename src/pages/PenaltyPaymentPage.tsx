import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PaymentWidget } from '@/components/PaymentWidget';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { PenaltyRecord, PenaltyUnpaidSummary } from '@/types';

export const PenaltyPaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { member } = useAuth();
  
  const [penaltyRecords, setPenaltyRecords] = useState<PenaltyRecord[]>([]);
  const [unpaidSummary, setUnpaidSummary] = useState<PenaltyUnpaidSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPaymentWidget, setShowPaymentWidget] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [isPaying, setIsPaying] = useState(false);

  // URL 파라미터에서 roomId 가져오기
  const roomId = new URLSearchParams(location.search).get('roomId');

  const loadPenaltyData = useCallback(async () => {
    if (!member) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      if (roomId) {
        // 특정 방의 벌금 조회
        const summary = await api.getUnpaidPenaltySummary(Number(roomId)) as PenaltyUnpaidSummary;
        setUnpaidSummary(summary);
        setPenaltyRecords(summary.records || []);
      } else {
        // 전체 벌금 조회
        const summary = await api.getAllUnpaidPenaltySummary() as PenaltyUnpaidSummary;
        setUnpaidSummary(summary);
        setPenaltyRecords(summary.records || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '벌금 정보를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [member, roomId]);

  useEffect(() => {
    loadPenaltyData();
  }, [loadPenaltyData]);

  const handlePayment = (amount: number) => {
    if (!member) return;
    
    setSelectedAmount(amount);
    setShowPaymentWidget(true);
  };

  const handlePaymentSuccess = async (paymentKey: string, orderId: string, amount: number) => {
    setIsPaying(true);
    
    try {
      // 서버에 결제 완료 알림
      if (roomId) {
        await api.payPenalty(Number(roomId), {
          amount,
          penaltyRecordIds: penaltyRecords.map(r => r.id),
        });
      } else {
        await api.payAllPenalty({
          amount,
          paymentKey,
          orderId,
          penaltyRecordIds: penaltyRecords.map(r => r.id),
        });
      }
      
      // 벌금 데이터 새로고침
      await loadPenaltyData();
      
      // 결제 위젯 닫기
      setShowPaymentWidget(false);
      setSelectedAmount(0);
      
      // 성공 메시지 표시 (토스트 등)
      alert('결제가 완료되었습니다.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '결제 처리 중 오류가 발생했습니다.');
    } finally {
      setIsPaying(false);
    }
  };

  const handlePaymentFail = (error: unknown) => {
    const message = error instanceof Error
      ? error.message
      : (typeof error === 'string' ? error : '결제에 실패했습니다.');
    setError(message);
    setShowPaymentWidget(false);
    setSelectedAmount(0);
  };

  const handlePaymentCancel = () => {
    setShowPaymentWidget(false);
    setSelectedAmount(0);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>벌금 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            돌아가기
          </Button>
        </div>
      </div>
    );
  }

  if (!unpaidSummary || unpaidSummary.totalUnpaidAmount === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">납부할 벌금이 없습니다</h2>
              <p className="text-gray-600 mb-6">
                현재 납부해야 할 벌금이 없습니다.
              </p>
              <Button onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                돌아가기
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">벌금 납부</h1>
            <p className="text-gray-600 mt-2">
              미납된 벌금을 확인하고 결제하세요
            </p>
          </div>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            돌아가기
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 벌금 요약 */}
          <Card>
            <CardHeader>
              <CardTitle>납부 요약</CardTitle>
              <CardDescription>
                미납된 벌금 현황을 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">미납 건수</span>
                <Badge variant="destructive">
                  {unpaidSummary.unpaidCount}건
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">총 미납 금액</span>
                <span className="text-lg font-bold text-red-600">
                  {formatAmount(unpaidSummary.totalUnpaidAmount)}원
                </span>
              </div>
              <Separator />
              <Button
                onClick={() => handlePayment(unpaidSummary.totalUnpaidAmount)}
                className="w-full"
                size="lg"
                disabled={isPaying}
              >
                전체 납부하기 ({formatAmount(unpaidSummary.totalUnpaidAmount)}원)
              </Button>
            </CardContent>
          </Card>

          {/* 벌금 상세 내역 */}
          <Card>
            <CardHeader>
              <CardTitle>벌금 상세 내역</CardTitle>
              <CardDescription>
                미납된 벌금의 상세 정보입니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {penaltyRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {formatDate(record.weekStartDate)} ~ {formatDate(record.weekEndDate)}
                      </div>
                      <div className="text-xs text-gray-500">
                        목표: {record.requiredWorkouts}회 / 실제: {record.actualWorkouts}회
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-600">
                        {formatAmount(record.penaltyAmount)}원
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePayment(record.penaltyAmount)}
                        disabled={isPaying}
                      >
                        납부
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 결제 위젯 모달 */}
        {showPaymentWidget && member && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <PaymentWidget
                amount={selectedAmount}
                orderName={`벌금 납부 - ${member.nickname}`}
                customerName={member.nickname}
                customerEmail={member.email}
                roomId={roomId ? Number(roomId) : undefined}
                penaltyRecordIds={penaltyRecords.map(r => r.id)}
                onSuccess={handlePaymentSuccess}
                onFail={handlePaymentFail}
                onCancel={handlePaymentCancel}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PenaltyPaymentPage;
