declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: {
        sendDefault: (options: Record<string, unknown>) => void;
      };
    };
  }
}

const KAKAO_SDK_SRC = 'https://developers.kakao.com/sdk/js/kakao.js';

/**
 * 여러 컴포넌트에서 호출되더라도 SDK 스크립트 로드는 한 번만 수행된다.
 */
let loadPromise: Promise<void> | null = null;

const loadKakaoSdk = (): Promise<void> => {
  if (window.Kakao) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = KAKAO_SDK_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('카카오 SDK 로드에 실패했습니다.'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
};

export const isKakaoShareAvailable = (): boolean => Boolean(import.meta.env.VITE_KAKAO_JS_KEY);

const ensureKakaoInitialized = async (): Promise<void> => {
  const jsKey = import.meta.env.VITE_KAKAO_JS_KEY;
  if (!jsKey) {
    throw new Error('카카오톡 공유가 아직 설정되지 않았어요.');
  }

  await loadKakaoSdk();

  if (!window.Kakao?.isInitialized()) {
    window.Kakao?.init(jsKey);
  }
};

export const buildRoomInviteUrl = (entryCode: string): string =>
  `${window.location.origin}/join?code=${encodeURIComponent(entryCode)}`;

interface ShareRoomInviteParams {
  roomName: string;
  entryCode: string;
}

export const shareRoomInvite = async ({ roomName, entryCode }: ShareRoomInviteParams): Promise<void> => {
  await ensureKakaoInitialized();

  const inviteUrl = buildRoomInviteUrl(entryCode);

  window.Kakao?.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: `${roomName} 운동방 초대`,
      description: `입장 코드 ${entryCode}로 바로 참여할 수 있어요. 같이 운동해요!`,
      imageUrl: 'https://hcm-bucket-dev.s3.ap-northeast-2.amazonaws.com/HCM_LOGO.png',
      link: {
        mobileWebUrl: inviteUrl,
        webUrl: inviteUrl,
      },
    },
    buttons: [
      {
        title: '바로 참여하기',
        link: {
          mobileWebUrl: inviteUrl,
          webUrl: inviteUrl,
        },
      },
    ],
  });
};
