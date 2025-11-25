import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { WorkoutRoom } from '@/types';
import { Loader2, UsersRound } from 'lucide-react';
import { format } from 'date-fns';

export const AdminRoomsSection = () => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<WorkoutRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<WorkoutRoom | null>(null);
  const [maxMembers, setMaxMembers] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  const loadRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getAllWorkoutRoomsAdmin();
      const list = Array.isArray(response) ? response : response?.content ?? [];
      setRooms(list as WorkoutRoom[]);
    } catch (error) {
      toast({
        title: '오류',
        description: error.message || '운동방 목록을 불러올 수 없습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const handleEditRoom = (room: WorkoutRoom) => {
    setSelectedRoom(room);
    setMaxMembers(room.maxMembers);
  };

  const handleUpdateMaxMembers = async () => {
    if (!selectedRoom) return;
    if (maxMembers < selectedRoom.currentMembers) {
      toast({
        title: '입력 오류',
        description: '현재 인원보다 작은 값으로 설정할 수 없습니다.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await api.updateWorkoutRoomMaxMembers(selectedRoom.id, maxMembers);
      toast({
        title: '수정 완료',
        description: `${selectedRoom.name}의 최대 인원이 업데이트되었습니다.`,
      });
      setSelectedRoom(null);
      loadRooms();
    } catch (error) {
      toast({
        title: '오류',
        description: error.message || '최대 인원을 수정할 수 없습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2 text-purple-600">
          <UsersRound className="h-5 w-5" />
          <CardTitle className="text-xl font-bold">운동방 관리</CardTitle>
        </div>
        <div className="text-sm text-muted-foreground">
          모든 운동방의 상태와 인원 기준을 확인하고 조정할 수 있습니다.
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            불러오는 중...
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">등록된 운동방이 없습니다.</div>
        ) : (
          <>
            {/* 데스크톱 테이블 뷰 */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>방 이름</TableHead>
                    <TableHead>기간</TableHead>
                    <TableHead>참여 인원</TableHead>
                    <TableHead>주간 목표</TableHead>
                    <TableHead>벌금</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell>
                        <div className="font-medium">{room.name}</div>
                        <div className="text-xs text-muted-foreground">#{room.id} · 방장 {room.ownerNickname}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(room.startDate), 'yyyy-MM-dd')} ~{' '}
                        {room.endDate ? format(new Date(room.endDate), 'yyyy-MM-dd') : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {room.currentMembers}/{room.maxMembers}명
                        </div>
                      </TableCell>
                      <TableCell>{room.minWeeklyWorkouts}회</TableCell>
                      <TableCell>{room.penaltyPerMiss.toLocaleString()}원</TableCell>
                      <TableCell>
                        <Badge variant={room.isActive ? 'default' : 'secondary'}>
                          {room.isActive ? '활성' : '비활성'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleEditRoom(room)}>
                          최대 인원 조정
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* 모바일 카드 뷰 */}
            <div className="md:hidden space-y-4">
              {rooms.map((room) => (
                <Card key={room.id} className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base truncate">{room.name}</div>
                        <div className="text-xs text-muted-foreground">#{room.id}</div>
                        <div className="text-xs text-muted-foreground mt-1">방장: {room.ownerNickname}</div>
                      </div>
                      <Badge variant={room.isActive ? 'default' : 'secondary'} className="shrink-0">
                        {room.isActive ? '활성' : '비활성'}
                      </Badge>
                    </div>

                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">기간</span>
                        <span className="font-medium text-right">
                          {format(new Date(room.startDate), 'yy.MM.dd')} ~ {room.endDate ? format(new Date(room.endDate), 'yy.MM.dd') : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">참여 인원</span>
                        <span className="font-medium">{room.currentMembers}/{room.maxMembers}명</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">주간 목표</span>
                        <span className="font-medium">{room.minWeeklyWorkouts}회</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">벌금</span>
                        <span className="font-medium">{room.penaltyPerMiss.toLocaleString()}원</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditRoom(room)}
                      className="w-full mt-2"
                    >
                      최대 인원 조정
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={!!selectedRoom} onOpenChange={(open) => !open && setSelectedRoom(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>최대 인원 조정</DialogTitle>
          </DialogHeader>
          {selectedRoom && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {selectedRoom.name}의 현재 인원 {selectedRoom.currentMembers} / 최대 {selectedRoom.maxMembers}
              </div>
              <div>
                <Label htmlFor="maxMembers">최대 인원</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  min={selectedRoom.currentMembers}
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(Number(e.target.value))}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedRoom(null)}>
              취소
            </Button>
            <Button onClick={handleUpdateMaxMembers} disabled={isSaving}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminRoomsSection;

