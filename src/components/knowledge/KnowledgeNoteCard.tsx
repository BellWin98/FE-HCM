import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { KNOWLEDGE_CATEGORY_LABELS, type KnowledgeNote } from '@/types/knowledgeNote';
import { cn } from '@/lib/utils';
import NoteImageStrip from '@/components/knowledge/NoteImageStrip';
import NoteImageViewer from '@/components/knowledge/NoteImageViewer';

interface KnowledgeNoteCardProps {
  note: KnowledgeNote;
  onEdit: (note: KnowledgeNote) => void;
  onDelete: (note: KnowledgeNote) => void;
  onTagClick: (tag: string) => void;
  onStockClick: (note: KnowledgeNote) => void;
}

const isHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value.trim());

/** 이보다 길면(줄 수 또는 글자 수) 4줄로 줄여 보이고 펼치기 버튼을 단다. */
const COLLAPSE_MAX_LINES = 4;
const COLLAPSE_MAX_CHARS = 140;

const isLongContent = (content: string | null): boolean =>
  content !== null &&
  (content.split('\n').length > COLLAPSE_MAX_LINES || content.length > COLLAPSE_MAX_CHARS);

interface NoteSourceProps {
  sourceUrl: string | null;
  sourceText: string | null;
}

/**
 * 출처 표시. 사용자가 입력한 값이므로 http(s) 만 링크로 만든다(javascript: 등 차단).
 * 링크와 텍스트가 둘 다 있으면(공유하기로 쓴 메모) 텍스트를 링크 이름으로 쓴다.
 */
const NoteSource = ({ sourceUrl, sourceText }: NoteSourceProps) => {
  const href = sourceUrl ?? sourceText;
  if (!href) return null;

  if (isHttpUrl(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block break-all text-xs text-blue-600 underline"
      >
        {sourceUrl && sourceText ? sourceText : href}
      </a>
    );
  }

  return (
    <div className="space-y-0.5 text-xs text-muted-foreground">
      {sourceText && <p className="break-all">{sourceText}</p>}
      {sourceUrl && <p className="break-all">{sourceUrl}</p>}
    </div>
  );
};

export const KnowledgeNoteCard = ({ note, onEdit, onDelete, onTagClick, onStockClick }: KnowledgeNoteCardProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [contentExpanded, setContentExpanded] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const collapsible = isLongContent(note.content);

  const handleOpenImage = (index: number): void => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{KNOWLEDGE_CATEGORY_LABELS[note.category]}</Badge>
          {note.stockSymbol && note.stockName && (
            <button
              type="button"
              aria-label={`${note.stockName} 메모만 보기`}
              onClick={() => onStockClick(note)}
              className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Badge variant="outline" className="hover:bg-muted">
                {note.stockName}
              </Badge>
            </button>
          )}
          <span className="ml-auto text-xs text-muted-foreground">{note.createdAt.slice(0, 10)}</span>
        </div>

        {note.content && (
          <div className="space-y-1">
            <p
              className={cn(
                'whitespace-pre-wrap break-words text-sm',
                collapsible && !contentExpanded && 'line-clamp-4'
              )}
            >
              {note.content}
            </p>
            {collapsible && (
              <button
                type="button"
                aria-expanded={contentExpanded}
                onClick={() => setContentExpanded((v) => !v)}
                className="text-xs text-muted-foreground hover:underline"
              >
                {contentExpanded ? '내용 접기' : '내용 더보기'}
              </button>
            )}
          </div>
        )}

        <NoteImageStrip images={note.images} size="md" onOpen={handleOpenImage} />

        <NoteSource sourceUrl={note.sourceUrl} sourceText={note.sourceText} />

        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {note.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onTagClick(tag)}
                className="rounded-full bg-muted px-2 py-0.5 text-xs hover:bg-muted/70"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onEdit(note)}>
            수정
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
            삭제
          </Button>
        </div>
      </CardContent>

      {note.images.length > 0 && (
        <NoteImageViewer
          images={note.images}
          startIndex={viewerIndex}
          open={viewerOpen}
          onOpenChange={setViewerOpen}
        />
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>메모를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>삭제한 메모는 되돌릴 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(note)}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
