import { useCallback, useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { findReactionEmoji } from '@/lib/workoutReactions';
import { WorkoutCommentDialog } from '@/components/WorkoutCommentDialog';
import type { ReactionCount, ReactionEmojiCode, WorkoutFeedItem, WorkoutFeedRoom } from '@/types';

interface WorkoutFeedSocialProps {
  item: WorkoutFeedItem;
  /** 특정 방의 댓글 수가 바뀌었을 때. 부모가 피드 상태(방별 + 합계)를 맞춘다. */
  onCommentCountChange: (recordId: number, count: number) => void;
  className?: string;
}

const labelOf = (emoji: ReactionEmojiCode): string => findReactionEmoji(emoji)?.label ?? emoji;

/**
 * 마이페이지 피드의 리액션/댓글 표시.
 *
 * 운동 인증 한 번은 참여 중인 방 수만큼 레코드로 저장되므로 리액션/댓글이 방마다 나뉜다.
 * 그래서 합계는 읽기 전용으로만 보여주고(어느 방에 남길지 정할 수 없다), 실제로 열고 쓰는 것은
 * 방을 고른 뒤에만 할 수 있게 한다. 리액션은 남의 인증에 남기는 것이므로 여기서는 표시만 한다.
 */
export const WorkoutFeedSocial = ({ item, onCommentCountChange, className }: WorkoutFeedSocialProps) => {
  const [isRoomListOpen, setIsRoomListOpen] = useState(false);
  const [openCommentRecordId, setOpenCommentRecordId] = useState<number | null>(null);

  const rooms: WorkoutFeedRoom[] = item.rooms ?? [];
  const reactions = item.reactions ?? [];
  const commentCount = item.commentCount ?? 0;
  // rooms 가 없는 응답(구버전 서버)에서도 댓글은 열 수 있어야 한다.
  const singleRecordId = rooms.length === 1 ? rooms[0].recordId : rooms.length === 0 ? item.id : null;

  // 다이얼로그가 의존성으로 들고 가는 값이라 매 렌더 새 함수가 되지 않게 고정한다.
  const handleCommentCountChange = useCallback(
    (count: number) => {
      if (openCommentRecordId === null) {
        return;
      }
      onCommentCountChange(openCommentRecordId, count);
    },
    [onCommentCountChange, openCommentRecordId],
  );

  const handleCommentButton = () => {
    if (singleRecordId !== null) {
      setOpenCommentRecordId(singleRecordId);
      return;
    }
    setIsRoomListOpen((previous) => !previous);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        <ReactionChips reactions={reactions} />

        <button
          type="button"
          aria-label={`댓글 ${commentCount}개`}
          aria-expanded={singleRecordId === null ? isRoomListOpen : undefined}
          onClick={handleCommentButton}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
        >
          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{commentCount}</span>
        </button>

        {rooms.length > 1 && (
          <button
            type="button"
            aria-expanded={isRoomListOpen}
            onClick={() => setIsRoomListOpen((previous) => !previous)}
            className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
          >
            <span>{`방 ${rooms.length}개`}</span>
            <ChevronDown
              className={cn('h-3.5 w-3.5 transition-transform', isRoomListOpen && 'rotate-180')}
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      {rooms.length > 1 && isRoomListOpen && (
        <ul className="space-y-1 rounded-md border bg-muted/30 p-2">
          {rooms.map((room) => (
            <li key={room.recordId} className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium">{room.roomName}</span>
              <ReactionChips reactions={room.reactions ?? []} />
              <button
                type="button"
                aria-label={`${room.roomName} 댓글 ${room.commentCount ?? 0}개`}
                onClick={() => setOpenCommentRecordId(room.recordId)}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
              >
                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{room.commentCount ?? 0}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {openCommentRecordId !== null && (
        <WorkoutCommentDialog
          recordId={openCommentRecordId}
          open
          onOpenChange={(open) => {
            if (!open) {
              setOpenCommentRecordId(null);
            }
          }}
          onCommentCountChange={handleCommentCountChange}
        />
      )}
    </div>
  );
};

/** 표시 전용 리액션 칩. 어느 방에 남길지 정할 수 없으므로 버튼이 아니다. */
const ReactionChips = ({ reactions }: { reactions: ReactionCount[] }) => (
  <>
    {reactions.map((reaction) => (
      <span
        key={reaction.emoji}
        aria-label={`${labelOf(reaction.emoji)} 리액션 ${reaction.count}개`}
        className={cn(
          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs',
          reaction.reactedByMe
            ? 'border-primary bg-primary/10 font-semibold text-primary'
            : 'border-transparent bg-muted text-muted-foreground',
        )}
      >
        <span aria-hidden="true">{reaction.symbol}</span>
        <span>{reaction.count}</span>
      </span>
    ))}
  </>
);

export default WorkoutFeedSocial;
