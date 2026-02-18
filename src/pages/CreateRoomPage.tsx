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

  const convertKoreanToEnglish = (text: string) => {
    const koreanToEnglishMap: { [key: string]: string } = {
      'ㅂ': 'q', 'ㅈ': 'w', 'ㄷ': 'e', 'ㄱ': 'r', 'ㅅ': 't', 'ㅛ': 'y', 'ㅕ': 'u', 'ㅑ': 'i', 'ㅐ': 'o', 'ㅔ': 'p',
      'ㅁ': 'a', 'ㄴ': 's', 'ㅇ': 'd', 'ㄹ': 'f', 'ㅎ': 'g', 'ㅗ': 'h', 'ㅓ': 'j', 'ㅏ': 'k', 'ㅣ': 'l',
      'ㅋ': 'z', 'ㅌ': 'x', 'ㅊ': 'c', 'ㅍ': 'v', 'ㅠ': 'b', 'ㅜ': 'n', 'ㅡ': 'm',
      'ㅃ': 'Q', 'ㅉ': 'W', 'ㄸ': 'E', 'ㄲ': 'R', 'ㅆ': 'T', 'ㅒ': 'O', 'ㅖ': 'P'
    };
    
    return text.split('').map(char => koreanToEnglishMap[char] || char).join('');
  };

// 한글을 영어로 변환하는 함수
const koreanToEnglish = (text: string): string => {
  const koreanMap: { [key: string]: string } = {
    // 자음
    'ㄱ': 'r', 'ㄲ': 'R', 'ㄴ': 's', 'ㄷ': 'e', 'ㄸ': 'E', 'ㄹ': 'f',
    'ㅁ': 'a', 'ㅂ': 'q', 'ㅃ': 'Q', 'ㅅ': 't', 'ㅆ': 'T', 'ㅇ': 'd',
    'ㅈ': 'w', 'ㅉ': 'W', 'ㅊ': 'c', 'ㅋ': 'z', 'ㅌ': 'x', 'ㅍ': 'v', 'ㅎ': 'g',
    // 모음
    'ㅏ': 'k', 'ㅐ': 'o', 'ㅑ': 'i', 'ㅒ': 'O', 'ㅓ': 'j', 'ㅔ': 'p',
    'ㅕ': 'u', 'ㅖ': 'P', 'ㅗ': 'h', 'ㅘ': 'hk', 'ㅙ': 'ho', 'ㅚ': 'hl',
    'ㅛ': 'y', 'ㅜ': 'n', 'ㅝ': 'nj', 'ㅞ': 'np', 'ㅟ': 'nl', 'ㅠ': 'b', 'ㅡ': 'm', 'ㅢ': 'ml', 'ㅣ': 'l',
    // 완성된 글자
    '가': 'rk', '각': 'rk', '간': 'rks', '갇': 'rke', '갈': 'rkf', '갉': 'rka', '갊': 'rkq', '갋': 'rkt', '갌': 'rkd', '갍': 'rkw', '갎': 'rkc', '갏': 'rkz',
    '나': 'sk', '낙': 'sk', '난': 'sks', '낟': 'ske', '날': 'skf', '낡': 'ska', '낢': 'skq', '낣': 'skt', '낤': 'skd', '낥': 'skw', '낦': 'skc', '낧': 'skz',
    '다': 'ek', '닥': 'ek', '단': 'eks', '닫': 'eke', '달': 'ekf', '닭': 'eka', '닮': 'ekq', '닯': 'ekt', '닰': 'ekd', '닱': 'ekw', '닲': 'ekc', '닳': 'ekz',
    '라': 'fk', '락': 'fk', '란': 'fks', '랃': 'fke', '랄': 'fkf', '랅': 'fka', '랆': 'fkq', '랇': 'fkt', '랈': 'fkd', '랉': 'fkw', '랊': 'fkc', '랋': 'fkz',
    '마': 'ak', '막': 'ak', '만': 'aks', '맏': 'ake', '말': 'akf', '맑': 'aka', '맒': 'akq', '맓': 'akt', '맔': 'akd', '맕': 'akw', '맖': 'akc', '맗': 'akz',
    '바': 'qk', '박': 'qk', '반': 'qks', '받': 'qke', '발': 'qkf', '밝': 'qka', '밞': 'qkq', '밟': 'qkt', '밠': 'qkd', '밡': 'qkw', '밢': 'qkc', '밣': 'qkz',
    '사': 'tk', '삭': 'tk', '산': 'tks', '삳': 'tke', '살': 'tkf', '삵': 'tka', '삶': 'tkq', '삷': 'tkt', '삸': 'tkd', '삹': 'tkw', '삺': 'tkc', '삻': 'tkz',
    '아': 'dk', '악': 'dk', '안': 'dks', '앋': 'dke', '알': 'dkf', '앍': 'dka', '앎': 'dkq', '앏': 'dkt', '앐': 'dkd', '앑': 'dkw', '앒': 'dkc', '앓': 'dkz',
    '자': 'wk', '작': 'wk', '잔': 'wks', '잗': 'wke', '잘': 'wkf', '잚': 'wka', '잛': 'wkq', '잜': 'wkt', '잝': 'wkd', '잞': 'wkw', '잟': 'wkc', '잠': 'wkz',
    '차': 'ck', '착': 'ck', '찬': 'cks', '찯': 'cke', '찰': 'ckf', '찱': 'cka', '찲': 'ckq', '찳': 'ckt', '찴': 'ckd', '찵': 'ckw', '찶': 'ckc', '찷': 'ckz',
    '카': 'zk', '칵': 'zk', '칸': 'zks', '칻': 'zke', '칼': 'zkf', '칽': 'zka', '칾': 'zkq', '칿': 'zkt', '캀': 'zkd', '캁': 'zkw', '캂': 'zkc', '캃': 'zkz',
    '타': 'xk', '탁': 'xk', '탄': 'xks', '탇': 'xke', '탈': 'xkf', '탉': 'xka', '탊': 'xkq', '탋': 'xkt', '탌': 'xkd', '탍': 'xkw', '탎': 'xkc', '탏': 'xkz',
    '파': 'vk', '팩': 'vk', '판': 'vks', '팯': 'vke', '팰': 'vkf', '팱': 'vka', '팲': 'vkq', '팳': 'vkt', '팴': 'vkd', '팵': 'vkw', '팶': 'vkc', '팷': 'vkz',
    '하': 'gk', '학': 'gk', '한': 'gks', '핟': 'gke', '할': 'gkf', '핡': 'gka', '핢': 'gkq', '핣': 'gkt', '핤': 'gkd', '핥': 'gkw', '핦': 'gkc', '핧': 'gkz'
  };

  return text.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, (char) => koreanMap[char] || char);
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
                      const processedValue = koreanToEnglish(e.target.value);
                      if (processedValue.length <= 10) {
                        setEntryCode(processedValue);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === ' ') {
                        e.preventDefault();
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