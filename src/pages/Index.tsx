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
import { useEffect, useRef, useState } from 'react';

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

const useInView = (options?: IntersectionObserverInit) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!ref.current || isInView) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15, ...options },
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [isInView, options]);

  return { ref, isInView };
};

const FadeInSection = ({ children }: { children: React.ReactNode }) => {
  const { ref, isInView } = useInView();

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      {children}
    </div>
  );
};

const useCountUp = ({ target, duration = 1000 }: { target: number; duration?: number }) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame: number;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.floor(progress * target));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [target, duration]);

  return value;
};

const SocialProofStats = () => {
  const stat1 = useCountUp({ target: 600, duration: 1200 });
  const stat2 = useCountUp({ target: 6, duration: 1200 });
  const stat3 = useCountUp({ target: 88, duration: 1200 });

  return (
    <div className="grid w-full max-w-xl grid-cols-3 gap-3 text-center text-xs sm:text-sm">
      <div className="rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2">
        <p className="text-sm font-semibold text-slate-900">
          {stat1.toLocaleString()}
          회+
        </p>
        <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">총 운동 인증 횟수</p>
      </div>
      <div className="rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2">
        <p className="text-sm font-semibold text-slate-900">
          {stat2.toLocaleString()}
          개
        </p>
        <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">현재 운영 중인 방</p>
      </div>
      <div className="rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2">
        <p className="text-sm font-semibold text-slate-900">{stat3}%</p>
        <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">벌금 완납률</p>
      </div>
    </div>
  );
};

const FAQ = () => {
  const [openId, setOpenId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const items = [
    // {
    //   id: 'account',
    //   question: '회원가입을 꼭 해야 하나요?',
    //   answer:
    //     '초기에는 간편 로그인을 중심으로 제공할 예정입니다. 별도의 복잡한 회원가입 절차 없이, 자주 사용하는 계정 하나만으로 바로 시작할 수 있도록 설계하고 있습니다.',
    // },
    {
      id: 'penalty-rule',
      question: '벌금 금액과 규칙은 누가 정하나요?',
      answer:
        '방장이 운동방을 개설할 때 직접 정해요. 최소 인증 횟수, 인증 1회 누락 시 낼 벌금, 최대 인원을 설정할 수 있어요.',
    },
    {
      id: 'payment',
      question: '실제 돈 거래는 어떻게 진행되나요?',
      answer:
        '헬창마을은 결제/송금 기능을 제공하지 않아요. 서비스 안에서 미인증 횟수와 예상 벌금만 투명하게 계산해 주고, 실제 정산은 계좌이체나 송금 앱 등 방에서 정한 방식으로 직접 진행해 주세요.',
    },
    // {
    //   id: 'quit',
    //   question: '중간에 힘들어서 그만두고 싶으면 어떻게 하나요?',
    //   answer:
    //     '언제든지 방을 나갈 수 있습니다. 다만 이미 발생한 벌금이 있다면, 방 규칙에 따라 정산한 뒤 나가는 것을 추천드립니다.',
    // },
    {
      id: 'photo',
      question: '운동 인증 사진은 꼭 얼굴이 나와야 하나요?',
      answer:
        '얼굴이 반드시 나올 필요는 없습니다. 운동기구가 나온 사진이나, 어플(타임스탬프) 등으로 인증할 수 있어요.',
    },
    // {
    //   id: 'device',
    //   question: '모바일에서만 사용 가능한가요?',
    //   answer:
    //     '현재는 모바일 화면에 최적화되어 있지만, PC 웹 브라우저에서도 이용하실 수 있도록 점진적으로 개선할 예정입니다.',
    // },
  ];

  return (
    <div className="mx-auto mt-10 max-w-3xl space-y-3">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/60"
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-5 sm:py-4"
              onClick={() => handleToggle(item.id)}
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${item.id}`}
            >
              <span className="text-sm font-semibold text-slate-900 sm:text-base">
                {item.question}
              </span>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-xs font-semibold text-slate-600 transition-transform ${
                  isOpen ? 'rotate-45' : ''
                }`}
                aria-hidden="true"
              >
                +
              </span>
            </button>
            <div
              id={`faq-panel-${item.id}`}
              className={`grid transition-all duration-200 ${
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-4 pb-4 text-xs leading-relaxed text-slate-600 sm:px-5 sm:pb-5 sm:text-sm">
                  {item.answer}
                </div>
              </div>
            </div>
          </div>
        );
      })}
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
    <div className="relative min-h-screen min-h-[100dvh] bg-gradient-to-br from-slate-50 via-white to-indigo-50 overflow-x-hidden pb-safe">
      {/* 모바일 고정 CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 px-4 py-3 shadow-[0_-4px_16px_rgba(15,23,42,0.12)] backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div className="text-xs leading-snug text-slate-600">
            <p className="font-semibold text-slate-900">지금 바로 운동 인증하러 가볼까요?</p>
            <p>간편 로그인으로 1초 만에 가입해보세요!</p>
          </div>
          <Button
            size="sm"
            className="min-w-[110px] rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/40 hover:bg-indigo-700"
            onClick={() => navigate('/login')}
            aria-label="헬창마을 시작하기"
          >
            GO! GO!
          </Button>
        </div>
      </div>

      {/* 헤더 */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="flex items-center space-x-2 rounded-lg px-1 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white"
              onClick={() => navigate('/')}
              aria-label="헬창마을 랜딩페이지로 이동"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/30">
                <span className="text-sm font-bold text-white">HCM</span>
              </div>
              <span className="text-xl font-bold text-slate-900">헬창마을</span>
            </button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => navigate('/login')}
                className="hidden text-sm font-medium text-slate-600 hover:text-indigo-600 sm:inline-flex"
              >
                로그인
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero 섹션 */}
        <section className="container mx-auto px-4 pt-12 pb-16 sm:pt-20 sm:pb-24">
          <FadeInSection>
            <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_minmax(0,1fr)] lg:gap-14">
              <div className="flex flex-col">
                <p className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50 px-4 py-2 text-xs font-medium text-indigo-700 shadow-sm sm:text-sm">
                  <span className="inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500 ring-2 ring-indigo-200" />
                  의지가 아닌, 시스템으로 운동 습관을 만들어 드릴게요
                </p>
                <h1 className="mb-6 max-w-2xl text-3xl font-black leading-[1.15] tracking-tight text-slate-900 sm:text-5xl sm:leading-[1.12] lg:text-6xl">
                  헬창마을은 <br /><br />벌금 관리형
                  <br />
                  <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    운동 인증 플랫폼입니다.
                  </span>
                  <br />
                </h1>
                <p className="mb-10 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                  벌금 관리는 신경쓰지 마세요 <br /> 운동에만 집중할 수 있게 도와드릴게요
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <Button
                    size="lg"
                    onClick={() => navigate('/login')}
                    className="rounded-xl bg-indigo-600 px-10 py-6 text-base font-semibold text-white shadow-xl shadow-indigo-500/40 transition-transform duration-150 hover:scale-[1.02] hover:bg-indigo-700 sm:text-lg"
                    aria-label="헬창마을 무료로 시작하고 운동방 만들기"
                  >
                    운동 인증 하러가기
                  </Button>
                  <div className="text-center text-xs leading-relaxed text-slate-500 sm:text-sm">
                    <p>간편 로그인으로 누구나 1초 만에 가입할 수 있어요.</p>
                  </div>
                </div>
              </div>

              {/* Hero 데모 영역 */}
              <div className="relative">
                <div className="pointer-events-none absolute -inset-x-6 -top-6 -bottom-10 rounded-[2rem] bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-amber-500/10 blur-3xl" />
                <div className="relative rounded-2xl border border-slate-200/80 bg-white/80 p-3 shadow-2xl shadow-slate-900/10 backdrop-blur">
                  <FeatureMedia
                    src="/images/demo/main.gif"
                    alt="헬창마을 서비스 데모 화면"
                    icon={BarChart3}  
                    placeholderBg="bg-gradient-to-br from-indigo-500 to-violet-600"
                    aspectRatio="9/16"
                  />
                </div>
              </div>
            </div>
          </FadeInSection>
        </section>

        {/* Social Proof Bar */}
        <section className="border-y border-slate-200 bg-white/80 py-4">
          <div className="container mx-auto px-4">
            <FadeInSection>
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-700 sm:text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>현재 13명의 유저가 꾸준히 운동을 인증하고 있어요!</span>
                </div>
                <SocialProofStats />
              </div>
            </FadeInSection>
          </div>
        </section>

        {/* 상세 기능 쇼케이스 - 기존 기능 레이아웃 활용 */}
        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <FadeInSection>
              <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
              왜 꼭 헬창마을이어야 할까요?
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-600 sm:text-base">
                기능이 아니라, 오로지 사용성과 편의성에 집중했어요.
                <br /><br />
                대시보드, 운동 인증, 벌금 집계, 인증 캘린더, 채팅방까지.
                <br /><br />
                헬창마을 안에서 전부 해결되도록 설계했어요.
              </p>
              <div className="mx-auto mt-14 max-w-5xl space-y-20">
                {/* 1. 운동방 - 이미지 좌측 */}
                <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
                  <div className="order-2 lg:order-1">
                    <FeatureMedia
                      src="/images/features/dashboard.gif"
                      alt="운동방 대시보드 화면"
                      icon={Users}
                      placeholderBg="bg-gradient-to-br from-indigo-500 to-violet-600"
                      aspectRatio="4/9"
                    />
                  </div>
                  <div className="order-1 lg:order-2">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                        <Users className="h-5 w-5 text-indigo-600" />
                      </div>
                      <span className="text-sm font-medium text-indigo-600">운동방 대시보드</span>
                    </div>
                    <h3 className="mb-3 text-2xl font-bold text-slate-900">
                      운동기록을 한눈에 확인해요
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                      각 멤버별 주간 인증 횟수와 미인증 횟수를 볼 수 있어요.
                      <br />
                      운동 횟수를 일일이 카운트하지 않아도, 자동으로 집계돼요.
                    </p>
                  </div>
                </div>

                {/* 2. 운동 인증 - 이미지 우측 */}
                <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
                  <div>
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                        <Camera className="h-5 w-5 text-emerald-600" />
                      </div>
                      <span className="text-sm font-medium text-emerald-600">운동 인증</span>
                    </div>
                    <h3 className="mb-3 text-2xl font-bold text-slate-900">
                      초간단 운동 인증, 10초면 돼요
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                      운동 인증샷을 올리면, 그 날의 인증이 바로 반영돼요.
                      <br />
                      서로의 운동 인증샷을 확인하고, 자극을 주고 받아보세요.
                    </p>
                  </div>
                  <div>
                    <FeatureMedia
                      src="/images/features/upload.gif"
                      alt="운동 인증 업로드 화면"
                      icon={Camera}
                      placeholderBg="bg-gradient-to-br from-emerald-500 to-teal-600"
                      aspectRatio="4/9"
                    />
                  </div>
                </div>

                {/* 3. 벌금 관리 - 이미지 좌측 */}
                <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
                  <div className="order-2 lg:order-1">
                    <FeatureMedia
                      src="/images/features/penalty.gif"
                      alt="벌금 자동 집계 화면"
                      icon={Banknote}
                      placeholderBg="bg-gradient-to-br from-amber-500 to-orange-600"
                      aspectRatio="4/9"
                    />
                  </div>
                  <div className="order-1 lg:order-2">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                        <Banknote className="h-5 w-5 text-amber-600" />
                      </div>
                      <span className="text-sm font-medium text-amber-600">벌금 관리</span>
                    </div>
                    <h3 className="mb-3 text-2xl font-bold text-slate-900">
                      기간별로 벌금을 한눈에 확인해요
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                      매주 월요일 자정에 자동으로 벌금을 집계돼고, <br />
                      주간 운동 횟수를 초기화돼요.
                    </p>
                  </div>
                </div>

                {/* 4. 방 채팅 - 이미지 우측 */}
                <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
                  <div>
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                        <MessageCircle className="h-5 w-5 text-violet-600" />
                      </div>
                      <span className="text-sm font-medium text-violet-600">채팅방</span>
                    </div>
                    <h3 className="mb-3 text-2xl font-bold text-slate-900">
                      카톡방을 따로 만들 필요가 없어요
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                      운동방 멤버와의 소통은 헬창마을 안에서 해결하세요.
                      <br />
                      멤버들과 한 곳에서 자유롭게 대화를 나눌 수 있어요.
                    </p>
                  </div>
                  <div>
                    <FeatureMedia
                      src="/images/features/chat.gif"
                      alt="운동방 채팅 화면"
                      icon={MessageCircle}
                      placeholderBg="bg-gradient-to-br from-violet-500 to-purple-600"
                      aspectRatio="4/9"
                    />
                  </div>
                </div>
              </div>
            </FadeInSection>
          </div>
        </section>

        {/* 고객 후기 섹션 */}
        {/* <section className="bg-slate-50/80 py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <FadeInSection>
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  이미 헬창마을과 함께 
                  <br />
                  운동하고 있는 사람들
                </h2>
                <p className="mt-3 text-sm text-slate-600 sm:text-base">
                  실제 유저들의 후기를 기반으로 작성된 예시입니다.
                  <br />
                  서비스가 성장하면서 더 많은 생생한 이야기들이 
                  <br />
                  이 자리를 채울 거예요.
                </p>
              </div>
              <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
                {[
                  {
                    name: '김OO',
                    role: '3년차 직장인',
                    quote:
                      '퇴근 후에는 늘 누워만 있었는데, 벌금 방 덕분에 주 3회 헬스장을 4주째 빠지지 않고 가는 중입니다.',
                  },
                  {
                    name: '박OO',
                    role: '사이드프로젝트 팀장',
                    quote:
                      '팀원들과 같이 방을 만들어서 운동 중인데, 벌금 덕분에 서로 눈치 보면서라도 꼭 운동하게 돼요.',
                  },
                  {
                    name: '이OO',
                    role: '헬린이',
                    quote:
                      '혼자 운동 계획 세우면 항상 작심삼일이었는데, 지금은 방 사람들 눈치가 보여서라도 인증을 올리게 됩니다.',
                  },
                ].map((item) => (
                  <Card
                    key={item.name}
                    className="flex h-full flex-col border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/60"
                  >
                    <CardContent className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        <p className="text-sm leading-relaxed text-slate-700">“{item.quote}”</p>
                      </div>
                      <div className="mt-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                          {item.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </FadeInSection>
          </div>
        </section> */}

        {/* 요금/정책 섹션 */}
        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <FadeInSection>
              <div className="mx-auto max-w-3xl text-center">
                <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-semibold text-white">
                  <Zap className="h-3 w-3" />
                  지금은 베타 기간, 전 기능 무료
                </p>
                <p className="mt-3 text-sm text-slate-600 sm:text-base">
                  헬창마을은 아직 베타 서비스 단계이기 때문에,
                  <br />
                  플랫폼 이용료 없이 모든 기능을 무료로 사용하실 수 있어요.
                </p>
              </div>
            </FadeInSection>
          </div>
        </section>

        {/* FAQ 섹션 */}
        <section className="bg-slate-50/90 py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <FadeInSection>
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">자주 묻는 질문</h2>
                <p className="mt-3 text-sm text-slate-600 sm:text-base">
                  가입 전에 궁금하실 수 있는 것들을 먼저 정리했어요.
                  <br />
                  이 외에 궁금한 점이 있다면 언제든지 문의해 주세요.
                </p>
              </div>
              <FAQ />
            </FadeInSection>
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-slate-200 bg-slate-50/80 py-8">
        <div className="container mx-auto px-4 text-center text-xs text-slate-500 sm:text-sm">
          <p>© 2026 HCM. All rights reserved.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              className="text-xs text-slate-500 underline-offset-4 hover:text-slate-700 hover:underline"
              aria-label="개인정보 처리방침 보기"
            >
              개인정보처리방침
            </button>
            <button
              type="button"
              className="text-xs text-slate-500 underline-offset-4 hover:text-slate-700 hover:underline"
              aria-label="서비스 이용약관 보기"
            >
              이용약관
            </button>
            <button
              type="button"
              className="text-xs text-slate-500 underline-offset-4 hover:text-slate-700 hover:underline"
              aria-label="헬창마을 문의 메일 보내기"
            >
              문의하기 bellwin98@gmail.com
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;
