import { useId, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { NoteContent } from '@/components/knowledge/NoteContent';
import NoteImageStrip from '@/components/knowledge/NoteImageStrip';
import NoteImageViewer from '@/components/knowledge/NoteImageViewer';
import { noteHeadline } from '@/components/knowledge/noteHeadline';

interface KnowledgeNoteCardProps {
  note: KnowledgeNote;
  /** 로그인한 회원 id. 내가 쓴 메모에 "나" 를 표시하는 데 쓴다. */
  currentMemberId?: number;
  onEdit: (note: KnowledgeNote) => void;
  onDelete: (note: KnowledgeNote) => void;
  onTagClick: (tag: string) => void;
  onStockClick: (note: KnowledgeNote) => void;
}

const isHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value.trim());

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

export const KnowledgeNoteCard = ({
  note,
  currentMemberId,
  onEdit,
  onDelete,
  onTagClick,
  onStockClick,
}: KnowledgeNoteCardProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  // 목록에서는 한 줄만 보여 많이 훑어볼 수 있게 하고, 누르면 전체를 펼친다. 펼침 상태는 저장하지 않는다.
  const [expanded, setExpanded] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const bodyId = useId();
  const headline = noteHeadline(note);

  const handleOpenImage = (index: number): void => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{KNOWLEDGE_CATEGORY_LABELS[note.category]}</Badge>
          {note.visibility === 'PRIVATE' && <Badge variant="outline">비공개</Badge>}
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
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <Avatar className="h-5 w-5">
              {note.author.profileUrl && <AvatarImage src={note.author.profileUrl} alt={note.author.nickname} />}
              <AvatarFallback className="text-[10px]">{note.author.nickname.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{note.author.id === currentMemberId ? '나' : note.author.nickname}</span>
            <span aria-hidden="true">·</span>
            <span>{note.createdAt.slice(0, 10)}</span>
          </span>
        </div>

        {/* 태그는 이 버튼 안에서 텍스트로만 보인다 — 버튼 안에 버튼을 둘 수 없어, 태그 검색은 펼친 뒤 한다. */}
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full min-w-0 items-center gap-2 rounded-md text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {/* 이미지만 있는 메모는 문구가 모두 "이미지 메모" 라 첫 이미지를 작게 보여 구분하게 한다. */}
          {headline.kind === 'image' && note.images.length > 0 && (
            <img
              src={note.images[0]}
              alt=""
              loading="lazy"
              className="h-6 w-6 shrink-0 rounded object-cover"
            />
          )}
          <span
            className={cn(
              'min-w-0 flex-1 truncate',
              headline.kind === 'title' && 'font-semibold',
              headline.kind === 'image' && 'text-muted-foreground'
            )}
          >
            {headline.text}
          </span>
          {note.images.length > 0 && (
            <span className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground">
              <ImageIcon aria-hidden="true" className="h-3.5 w-3.5" />
              <span aria-hidden="true">{note.images.length}</span>
              <span className="sr-only">이미지 {note.images.length}장</span>
            </span>
          )}
          {!expanded && note.tags.length > 0 && (
            <span className="max-w-[40%] shrink-0 truncate text-xs text-muted-foreground">
              {note.tags.map((tag) => `#${tag}`).join(' ')}
            </span>
          )}
        </button>

        {expanded && (
          <div id={bodyId} className="space-y-3">
            {note.content && <NoteContent content={note.content} />}

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

            {note.editable && (
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => onEdit(note)}>
                  수정
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
                  삭제
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {note.images.length > 0 && (
        <NoteImageViewer
          images={note.images}
          startIndex={viewerIndex}
          open={viewerOpen}
          onOpenChange={setViewerOpen}
        />
      )}

      {note.editable && (
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
      )}
    </Card>
  );
};
