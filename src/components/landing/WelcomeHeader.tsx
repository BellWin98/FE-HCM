import { Button } from '@/components/ui/button';

type WelcomeHeaderProps = {
  onNavigate: (path: string) => void;
};

export const WelcomeHeader = ({ onNavigate }: WelcomeHeaderProps) => (
  <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
    <div className="container mx-auto max-w-6xl px-4 py-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="flex items-center space-x-2 rounded-2xl px-1 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white"
          onClick={() => onNavigate('/')}
          aria-label="헬창마을 랜딩페이지로 이동"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 shadow-md shadow-indigo-500/20">
            <span className="text-sm font-bold text-white">HCM</span>
          </div>
          <span className="text-xl font-bold text-slate-900">헬창마을</span>
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => onNavigate('/login')}
            className="hidden text-sm font-medium text-slate-600 hover:text-indigo-600 sm:inline-flex"
          >
            로그인
          </Button>
        </div>
      </div>
    </div>
  </header>
);
