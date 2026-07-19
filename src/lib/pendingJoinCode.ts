const PENDING_JOIN_CODE_KEY = 'pendingJoinCode';

/**
 * 카카오 초대 링크(/join?code=...)로 들어온 미로그인 사용자가 로그인을 마친 뒤
 * 원래 참여하려던 방으로 이어갈 수 있도록 입장 코드를 임시 보관한다.
 */
export const savePendingJoinCode = (code: string): void => {
  sessionStorage.setItem(PENDING_JOIN_CODE_KEY, code);
};

export const consumePendingJoinCode = (): string | null => {
  const code = sessionStorage.getItem(PENDING_JOIN_CODE_KEY);
  if (code) {
    sessionStorage.removeItem(PENDING_JOIN_CODE_KEY);
  }
  return code;
};
