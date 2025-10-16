import { Layout } from '@/components/layout/Layout';
import { UserProfileSection } from '@/components/UserProfileSection';
import { WorkoutFeedSection } from '@/components/WorkoutFeedSection';
import { WorkoutStatsSection } from '@/components/WorkoutStatsSection';
import { UserSettingsSection } from '@/components/UserSettingsSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile, WorkoutStats, WorkoutFeedItem, UserSettings } from '@/types';
import { api } from '@/lib/api';
import { User, Activity, Settings, Trophy, Calendar, Target, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export const MyPage = () => {
  const { member, updateMember } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('profile');
  
  // 상태 관리
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats | null>(null);
  const [workoutFeed, setWorkoutFeed] = useState<WorkoutFeedItem[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터 로딩
  useEffect(() => {
    const loadUserData = async () => {
      if (!member) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // 병렬로 데이터 로딩
        const [profile, feed] = await Promise.all([
          api.getUserProfile(),
          api.getUserWorkoutFeed(0, 20),
          // api.getUserWorkoutStats(),
          // api.getUserSettings(),
        ]);
        
        setUserProfile(profile as UserProfile);
        // setWorkoutStats(stats as WorkoutStats);
        // API 응답이 페이징된 경우 content 필드에서 배열 추출
        const feedArray = Array.isArray(feed) ? feed : (feed as any)?.content || [];
        setWorkoutFeed(feedArray);
        // setUserSettings(settings as UserSettings);
      } catch (err) {
        console.error('Failed to load user data:', err);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [member]);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-red-500 mb-4">⚠️</div>
                <p className="text-lg font-medium mb-2">오류가 발생했습니다</p>
                <p className="text-muted-foreground">{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">마이페이지</h1>
              <p className="text-lg opacity-90">
                안녕하세요, {member?.nickname}님! 🏋️‍♂️
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-white/20 text-white">
                {member?.role === 'ADMIN' ? '관리자' : member?.role === 'FAMILY' ? '가족' : '회원'}
              </Badge>
            </div>
          </div>
        </div>

        {/* 모바일에서는 탭, 데스크톱에서는 사이드바 */}
        {isMobile ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile" className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">프로필</span>
              </TabsTrigger>
              <TabsTrigger value="feed" className="flex items-center space-x-1">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">피드</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center space-x-1">
                <Trophy className="h-4 w-4" />
                <span className="hidden sm:inline">통계</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center space-x-1">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">설정</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <UserProfileSection
                profile={userProfile}
                onProfileUpdate={setUserProfile}
                onMemberUpdate={updateMember}
              />
            </TabsContent>

            <TabsContent value="feed" className="space-y-6">
              <WorkoutFeedSection 
                feed={workoutFeed}
                onFeedUpdate={setWorkoutFeed}
              />
            </TabsContent>

            <TabsContent value="stats" className="space-y-6">
              <WorkoutStatsSection stats={workoutStats} />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <UserSettingsSection 
                settings={userSettings}
                onSettingsUpdate={setUserSettings}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 사이드바 */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>메뉴</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      activeTab === 'profile' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>프로필</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('feed')}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      activeTab === 'feed' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4" />
                      <span>운동 피드</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('stats')}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      activeTab === 'stats' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Trophy className="h-4 w-4" />
                      <span>통계</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      activeTab === 'settings' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>설정</span>
                    </div>
                  </button>
                </CardContent>
              </Card>
            </div>

            {/* 메인 콘텐츠 */}
            <div className="lg:col-span-3">
              {activeTab === 'profile' && (
                <UserProfileSection
                  profile={userProfile}
                  onProfileUpdate={setUserProfile}
                  onMemberUpdate={updateMember}
                />
              )}
              {activeTab === 'feed' && (
                <WorkoutFeedSection 
                  feed={workoutFeed}
                  onFeedUpdate={setWorkoutFeed}
                />
              )}
              {activeTab === 'stats' && (
                <WorkoutStatsSection stats={workoutStats} />
              )}
              {activeTab === 'settings' && (
                <UserSettingsSection 
                  settings={userSettings}
                  onSettingsUpdate={setUserSettings}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyPage;
