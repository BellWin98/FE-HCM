import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { AdminUser, PageResponse } from '@/types';
import { Loader2, ShieldCheck, UserCog } from 'lucide-react';

const roleOptions: Array<{ label: string; value: AdminUser['role'] }> = [
  { label: '일반 회원', value: 'USER' },
  { label: '가족', value: 'FAMILY' },
  { label: '관리자', value: 'ADMIN' },
];

const statusOptions = [
  { label: '전체', value: 'ALL' },
  { label: '활성', value: 'ACTIVE' },
  { label: '비활성', value: 'INACTIVE' },
];

export const AdminUsersSection = () => {
  const { toast } = useToast();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | AdminUser['role']>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editingForm, setEditingForm] = useState({ nickname: '', email: '' });
  const [mutatingUserId, setMutatingUserId] = useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getAllUsers({
        keyword: searchKeyword || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        size: 100,
      });
      const list = Array.isArray(response)
        ? response
        : (response as PageResponse<AdminUser>).content ?? [];
      setUsers(list);
    } catch (error) {
      toast({
        title: '오류',
        description: error.message || '유저 목록을 불러오지 못했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchKeyword, statusFilter, roleFilter, toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setEditingForm({ nickname: user.nickname, email: user.email });
  };

  const handleEditSubmit = async () => {
    if (!editingUser) return;
    setMutatingUserId(editingUser.id);
    try {
      await api.updateUserInfo(editingUser.id, editingForm);
      toast({ title: '저장 완료', description: '유저 정보가 업데이트되었습니다.' });
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      toast({
        title: '오류',
        description: error.message || '유저 정보를 수정할 수 없습니다.',
        variant: 'destructive',
      });
    } finally {
      setMutatingUserId(null);
    }
  };

  const handleActivationToggle = async (user: AdminUser, active: boolean) => {
    setMutatingUserId(user.id);
    try {
      await api.updateUserActivation(user.id, active);
      toast({
        title: active ? '활성화 완료' : '비활성화 완료',
        description: `${user.nickname}님의 상태가 업데이트되었습니다.`,
      });
      loadUsers();
    } catch (error) {
      toast({
        title: '오류',
        description: error.message || '상태를 변경할 수 없습니다.',
        variant: 'destructive',
      });
    } finally {
      setMutatingUserId(null);
    }
  };

  const handleRoleChange = async (user: AdminUser, role: AdminUser['role']) => {
    setMutatingUserId(user.id);
    try {
      await api.updateUserRole(user.id, role);
      toast({
        title: '역할 변경 완료',
        description: `${user.nickname}님의 권한이 업데이트되었습니다.`,
      });
      loadUsers();
    } catch (error) {
      toast({
        title: '오류',
        description: error.message || '역할을 변경할 수 없습니다.',
        variant: 'destructive',
      });
    } finally {
      setMutatingUserId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    if (searchKeyword.trim() === '') return users;
    return users.filter((user) =>
      `${user.nickname} ${user.email}`.toLowerCase().includes(searchKeyword.toLowerCase())
    );
  }, [users, searchKeyword]);

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-2 text-blue-600">
          <UserCog className="h-5 w-5" />
          <CardTitle className="text-xl font-bold">유저 관리</CardTitle>
        </div>
        <div className="flex flex-col gap-3">
          <Input
            placeholder="닉네임/이메일 검색"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={(value: 'ALL' | AdminUser['role']) => setRoleFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="역할" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 역할</SelectItem>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadUsers} disabled={isLoading} className="col-span-2 md:col-span-1">
              새로고침
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            불러오는 중...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">표시할 유저가 없습니다.</div>
        ) : (
          <>
            {/* 데스크톱 테이블 뷰 */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>닉네임</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>역할</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>최근 접속</TableHead>
                    <TableHead className="text-right">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const isMutating = mutatingUserId === user.id;
                    return (
                      <TableRow key={user.id} className="align-top">
                        <TableCell>
                          <div className="font-medium">{user.nickname}</div>
                          <div className="text-xs text-muted-foreground">#{user.id}</div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(value: AdminUser['role']) => handleRoleChange(user, value)}
                            disabled={isMutating}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {roleOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={user.status === 'ACTIVE' ? 'default' : 'secondary'}>
                              {user.status === 'ACTIVE' ? '활성' : '비활성'}
                            </Badge>
                            <Switch
                              checked={user.status === 'ACTIVE'}
                              onCheckedChange={(checked) => handleActivationToggle(user, checked)}
                              disabled={isMutating}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(user)} disabled={isMutating}>
                            상세 수정
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* 모바일 카드 뷰 */}
            <div className="md:hidden space-y-4">
              {filteredUsers.map((user) => {
                const isMutating = mutatingUserId === user.id;
                return (
                  <Card key={user.id} className="overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-base truncate">{user.nickname}</div>
                          <div className="text-xs text-muted-foreground">#{user.id}</div>
                          <div className="text-sm text-muted-foreground truncate mt-1">{user.email}</div>
                        </div>
                        <Badge variant={user.status === 'ACTIVE' ? 'default' : 'secondary'} className="shrink-0">
                          {user.status === 'ACTIVE' ? '활성' : '비활성'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">역할</div>
                          <Select
                            value={user.role}
                            onValueChange={(value: AdminUser['role']) => handleRoleChange(user, value)}
                            disabled={isMutating}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {roleOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">활성화</div>
                          <div className="flex items-center h-9">
                            <Switch
                              checked={user.status === 'ACTIVE'}
                              onCheckedChange={(checked) => handleActivationToggle(user, checked)}
                              disabled={isMutating}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        최근 접속: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('ko-KR', {
                          year: '2-digit',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(user)}
                        disabled={isMutating}
                        className="w-full"
                      >
                        상세 수정
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              유저 정보 수정
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nickname">닉네임</Label>
              <Input
                id="nickname"
                value={editingForm.nickname}
                onChange={(e) => setEditingForm((prev) => ({ ...prev, nickname: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={editingForm.email}
                onChange={(e) => setEditingForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              취소
            </Button>
            <Button onClick={handleEditSubmit} disabled={mutatingUserId === editingUser?.id}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminUsersSection;

