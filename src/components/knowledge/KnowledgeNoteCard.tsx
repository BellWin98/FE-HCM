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

interface KnowledgeNoteCardProps {
  note: KnowledgeNote;
  onEdit: (note: KnowledgeNote) => void;
  onDelete: (note: KnowledgeNote) => void;
  onTagClick: (tag: string) => void;
}

const isHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value.trim());

export const KnowledgeNoteCard = ({ note, onEdit, onDelete, onTagClick }: KnowledgeNoteCardProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  // 사용자가 입력한 값이므로 http(s) 만 링크로 만든다 (javascript: 등 차단).
  const source = note.sourceUrl ?? note.sourceText;

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{KNOWLEDGE_CATEGORY_LABELS[note.category]}</Badge>
          {note.stockName && <Badge variant="outline">{note.stockName}</Badge>}
          <span className="ml-auto text-xs text-muted-foreground">{note.createdAt.slice(0, 10)}</span>
        </div>

        <p className="whitespace-pre-wrap break-words text-sm">{note.content}</p>

        {source &&
          (isHttpUrl(source) ? (
            <a
              href={source}
              target="_blank"
              rel="noopener noreferrer"
              className="block break-all text-xs text-blue-600 underline"
            >
              {source}
            </a>
          ) : (
            <p className="break-all text-xs text-muted-foreground">{source}</p>
          ))}

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
