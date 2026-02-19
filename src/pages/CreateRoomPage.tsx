import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { api } from '@/lib/api';
import { formatDateToYmd, getTodayYmd, validateWorkoutRoomRules } from '@/lib/workoutRoomRules';

export const CreateRoomPage = () => {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');
  const [entryCode, setEntryCode] = useState('');
  const [minWeeklyWorkouts, setMinWeeklyWorkouts] = useState('3');
  const [penaltyPerMiss, setPenaltyPerMiss] = useState('5000');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [enableEndDate, setEnableEndDate] = useState(false);
  const [maxMembers, setMaxMembers] = useState('10');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const today = getTodayYmd();

  const generateRandomEntryCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 혼동 가능 문자 제외 (0,O,1,I)
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleGenerateEntryCode = () => {
    setEntryCode(generateRandomEntryCode());
  };

  const validateForm = () => {
    if (!roomName.trim()) {
      setError('방 이름을 입력해주세요.');
      return false;
    }

    if (roomName.length < 2 || roomName.length > 20) {
      setError('방 이름은 2-20자 사이여야 합니다.');
      return false;
    }

    const rulesError = validateWorkoutRoomRules({
      startDate,
      endDate,
      enableEndDate,
      maxMembers,
      minWeeklyWorkouts,
      penaltyPerMiss,
      todayYmd: today,
    });
    if (rulesError) {
      setError(rulesError);
      return false;
    }

    if (!entryCode.trim()) {
      setError('운동방 코드를 생성해주세요.');
      return false;
    }

    if (entryCode.length < 6 || entryCode.length > 10) {
      setError('운동방 코드는 6-10자 사이여야 합니다.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const workoutRoomData = {
        name: roomName.trim(),
        minWeeklyWorkouts: parseInt(minWeeklyWorkouts),
        penaltyPerMiss: parseInt(penaltyPerMiss),
        // startDate: formatDateToYmd(startDate),
        // endDate: enableEndDate && endDate ? formatDateToYmd(endDate) : null,
        maxMembers: parseInt(maxMembers),
        entryCode: entryCode.trim(),
      };

      await api.createWorkoutRoom(workoutRoomData);
      
      navigate('/dashboard');
    } catch (err) {
      setError('방 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>운동 인증 방 만들기</CardTitle>
            <CardDescription>
              친구들과 함께할 운동 인증 방을 만들어보세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="room-name">방 이름 *</Label>
                <Input
                  id="room-name"
                  placeholder="예: 헬스 3개월 도전"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  minLength={2}
                  maxLength={20}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-workouts">주간 최소 운동 횟수</Label>
                  <Input
                    id="min-workouts"
                    type="number"
                    min="1"
                    max="7"
                    value={minWeeklyWorkouts}
                    onChange={(e) => setMinWeeklyWorkouts(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">일주일에 최소 몇 번 운동할지 설정하세요</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="penalty">1회 누락당 벌금 (원)</Label>
                  <Input
                    id="penalty"
                    type="number"
                    min="1000"
                    max="50000"
                    step="1000"
                    value={penaltyPerMiss}
                    onChange={(e) => setPenaltyPerMiss(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">운동을 빠뜨릴 때마다 부과될 벌금</p>
                </div>
              </div>

              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>시작일 *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? (
                          format(startDate, "PPP", { locale: ko })
                        ) : (
                          <span>시작일 선택</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        disabled={(date) => {
                          const formattedDate = formatDateToYmd(date);
                          return formattedDate < today || date.getDay() !== 1;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-gray-500">매주 월요일만 선택 가능합니다.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 ">
                    <Label className="mb-0">종료일</Label>
                    <Checkbox id="enable-end-date" checked={enableEndDate} onCheckedChange={(checked) => {
                      setEnableEndDate(!!checked);
                      if (!checked) setEndDate(undefined);
                    }} />
                    <span className="text-xs text-gray-500">종료일 설정</span>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          (!endDate || !enableEndDate) && "text-muted-foreground"
                        )}
                        disabled={!enableEndDate}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate && enableEndDate ? (
                          format(endDate, "PPP", { locale: ko })
                        ) : (
                          <span>종료일 선택</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => {
                          const formattedDate = formatDateToYmd(date);
                          return formattedDate < today || date.getDay() !== 0;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-gray-500" style={{marginTop: 7}}>매주 일요일만 선택 가능합니다.</p>
                </div>
              </div> */}

              <div className="space-y-2">
                <Label htmlFor="max-members">최대 참여 인원</Label>
                <Input
                  id="max-members"
                  type="number"
                  min="2"
                  max="10"
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(e.target.value)}
                  className="max-w-xs"
                />
                <p className="text-xs text-gray-500">방장 포함 최대 참여 가능한 인원수</p>
              </div>

              <div className="space-y-2">
                <Label>운동방 코드</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="entry-code"
                    value={entryCode}
                    readOnly
                    className="max-w-xs font-mono bg-muted"
                    placeholder="코드 생성 버튼을 클릭하세요"
                  />
                  <Button type="button" variant="outline" onClick={handleGenerateEntryCode}>
                    코드 생성
                  </Button>
                </div>
                <p className="text-xs text-gray-500">버튼을 클릭하면 랜덤 코드가 생성됩니다. 방장만 코드 변경이 가능합니다.</p>
              </div>
             

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/dashboard')}
                >
                  취소
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  방 만들기
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default CreateRoomPage;