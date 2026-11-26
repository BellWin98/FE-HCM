import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PUSH_NAVIGATE, toPushUrl } from '@/lib/pushNavigation';

// 서비스워커가 알림 클릭 시 보내는 PUSH_NAVIGATE 메시지를 받아 해당 경로로 이동한다.
export const useServiceWorkerNavigation = (): void => {
  const navigate = useNavigate();

  useEffect(() => {
    const sw = typeof navigator !== 'undefined' ? navigator.serviceWorker : undefined;
    if (!sw) return;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== PUSH_NAVIGATE) return;
      navigate(toPushUrl(event.data.url));
    };
    sw.addEventListener('message', onMessage);
    return () => sw.removeEventListener('message', onMessage);
  }, [navigate]);
};
