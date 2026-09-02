import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

/** 라우트 가드와 헤더 메뉴가 같은 캐시를 보도록 키를 한곳에서 정의한다. */
export const TOSS_ACCESS_QUERY_KEY = ['tossAccess'] as const;

/**
 * 로그인한 본인의 토스 접근 권한.
 *
 * 토스 접근은 `member.role`이 아니라 서버의 `toss_access`로 관리되고(ADMIN은 등록 없이도 항상 허용),
 * `AuthContext`의 member는 localStorage 캐시라 관리자가 권한을 바꿔도 재로그인 전까지 갱신되지 않는다.
 * 그래서 role 로 추측하지 않고 서버에 물어본다.
 *
 * 실제 차단은 서버(`@PreAuthorize`)가 하므로 여기서는 화면 노출만 결정한다. 헤더가 페이지마다
 * 다시 마운트되는 것을 감안해 1분간은 캐시를 재사용한다 — 관리자가 권한을 바꾸면
 * `AdminMembersPage`가 이 키를 무효화한다.
 */
export const useTossAccess = () => {
  const { isAuthenticated } = useAuth();

  const { data, isPending, isError } = useQuery({
    queryKey: TOSS_ACCESS_QUERY_KEY,
    queryFn: () => api.getTossAccess(),
    enabled: isAuthenticated,
    retry: false,
    staleTime: 60_000,
  });

  return {
    // 조회 실패는 권한 없음으로 취급한다 — 계좌 정보이므로 판정할 수 없으면 열지 않는다.
    hasAccess: !isError && (data?.hasAccess ?? false),
    isPending: isAuthenticated && isPending,
    isError,
  };
};
