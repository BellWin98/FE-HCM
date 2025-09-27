import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { PenaltyAccount, PenaltyAccountFormData } from '@/types';
import { Plus, Edit, Trash2, CreditCard, Check, Copy } from 'lucide-react';

interface PenaltyAccountManagerProps {
  roomId: number;
  isOwner: boolean;
}

export const PenaltyAccountManager: React.FC<PenaltyAccountManagerProps> = ({ roomId, isOwner }) => {
  const [penaltyAccount, setPenaltyAccount] = useState<PenaltyAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<PenaltyAccountFormData>({
    bankName: '',
    accountNumber: '',
    accountHolder: ''
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const loadPenaltyAccount = useCallback(async () => {
    try {
      setIsLoading(true);
      const account = await api.getPenaltyAccount(roomId) as PenaltyAccount;
      setPenaltyAccount(account);
    } catch (error) {
      // 계좌가 없는 경우는 에러가 아닐 수 있음
      if (error.message.includes('404') || error.message.includes('not found')) {
        setPenaltyAccount(null);
      } else {
        toast({
          title: '오류',
          description: '벌금 계좌 정보를 불러오는데 실패했습니다.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [roomId, toast]);

  useEffect(() => {
    loadPenaltyAccount();
  }, [loadPenaltyAccount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await api.upsertPenaltyAccount(roomId, formData);
      toast({
        title: '성공',
        description: isEditing ? '벌금 계좌가 수정되었습니다.' : '벌금 계좌가 등록되었습니다.',
      });
      
      setIsDialogOpen(false);
      setIsEditing(false);
      setFormData({ bankName: '', accountNumber: '', accountHolder: '' });
      loadPenaltyAccount();
    } catch (error) {
      toast({
        title: '오류',
        description: error.message || '벌금 계좌 등록/수정에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = () => {
    if (penaltyAccount) {
      setFormData({
        bankName: penaltyAccount.bankName,
        accountNumber: penaltyAccount.accountNumber,
        accountHolder: penaltyAccount.accountHolder
      });
      setIsEditing(true);
      setIsDialogOpen(true);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deletePenaltyAccount(roomId);
      toast({
        title: '성공',
        description: '벌금 계좌가 삭제되었습니다.',
      });
      loadPenaltyAccount();
    } catch (error) {
        console.error(error.message);
      toast({
        title: '오류',
        description: error.message || '벌금 계좌 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({ bankName: '', accountNumber: '', accountHolder: '' });
    setIsEditing(false);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch(error){
      console.error(error);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <CreditCard className="h-5 w-5" />
            벌금 계좌
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
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <CreditCard className="h-5 w-5" />
          벌금 계좌
        </CardTitle>
      </CardHeader>
      <CardContent>
        {penaltyAccount ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">은행명</Label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm">{penaltyAccount.bankName}</p>
                  {/* <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => copyToClipboard(penaltyAccount.bankName, 'bankName')}
                  >
                    {copiedField === 'bankName' ? (
                      <Check className='h-4 w-4 text-green-500'/>
                    ):(
                      <Copy className='h-4 w-4'/>
                    )}
                  </Button> */}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">계좌번호</Label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm font-mono">{penaltyAccount.accountNumber}</p>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => copyToClipboard(penaltyAccount.accountNumber, 'accountNumber')}
                  >
                    {copiedField === 'accountNumber' ? (
                      <Check className='h-4 w-4 text-green-500'/>
                    ):(
                      <Copy className='h-4 w-4'/>
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">예금주</Label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm">{penaltyAccount.accountHolder}</p>
                  {/* <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => copyToClipboard(penaltyAccount.accountHolder, 'accountHolder')}
                  >
                    {copiedField === 'accountHolder' ? (
                      <Check className='h-4 w-4 text-green-500'/>
                    ):(
                      <Copy className='h-4 w-4'/>
                    )}
                  </Button> */}
                </div>
              </div>
            </div>
            
            {isOwner && (
              <div className="flex gap-2">
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-1" />
                      수정
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>벌금 계좌 수정</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="bankName">은행명</Label>
                        <Input
                          id="bankName"
                          value={formData.bankName}
                          onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="accountNumber">계좌번호</Label>
                        <Input
                          id="accountNumber"
                          value={formData.accountNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="accountHolder">예금주</Label>
                        <Input
                          id="accountHolder"
                          value={formData.accountHolder}
                          onChange={(e) => setFormData(prev => ({ ...prev, accountHolder: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          취소
                        </Button>
                        <Button type="submit">수정</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-1" />
                      삭제
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>벌금 계좌 삭제</AlertDialogTitle>
                      <AlertDialogDescription>
                        정말로 벌금 계좌를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        삭제
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">등록된 벌금 계좌가 없습니다.</p>
            {isOwner && (
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-1" />
                    벌금 계좌 등록
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>벌금 계좌 등록</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="bankName">은행명</Label>
                      <Input
                        id="bankName"
                        value={formData.bankName}
                        onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                        placeholder="예: 국민은행"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="accountNumber">계좌번호</Label>
                      <Input
                        id="accountNumber"
                        value={formData.accountNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                        placeholder="예: 123456-78-901234"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="accountHolder">예금주</Label>
                      <Input
                        id="accountHolder"
                        value={formData.accountHolder}
                        onChange={(e) => setFormData(prev => ({ ...prev, accountHolder: e.target.value }))}
                        placeholder="예금주명을 입력하세요"
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        취소
                      </Button>
                      <Button type="submit">등록</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
