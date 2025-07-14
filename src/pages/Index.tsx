import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Target, Trophy, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function WelcomePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">FB</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">헬창마을</h1>
          </div>
          <div className="flex space-x-4">
            <Button variant="outline" onClick={() => navigate('/login')}>
              로그인
            </Button>
            {/* <Button onClick={() => navigate('/register')}>
              시작하기
            </Button> */}
          </div>
        </div>
      </header>

      {/* 메인 섹션 */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            돈을 잃어야 <br />움직인다.
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            운동 습관을 만들고 싶다면? <br />친구들과 함께 도전하고, <br />벌금 시스템으로 동기부여를 받아보세요!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/register')} className="text-lg px-8 py-3">
              무료로 시작하기
            </Button>
            {/* <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="text-lg px-8 py-3">
              로그인
            </Button> */}
          </div>
        </div>

        {/* 특징 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 mx-auto text-blue-600 mb-4" />
              <CardTitle>친구와 함께</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                혼자서는 힘든 운동 습관, <br />친구들과 함께라면 더 재미있고 지속 가능해요!
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Target className="h-12 w-12 mx-auto text-green-600 mb-4" />
              <CardTitle>목표 설정</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                주간 운동 목표를 설정하고, <br />사진으로 운동을 인증해보세요.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="h-12 w-12 mx-auto text-red-600 mb-4" />
              <CardTitle>벌금 시스템</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                운동을 빠뜨리면 벌금! <br />확실한 동기부여로 운동 습관을 만들어보세요.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Trophy className="h-12 w-12 mx-auto text-yellow-600 mb-4" />
              <CardTitle>성취감</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                운동 기록을 시각적으로 확인하고, <br />친구들과 성과를 공유해보세요.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* 사용법 섹션 */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-8">3단계로 시작하세요</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">방 생성 또는 참여</h3>
              <p className="text-gray-600">
                친구들과 운동 인증 방을 만들거나, <br /> 기존 방에 참여하세요.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">운동 인증</h3>
              <p className="text-gray-600">
                운동 후 사진을 촬영하고, <br /> 운동 종류와 시간을 기록해서 인증하세요.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">함께 성장</h3>
              <p className="text-gray-600">
                친구들의 운동 현황을 확인하고, <br />서로 격려하며 건강한 습관을 만들어가세요.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p>© 2025 헬창마을.</p>
      </footer>
    </div>
  );
}
