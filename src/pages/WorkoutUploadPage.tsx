import { Layout } from '@/components/layout/Layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { WorkoutType, WORKOUT_TYPES } from '@/types';
import { format } from 'date-fns';
import { da, ko } from 'date-fns/locale';
import { CalendarIcon, Loader2, Upload } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const toDateOnly = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
const today = toDateOnly(new Date());
const sevenDaysAgo = toDateOnly(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));

export const WorkoutUploadPage = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [workoutDate, setWorkoutDate] = useState<Date>(new Date());
  const [workoutType, setWorkoutType] = useState<WorkoutType>('헬스');
  const [customWorkoutType, setCustomWorkoutType] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('이미지 크기는 10MB 이하여야 합니다.');
      return;
    }

    // 파일 형식 체크
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('JPEG, PNG, WebP 형식의 이미지만 업로드 가능합니다.');
      return;
    }

    setSelectedImage(file);
    setError('');

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    if (!selectedImage) {
      setError('운동 인증 사진을 선택해주세요.');
      return false;
    }

    if (!duration || parseInt(duration) < 10 || parseInt(duration) > 720) {
      setError('운동 시간은 10분 이상 720분 이하로 입력해주세요.');
      return false;
    }

    if (workoutType === '기타' && !customWorkoutType.trim()) {
      setError('기타 운동 종류를 입력해주세요.');
      return false;
    }

    // 날짜 검증 (7일 이내)
    if (toDateOnly(workoutDate) > today || toDateOnly(workoutDate) < sevenDaysAgo) {
      setError('운동 일자는 오늘부터 7일 이내만 선택 가능합니다.');
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
      const workoutData = {
        workoutDate: format(workoutDate, 'yyyy-MM-dd'),
        workoutType: workoutType === '기타' ? customWorkoutType : workoutType,
        duration: parseInt(duration)
      };

      await api.uploadWorkout(workoutData, selectedImage!);
      
      navigate('/dashboard');
    } catch (err) {
      console.error('운동 인증 업로드 실패:', err);
      setError(err instanceof Error ? err.message : '운동 인증 업로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>운동 인증 사진 업로드</CardTitle>
            <CardDescription>
              오늘의 운동을 인증해보세요! <br/> 사진과 함께 운동 정보를 입력해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 이미지 업로드 */}
              <div className="space-y-2">
                <Label htmlFor="workout-image">운동 인증 사진 *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview}
                        alt="운동 인증 미리보기"
                        className="max-w-full max-h-64 mx-auto rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview('');
                        }}
                      >
                        다른 사진 선택
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 mx-auto text-gray-400" />
                      <div>
                        <label
                          htmlFor="image-upload"
                          className="cursor-pointer text-blue-600 hover:text-blue-500"
                        >
                          클릭해서 사진 선택
                        </label>
                        <p className="text-sm text-gray-500">
                          또는 파일을 드래그해서 업로드하세요
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          JPEG, PNG, WebP (최대 10MB)
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {/* 운동 일자 */}
              <div className="space-y-2">
                <Label>운동 일자 *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !workoutDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {workoutDate ? (
                        format(workoutDate, "PPP", { locale: ko })
                      ) : (
                        <span>날짜를 선택하세요</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={workoutDate}
                      onSelect={(date) => date && setWorkoutDate(date)}
                      disabled={(date) => {
                        const formattedDate = toDateOnly(date);
                        // return formattedDate > today || formattedDate < sevenDaysAgo;
                        return formattedDate > today;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-gray-500 px-3">
                이번주 운동일자만 이번주 운동횟수에 반영됩니다.
                </p>                
              </div>

              {/* 운동 종류 */}
              <div className="space-y-2">
                <Label htmlFor="workout-type">운동 종류 *</Label>
                <Select value={workoutType} onValueChange={(value) => setWorkoutType(value as WorkoutType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="운동 종류를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKOUT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {workoutType === '기타' && (
                  <div className="mt-2">
                    <Input
                      placeholder="운동 종류를 직접 입력하세요"
                      value={customWorkoutType}
                      onChange={(e) => setCustomWorkoutType(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* 운동 시간 */}
              <div className="space-y-2">
                <Label htmlFor="duration">운동 시간 (분) *</Label>
                <Input
                  className='text-sm'
                  id="duration"
                  type="number"
                  min="10"
                  max="720"
                  placeholder="운동한 시간을 분 단위로 입력하세요"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
                <p className="text-xs text-gray-500 px-3">
                  최소 10분, 최대 720분(12시간)까지 입력 가능합니다.
                </p>
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
                  운동 인증하기
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default WorkoutUploadPage;