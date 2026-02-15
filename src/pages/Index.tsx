import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Camera,
  Banknote,
  MessageCircle,
  CalendarCheck,
  Bell,
  BarChart3,
  Zap,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const WelcomePage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-slate-50 via-white to-indigo-50 overflow-x-hidden pb-safe">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="text-white font-bold text-sm">HCM</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900">헬창마을</h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => navigate('/login')}
                className="text-slate-600 hover:text-indigo-600"
              >
                로그인
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <section className="container mx-auto px-4 pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="text-center max-w-4xl mx-auto">
          <p className="inline-block px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-6">
            의지가 아닌, 시스템으로 운동 습관을 만듭니다.
          </p>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 mb-6 leading-tight tracking-tight">
            돈을 걸어야
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              움직인다.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            친구와 운동방 만들고, 
            <br className="hidden sm:block" />
            운동 인증샷 올리고, 
            <br className="hidden sm:block" />
            횟수 못 채우면 벌금!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/login')}
              className="text-lg px-10 py-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/30 font-semibold rounded-xl"
            >
              무료로 시작하기
            </Button>
          </div>
          <p className="text-sm text-slate-500 mt-4">가입 후 바로 운동방을 만들 수 있어요</p>
        </div>
      </section>

      {/* 페인 포인트 */}
      <section className="bg-slate-100/80 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-10">
            이런 경험, 있지 않나요?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              '작심삼일의 연속',
              '매일 반복되는 "내일부터"',
              '운동 동기부여가 없을 때',
              '벌금 관리하기 귀찮을 때',
            ].map((text, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-slate-200/80 shadow-sm"
              >
                <span className="text-slate-400 text-xl">😓</span>
                <span className="text-slate-700 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-indigo-600 font-semibold mt-6">
            헬창마을이 해결해 드립니다
          </p>
        </div>
      </section>

      {/* 핵심 기능 & 영업 포인트 */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">
            올인원 운동 인증 플랫폼
          </h2>
          <p className="text-center text-slate-600 mb-16 max-w-2xl mx-auto">
            운동 인증 · 벌금 관리 · 채팅방
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* 운동방 */}
            <Card className="border-slate-200/80 shadow-lg hover:shadow-xl transition-shadow overflow-hidden group">
              <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500" />
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle className="text-lg">운동방</CardTitle>
                <CardDescription className="font-semibold text-indigo-600">
                  방 하나 만들고, 규칙만 정하면 끝
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">
                  주간 최소 인증횟수 + 1회 미인증시 벌금
                </p>
              </CardContent>
            </Card>

            {/* 운동 인증 */}
            <Card className="border-slate-200/80 shadow-lg hover:shadow-xl transition-shadow overflow-hidden group">
              <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Camera className="h-6 w-6 text-emerald-600" />
                </div>
                <CardTitle className="text-lg">운동 인증</CardTitle>
                <CardDescription className="font-semibold text-emerald-600">
                  인증샷 + 운동 시간 + 운동종류
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">
                  운동 인증샷 올리고, <br/>
                  방 멤버가 서로 확인해요
                </p>
              </CardContent>
            </Card>

            {/* 벌금 시스템 */}
            <Card className="border-slate-200/80 shadow-lg hover:shadow-xl transition-shadow overflow-hidden group">
              <div className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Banknote className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle className="text-lg">벌금 관리</CardTitle>
                <CardDescription className="font-semibold text-amber-600">
                  공용 계좌로 투명하게 정산
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">
                  벌금 계좌를 등록하면 누가 얼마 냈는지 앱에서 한눈에 볼 수 있어요.
                </p>
              </CardContent>
            </Card>

            {/* 실시간 채팅 */}
            <Card className="border-slate-200/80 shadow-lg hover:shadow-xl transition-shadow overflow-hidden group">
              <div className="h-1.5 bg-gradient-to-r from-violet-500 to-purple-500" />
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <MessageCircle className="h-6 w-6 text-violet-600" />
                </div>
                <CardTitle className="text-lg">방 채팅</CardTitle>
                <CardDescription className="font-semibold text-violet-600">
                  카톡이 필요 없어요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">
                  운동방 멤버와의 소통공간이에요
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 2행: 휴식일, 대시보드, 마이페이지, 푸시 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mt-6">
            <Card className="border-slate-200/80 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-sky-600" />
                  <CardTitle className="text-base">휴식일</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">
                  운동 쉬고싶을 때 휴식일을 등록하면<br/>해당 기간엔 벌금이 없어요.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  <CardTitle className="text-base">대시보드</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">
                  운동 현황과 인증 랭킹을 볼 수 있어요.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-base">마이페이지</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">
                  내 운동 피드를 통해 성취감이 생겨요.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-rose-500" />
                  <CardTitle className="text-base">푸시 알림</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm">
                  운동 인증하거나 채팅을 보내면 <br />푸시 알림이 와요.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 하단 CTA */}
      <section className="py-20 border-t border-slate-200">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-6">
            <CheckCircle2 className="h-4 w-4" />
            가입 비용 없음 · 바로 사용 가능
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            이번 주말, 친구하고 운동방 만들어 볼까요?
          </h2>
          <p className="text-slate-600 mb-8 max-w-xl mx-auto">
            규칙만 정하면 됩니다. "주 3회 인증 필수, 한번 빼먹으면 5000원"
          </p>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-slate-200 bg-slate-50/50 py-8">
        <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© 2026 HCM. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;
