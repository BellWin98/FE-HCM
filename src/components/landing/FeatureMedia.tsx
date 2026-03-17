import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';

/** 이미지/GIF 표시 컴포넌트 - src 없거나 로드 실패 시 아이콘 placeholder */
export const FeatureMedia = ({
  src,
  alt,
  icon: Icon,
  placeholderBg,
  aspectRatio = '4/9',
}: {
  src?: string | null;
  alt: string;
  icon: LucideIcon;
  placeholderBg: string;
  aspectRatio?: string;
}) => {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !src || failed;

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-sm"
      style={{ aspectRatio }}
    >
      {showPlaceholder ? (
        <div className={`absolute inset-0 flex items-center justify-center ${placeholderBg}`}>
          <Icon className="h-16 w-16 text-white/80 sm:h-20 sm:w-20" strokeWidth={1.5} />
        </div>
      ) : (
        <img
          src={src ?? ''}
          alt={alt}
          className="h-full w-full object-cover object-top"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
};
