import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Target, Trophy, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const WelcomePage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-brand-bg text-brand-foreground overflow-x-hidden pb-safe">
      {/* 헤더 */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center">
              <span className="text-brand-bg font-bold text-sm">HCM</span>
            </div>
            <h1 className="text-2xl font-bold text-brand-foreground">헬창마을</h1>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => navigate('/login')}
              className="border-brand-primary text-brand-primary hover:bg-brand-primary/10"
            >
              로그인
            </Button>
            <Button
              onClick={() => navigate('/register')}
              className="bg-brand-primary text-brand-bg hover:bg-brand-primary/90 hover:scale-[1.02] transition-transform"
            >
              무료로 시작하기
            </Button>
          </div>
        </div>
      </header>

      {/* 메인 섹션 - Above the fold */}
      <main className="container mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-16 min-h-[50vh] sm:min-h-[70vh] flex flex-col justify-center">
          <h1 className="text-4xl sm:text-6xl font-black text-brand-primary mb-6 leading-tight tracking-tight">
            돈을 잃어야 <br />움직인다.
          </h1>
          <p className="text-lg sm:text-xl text-brand-foreground/90 mb-8 max-w-2xl mx-auto">
            친구와 방 만들고, 운동 인증하고, 못 하면 벌금. <br />
            확실한 동기부여로 운동 습관을 만드세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/register')}
              className="text-lg px-8 py-6 bg-brand-primary text-brand-bg hover:bg-brand-primary/90 hover:scale-[1.02] transition-transform font-bold"
            >
              무료로 시작하기
            </Button>
          </div>
        </div>

        {/* 특징 카드 - Dark Surface */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center bg-brand-surface border border-white/10 hover:border-brand-primary/30 transition-colors">
            <CardHeader>
              <Users className="h-12 w-12 mx-auto text-brand-primary mb-4" />
              <CardTitle className="text-brand-foreground">친구와 함께</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-brand-foreground/80">
                혼자서는 힘든 운동 습관, <br />친구들과 함께라면 더 재미있고 지속 가능해요!
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center bg-brand-surface border border-white/10 hover:border-brand-primary/30 transition-colors">
            <CardHeader>
              <Target className="h-12 w-12 mx-auto text-brand-primary mb-4" />
              <CardTitle className="text-brand-foreground">목표 설정</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-brand-foreground/80">
                주간 운동 목표를 설정하고, <br />사진으로 운동을 인증해보세요.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center bg-brand-surface border border-white/10 hover:border-brand-penalty/30 transition-colors">
            <CardHeader>
              <Shield className="h-12 w-12 mx-auto text-brand-penalty mb-4" />
              <CardTitle className="text-brand-foreground">벌금 시스템</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-brand-foreground/80">
                운동을 빠뜨리면 벌금! <br />확실한 동기부여로 운동 습관을 만들어보세요.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center bg-brand-surface border border-white/10 hover:border-brand-primary/30 transition-colors">
            <CardHeader>
              <Trophy className="h-12 w-12 mx-auto text-brand-primary mb-4" />
              <CardTitle className="text-brand-foreground">성취감</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-brand-foreground/80">
                운동 기록을 시각적으로 확인하고, <br />친구들과 성과를 공유해보세요.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* 3단계 섹션 */}
        <div className="bg-brand-surface rounded-2xl p-8 shadow-lg border border-white/10">
          <h2 className="text-3xl font-bold text-center mb-8 text-brand-foreground">3단계로 시작하세요</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-primary/20 border-2 border-brand-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-brand-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-brand-foreground">방 생성 또는 참여</h3>
              <p className="text-brand-foreground/80">
                친구들과 운동 인증 방을 만들거나, <br /> 기존 방에 참여하세요.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-primary/20 border-2 border-brand-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-brand-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-brand-foreground">운동 인증</h3>
              <p className="text-brand-foreground/80">
                운동 후 사진을 촬영하고, <br /> 운동 종류와 시간을 기록해서 인증하세요.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-primary/20 border-2 border-brand-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-brand-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-brand-foreground">함께 성장</h3>
              <p className="text-brand-foreground/80">
                친구들의 운동 현황을 확인하고, <br />서로 격려하며 건강한 습관을 만들어가세요.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="container mx-auto px-4 py-8 text-center text-brand-foreground/60">
        <p>© 2025 헬창마을.</p>
      </footer>
    </div>
  );
};

export default WelcomePage;
