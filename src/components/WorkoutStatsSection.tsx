import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { WorkoutStats } from '@/types';
import { Trophy, Target, Calendar, Clock, TrendingUp, Award, Zap, Activity } from 'lucide-react';

interface WorkoutStatsSectionProps {
  stats: WorkoutStats | null;
}

export const WorkoutStatsSection = ({ stats }: WorkoutStatsSectionProps) => {
  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            통계 정보를 불러올 수 없습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  const weeklyProgressPercentage = stats.weeklyGoal > 0 
    ? Math.min((stats.weeklyProgress / stats.weeklyGoal) * 100, 100)
    : 0;

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-600';
    if (streak >= 14) return 'text-brand-primary';
    if (streak >= 7) return 'text-green-600';
    return 'text-orange-600';
  };

  const getStreakBadge = (streak: number) => {
    if (streak >= 30) return { text: '🔥 불타는 헬창', color: 'bg-purple-100 text-purple-800' };
    if (streak >= 14) return { text: '💪 강력한 헬창', color: 'bg-brand-primary/20 text-brand-primary' };
    if (streak >= 7) return { text: '🏃‍♂️ 열정적인 헬창', color: 'bg-green-100 text-green-800' };
    return { text: '🌱 성장하는 헬창', color: 'bg-orange-100 text-orange-800' };
  };

  const streakBadge = getStreakBadge(stats.currentStreak);

  return (
    <div className="space-y-6">
      {/* 주간 목표 진행률 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>이번 주 목표</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">주간 운동 목표</span>
              <span className="text-sm text-muted-foreground">
                {stats.weeklyProgress} / {stats.weeklyGoal}회
              </span>
            </div>
            <Progress value={weeklyProgressPercentage} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">진행률</span>
              <span className="font-medium">{Math.round(weeklyProgressPercentage)}%</span>
            </div>
            {weeklyProgressPercentage >= 100 && (
              <div className="text-center">
                <Badge className="bg-green-100 text-green-800">
                  🎉 이번 주 목표 달성!
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 연속 운동 기록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>연속 운동 기록</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getStreakColor(stats.currentStreak)}`}>
                {stats.currentStreak}일
              </div>
              <Badge className={`mt-2 ${streakBadge.color}`}>
                {streakBadge.text}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-600">
                  {stats.longestStreak}일
                </div>
                <div className="text-sm text-muted-foreground">최장 기록</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-600">
                  {stats.totalWorkouts}일
                </div>
                <div className="text-sm text-muted-foreground">총 운동일</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 월간 통계 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>월간 통계</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-brand-primary/10 rounded-lg">
                <div className="text-2xl font-bold text-brand-primary">
                  {stats.monthlyWorkouts}회
                </div>
                <div className="text-sm text-brand-primary">이번 달 운동</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(stats.totalDuration / 60)}시간
                </div>
                <div className="text-sm text-green-600">총 운동 시간</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 선호 운동 종목 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>운동 분석</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-lg font-semibold text-yellow-700">
                {stats.favoriteWorkoutType}
              </div>
              <div className="text-sm text-yellow-600">가장 많이 한 운동</div>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>평균 운동 시간: {Math.round(stats.totalDuration / stats.totalWorkouts)}분</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 성취 배지 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>성취 배지</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats.totalWorkouts >= 100 && (
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl mb-1">🏆</div>
                <div className="text-xs font-medium text-yellow-700">100일 달성</div>
              </div>
            )}
            {stats.longestStreak >= 30 && (
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl mb-1">🔥</div>
                <div className="text-xs font-medium text-purple-700">30일 연속</div>
              </div>
            )}
            {stats.monthlyWorkouts >= 20 && (
              <div className="text-center p-3 bg-brand-primary/10 rounded-lg">
                <div className="text-2xl mb-1">💪</div>
                <div className="text-xs font-medium text-brand-primary">월 20회</div>
              </div>
            )}
            {stats.totalDuration >= 1000 && (
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl mb-1">⏰</div>
                <div className="text-xs font-medium text-green-700">1000분 달성</div>
              </div>
            )}
            {stats.currentStreak >= 7 && (
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl mb-1">🏃‍♂️</div>
                <div className="text-xs font-medium text-orange-700">일주일 연속</div>
              </div>
            )}
            {stats.weeklyProgress >= stats.weeklyGoal && (
              <div className="text-center p-3 bg-pink-50 rounded-lg">
                <div className="text-2xl mb-1">🎯</div>
                <div className="text-xs font-medium text-pink-700">주간 목표</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
