import { useRef, useState } from 'react';
import type { KeyboardEvent, RefObject } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import TossStockSearchSheet from '@/components/tossStock/TossStockSearchSheet';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { KNOWLEDGE_NOTES_QUERY_KEY } from '@/hooks/useKnowledgeAccess';
import { loadLastContext, saveLastContext } from '@/lib/knowledgeNoteDraft';
import { KNOWLEDGE_CATEGORIES, KNOWLEDGE_CATEGORY_LABELS } from '@/types/knowledgeNote';
import type { KnowledgeCategory, KnowledgeNoteInput } from '@/types/knowledgeNote';
import type { QuickNoteOpenOptions } from '@/contexts/QuickNoteContext';

const SOURCE_REQUIRED_MESSAGE = '출처(링크 또는 텍스트)를 입력하세요';
const CONTENT_REQUIRED_MESSAGE = '내용을 입력하세요';
const SAVE_FAILED_MESSAGE = '메모를 저장하지 못했습니다.';

interface SelectedStock {
  symbol: string;
  name: string;
}

interface KnowledgeNoteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: QuickNoteOpenOptions;
}

/** 쉼표로 나눈 조각을 다듬고 이미 있는 태그와 겹치는 것을 거른다. */
const mergeTags = (current: string[], additions: string[]): string[] => {
  const next = [...current];
  additions.forEach((raw) => {
    const tag = raw.trim();
    if (tag && !next.includes(tag)) next.push(tag);
  });
  return next;
};

interface KnowledgeNoteFormProps {
  options: QuickNoteOpenOptions;
  contentRef: RefObject<HTMLTextAreaElement>;
  onDone: () => void;
}

const KnowledgeNoteForm = ({ options, contentRef, onDone }: KnowledgeNoteFormProps) => {
  const { note, prefill } = options;
  const queryClient = useQueryClient();

  // 폼 상태는 다이얼로그 콘텐츠가 마운트될 때 한 번 정해진다(닫히면 언마운트되므로 열 때마다 새로 채워진다).
  const [initial] = useState(() => {
    if (note) {
      return {
        category: note.category,
        content: note.content,
        sourceUrl: note.sourceUrl ?? '',
        sourceText: note.sourceText ?? '',
        tags: note.tags,
        stock: note.stockSymbol ? { symbol: note.stockSymbol, name: note.stockName ?? note.stockSymbol } : null,
      };
    }
    const last = loadLastContext();
    // 출처는 링크·텍스트가 한 쌍이다 — prefill 이 한쪽만 줘도 마지막 출처의 나머지 한쪽을 섞지 않는다.
    const prefillHasSource = Boolean(prefill?.sourceUrl || prefill?.sourceText);
    return {
      category: prefill?.category ?? last?.category ?? 'DEV',
      content: prefill?.content ?? '',
      sourceUrl: (prefillHasSource ? prefill?.sourceUrl : last?.sourceUrl) ?? '',
      sourceText: (prefillHasSource ? prefill?.sourceText : last?.sourceText) ?? '',
      tags: prefill?.tags ?? [],
      stock: prefill?.stockSymbol
        ? { symbol: prefill.stockSymbol, name: prefill.stockName ?? prefill.stockSymbol }
        : null,
    };
  });

  const [category, setCategory] = useState<KnowledgeCategory>(initial.category);
  const [content, setContent] = useState(initial.content);
  const [sourceUrl, setSourceUrl] = useState(initial.sourceUrl);
  const [sourceText, setSourceText] = useState(initial.sourceText);
  const [tags, setTags] = useState<string[]>(initial.tags);
  const [tagDraft, setTagDraft] = useState('');
  const [stock, setStock] = useState<SelectedStock | null>(initial.stock);
  const [stockNotice, setStockNotice] = useState(false);
  const [stockSheetOpen, setStockSheetOpen] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const composingRef = useRef(false);

  const mutation = useMutation({
    mutationFn: (input: KnowledgeNoteInput) =>
      note ? api.updateKnowledgeNote(note.id, input) : api.createKnowledgeNote(input),
  });

  const handleCategoryChange = (value: string): void => {
    const next = value as KnowledgeCategory;
    setCategory(next);
    if (next === 'STOCK') {
      setStockNotice(false);
      return;
    }
    if (stock) {
      // 종목은 주식 분야에서만 의미가 있다 — 조용히 지우지 않고 알린다.
      setStock(null);
      setStockNotice(true);
    }
  };

  const commitTagDraft = (): string[] => {
    const next = mergeTags(tags, tagDraft.split(','));
    setTags(next);
    setTagDraft('');
    return next;
  };

  const handleTagChange = (value: string): void => {
    if (!value.includes(',')) {
      setTagDraft(value);
      return;
    }
    const parts = value.split(',');
    const rest = parts.pop() ?? '';
    setTags((current) => mergeTags(current, parts));
    setTagDraft(rest);
  };

  const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key !== 'Enter' || event.ctrlKey || event.metaKey) return;
    // 한글 조합 중의 Enter 는 조합 확정이지 칩 추가가 아니다.
    if (composingRef.current || event.nativeEvent.isComposing) return;
    event.preventDefault();
    commitTagDraft();
  };

  const handleRemoveTag = (tag: string): void => {
    setTags((current) => current.filter((item) => item !== tag));
  };

  const handleClearSource = (): void => {
    setSourceUrl('');
    setSourceText('');
  };

  const handleSubmit = (): void => {
    if (mutation.isPending) return;

    const url = sourceUrl.trim();
    const text = sourceText.trim();
    const body = content.trim();
    if (!url && !text) {
      setSourceError(SOURCE_REQUIRED_MESSAGE);
      return;
    }
    if (!body) {
      setContentError(CONTENT_REQUIRED_MESSAGE);
      return;
    }

    const input: KnowledgeNoteInput = {
      category,
      content: body,
      ...(url ? { sourceUrl: url } : {}),
      ...(text ? { sourceText: text } : {}),
      tags: mergeTags(tags, tagDraft.split(',')),
      ...(category === 'STOCK' && stock ? { stockSymbol: stock.symbol, stockName: stock.name } : {}),
    };

    mutation.mutate(input, {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: KNOWLEDGE_NOTES_QUERY_KEY });
        toast.success('메모를 저장했습니다.');
        // 수정은 "방금 쓴 맥락" 이 아니므로 다음 빠른 메모의 기본값을 바꾸지 않는다.
        if (!note) {
          saveLastContext({
            category,
            ...(url ? { sourceUrl: url } : {}),
            ...(text ? { sourceText: text } : {}),
          });
        }
        onDone();
      },
      onError: (error) => {
        toast.error(SAVE_FAILED_MESSAGE, {
          description: error instanceof Error && error.message ? error.message : undefined,
        });
      },
    });
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    handleSubmit();
  };

  const handleFormKeyDown = (event: KeyboardEvent<HTMLFormElement>): void => {
    if (event.key !== 'Enter' || !(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    handleSubmit();
  };

  const hasSource = Boolean(sourceUrl || sourceText);

  return (
    <form onSubmit={handleFormSubmit} onKeyDown={handleFormKeyDown} className="grid gap-4">
      <RadioGroup
        aria-label="분야"
        value={category}
        onValueChange={handleCategoryChange}
        className="grid-cols-4 gap-2"
      >
        {KNOWLEDGE_CATEGORIES.map((item) => (
          <Label
            key={item}
            htmlFor={`knowledge-category-${item}`}
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-sm has-[:checked]:border-primary"
          >
            <RadioGroupItem id={`knowledge-category-${item}`} value={item} />
            {KNOWLEDGE_CATEGORY_LABELS[item]}
          </Label>
        ))}
      </RadioGroup>

      {category === 'STOCK' && (
        <div className="grid gap-1">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setStockSheetOpen(true)}>
              종목 연결
            </Button>
            {stock && (
              <span className="flex items-center gap-1 text-sm">
                <span className="font-medium">{stock.name}</span>
                <span className="text-muted-foreground">{stock.symbol}</span>
                <button
                  type="button"
                  aria-label="종목 연결 해제"
                  className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
                  onClick={() => setStock(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
      {stockNotice && (
        <p role="status" className="text-sm text-muted-foreground">
          종목 연결이 해제됩니다
        </p>
      )}

      <div className="grid gap-1.5">
        <Label htmlFor="knowledge-note-content">내용</Label>
        <Textarea
          id="knowledge-note-content"
          ref={contentRef}
          value={content}
          rows={5}
          onChange={(event) => {
            setContent(event.target.value);
            setContentError(null);
          }}
        />
        {contentError && (
          <p role="alert" className="text-sm text-destructive">
            {contentError}
          </p>
        )}
      </div>

      <div className="grid gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">출처</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!hasSource}
            onClick={handleClearSource}
          >
            출처 지우기
          </Button>
        </div>
        <Label htmlFor="knowledge-note-source-url" className="sr-only">
          출처 링크
        </Label>
        <Input
          id="knowledge-note-source-url"
          type="url"
          inputMode="url"
          placeholder="https://"
          value={sourceUrl}
          onChange={(event) => {
            setSourceUrl(event.target.value);
            setSourceError(null);
          }}
        />
        <Label htmlFor="knowledge-note-source-text" className="sr-only">
          출처 텍스트
        </Label>
        <Input
          id="knowledge-note-source-text"
          placeholder="책, 영상, 사람 등 링크가 없는 출처"
          value={sourceText}
          onChange={(event) => {
            setSourceText(event.target.value);
            setSourceError(null);
          }}
        />
        {sourceError && (
          <p role="alert" className="text-sm text-destructive">
            {sourceError}
          </p>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="knowledge-note-tags">태그</Label>
        {tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <li
                key={tag}
                className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs"
              >
                {tag}
                <button
                  type="button"
                  aria-label={`${tag} 태그 삭제`}
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => handleRemoveTag(tag)}
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <Input
          id="knowledge-note-tags"
          placeholder="쉼표 또는 Enter 로 추가"
          value={tagDraft}
          onChange={(event) => handleTagChange(event.target.value)}
          onKeyDown={handleTagKeyDown}
          onCompositionStart={() => {
            composingRef.current = true;
          }}
          onCompositionEnd={() => {
            composingRef.current = false;
          }}
          onBlur={() => {
            if (tagDraft.trim()) commitTagDraft();
          }}
        />
      </div>

      <Button type="submit" disabled={mutation.isPending}>
        저장
      </Button>

      {category === 'STOCK' && (
        <TossStockSearchSheet
          open={stockSheetOpen}
          onOpenChange={setStockSheetOpen}
          onSelect={(result) => setStock({ symbol: result.symbol, name: result.name })}
        />
      )}
    </form>
  );
};

export const KnowledgeNoteFormDialog = ({ open, onOpenChange, options }: KnowledgeNoteFormDialogProps) => {
  const isMobile = useIsMobile();
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const title = options.note ? '메모 수정' : '빠른 메모';
  const description = '출처와 함께 지식을 짧게 기록합니다.';

  // Radix 의 기본 첫 포커스는 분야 라디오에 가므로 내용 칸으로 직접 보낸다.
  const handleOpenAutoFocus = (event: Event): void => {
    event.preventDefault();
    contentRef.current?.focus({ preventScroll: true });
  };

  const handleDone = (): void => onOpenChange(false);

  const form = <KnowledgeNoteForm options={options} contentRef={contentRef} onDone={handleDone} />;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          onOpenAutoFocus={handleOpenAutoFocus}
          className="max-h-[90dvh] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription className="sr-only">{description}</SheetDescription>
          </SheetHeader>
          <div className="mt-4">{form}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={handleOpenAutoFocus} className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">{description}</DialogDescription>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  );
};
