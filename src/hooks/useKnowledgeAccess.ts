import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

/** 라우트 가드와 헤더 메뉴가 같은 캐시를 보도록 키를 한곳에서 정의한다. */
export const KNOWLEDGE_ACCESS_QUERY_KEY = ['knowledgeAccess'] as const;

/**
 * 메모 목록·종목별 조회·종목별 개수 쿼리 키의 공통 prefix.
 * 저장/수정/삭제 후에는 이 prefix 하나만 무효화하면 모두 갱신된다.
 */
export const KNOWLEDGE_NOTES_QUERY_KEY = ['knowledgeNotes'] as const;

/**
 * 로그인한 본인의 지식 메모 접근 권한. role 로 추측하지 않고 서버에 물어본다
 * (`useTossAccess` 와 같은 구조). 실제 차단은 서버가 하며 여기서는 화면 노출만 결정한다.
 */
export const useKnowledgeAccess = () => {
  const { isAuthenticated } = useAuth();

  const { data, isPending, isError } = useQuery({
    queryKey: KNOWLEDGE_ACCESS_QUERY_KEY,
    queryFn: () => api.getKnowledgeAccess(),
    enabled: isAuthenticated,
    retry: false,
    staleTime: 60_000,
  });

  return {
    // 조회 실패는 권한 없음으로 취급한다 — 판정할 수 없으면 열지 않는다.
    hasAccess: !isError && (data?.hasAccess ?? false),
    isPending: isAuthenticated && isPending,
  };
};
