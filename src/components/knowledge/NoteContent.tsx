import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { highlightCode } from '@/lib/highlight';
import { parseNoteContent } from '@/lib/noteContent';
import { cn } from '@/lib/utils';

const COPY_FEEDBACK_MS = 2000;

type CopyState = 'idle' | 'copied' | 'failed';

const COPY_LABELS: Record<Exclude<CopyState, 'idle'>, string> = {
  copied: '복사됨',
  failed: '복사 실패',
};

const CodeBlock = ({ code, lang }: { code: string; lang: string | null }) => {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const highlighted = highlightCode(code, lang);

  useEffect(() => {
    if (copyState === 'idle') return undefined;
    const timer = window.setTimeout(() => setCopyState('idle'), COPY_FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  // 폰에서는 코드 일부만 정확히 선택하기 어려워 블록 전체를 복사하는 버튼을 둔다.
  const handleCopy = async (): Promise<void> => {
    try {
      if (!navigator.clipboard) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(code);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  };

  return (
    <div className="relative min-w-0">
      <pre className="overflow-x-auto rounded-md bg-muted p-3 pr-10 text-xs">
        {highlighted !== null ? (
          // highlight.js 출력은 코드를 이스케이프한 HTML 이다 — 이 컴포넌트에서 innerHTML 을 쓰는 유일한 곳.
          <code className="hljs font-mono" dangerouslySetInnerHTML={{ __html: highlighted }} />
        ) : (
          <code className="font-mono">{code}</code>
        )}
      </pre>
      <button
        type="button"
        aria-label="코드 복사"
        onClick={() => void handleCopy()}
        className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-md bg-background/80 px-1.5 py-1 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {copyState === 'copied' ? (
          <Check aria-hidden="true" className="h-3.5 w-3.5" />
        ) : (
          <Copy aria-hidden="true" className="h-3.5 w-3.5" />
        )}
        {copyState !== 'idle' && <span role="status">{COPY_LABELS[copyState]}</span>}
      </button>
    </div>
  );
};

interface NoteContentProps {
  content: string;
  className?: string;
}

/** 메모 본문. ``` 코드블록만 고정폭·색 강조로 그리고 나머지 글은 줄바꿈을 살려 그대로 보여 준다. */
export const NoteContent = ({ content, className }: NoteContentProps) => (
  <div className={cn('min-w-0 space-y-2 text-sm', className)}>
    {parseNoteContent(content).map((segment, index) =>
      segment.kind === 'code' ? (
        <CodeBlock key={index} code={segment.code} lang={segment.lang} />
      ) : (
        <p key={index} className="whitespace-pre-wrap break-words">
          {segment.text}
        </p>
      )
    )}
  </div>
);
