import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { paymentService } from '@/lib/payment';
import { PenaltyRecord, PenaltyPayment, PenaltyPaymentFormData } from '@/types';
import { CreditCard, Calendar, DollarSign, Upload, Receipt, Smartphone, Building2, Wallet } from 'lucide-react';

interface PenaltyPaymentProps {
  roomId: number;
  userId: number;
}

export const PenaltyPaymentComponent: React.FC<PenaltyPaymentProps> = ({ roomId, userId }) => {
  const [penaltyRecords, setPenaltyRecords] = useState<PenaltyRecord[]>([]);
  const [penaltyPayments, setPenaltyPayments] = useState<{ [key: number]: PenaltyPayment[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PenaltyRecord | null>(null);
  const [formData, setFormData] = useState<PenaltyPaymentFormData>({
    penaltyRecordId: 0,
    amount: 0,
    paymentMethod: 'BANK_TRANSFER',
    paymentDate: new Date().toISOString().split('T')[0],
    proofImage: undefined,
    notes: ''
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadPenaltyRecords = async () => {
    try {
      setIsLoading(true);
      const records = await api.getPenaltyRecords(roomId) as PenaltyRecord[];
      setPenaltyRecords(records);
      
      // 각 벌금 기록에 대한 납부 내역도 로드
      for (const record of records) {
        try {
          const payments = await api.getPenaltyPayments(record.id) as PenaltyPayment[];
          setPenaltyPayments(prev => ({ ...prev, [record.id]: payments }));
        } catch (error) {
          // 납부 내역이 없는 경우는 정상
          setPenaltyPayments(prev => ({ ...prev, [record.id]: [] }));
        }
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '벌금 기록을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
    };
    
    loadPenaltyRecords();
  }, [roomId, toast]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRecord) return;

    // 토스페이먼츠 결제 처리
    if (formData.paymentMethod.startsWith('TOSS_')) {
      await handleTossPayment();
      return;
    }

    // 기존 결제 처리 (수동 납부)
    try {
      await api.payPenalty(
        selectedRecord.id,
        {
          amount: formData.amount,
          paymentMethod: formData.paymentMethod,
          paymentDate: formData.paymentDate,
          notes: formData.notes
        },
        formData.proofImage
      );

      toast({
        title: '성공',
        description: '벌금 납부가 완료되었습니다.',
      });

      setIsDialogOpen(false);
      setSelectedRecord(null);
      setFormData({
        penaltyRecordId: 0,
        amount: 0,
        paymentMethod: 'BANK_TRANSFER',
        paymentDate: new Date().toISOString().split('T')[0],
        proofImage: undefined,
        notes: ''
      });
      
      // 데이터 다시 로드
      window.location.reload();
    } catch (error) {
      toast({
        title: '오류',
        description: error.message || '벌금 납부에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleTossPayment = async () => {
    if (!selectedRecord) return;

    setIsProcessingPayment(true);
    
    try {
      // 주문 ID 생성
      const orderId = paymentService.generateOrderId();
      
      // 백엔드에 주문 생성
      await api.createPaymentOrder(selectedRecord.id, formData.amount, orderId);
      
      // URL 생성
      const urls = paymentService.generateUrls(orderId);
      
      // 토스페이먼츠 결제 요청
      const paymentMethod = formData.paymentMethod.replace('TOSS_', '').toLowerCase();
      
      const paymentRequest = {
        amount: formData.amount,
        orderName: `벌금 납부 - ${new Date(selectedRecord.weekStartDate).toLocaleDateString()} ~ ${new Date(selectedRecord.weekEndDate).toLocaleDateString()}`,
        customerName: '회원',
        customerEmail: 'member@example.com',
        orderId,
        successUrl: urls.successUrl,
        failUrl: urls.failUrl,
      };

      switch (paymentMethod) {
        case 'card':
          await paymentService.requestPayment(paymentRequest);
          break;
        case 'bank':
          await paymentService.requestBankTransfer(paymentRequest);
          break;
        case 'virtual':
          await paymentService.requestVirtualAccount(paymentRequest);
          break;
        case 'mobile':
          await paymentService.requestMobilePayment(paymentRequest);
          break;
        default:
          await paymentService.requestPayment(paymentRequest);
      }

      // 결제 창이 열리므로 여기서는 성공 메시지만 표시
      toast({
        title: '결제 진행',
        description: '결제 창이 열렸습니다. 결제를 완료해주세요.',
      });

    } catch (error) {
      console.error('토스페이먼츠 결제 실패:', error);
      toast({
        title: '결제 실패',
        description: error.message || '결제 요청에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const openPaymentDialog = (record: PenaltyRecord) => {
    setSelectedRecord(record);
    setFormData(prev => ({
      ...prev,
      penaltyRecordId: record.id,
      amount: record.penaltyAmount
    }));
    setIsDialogOpen(true);
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

  const getRemainingAmount = (record: PenaltyRecord) => {
    const payments = penaltyPayments[record.id] || [];
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    return Math.max(0, record.penaltyAmount - totalPaid);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            벌금 납부
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          벌금 납부
        </CardTitle>
      </CardHeader>
      <CardContent>
        {penaltyRecords.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">납부할 벌금이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {penaltyRecords.map((record) => {
              const paymentStatus = getPaymentStatus(record);
              const remainingAmount = getRemainingAmount(record);
              const payments = penaltyPayments[record.id] || [];

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

                  {remainingAmount > 0 && (
                    <Dialog open={isDialogOpen && selectedRecord?.id === record.id} onOpenChange={(open) => {
                      setIsDialogOpen(open);
                      if (!open) {
                        setSelectedRecord(null);
                        setFormData({
                          penaltyRecordId: 0,
                          amount: 0,
                          paymentMethod: 'BANK_TRANSFER',
                          paymentDate: new Date().toISOString().split('T')[0],
                          proofImage: undefined,
                          notes: ''
                        });
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button onClick={() => openPaymentDialog(record)}>
                          <CreditCard className="h-4 w-4 mr-1" />
                          벌금 납부
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>벌금 납부</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handlePayment} className="space-y-4">
                          <div>
                            <Label htmlFor="amount">납부 금액</Label>
                            <Input
                              id="amount"
                              type="number"
                              value={formData.amount}
                              onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                              min="1"
                              max={remainingAmount}
                              required
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              최대 {remainingAmount.toLocaleString()}원까지 납부 가능
                            </p>
                          </div>

                          <div>
                            <Label htmlFor="paymentMethod">납부 방법</Label>
                            <Select
                              value={formData.paymentMethod}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value as any }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="BANK_TRANSFER">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    계좌이체 (수동)
                                  </div>
                                </SelectItem>
                                <SelectItem value="TOSS_CARD">
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-blue-500" />
                                    토스페이먼츠 - 카드
                                  </div>
                                </SelectItem>
                                <SelectItem value="TOSS_BANK">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-blue-500" />
                                    토스페이먼츠 - 계좌이체
                                  </div>
                                </SelectItem>
                                <SelectItem value="TOSS_VIRTUAL">
                                  <div className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4 text-blue-500" />
                                    토스페이먼츠 - 가상계좌
                                  </div>
                                </SelectItem>
                                <SelectItem value="TOSS_MOBILE">
                                  <div className="flex items-center gap-2">
                                    <Smartphone className="h-4 w-4 text-blue-500" />
                                    토스페이먼츠 - 휴대폰
                                  </div>
                                </SelectItem>
                                <SelectItem value="CASH">현금</SelectItem>
                                <SelectItem value="OTHER">기타</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {!formData.paymentMethod.startsWith('TOSS_') && (
                            <>
                              <div>
                                <Label htmlFor="paymentDate">납부 일자</Label>
                                <Input
                                  id="paymentDate"
                                  type="date"
                                  value={formData.paymentDate}
                                  onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                                  required
                                />
                              </div>

                              <div>
                                <Label htmlFor="proofImage">납부 증빙 (선택)</Label>
                                <Input
                                  id="proofImage"
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => setFormData(prev => ({ ...prev, proofImage: e.target.files?.[0] }))}
                                />
                              </div>

                              <div>
                                <Label htmlFor="notes">메모 (선택)</Label>
                                <Textarea
                                  id="notes"
                                  value={formData.notes}
                                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                  placeholder="납부 관련 메모를 입력하세요"
                                  rows={3}
                                />
                              </div>
                            </>
                          )}

                          {formData.paymentMethod.startsWith('TOSS_') && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="flex items-center gap-2 text-blue-700 mb-2">
                                <CreditCard className="h-4 w-4" />
                                <span className="font-medium">토스페이먼츠 결제</span>
                              </div>
                              <p className="text-sm text-blue-600">
                                토스페이먼츠를 통해 안전하게 결제하실 수 있습니다. 
                                결제 버튼을 클릭하면 토스페이먼츠 결제 창이 열립니다.
                              </p>
                            </div>
                          )}

                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                              취소
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={isProcessingPayment}
                              className={formData.paymentMethod.startsWith('TOSS_') ? 'bg-blue-600 hover:bg-blue-700' : ''}
                            >
                              {isProcessingPayment ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                                  처리 중...
                                </>
                              ) : (
                                <>
                                  {formData.paymentMethod.startsWith('TOSS_') ? (
                                    <CreditCard className="h-4 w-4 mr-1" />
                                  ) : (
                                    <DollarSign className="h-4 w-4 mr-1" />
                                  )}
                                  {formData.paymentMethod.startsWith('TOSS_') ? '토스페이먼츠로 결제' : '납부하기'}
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PenaltyPaymentComponent;