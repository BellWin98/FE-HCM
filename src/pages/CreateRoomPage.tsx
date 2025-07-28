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

  const formatDateToLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = formatDateToLocal(new Date);

  const convertKoreanToEnglish = (text: string) => {
    const koreanToEnglishMap: { [key: string]: string } = {
      'ㅂ': 'q', 'ㅈ': 'w', 'ㄷ': 'e', 'ㄱ': 'r', 'ㅅ': 't', 'ㅛ': 'y', 'ㅕ': 'u', 'ㅑ': 'i', 'ㅐ': 'o', 'ㅔ': 'p',
      'ㅁ': 'a', 'ㄴ': 's', 'ㅇ': 'd', 'ㄹ': 'f', 'ㅎ': 'g', 'ㅗ': 'h', 'ㅓ': 'j', 'ㅏ': 'k', 'ㅣ': 'l',
      'ㅋ': 'z', 'ㅌ': 'x', 'ㅊ': 'c', 'ㅍ': 'v', 'ㅠ': 'b', 'ㅜ': 'n', 'ㅡ': 'm',
      'ㅃ': 'Q', 'ㅉ': 'W', 'ㄸ': 'E', 'ㄲ': 'R', 'ㅆ': 'T', 'ㅒ': 'O', 'ㅖ': 'P'
    };
    
    return text.split('').map(char => koreanToEnglishMap[char] || char).join('');
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

    if (!startDate) {
      setError('운동 인증 시작일을 설정해주세요.');
      return false;
    }

    if (formatDateToLocal(startDate) < today) {
      setError('시작일은 오늘 이후여야 합니다.');
      return false;
    }

    if (enableEndDate && endDate) {
      if (startDate >= endDate) {
        setError('종료일은 시작일보다 늦어야 합니다.');
        return false;
      }
      if (formatDateToLocal(endDate) < today) {
        setError('종료일은 오늘 이후여야 합니다.');
        return false;
      }
    }

    const minWorkouts = parseInt(minWeeklyWorkouts);
    if (minWorkouts < 1 || minWorkouts > 7) {
      setError('주간 최소 운동 횟수는 1-7회 사이여야 합니다.');
      return false;
    }

    const penalty = parseInt(penaltyPerMiss);
    if (penalty < 1000 || penalty > 50000) {
      setError('벌금은 1,000원 이상 50,000원 이하여야 합니다.');
      return false;
    }

    const maxMembersNum = parseInt(maxMembers);
    if (maxMembersNum < 2 || maxMembersNum > 10) {
      setError('참여 인원은 2명 이상 10명 이하여야 합니다.');
      return false;
    }

    if (!entryCode.trim()) {
      setError('방 비밀번호를 입력해주세요.');
      return false;
    }

    if (entryCode.length < 2 || entryCode.length > 10) {
      setError('방 비밀번호는 2-10자 사이여야 합니다.');
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
        startDate: formatDateToLocal(startDate),
        endDate: enableEndDate && endDate ? formatDateToLocal(endDate) : null,
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          const formattedDate = formatDateToLocal(date);
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
                          const formattedDate = formatDateToLocal(date);
                          return formattedDate < today || date.getDay() !== 0;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-gray-500" style={{marginTop: 7}}>매주 일요일만 선택 가능합니다.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max-members">최대 참여 인원</Label>
                  <Input
                    id="max-members"
                    type="number"
                    min="2"
                    max="10"
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">방장 포함 최대 참여 가능한 인원수</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entry-code">방 비밀번호</Label>
                  <Input
                    id="entry-code"
                    value={entryCode}
                    onChange={(e) => {
                      const processedValue = convertKoreanToEnglish(e.target.value.replace(/\s/g, ''));
                      if (processedValue.length <= 10) {
                        setEntryCode(processedValue);
                      }
                    }}
                    minLength={2}
                    maxLength={10}
                  />
                  <p className="text-xs text-gray-500">2자리 이상 10자리 이하의 방 비밀번호</p>
                </div> 
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