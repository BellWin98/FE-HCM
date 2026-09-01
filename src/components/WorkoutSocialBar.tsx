import { useEffect, useState } from 'react';
import { MessageCircle, SmilePlus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { REACTION_EMOJIS, findReactionEmoji } from '@/lib/workoutReactions';
import { WorkoutCommentDialog } from '@/components/WorkoutCommentDialog';
import type { ReactionCount, ReactionEmojiCode, WorkoutSocialSummary } from '@/types';

interface WorkoutSocialBarProps {
  recordId: number;
  reactions: ReactionCount[];
  commentCount: number;
  /** 갱신된 집계. 부모가 피드/운동방 상태를 함께 맞출 때 사용한다. */
  onChange?: (summary: WorkoutSocialSummary) => void;
  /**
   * 주어지면 내부 댓글 다이얼로그를 열지 않고 이 콜백만 호출한다.
   *
   * 팝오버 안에서 이 바를 쓸 때 필요하다. 다이얼로그를 팝오버 안에서 렌더하면
   * 팝오버가 닫히는 순간 다이얼로그까지 함께 언마운트된다. 부모가 팝오버 바깥에서
   * 다이얼로그를 열도록 위임한다.
   */
  onOpenComments?: (recordId: number) => void;
  className?: string;
}

const labelOf = (emoji: ReactionEmojiCode): string => findReactionEmoji(emoji)?.label ?? emoji;

export const WorkoutSocialBar = ({
  recordId,
  reactions,
  commentCount,
  onChange,
  onOpenComments,
  className,
}: WorkoutSocialBarProps) => {
  const [summary, setSummary] = useState<WorkoutSocialSummary>({
    reactions: reactions ?? [],
    commentCount: commentCount ?? 0,
  });
  const [isPending, setIsPending] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isCommentOpen, setIsCommentOpen] = useState(false);

  // 부모가 피드를 다시 불러오면(기간 전환, 더보기 등) 그 집계를 따라간다.
  //
  // 참조가 아니라 내용으로 비교한다. 부모가 집계를 상태로 들고 있지 않은 화면(운동방 상세)에서는
  // 리렌더마다 같은 내용의 새 배열이 내려오는데, 참조로 비교하면 방금 누른 리액션이 옛 값으로
  // 되돌아간다.
  const propsSignature = JSON.stringify({ reactions: reactions ?? [], commentCount: commentCount ?? 0 });
  useEffect(() => {
    setSummary(JSON.parse(propsSignature) as WorkoutSocialSummary);
  }, [propsSignature]);

  const applySummary = (updated: WorkoutSocialSummary) => {
    setSummary(updated);
    onChange?.(updated);
  };

  const myReaction = summary.reactions.find((reaction) => reaction.reactedByMe)?.emoji;

  const handleToggleReaction = async (emoji: ReactionEmojiCode) => {
    if (isPending) {
      return;
    }

    setIsPending(true);
    try {
      // 같은 이모지를 다시 누르면 취소, 다른 이모지를 누르면 교체된다.
      const updated =
        myReaction === emoji
          ? await api.cancelWorkoutReaction(recordId)
          : await api.reactToWorkout(recordId, emoji);
      applySummary(updated);
    } catch {
      toast.error('리액션을 남기지 못했습니다.');
    } finally {
      setIsPending(false);
      setIsPickerOpen(false);
    }
  };

  const handleCommentCountChange = (nextCount: number) => {
    applySummary({ ...summary, commentCount: nextCount });
  };

  return (
    <>
      <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
        {summary.reactions.map((reaction) => (
          <button
            key={reaction.emoji}
            type="button"
            disabled={isPending}
            aria-pressed={reaction.reactedByMe}
            aria-label={`${labelOf(reaction.emoji)} 리액션 ${reaction.count}개${
              reaction.reactedByMe ? ', 누름' : ''
            }`}
            onClick={() => handleToggleReaction(reaction.emoji)}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors disabled:opacity-60',
              reaction.reactedByMe
                ? 'border-primary bg-primary/10 font-semibold text-primary'
                : 'border-transparent bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            <span aria-hidden="true">{reaction.symbol}</span>
            <span>{reaction.count}</span>
          </button>
        ))}

        {/*
          피커는 포털(Popover) 대신 인라인으로 편다.
          이 바는 운동방 화면에서 팝오버 안에 들어가는데, 포털을 쓰면 팝오버가 중첩되어
          피커를 여는 순간 바깥 팝오버가 바깥 클릭으로 인식해 닫혀 버린다.
        */}
        <button
          type="button"
          disabled={isPending}
          aria-label="리액션 남기기"
          aria-expanded={isPickerOpen}
          onClick={() => setIsPickerOpen((previous) => !previous)}
          className="inline-flex items-center rounded-full border border-dashed border-muted-foreground/40 p-1 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          <SmilePlus className="h-4 w-4" aria-hidden="true" />
        </button>

        {isPickerOpen && (
          <div className="flex items-center gap-0.5 rounded-full border bg-popover px-1 py-0.5 shadow-sm">
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji.code}
                type="button"
                disabled={isPending}
                aria-label={emoji.label}
                aria-pressed={myReaction === emoji.code}
                onClick={() => handleToggleReaction(emoji.code)}
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-base transition-colors hover:bg-muted disabled:opacity-60',
                  myReaction === emoji.code && 'bg-primary/10',
                )}
              >
                <span aria-hidden="true">{emoji.symbol}</span>
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          aria-label={`댓글 ${summary.commentCount}개`}
          onClick={() => (onOpenComments ? onOpenComments(recordId) : setIsCommentOpen(true))}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
        >
          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{summary.commentCount}</span>
        </button>
      </div>

      {!onOpenComments && (
        <WorkoutCommentDialog
          recordId={recordId}
          open={isCommentOpen}
          onOpenChange={setIsCommentOpen}
          onCommentCountChange={handleCommentCountChange}
        />
      )}
    </>
  );
};

export default WorkoutSocialBar;
