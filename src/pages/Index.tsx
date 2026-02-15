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
  type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

/** 이미지/GIF 표시 컴포넌트 - src 없거나 로드 실패 시 아이콘 placeholder */
const FeatureMedia = ({
  src,
  alt,
  icon: Icon,
  placeholderBg,
  aspectRatio = '4/9',
}: {
  src?: string | null;
  alt: string;
  icon: LucideIcon;
  placeholderBg: string;
  aspectRatio?: string;
}) => {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !src || failed;

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 shadow-lg"
      style={{ aspectRatio }}
    >
      {showPlaceholder ? (
        <div className={`absolute inset-0 flex items-center justify-center ${placeholderBg}`}>
          <Icon className="h-16 w-16 text-white/80 sm:h-20 sm:w-20" strokeWidth={1.5} />
        </div>
      ) : (
        <>
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover object-top"
            loading="lazy"
            onError={() => setFailed(true)}
          />
        </>
      )}
    </div>
  );
};

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
            운동 혼자하지 마세요
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              "돈 걸고" 같이 하세요
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            사람들과 운동방 만들고, 
            <br/>
            운동 인증샷 올리고, 
            <br/>
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
              '"내일부터 운동한다" → 절대안함',
              '혼자 운동하기 싫을 때',
              '매일 벌금 집계하기 귀찮을 때',
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
            헬창마을이 해결해 드립니다❗️
          </p>
        </div>
      </section>

      {/* 핵심 기능 & 영업 포인트 - 이미지/GIF 포함 */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">
            올인원 운동 인증 플랫폼
          </h2>
          <p className="text-center text-slate-600 mb-20 max-w-2xl mx-auto">
            운동방 대시보드 · 운동 인증 · 벌금 관리 · 채팅방
          </p>

          {/* 메인 기능: 이미지 + 텍스트 교차 배치 */}
          <div className="max-w-5xl mx-auto space-y-24">
            {/* 1. 운동방 - 이미지 좌측 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div className="order-2 lg:order-1">
                <FeatureMedia
                  src="/images/features/room.gif"
                  alt="운동방 화면"
                  icon={Users}
                  placeholderBg="bg-gradient-to-br from-indigo-500 to-violet-600"
                  aspectRatio="4/9"
                />
              </div>
              <div className="order-1 lg:order-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-indigo-600" />
                  </div>
                  <span className="text-sm font-medium text-indigo-600">운동방 대시보드</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  방 하나 만들고, 규칙만 정하면 끝
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  주간 최소 인증횟수 + 1회 미인증시 벌금
                </p>
              </div>
            </div>

            {/* 2. 운동 인증 - 이미지 우측 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Camera className="h-5 w-5 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-emerald-600">운동 인증</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  운동 인증하기
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  운동 인증샷 올리고, <br/>
                  방 멤버들과 서로 확인해요
                </p>
              </div>
              <div>
                <FeatureMedia
                  src="/images/features/upload.gif"
                  alt="운동 인증 화면"
                  icon={Camera}
                  placeholderBg="bg-gradient-to-br from-emerald-500 to-teal-600"
                  aspectRatio="4/9"
                />
              </div>
            </div>

            {/* 3. 벌금 관리 - 이미지 좌측 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div className="order-2 lg:order-1">
                <FeatureMedia
                  src="/images/features/penalty.gif"
                  alt="벌금 관리 화면"
                  icon={Banknote}
                  placeholderBg="bg-gradient-to-br from-amber-500 to-orange-600"
                  aspectRatio="4/9"
                />
              </div>
              <div className="order-1 lg:order-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Banknote className="h-5 w-5 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-amber-600">벌금 관리</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  매주 자동 집계되는 벌금 내역
                </h3>
                <p className="text-slate-600 leading-relaxed">
                   운동 미인증한 횟수 만큼 벌금이 자동으로 집계돼요
                </p>
              </div>
            </div>

            {/* 4. 방 채팅 - 이미지 우측 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-violet-600" />
                  </div>
                  <span className="text-sm font-medium text-violet-600">채팅방</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  카톡이 필요 없어요
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  운동방 멤버와의 소통공간이에요
                </p>
              </div>
              <div>
                <FeatureMedia
                  src="/images/features/chat.gif"
                  alt="방 채팅 화면"
                  icon={MessageCircle}
                  placeholderBg="bg-gradient-to-br from-violet-500 to-purple-600"
                  aspectRatio="4/9"
                />
              </div>
            </div>
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
            지금 바로 운동방을 개설해보세요
          </h2>
          <p className="text-slate-600 mb-8 max-w-xl mx-auto">
            규칙만 정하면 됩니다. <br/>"주 3회 인증 필수, 한번 빼먹으면 5000원"
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
