import { useCallback, useState } from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error: virtual module provided by vite-plugin-pwa at build time
import { useRegisterSW } from 'virtual:pwa-register/react';

interface UsePwaUpdaterResult {
  needRefresh: boolean;
  handleUpdate: () => void;
  dismiss: () => void;
}

export const usePwaUpdater = (): UsePwaUpdaterResult => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  const handleNeedRefresh = useCallback<Parameters<typeof useRegisterSW>[0]['onNeedRefresh']>(
    ({ worker }) => {
      setNeedRefresh(true);
      setWaitingWorker(worker ?? null);
    },
    [],
  );

  const handleRegisterError = useCallback<NonNullable<Parameters<typeof useRegisterSW>[0]['onRegisterError']>>(
    (error) => {
      console.error('[PWA] service worker registration error', error);
    },
    [],
  );

  const { updateServiceWorker } = useRegisterSW({
    immediate: true,
    onNeedRefresh: handleNeedRefresh,
    onRegisterError: handleRegisterError,
  });

  const handleUpdate = useCallback(() => {
    if (!updateServiceWorker) {
      return;
    }

    try {
      // 강제로 대기 중인 SW를 활성화시키고, 활성화 후 페이지를 한 번만 리로드한다.
      void updateServiceWorker(true)
        .then(() => {
          if (waitingWorker) {
            waitingWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        })
        .finally(() => {
          window.location.reload();
        });
    } catch (error) {
      console.error('[PWA] update failed', error);
      window.location.reload();
    }
  }, [updateServiceWorker, waitingWorker]);

  const dismiss = useCallback(() => {
    setNeedRefresh(false);
  }, []);

  if (import.meta.env.DEV) {
    return {
      needRefresh: false,
      handleUpdate: () => {},
      dismiss: () => {},
    };
  }

  return {
    needRefresh,
    handleUpdate,
    dismiss,
  };
};

