import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { PenaltyAccount, PenaltyRecord, PenaltyPayment } from '@/types';
import { CreditCard, Copy, Check, AlertCircle } from 'lucide-react';

interface PenaltyAccountViewProps {
  roomId: number;
}

export const PenaltyAccountView: React.FC<PenaltyAccountViewProps> = ({ roomId }) => {
  const [penaltyAccount, setPenaltyAccount] = useState<PenaltyAccount | null>(null);
  const [penaltyRecords, setPenaltyRecords] = useState<PenaltyRecord[]>([]);
  const [penaltyPayments, setPenaltyPayments] = useState<{ [key: number]: PenaltyPayment[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // 벌금 계좌 정보 로드
        try {
          const account = await api.getPenaltyAccount(roomId) as PenaltyAccount;
          setPenaltyAccount(account);
        } catch (error) {
          // 계좌가 없는 경우는 정상
          setPenaltyAccount(null);
        }
  
        // 벌금 기록 로드
        try {
          const records = await api.getPenaltyRecords(roomId) as PenaltyRecord[];
          setPenaltyRecords(records);
          
          // 각 벌금 기록에 대한 납부 내역도 로드
          for (const record of records) {
            try {
              const payments = await api.getPenaltyPayments(record.id) as PenaltyPayment[];
              setPenaltyPayments(prev => ({ ...prev, [record.id]: payments }));
            } catch (error) {
              setPenaltyPayments(prev => ({ ...prev, [record.id]: [] }));
            }
          }
        } catch (error) {
          setPenaltyRecords([]);
        }
      } catch (error) {
        toast({
          title: '오류',
          description: '벌금 정보를 불러오는데 실패했습니다.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [roomId, toast]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: '복사됨',
        description: '클립보드에 복사되었습니다.',
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast({
        title: '오류',
        description: '복사에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const getPaymentStatus = (record: PenaltyRecord) => {
    const payments = penaltyPayments[record.id] || [];
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    if (totalPaid >= record.penaltyAmount) {
      return { status: 'paid', text: '납부완료', variant: 'default' as const };
    } else if (totalPaid > 0) {
      return { status: 'partial', text: '부분납부', variant: 'secondary' as const };
    } else {
      return { status: 'unpaid', text: '미납부', variant: 'destructive' as const };
    }
  };

  const getTotalPenaltyAmount = () => {
    return penaltyRecords.reduce((sum, record) => sum + record.penaltyAmount, 0);
  };

  const getTotalPaidAmount = () => {
    return Object.values(penaltyPayments).flat().reduce((sum, payment) => sum + payment.amount, 0);
  };

  const getTotalRemainingAmount = () => {
    return getTotalPenaltyAmount() - getTotalPaidAmount();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            벌금 계좌 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 벌금 계좌 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            벌금 계좌 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          {penaltyAccount ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">은행명</label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm">{penaltyAccount.bankName}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(penaltyAccount.bankName, 'bankName')}
                    >
                      {copiedField === 'bankName' ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">계좌번호</label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm font-mono">{penaltyAccount.accountNumber}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(penaltyAccount.accountNumber, 'accountNumber')}
                    >
                      {copiedField === 'accountNumber' ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">예금주</label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm">{penaltyAccount.accountHolder}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(penaltyAccount.accountHolder, 'accountHolder')}
                    >
                      {copiedField === 'accountHolder' ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">등록된 벌금 계좌가 없습니다.</p>
              <p className="text-sm text-gray-400 mt-2">방장이 벌금 계좌를 등록하면 여기에 표시됩니다.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 벌금 현황 요약 */}
      {penaltyRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>벌금 현황 요약</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">총 벌금</p>
                <p className="text-2xl font-bold text-red-600">
                  {getTotalPenaltyAmount().toLocaleString()}원
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">납부 금액</p>
                <p className="text-2xl font-bold text-green-600">
                  {getTotalPaidAmount().toLocaleString()}원
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">잔여 금액</p>
                <p className="text-2xl font-bold text-orange-600">
                  {getTotalRemainingAmount().toLocaleString()}원
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 벌금 기록 목록 */}
      {penaltyRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>벌금 기록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {penaltyRecords.map((record) => {
                const paymentStatus = getPaymentStatus(record);
                const payments = penaltyPayments[record.id] || [];
                const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
                const remainingAmount = Math.max(0, record.penaltyAmount - totalPaid);

                return (
                  <div key={record.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">
                          {new Date(record.weekStartDate).toLocaleDateString()} ~ {new Date(record.weekEndDate).toLocaleDateString()}
                        </h4>
                        <p className="text-sm text-gray-500">
                          목표 운동: {record.requiredWorkouts}회 / 실제 운동: {record.actualWorkouts}회
                        </p>
                      </div>
                      <Badge variant={paymentStatus.variant}>
                        {paymentStatus.text}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">벌금 금액</p>
                        <p className="font-medium">{record.penaltyAmount.toLocaleString()}원</p>
                      </div>
                      {remainingAmount > 0 && (
                        <div>
                          <p className="text-sm text-gray-500">잔여 금액</p>
                          <p className="font-medium text-red-600">{remainingAmount.toLocaleString()}원</p>
                        </div>
                      )}
                    </div>

                    {payments.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">납부 내역</p>
                        {payments.map((payment) => (
                          <div key={payment.id} className="bg-gray-50 rounded p-3 text-sm">
                            <div className="flex justify-between">
                              <span>{payment.amount.toLocaleString()}원</span>
                              <span className="text-gray-500">
                                {new Date(payment.paymentDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-gray-500">
                              {payment.paymentMethod === 'BANK_TRANSFER' && '계좌이체'}
                              {payment.paymentMethod === 'CASH' && '현금'}
                              {payment.paymentMethod === 'OTHER' && '기타'}
                            </div>
                            {payment.notes && (
                              <div className="text-gray-500 mt-1">{payment.notes}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
