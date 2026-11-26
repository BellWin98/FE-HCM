export const PUSH_NAVIGATE = 'PUSH_NAVIGATE';

const PUSH_TOAST_DURATION = 2000;

interface PushToastOptions {
  description?: string;
  duration: number;
  action?: { label: string; onClick: () => void };
}

// 푸시 data.path 를 앱 내부 경로로 정규화한다. 비었거나 외부/상대 경로면 루트로 보낸다.
export const toPushUrl = (path: string | undefined | null): string => {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return '/';
  return path;
};

export const pushToastOptions = (
  data: Record<string, string> | undefined,
  navigate: (url: string) => void,
): PushToastOptions => {
  const options: PushToastOptions = {
    description: data?.body ?? undefined,
    duration: PUSH_TOAST_DURATION,
  };
  const path = data?.path;
  if (!path) return options;
  return {
    ...options,
    action: { label: '보기', onClick: () => navigate(toPushUrl(path)) },
  };
};
