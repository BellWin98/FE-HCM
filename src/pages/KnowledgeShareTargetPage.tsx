import { useEffect, useRef } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useQuickNote } from '@/contexts/QuickNoteContext';
import { useKnowledgeAccess } from '@/hooks/useKnowledgeAccess';
import { parseSharedContent } from '@/lib/parseSharedContent';
import { clearSharedPayload, takeSharedPayload } from '@/lib/shareTargetStash';

/**
 * Android 공유 시트(Web Share Target)의 도착 화면. 가드 컴포넌트 없이 직접 판정한다
 * (로딩 → 미인증 → 권한없음 → 통과). 미인증 시 공유 값은 보존하지 않는다.
 *
 * 공유 경로는 두 가지다.
 * - GET 쿼리(`?title=&text=&url=`): 쿼리 값을 그대로 쓴다.
 * - POST(이미지 포함): 서비스워커(public/share-target-sw.js)가 캐시에 맡기고 `?shared=1` 로 보낸다.
 *   통과하면 보관본을 꺼내 쓰고, 미인증·권한없음이면 보관본을 지운다.
 */
const KnowledgeShareTargetPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const { canWrite, isPending } = useKnowledgeAccess();
  const { openQuickNote } = useQuickNote();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const handledRef = useRef(false);

  const decided = !loading && !isPending && isAuthenticated;
  const unauthenticated = !loading && !isAuthenticated;

  useEffect(() => {
    if (!unauthenticated) return;
    void clearSharedPayload();
  }, [unauthenticated]);

  useEffect(() => {
    if (!decided || handledRef.current) return;
    handledRef.current = true;

    if (!canWrite) {
      void clearSharedPayload();
      toast.error('사용할 수 없는 기능입니다.');
      navigate('/dashboard', { replace: true });
      return;
    }

    const handleClosed = (): void => navigate('/notes', { replace: true });

    if (searchParams.get('shared') !== '1') {
      openQuickNote({
        prefill: parseSharedContent({
          title: searchParams.get('title'),
          text: searchParams.get('text'),
          url: searchParams.get('url'),
        }),
        onClosed: handleClosed,
      });
      return;
    }

    void takeSharedPayload().then((payload) => {
      openQuickNote({
        prefill: parseSharedContent({
          title: payload?.title ?? null,
          text: payload?.text ?? null,
          url: payload?.url ?? null,
        }),
        prefillFiles: payload?.files ?? [],
        onClosed: handleClosed,
      });
    });
  }, [decided, canWrite, navigate, openQuickNote, searchParams]);

  if (unauthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
};

export default KnowledgeShareTargetPage;
