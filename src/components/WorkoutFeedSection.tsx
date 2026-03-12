import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { type WorkoutFeedItem, type PageResponse, type WorkoutFeedPeriod } from '@/types';
import { api } from '@/lib/api';
import { Activity, Calendar, Clock } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface WorkoutFeedSectionProps {
  feed: WorkoutFeedItem[];
  onFeedUpdate: (feed: WorkoutFeedItem[]) => void;
  initialIsLastPage?: boolean;
}

export const WorkoutFeedSection = ({ feed, onFeedUpdate, initialIsLastPage = false }: WorkoutFeedSectionProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(!initialIsLastPage);
  const [selectedPeriod, setSelectedPeriod] = useState<WorkoutFeedPeriod>('ALL');
  const [zoomImageUrls, setZoomImageUrls] = useState<string[] | null>(null);
  const [zoomImageIndex, setZoomImageIndex] = useState<number>(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  // feed가 배열이 아닐 경우 빈 배열로 처리
  const safeFeed = useMemo<WorkoutFeedItem[]>(() => {
    if (!Array.isArray(feed)) {
      return [];
    }
    return feed;
  }, [feed]);

  // 캐러셀 인덱스 추적
  useEffect(() => {
    if (!carouselApi) return;

    const updateIndex = () => {
      setZoomImageIndex(carouselApi.selectedScrollSnap());
    };

    updateIndex();
    carouselApi.on('select', updateIndex);

    return () => {
      carouselApi.off('select', updateIndex);
    };
  }, [carouselApi]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) {
      return;
    }

    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const response = await api.getUserWorkoutFeed(nextPage, 20, selectedPeriod);
      const newFeed = Array.isArray(response)
        ? response
        : (response as PageResponse<WorkoutFeedItem>)?.content || [];

      if (newFeed.length === 0) {
        setHasMore(false);
        return;
      }

      onFeedUpdate([...safeFeed, ...newFeed]);
      setPage(nextPage);

      if (!Array.isArray(response) && (response as PageResponse<WorkoutFeedItem>)?.last) {
        setHasMore(false);
      }
    } catch (error) {
      toast.error('피드를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, onFeedUpdate, page, safeFeed, selectedPeriod]);

  const handleChangePeriod = async (period: WorkoutFeedPeriod) => {
    if (period === selectedPeriod) {
      return;
    }

    setSelectedPeriod(period);
    setPage(0);
    setHasMore(true);
    setIsLoading(true);

    try {
      const response = await api.getUserWorkoutFeed(0, 20, period);
      const newFeed = Array.isArray(response)
        ? response
        : (response as PageResponse<WorkoutFeedItem>)?.content || [];

      onFeedUpdate(newFeed);

      if (newFeed.length === 0 || (!Array.isArray(response) && (response as PageResponse<WorkoutFeedItem>)?.last)) {
        setHasMore(false);
      }
    } catch (error) {
      toast.error('피드를 불러오는데 실패했습니다.');
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getWorkoutTypeColor = (workoutType: string) => {
    const colors: { [key: string]: string } = {
      '헬스(가슴)': 'bg-red-100 text-red-800',
      '헬스(등)': 'bg-blue-100 text-blue-800',
      '헬스(어깨)': 'bg-green-100 text-green-800',
      '헬스(하체)': 'bg-purple-100 text-purple-800',
      '테니스': 'bg-yellow-100 text-yellow-800',
      '러닝': 'bg-orange-100 text-orange-800',
      '자전거': 'bg-cyan-100 text-cyan-800',
      '구기종목': 'bg-pink-100 text-pink-800',
      '수영': 'bg-indigo-100 text-indigo-800',
      '기타': 'bg-gray-100 text-gray-800',
    };
    return colors[workoutType] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>운동 인증 피드</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={selectedPeriod === 'ALL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleChangePeriod('ALL')}
              disabled={isLoading && selectedPeriod === 'ALL'}
            >
              전체
            </Button>
            <Button
              type="button"
              variant={selectedPeriod === 'WEEK' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleChangePeriod('WEEK')}
              disabled={isLoading && selectedPeriod === 'WEEK'}
            >
              이번 주
            </Button>
            <Button
              type="button"
              variant={selectedPeriod === 'MONTH' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleChangePeriod('MONTH')}
              disabled={isLoading && selectedPeriod === 'MONTH'}
            >
              이번 달
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {safeFeed.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">아직 운동 인증이 없습니다.</p>
              <p className="text-sm text-muted-foreground mt-2">
                첫 번째 운동을 인증해보세요!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {safeFeed.map((item) => {
                const imageUrls = item.imageUrls || [];
                const workoutTypes = item.workoutTypes || [];
                
                return (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      {/* 운동 이미지 */}
                      <div className="relative">
                        {imageUrls.length === 1 ? (
                          <img
                            src={imageUrls[0]}
                            alt={`${workoutTypes.join(', ')} 운동`}
                            className="w-full h-64 sm:h-80 object-cover cursor-zoom-in"
                            onClick={() => {
                              setZoomImageUrls(imageUrls);
                              setZoomImageIndex(0);
                            }}
                          />
                        ) : (
                          <Carousel className="w-full">
                            <CarouselContent>
                              {imageUrls.map((url, idx) => (
                                <CarouselItem key={idx}>
                                  <img
                                    src={url}
                                    alt={`${workoutTypes.join(', ')} 운동 ${idx + 1}`}
                                    className="w-full h-64 sm:h-80 object-cover cursor-zoom-in"
                                    onClick={() => {
                                      setZoomImageUrls(imageUrls);
                                      setZoomImageIndex(idx);
                                    }}
                                  />
                                </CarouselItem>
                              ))}
                            </CarouselContent>
                            {imageUrls.length > 1 && (
                              <>
                                <CarouselPrevious className="left-2 sm:left-4 h-8 w-8" />
                                <CarouselNext className="right-2 sm:right-4 h-8 w-8" />
                              </>
                            )}
                          </Carousel>
                        )}
                      </div>

                      {/* 운동 정보 */}
                      <div className="p-4 space-y-3">
                        {/* 운동 설명 */}
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}

                        {/* 날짜 */}
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(item.workoutDate), 'yyyy년 MM월 dd일', { locale: ko })}
                          </span>
                        </div>

                        {/* 기록 */}
                        <div className="flex items-center flex-wrap gap-2 text-sm text-muted-foreground">
                          {workoutTypes.map((type, idx) => (
                            <Badge key={idx} className={getWorkoutTypeColor(type)}>
                              {type}
                            </Badge>
                          ))}
                          <Badge variant="secondary" className="bg-white/90 text-black">
                            <Clock className="h-3 w-3 mr-1" />
                            {item.duration}분
                          </Badge>
                        </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}

              {/* 더보기 버튼 */}
              {hasMore && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? '로딩 중...' : '더보기'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 이미지 확대 다이얼로그 */}
      <Dialog open={!!zoomImageUrls} onOpenChange={() => setZoomImageUrls(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          {zoomImageUrls && zoomImageUrls.length > 0 && (
            <div className="relative">
              {zoomImageUrls.length === 1 ? (
                <img 
                  src={zoomImageUrls[0]} 
                  alt="확대된 운동 인증 사진" 
                  className="w-full h-auto max-h-[90vh] object-contain rounded" 
                />
              ) : (
                <Carousel 
                  className="w-full" 
                  setApi={setCarouselApi}
                  opts={{ 
                    startIndex: zoomImageIndex,
                    loop: true 
                  }}
                >
                  <CarouselContent>
                    {zoomImageUrls.map((url, idx) => (
                      <CarouselItem key={idx}>
                        <img 
                          src={url} 
                          alt={`확대된 운동 인증 사진 ${idx + 1}`} 
                          className="w-full h-auto max-h-[90vh] object-contain rounded" 
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-4 h-8 w-8" />
                  <CarouselNext className="right-4 h-8 w-8" />
                </Carousel>
              )}
              {zoomImageUrls.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {zoomImageIndex + 1} / {zoomImageUrls.length}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
