import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MAX_NOTE_IMAGES } from '@/types/knowledgeNote';
import type { NoteAttachment } from './noteAttachments';

interface NoteImageAttachmentsProps {
  attachments: NoteAttachment[];
  /** 최대 장수 때문에 담지 못한 이미지 수. 0 이면 안내를 숨긴다. */
  dropped: number;
  /** 저장 중에는 첨부를 바꾸지 못하게 한다. */
  disabled: boolean;
  onAddFiles: (files: File[]) => void;
  onRemove: (id: string) => void;
}

export const NoteImageAttachments = ({
  attachments,
  dropped,
  disabled,
  onAddFiles,
  onRemove,
}: NoteImageAttachmentsProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const full = attachments.length >= MAX_NOTE_IMAGES;

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(event.target.files ?? []);
    // 같은 파일을 다시 골라도 change 가 나도록 비운다.
    event.target.value = '';
    if (files.length > 0) onAddFiles(files);
  };

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || full}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="mr-1.5 h-4 w-4" />
          사진 첨부
        </Button>
        {full && <span className="text-xs text-muted-foreground">최대 {MAX_NOTE_IMAGES}장</span>}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          tabIndex={-1}
          className="hidden"
          onChange={handleChange}
        />
      </div>
      {dropped > 0 && (
        <p role="status" className="text-sm text-muted-foreground">
          {dropped}장은 빠졌어요(최대 {MAX_NOTE_IMAGES}장)
        </p>
      )}
      {attachments.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <li key={attachment.id} className="relative h-16 w-16">
              <img
                src={attachment.previewUrl}
                alt={`첨부 이미지 ${index + 1}`}
                className="h-full w-full rounded-md border object-cover"
              />
              <button
                type="button"
                aria-label={`이미지 ${index + 1} 빼기`}
                disabled={disabled}
                className="absolute -right-1.5 -top-1.5 rounded-full border bg-background p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-50"
                onClick={() => onRemove(attachment.id)}
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
