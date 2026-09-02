import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Send, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';
import { api } from '@/lib/api';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { WorkoutComment } from '@/types';

const PAGE_SIZE = 20;
const MAX_CONTENT_LENGTH = 500;

interface WorkoutCommentDialogProps {
  recordId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 댓글 수가 바뀔 때마다 호출된다. 피드 카드의 댓글 배지를 맞추는 용도. */
  onCommentCountChange?: (count: number) => void;
}

export const WorkoutCommentDialog = ({
  recordId,
  open,
  onOpenChange,
  onCommentCountChange,
}: WorkoutCommentDialogProps) => {
  const [comments, setComments] = useState<WorkoutComment[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [pendingDeleteCommentId, setPendingDeleteCommentId] = useState<number | null>(null);

  // 콜백은 ref 로 들고 간다.
  //
  // 부모(피드)는 댓글 수를 통보받으면 목록 상태를 갈아끼우고, 그 리렌더에서 콜백이 새 함수가 된다.
  // 이걸 의존성에 넣으면 조회 → 통보 → 부모 리렌더 → 조회가 무한히 반복된다.
  const onCommentCountChangeRef = useRef(onCommentCountChange);
  useEffect(() => {
    onCommentCountChangeRef.current = onCommentCountChange;
  }, [onCommentCountChange]);

  const updateTotalCount = useCallback((next: number) => {
    const safeCount = Math.max(next, 0);
    setTotalCount(safeCount);
    onCommentCountChangeRef.current?.(safeCount);
  }, []);

  const loadPage = useCallback(
    async (targetPage: number) => {
      setIsLoading(true);
      try {
        const response = await api.getWorkoutComments(recordId, targetPage, PAGE_SIZE);
        const loaded = response?.content ?? [];
        setComments((previous) => (targetPage === 0 ? loaded : [...previous, ...loaded]));
        setPage(targetPage);
        setHasMore(!(response?.last ?? true));
        updateTotalCount(response?.totalElements ?? loaded.length);
      } catch {
        toast.error('댓글을 불러오지 못했습니다.');
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    },
    [recordId, updateTotalCount],
  );

  // 다이얼로그를 열 때마다 첫 페이지부터 다시 읽는다(다른 사람이 그 사이 남긴 댓글 반영).
  useEffect(() => {
    if (!open) {
      setPendingDeleteCommentId(null);
      return;
    }
    setComments([]);
    setContent('');
    void loadPage(0);
  }, [open, loadPage]);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.addWorkoutComment(recordId, trimmed);
      setComments((previous) => [...previous, created]);
      setContent('');
      updateTotalCount(totalCount + 1);
    } catch {
      toast.error('댓글을 남기지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestDelete = (commentId: number) => {
    setPendingDeleteCommentId(commentId);
  };

  const handleConfirmDelete = async () => {
    if (pendingDeleteCommentId === null) {
      return;
    }

    const commentId = pendingDeleteCommentId;
    setPendingDeleteCommentId(null);

    try {
      await api.deleteWorkoutComment(recordId, commentId);
      setComments((previous) => previous.filter((comment) => comment.id !== commentId));
      updateTotalCount(totalCount - 1);
    } catch {
      toast.error('댓글을 삭제하지 못했습니다.');
    }
  };

  // 모바일에서 Enter 는 줄바꿈이어야 하므로, 전송은 Ctrl/Cmd + Enter 로만 받는다.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>댓글 {totalCount}개</DialogTitle>
        </DialogHeader>

        <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
          {comments.length === 0 && !isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              첫 번째 댓글을 남겨보세요!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-2">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={comment.profileUrl} alt={comment.nickname} />
                  <AvatarFallback className="text-xs">
                    {comment.nickname.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{comment.nickname}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm">{comment.content}</p>
                </div>
                {comment.mine && (
                  <button
                    type="button"
                    aria-label="댓글 삭제"
                    onClick={() => handleRequestDelete(comment.id)}
                    className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            ))
          )}

          {hasMore && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              disabled={isLoading}
              onClick={() => void loadPage(page + 1)}
            >
              {isLoading ? '불러오는 중...' : '이전 댓글 더보기'}
            </Button>
          )}
        </div>

        <div className="flex items-end gap-2 border-t pt-3">
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={MAX_CONTENT_LENGTH}
            rows={2}
            placeholder="응원의 한마디를 남겨보세요"
            aria-label="댓글 입력"
            className="min-h-[2.5rem] resize-none"
          />
          <Button
            type="button"
            size="icon"
            aria-label="댓글 등록"
            disabled={isSubmitting || content.trim().length === 0}
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <AlertDialog
      open={pendingDeleteCommentId !== null}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setPendingDeleteCommentId(null);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>댓글을 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>삭제한 댓글은 되돌릴 수 없습니다.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => void handleConfirmDelete()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default WorkoutCommentDialog;
