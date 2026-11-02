import { cn } from '@/lib/utils';

const MAX_VISIBLE = 4;

interface NoteImageStripProps {
  images: string[];
  size?: 'md' | 'sm';
  onOpen: (index: number) => void;
}

const NoteImageStrip = ({ images, size = 'md', onOpen }: NoteImageStripProps) => {
  if (images.length === 0) return null;

  const hasOverflow = images.length > MAX_VISIBLE;
  const visible = hasOverflow ? images.slice(0, MAX_VISIBLE - 1) : images;
  const hiddenCount = images.length - visible.length;
  const boxClass = size === 'sm' ? 'h-10 w-10' : 'h-14 w-14';

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>, index: number): void => {
    event.stopPropagation();
    onOpen(index);
  };

  return (
    <div className="flex gap-1.5">
      {visible.map((src, index) => (
        <button
          key={`${src}-${index}`}
          type="button"
          aria-label={`이미지 ${index + 1}/${images.length} 크게 보기`}
          onClick={(event) => handleOpen(event, index)}
          className={cn('shrink-0 overflow-hidden rounded-md bg-muted', boxClass)}
        >
          <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
        </button>
      ))}
      {hasOverflow && (
        <button
          type="button"
          aria-label={`이미지 ${MAX_VISIBLE}/${images.length} 크게 보기`}
          onClick={(event) => handleOpen(event, MAX_VISIBLE - 1)}
          className={cn(
            'relative shrink-0 overflow-hidden rounded-md bg-muted text-sm font-semibold text-white',
            boxClass
          )}
        >
          <img src={images[MAX_VISIBLE - 1]} alt="" loading="lazy" className="h-full w-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center bg-black/55">+{hiddenCount}</span>
        </button>
      )}
    </div>
  );
};

export default NoteImageStrip;
