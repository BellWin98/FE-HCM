import { Layout } from '@/components/layout/Layout';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarIcon, Loader2, Save } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/sonner';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatDateToYmd, getTodayYmd, parseDateLikeToDate, validateWorkoutRoomRules } from '@/lib/workoutRoomRules';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useEffect, useMemo, useState } from 'react';
import { AdminStateBlock } from '@/components/admin/AdminStateBlock';

const AdminRoomDetailPage = () => {
  const { roomId } = useParams();
  const queryClient = useQueryClient();

  const numericRoomId = useMemo(() => Number(roomId), [roomId]);
  const todayYmd = useMemo(() => getTodayYmd(), []);

  const detailQuery = useQuery({
    queryKey: ['adminWorkoutRoomDetail', numericRoomId],
    queryFn: () => api.getAdminWorkoutRoomDetail(numericRoomId),
    enabled: Number.isFinite(numericRoomId),
    placeholderData: keepPreviousData,
  });

  const room = detailQuery.data?.workoutRoomInfo ?? null;

  const [initialized, setInitialized] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [enableEndDate, setEnableEndDate] = useState(false);
  const [maxMembers, setMaxMembers] = useState('10');
  const [minWeeklyWorkouts, setMinWeeklyWorkouts] = useState('3');
  const [penaltyPerMiss, setPenaltyPerMiss] = useState('5000');
  const [localError, setLocalError] = useState('');

  // When navigating between room IDs without unmount, reset initialization.
  useEffect(() => {
    setInitialized(false);
    setLocalError('');
    setStartDate(undefined);
    setEndDate(undefined);
    setEnableEndDate(false);
  }, [numericRoomId]);

  const hydrateFromRoom = (r: typeof room) => {
    if (!r) return;
    const sd = parseDateLikeToDate(r.startDate);
    const ed = parseDateLikeToDate(r.endDate);
    setStartDate(sd);
    setEndDate(ed);
    setEnableEndDate(Boolean(ed));
    setMaxMembers(String(r.maxMembers ?? 10));
    setMinWeeklyWorkouts(String(r.minWeeklyWorkouts ?? 3));
    setPenaltyPerMiss(String(r.penaltyPerMiss ?? 5000));
  };

  useEffect(() => {
    if (!room || initialized) return;
    hydrateFromRoom(room);
    setInitialized(true);
  }, [room, initialized]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!Number.isFinite(numericRoomId)) throw new Error('유효하지 않은 roomId 입니다.');

      const error = validateWorkoutRoomRules({
        startDate,
        endDate,
        enableEndDate,
        maxMembers,
        minWeeklyWorkouts,
        penaltyPerMiss,
        todayYmd,
        enforceNotPast: false,
      });
      if (error) throw new Error(error);

      // startDate is guaranteed by validation.
      const body = {
        startDate: formatDateToYmd(startDate as Date),
        endDate: enableEndDate && endDate ? formatDateToYmd(endDate) : null,
        maxMembers: Number.parseInt(maxMembers, 10),
        minWeeklyWorkouts: Number.parseInt(minWeeklyWorkouts, 10),
        penaltyPerMiss: Number.parseInt(penaltyPerMiss, 10),
      };

      return api.updateAdminWorkoutRoom(numericRoomId, body);
    },
    onSuccess: () => {
      toast.success('운동방 규칙이 저장되었습니다.');
      setLocalError('');
      queryClient.invalidateQueries({ queryKey: ['adminWorkoutRoomDetail', numericRoomId] });
      queryClient.invalidateQueries({ queryKey: ['adminWorkoutRooms'] });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : '저장에 실패했습니다. 잠시 후 다시 시도해주세요.';
      setLocalError(msg);
      toast.error(msg);
    },
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/rooms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold md:text-2xl">운동방 상세</h1>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">
              {Number.isFinite(numericRoomId) ? `ID: ${numericRoomId}` : '유효하지 않은 ID'}
              {room?.name ? ` · ${room.name}` : ''}
            </p>
          </div>
        </div>

        {detailQuery.isLoading ? (
          <AdminStateBlock variant="loading" />
        ) : detailQuery.isError ? (
          <AdminStateBlock
            variant="error"
            title="운동방 상세를 불러오지 못했습니다."
            description={detailQuery.error instanceof Error ? detailQuery.error.message : ''}
            onAction={() => detailQuery.refetch()}
          />
        ) : !room ? (
          <AdminStateBlock variant="empty" description="운동방 정보가 없습니다." />
        ) : (
          <Tabs defaultValue="settings">
            <TabsList className="flex w-full gap-1 sm:inline-flex">
              <TabsTrigger value="settings" className="flex-1">
                Settings
              </TabsTrigger>
              <TabsTrigger value="members" className="flex-1">
                Members
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="mt-3 md:mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>규칙 설정</CardTitle>
                  <CardDescription>기간 / 정원 / 주간 목표 / 벌금 규칙을 수정합니다.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs md:text-sm">시작일 *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn('w-full justify-start text-left font-normal', !startDate && 'text-muted-foreground')}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, 'PPP', { locale: ko }) : <span>시작일 선택</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            disabled={(date) => {
                              return date.getDay() !== 1;
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <p className="text-xs text-muted-foreground">매주 월요일만 선택 가능합니다.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Label className="mb-0 text-xs md:text-sm">종료일</Label>
                        <Checkbox
                          id="admin-enable-end-date"
                          checked={enableEndDate}
                          onCheckedChange={(checked) => {
                            const enabled = Boolean(checked);
                            setEnableEndDate(enabled);
                            if (!enabled) setEndDate(undefined);
                          }}
                        />
                        <span className="text-xs text-muted-foreground">종료일 설정</span>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              (!endDate || !enableEndDate) && 'text-muted-foreground'
                            )}
                            disabled={!enableEndDate}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate && enableEndDate ? format(endDate, 'PPP', { locale: ko }) : <span>종료일 선택</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            disabled={(date) => {
                              return date.getDay() !== 0;
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <p className="text-xs text-muted-foreground" style={{ marginTop: 7 }}>
                        매주 일요일만 선택 가능합니다.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="admin-max-members" className="text-xs md:text-sm">
                        최대 참여 인원
                      </Label>
                      <Input
                        id="admin-max-members"
                        type="number"
                        min="2"
                        max="10"
                        value={maxMembers}
                        onChange={(e) => setMaxMembers(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">방장 포함 최대 참여 가능한 인원수</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin-min-weekly" className="text-xs md:text-sm">
                        주간 최소 운동 횟수
                      </Label>
                      <Input
                        id="admin-min-weekly"
                        type="number"
                        min="1"
                        max="7"
                        value={minWeeklyWorkouts}
                        onChange={(e) => setMinWeeklyWorkouts(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">일주일에 최소 몇 번 운동할지 설정하세요</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="admin-penalty" className="text-xs md:text-sm">
                        1회 누락당 벌금 (원)
                      </Label>
                      <Input
                        id="admin-penalty"
                        type="number"
                        min="1000"
                        max="50000"
                        step="1000"
                        value={penaltyPerMiss}
                        onChange={(e) => setPenaltyPerMiss(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">운동을 빠뜨릴 때마다 부과될 벌금</p>
                    </div>
                  </div>

                  {localError ? (
                    <Alert variant="destructive">
                      <AlertDescription>{localError}</AlertDescription>
                    </Alert>
                  ) : null}

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        hydrateFromRoom(room);
                        setLocalError('');
                        toast.message('변경 사항을 되돌렸습니다.');
                      }}
                      disabled={updateMutation.isPending}
                    >
                      되돌리기
                    </Button>

                    <Button
                      type="button"
                      onClick={() => updateMutation.mutate()}
                      disabled={updateMutation.isPending}
                      className="w-full gap-2 sm:w-auto"
                    >
                      {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      저장
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="members" className="mt-3 md:mt-4">
              <AdminStateBlock description="Members 탭은 추후 구현 예정입니다." />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default AdminRoomDetailPage;
