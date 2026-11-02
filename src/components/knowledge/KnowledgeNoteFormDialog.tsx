import { useEffect, useRef, useState } from 'react';
import type { ClipboardEvent, KeyboardEvent, MutableRefObject, RefObject } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { NoteImageAttachments } from '@/components/knowledge/NoteImageAttachments';
import { addFiles, fromUrls, revokePreview } from '@/components/knowledge/noteAttachments';
import type { NoteAttachment } from '@/components/knowledge/noteAttachments';
import TossStockSearchSheet from '@/components/tossStock/TossStockSearchSheet';
import { api } from '@/lib/api';
import { compressImage } from '@/lib/compressImage';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useVisualViewportInset } from '@/hooks/useVisualViewportInset';
import { KNOWLEDGE_NOTES_QUERY_KEY } from '@/hooks/useKnowledgeAccess';
import { clearLastContext, loadLastContext, saveLastContext } from '@/lib/knowledgeNoteDraft';
import { ALLOWED_NOTE_IMAGE_TYPES, KNOWLEDGE_CATEGORIES, KNOWLEDGE_CATEGORY_LABELS } from '@/types/knowledgeNote';
import type { KnowledgeCategory, KnowledgeNoteInput } from '@/types/knowledgeNote';
import type { QuickNoteOpenOptions } from '@/contexts/QuickNoteContext';

const CONTENT_REQUIRED_MESSAGE = '내용 또는 이미지를 입력하세요';
const UNSUPPORTED_IMAGE_MESSAGE = 'JPEG·PNG·WebP·GIF 이미지만 첨부할 수 있어요';
const SAVE_FAILED_MESSAGE = '메모를 저장하지 못했습니다.';

/** 모바일 키보드의 자동완성·자동 고침 제안을 끈다. */
const NO_SUGGESTION_PROPS = { autoComplete: 'off', autoCorrect: 'off', spellCheck: false } as const;

interface SelectedStock {
  symbol: string;
  name: string;
}

interface KnowledgeNoteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: QuickNoteOpenOptions;
  /** 열 때마다 바뀌는 값. 폼의 key 로 써서 열 때마다 폼 상태를 새로 채운다. */
  formKey: number;
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

type PasteHandler = (event: ClipboardEvent<HTMLElement>) => void;

/** 붙여넣기 이벤트에 담긴 파일들(파일 목록이 비어 있으면 항목에서 꺼낸다). */
const getPastedFiles = (event: ClipboardEvent<HTMLElement>): File[] => {
  const data = event.clipboardData;
  if (!data) return [];
  const files = Array.from(data.files ?? []);
  if (files.length > 0) return files;
  return Array.from(data.items ?? [])
    .filter((item) => item.kind === 'file')
    .flatMap((item) => item.getAsFile() ?? []);
};

interface KnowledgeNoteFormProps {
  options: QuickNoteOpenOptions;
  /** 다이얼로그 내용 영역의 onPaste 가 이 폼의 붙여넣기 처리를 부를 수 있도록 폼이 채워 둔다. */
  pasteHandlerRef: MutableRefObject<PasteHandler | null>;
  contentRef: RefObject<HTMLTextAreaElement>;
  onDone: () => void;
}

const KnowledgeNoteForm = ({ options, pasteHandlerRef, contentRef, onDone }: KnowledgeNoteFormProps) => {
  const { note, prefill, prefillFiles } = options;
  const queryClient = useQueryClient();

  // 폼 상태는 마운트될 때 한 번 정해진다. 열 때마다 바뀌는 key(formKey)로 다시 마운트되므로 열 때마다 새로 채워진다.
  const [initial] = useState(() => {
    if (note) {
      return {
        category: note.category,
        content: note.content ?? '',
        attachments: fromUrls(note.images),
        dropped: 0,
        sourceUrl: note.sourceUrl ?? '',
        sourceText: note.sourceText ?? '',
        tags: note.tags,
        stock: note.stockSymbol ? { symbol: note.stockSymbol, name: note.stockName ?? note.stockSymbol } : null,
        sourceFromLast: false,
      };
    }
    const last = loadLastContext();
    const { next: attachments, dropped } = addFiles([], prefillFiles ?? []);
    // 출처는 링크·텍스트가 한 쌍이다 — prefill 이 한쪽만 줘도 마지막 출처의 나머지 한쪽을 섞지 않는다.
    const prefillHasSource = Boolean(prefill?.sourceUrl || prefill?.sourceText);
    const lastHasSource = Boolean(last?.sourceUrl || last?.sourceText);
    return {
      category: prefill?.category ?? last?.category ?? 'DEV',
      content: prefill?.content ?? '',
      attachments,
      dropped,
      sourceUrl: (prefillHasSource ? prefill?.sourceUrl : last?.sourceUrl) ?? '',
      sourceText: (prefillHasSource ? prefill?.sourceText : last?.sourceText) ?? '',
      tags: prefill?.tags ?? [],
      stock: prefill?.stockSymbol
        ? { symbol: prefill.stockSymbol, name: prefill.stockName ?? prefill.stockSymbol }
        : null,
      // 키보드에 가려 출처 칸이 안 보이는 채로 지난 출처가 붙어 저장되지 않도록 채웠다는 사실을 알린다.
      sourceFromLast: !prefillHasSource && lastHasSource,
    };
  });

  const [category, setCategory] = useState<KnowledgeCategory>(initial.category);
  const [content, setContent] = useState(initial.content);
  const [sourceUrl, setSourceUrl] = useState(initial.sourceUrl);
  const [sourceText, setSourceText] = useState(initial.sourceText);
  // 첨부 이미지 목록. 수정할 때 기존 이미지를 그대로 다시 보내야 서버에서 지워지지 않는다.
  const [attachments, setAttachments] = useState<NoteAttachment[]>(initial.attachments);
  const [droppedCount, setDroppedCount] = useState(initial.dropped);
  // 언마운트 때 미리보기 URL 을 해제하려면 최신 목록이 필요하다.
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;
  const [tags, setTags] = useState<string[]>(initial.tags);
  const [tagDraft, setTagDraft] = useState('');
  const [stock, setStock] = useState<SelectedStock | null>(initial.stock);
  const [stockNotice, setStockNotice] = useState(false);
  const [stockSheetOpen, setStockSheetOpen] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const composingRef = useRef(false);

  useEffect(
    () => () => {
      attachmentsRef.current.forEach(revokePreview);
    },
    []
  );

  // 새 첨부 업로드와 메모 저장을 한 번의 저장 흐름으로 묶는다 — 버튼은 둘 다 끝날 때까지 잠긴다.
  const mutation = useMutation({
    mutationFn: async ({ base, items }: { base: Omit<KnowledgeNoteInput, 'imageUrls'>; items: NoteAttachment[] }) => {
      const pending = items.filter((item) => !item.url && item.file);
      const uploaded = new Map<string, string>();
      if (pending.length > 0) {
        const files = await Promise.all(pending.map((item) => compressImage(item.file as File)));
        // HEIC·SVG 등은 압축 뒤에도 원본이 남는다 — 서버가 배치 전체를 400 으로 거절하기 전에 막는다.
        if (files.some((file) => !ALLOWED_NOTE_IMAGE_TYPES.includes(file.type))) {
          throw new Error(UNSUPPORTED_IMAGE_MESSAGE);
        }
        const urls = await api.uploadKnowledgeNoteImages(files);
        // 업로드 URL 은 보낸 파일과 순서대로 1:1 이다.
        if (urls.length !== pending.length) {
          throw new Error('이미지 업로드 결과가 올바르지 않아요');
        }
        pending.forEach((item, index) => uploaded.set(item.id, urls[index]));
        // 메모 요청이 실패해 다시 저장해도 같은 이미지를 또 올리지 않도록 먼저 상태에 적어 둔다.
        setAttachments((current) =>
          current.map((item) => (uploaded.has(item.id) ? { ...item, url: uploaded.get(item.id), file: undefined } : item))
        );
      }
      const imageUrls = items.map((item) => item.url ?? uploaded.get(item.id) ?? '');
      const input: KnowledgeNoteInput = { ...base, imageUrls };
      return note ? api.updateKnowledgeNote(note.id, input) : api.createKnowledgeNote(input);
    },
  });

  const handleAddFiles = (files: File[]): void => {
    if (mutation.isPending) return;
    const { next, dropped } = addFiles(attachmentsRef.current, files);
    attachmentsRef.current = next;
    setAttachments(next);
    setDroppedCount(dropped);
    setContentError(null);
  };

  const handleRemoveAttachment = (id: string): void => {
    const target = attachments.find((item) => item.id === id);
    if (target) revokePreview(target);
    setAttachments((current) => current.filter((item) => item.id !== id));
    setDroppedCount(0);
  };

  const handlePaste: PasteHandler = (event) => {
    const images = getPastedFiles(event).filter((file) => file.type.startsWith('image/'));
    if (images.length === 0) return;
    event.preventDefault();
    if (mutation.isPending) return;
    handleAddFiles(images);
  };
  useEffect(() => {
    pasteHandlerRef.current = handlePaste;
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
    // 기억해 둔 마지막 출처도 지워야 다음에 열 때 지운 출처가 다시 채워지지 않는다.
    clearLastContext();
  };

  const handleSubmit = (): void => {
    if (mutation.isPending) return;

    const url = sourceUrl.trim();
    const text = sourceText.trim();
    const body = content.trim();
    if (!body && attachments.length === 0) {
      setContentError(CONTENT_REQUIRED_MESSAGE);
      return;
    }

    const base: Omit<KnowledgeNoteInput, 'imageUrls'> = {
      category,
      ...(body ? { content: body } : {}),
      ...(url ? { sourceUrl: url } : {}),
      ...(text ? { sourceText: text } : {}),
      tags: mergeTags(tags, tagDraft.split(',')),
      ...(category === 'STOCK' && stock ? { stockSymbol: stock.symbol, stockName: stock.name } : {}),
    };

    setSaveError(null);
    mutation.mutate({ base, items: attachments }, {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: KNOWLEDGE_NOTES_QUERY_KEY });
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
        const detail = error instanceof Error && error.message ? ` ${error.message}` : '';
        setSaveError(`${SAVE_FAILED_MESSAGE}${detail}`);
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
  const showLastSourceHint = initial.sourceFromLast && hasSource;

  return (
    <form onSubmit={handleFormSubmit} onKeyDown={handleFormKeyDown} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="knowledge-note-content">내용</Label>
        <Textarea
          id="knowledge-note-content"
          ref={contentRef}
          value={content}
          rows={5}
          {...NO_SUGGESTION_PROPS}
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

      <NoteImageAttachments
        attachments={attachments}
        dropped={droppedCount}
        disabled={mutation.isPending}
        onAddFiles={handleAddFiles}
        onRemove={handleRemoveAttachment}
      />

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
        <div className="flex items-center justify-between">
          <span className="flex items-baseline gap-2">
            <span className="text-sm font-medium">출처</span>
            {showLastSourceHint && <span className="text-xs text-muted-foreground">지난 메모의 출처</span>}
          </span>
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
          {...NO_SUGGESTION_PROPS}
          value={sourceUrl}
          onChange={(event) => setSourceUrl(event.target.value)}
        />
        <Label htmlFor="knowledge-note-source-text" className="sr-only">
          출처 텍스트
        </Label>
        <Input
          id="knowledge-note-source-text"
          placeholder="책, 영상, 사람 등 링크가 없는 출처"
          {...NO_SUGGESTION_PROPS}
          value={sourceText}
          onChange={(event) => {
            setSourceText(event.target.value);
          }}
        />
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
          {...NO_SUGGESTION_PROPS}
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
      {saveError && (
        <p role="alert" className="text-sm text-destructive">
          {saveError}
        </p>
      )}

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

export const KnowledgeNoteFormDialog = ({ open, onOpenChange, options, formKey }: KnowledgeNoteFormDialogProps) => {
  const isMobile = useIsMobile();
  const keyboardInset = useVisualViewportInset(isMobile && open);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const pasteHandlerRef = useRef<PasteHandler | null>(null);
  const handlePaste: PasteHandler = (event) => pasteHandlerRef.current?.(event);
  const title = options.note ? '메모 수정' : '빠른 메모';
  const description = '출처와 함께 지식을 짧게 기록합니다.';

  // Radix 의 기본 첫 포커스는 분야 라디오에 가므로 내용 칸으로 직접 보낸다.
  const handleOpenAutoFocus = (event: Event): void => {
    event.preventDefault();
    contentRef.current?.focus({ preventScroll: true });
  };

  const handleDone = (): void => onOpenChange(false);

  const form = (
    <KnowledgeNoteForm key={formKey} options={options} pasteHandlerRef={pasteHandlerRef} contentRef={contentRef} onDone={handleDone} />
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          onOpenAutoFocus={handleOpenAutoFocus}
          onPaste={handlePaste}
          // 키보드가 올라오면 시트를 키보드 바로 위에 붙이고, 보이는 높이 안에서 스크롤되게 한다.
          style={{
            bottom: keyboardInset.bottom,
            ...(keyboardInset.height !== null ? { maxHeight: keyboardInset.height * 0.9 } : {}),
          }}
          // 열리자마자 내용 칸 포커스로 키보드가 올라오므로, 올라오는 애니메이션을 줄이고 bottom 변화는
          // 부드럽게 따라가게 해 시트가 뚝 끊겨 튀어 오르지 않게 한다.
          // 키보드가 없을 때만 홈 인디케이터만큼 아래 여백을 둔다(키보드 위에서는 필요 없다).
          className={cn(
            'max-h-[90dvh] overflow-y-auto overscroll-contain transition-[bottom] data-[state=open]:duration-300',
            keyboardInset.bottom === 0 && 'pb-safe'
          )}
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
      <DialogContent onOpenAutoFocus={handleOpenAutoFocus} onPaste={handlePaste} className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">{description}</DialogDescription>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  );
};
