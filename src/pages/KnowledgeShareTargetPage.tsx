import { useEffect, useRef } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useQuickNote } from '@/contexts/QuickNoteContext';
import { useKnowledgeAccess } from '@/hooks/useKnowledgeAccess';
import { parseSharedContent } from '@/lib/parseSharedContent';

/**
 * Android 공유 시트(Web Share Target)의 도착 화면. 가드 컴포넌트 없이 직접 판정한다
 * (로딩 → 미인증 → 권한없음 → 통과). 미인증 시 공유 값은 보존하지 않는다.
 */
const KnowledgeShareTargetPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const { hasAccess, isPending } = useKnowledgeAccess();
  const { openQuickNote } = useQuickNote();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const handledRef = useRef(false);

  const decided = !loading && !isPending && isAuthenticated;

  useEffect(() => {
    if (!decided || handledRef.current) return;
    handledRef.current = true;

    if (!hasAccess) {
      toast.error('사용할 수 없는 기능입니다.');
      navigate('/dashboard', { replace: true });
      return;
    }

    openQuickNote({
      prefill: parseSharedContent({
        title: searchParams.get('title'),
        text: searchParams.get('text'),
        url: searchParams.get('url'),
      }),
      onClosed: () => navigate('/notes', { replace: true }),
    });
  }, [decided, hasAccess, navigate, openQuickNote, searchParams]);

  if (!loading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
};

export default KnowledgeShareTargetPage;
