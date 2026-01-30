import { Layout } from '@/components/layout/Layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkoutSuccessDialog } from '@/components/WorkoutSuccessDialog';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { WorkoutType, WORKOUT_TYPES, UserProfile } from '@/types';
import { format } from 'date-fns';
import { da, ko } from 'date-fns/locale';
import { CalendarIcon, Loader2, Upload, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ensureFcmToken } from '@/lib/firebase';

const toDateOnly = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
const today = toDateOnly(new Date());
const sevenDaysAgo = toDateOnly(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));

export const WorkoutUploadPage = () => {
  const navigate = useNavigate();
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [workoutDate, setWorkoutDate] = useState<Date>(new Date());
  const [workoutTypes, setWorkoutTypes] = useState<WorkoutType[]>([]);
  const [customWorkoutType, setCustomWorkoutType] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [workoutRoomId, setWorkoutRoomId] = useState<number | null>(null);

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // 이미지 개수 제한 체크 (최대 3장)
    const remainingSlots = 3 - selectedImages.length;
    if (remainingSlots <= 0) {
      setError('운동 인증 사진은 최대 3장까지 업로드할 수 있습니다.');
      return;
    }

    // 파일 검증
    fileArray.forEach((file) => {
      // 이미지 개수 제한 체크
      if (validFiles.length >= remainingSlots) {
        errors.push(`최대 3장까지만 업로드 가능합니다. (현재 ${selectedImages.length}장 선택됨)`);
        return;
      }

      // 파일 크기 체크 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}의 크기는 10MB 이하여야 합니다.`);
        return;
      }

      // 파일 형식 체크
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        errors.push(`${file.name}은(는) JPEG, PNG, WebP 형식만 업로드 가능합니다.`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setError(errors.join(', '));
    }

    if (validFiles.length > 0) {
      // 모든 파일의 미리보기 생성
      const previewPromises = validFiles.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        });
      });

      const newPreviews = await Promise.all(previewPromises);
      
      setSelectedImages([...selectedImages, ...validFiles]);
      setImagePreviews([...imagePreviews, ...newPreviews]);
      if (errors.length === 0) {
        setError('');
      }
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processFiles(files);
    // 같은 파일을 다시 선택할 수 있도록 input 초기화
    e.target.value = '';
  };

  // 파일 드래그 중일 때 호출
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  // 드래그가 영역을 벗어날 때 호출
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // 파일을 드롭할 때 호출
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    await processFiles(files);
  };

  const validateForm = () => {
    if (selectedImages.length === 0) {
      setError('운동 인증 사진을 최소 1장 이상 선택해주세요.');
      return false;
    }

    if (selectedImages.length > 3) {
      setError('운동 인증 사진은 최대 3장까지 업로드할 수 있습니다.');
      return false;
    }

    if (!duration || parseInt(duration) < 10 || parseInt(duration) > 720) {
      setError('운동 시간은 10분 이상 720분 이하로 입력해주세요.');
      return false;
    }

    if (workoutTypes.length === 0) {
      setError('운동 종류를 최소 1개 이상 선택해주세요.');
      return false;
    }

    if (workoutTypes.length > 3) {
      setError('운동 종류는 최대 3개까지만 선택할 수 있습니다.');
      return false;
    }

    if (workoutTypes.includes('기타' as WorkoutType) && !customWorkoutType.trim()) {
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
        workoutTypes: workoutTypes.map(type => type === '기타' ? customWorkoutType : type),
        duration: parseInt(duration)
      };

      // await api.uploadWorkout(workoutData, selectedImages);

      if (workoutRoomId) {
        api.notifyRoomMembers(workoutRoomId, {
          body: duration + "분",
          type: "WORKOUT",
        }).catch((notifyErr) => {
          console.warn('운동 업로드 알림 전송 실패', notifyErr);
        });
      }

      // 유저 프로필에서 스트릭 정보 가져오기
      const profile = await api.getUserProfile() as UserProfile;
      setCurrentStreak(profile.currentStreak);

      // 성공 다이얼로그 표시
      setShowSuccessDialog(true);
    } catch (err) {
      console.error('운동 인증 업로드 실패:', err);
      setError(err instanceof Error ? err.message : '운동 인증 업로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 성공 다이얼로그 표시 1초 후 자동으로 대시보드로 이동
  useEffect(() => {
    if (showSuccessDialog) {
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [showSuccessDialog, navigate]);

  // const handleNavigateToDashboard = () => {
  //   setShowSuccessDialog(false);
  //   navigate('/dashboard');
  // };

  // FCM 토큰 등록 및 현재 운동방 정보 조회 (알림 전송을 위한 roomId 확보)
  useEffect(() => {
    ensureFcmToken().catch(() => {
      // permission 거부 등은 조용히 무시
    });

    api.getCurrentWorkoutRoom()
      .then((room) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const typedRoom = room as any;
        const id = typedRoom?.workoutRoomInfo?.id || typedRoom?.id;
        if (id) setWorkoutRoomId(id);
      })
      .catch(() => {
        // 현재 운동방이 없으면 알림만 생략
      });
  }, []);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <WorkoutSuccessDialog
          open={showSuccessDialog}
          onOpenChange={setShowSuccessDialog}
          currentStreak={currentStreak}
          // onNavigate={handleNavigateToDashboard}
        />
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
                <Label htmlFor="workout-image">운동 인증 사진</Label>
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                    isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {imagePreviews.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`운동 인증 미리보기 ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newImages = [...selectedImages];
                                const newPreviews = [...imagePreviews];
                                newImages.splice(index, 1);
                                newPreviews.splice(index, 1);
                                setSelectedImages(newImages);
                                setImagePreviews(newPreviews);
                              }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 justify-center">
                        {imagePreviews.length < 3 && (
                          <label
                            htmlFor="image-upload"
                            className="cursor-pointer"
                          >
                            <Button type="button" variant="outline" asChild>
                              <span>사진 추가</span>
                            </Button>
                          </label>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setSelectedImages([]);
                            setImagePreviews([]);
                          }}
                        >
                          모두 삭제
                        </Button>
                      </div>
                      {imagePreviews.length >= 3 && (
                        <p className="text-xs text-center text-gray-500">
                          최대 3장까지 업로드 가능합니다.
                        </p>
                      )}
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
                          JPEG, PNG, WebP (최대 10MB, 최대 3장까지 선택 가능)
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
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
                <Label htmlFor="workout-type">운동 종류 (최대 3개)</Label>
                <div className="border rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                  {WORKOUT_TYPES.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`workout-type-${type}`}
                        checked={workoutTypes.includes(type)}
                        disabled={!workoutTypes.includes(type) && workoutTypes.length >= 3}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            if (workoutTypes.length >= 3) {
                              setError('운동 종류는 최대 3개까지만 선택할 수 있습니다.');
                              return;
                            }
                            setWorkoutTypes([...workoutTypes, type]);
                            setError('');
                          } else {
                            setWorkoutTypes(workoutTypes.filter(t => t !== type));
                            setError('');
                          }
                        }}
                      />
                      <label
                        htmlFor={`workout-type-${type}`}
                        className={cn(
                          "text-sm font-medium leading-none cursor-pointer flex-1",
                          !workoutTypes.includes(type) && workoutTypes.length >= 3 && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
                {workoutTypes.includes('기타' as WorkoutType) && (
                  <div className="mt-2">
                    <Input
                      placeholder="기타 운동 종류를 직접 입력하세요"
                      value={customWorkoutType}
                      onChange={(e) => setCustomWorkoutType(e.target.value)}
                    />
                  </div>
                )}
                {workoutTypes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {workoutTypes.map((type) => (
                      <Badge key={type} variant="secondary" className="flex items-center gap-1">
                        {type === '기타' && customWorkoutType ? customWorkoutType : type}
                        <button
                          type="button"
                          onClick={() => {
                            setWorkoutTypes(workoutTypes.filter(t => t !== type));
                            if (type === '기타') {
                              setCustomWorkoutType('');
                            }
                          }}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
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