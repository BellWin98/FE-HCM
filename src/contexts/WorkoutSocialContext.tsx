import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { RoomMember, WorkoutRecord, WorkoutRoomDetail, WorkoutSocialSummary } from '@/types';

/**
 * 운동 인증의 리액션/댓글 집계를 운동방 단위로 들고 있는 저장소.
 *
 * 소셜 바(`WorkoutSocialBar`)는 팝오버 안에 있어서 팝오버가 닫히면 함께 언마운트되고 자기 상태를
 * 잃는다. 또 같은 인증이 "이번주 운동 현황"과 "월별 운동 현황" 두 곳에 동시에 그려지므로, 집계를
 * 두 화면 위(운동방 단위)에서 한 벌만 들고 있어야 한 쪽에서 남긴 리액션이 다른 쪽에도 새로고침 없이
 * 그대로 보인다.
 */
interface WorkoutSocialContextValue {
  /** 서버 응답(props)보다 방금 갱신한 집계를 우선해 돌려준다. */
  summaryOf: (record: WorkoutRecord) => WorkoutSocialSummary;
  /** 리액션 등록/취소 후 서버가 돌려준 집계를 반영한다. */
  applySummary: (recordId: number, summary: WorkoutSocialSummary) => void;
  /** 댓글 수만 바뀌었을 때 반영한다(리액션 집계는 유지). */
  applyCommentCount: (recordId: number, commentCount: number) => void;
}

const WorkoutSocialContext = createContext<WorkoutSocialContextValue | null>(null);

interface WorkoutSocialProviderProps {
  workoutRoom: WorkoutRoomDetail | null;
  children: ReactNode;
}

export const WorkoutSocialProvider = ({ workoutRoom, children }: WorkoutSocialProviderProps) => {
  const [summaries, setSummaries] = useState<Record<number, WorkoutSocialSummary>>({});

  // 서버에서 방 상세를 다시 받아오면(다른 사람이 남긴 리액션 포함) 그쪽이 최신이므로 덮어쓴 값은 버린다.
  useEffect(() => {
    setSummaries({});
  }, [workoutRoom]);

  // 인증 기록을 id 로 찾기 위한 색인. 댓글 수만 바뀔 때 리액션 집계를 잃지 않으려면 필요하다.
  const recordsById = useMemo(() => {
    const map = new Map<number, WorkoutRecord>();
    workoutRoom?.workoutRoomMembers.forEach((member: RoomMember) => {
      member.workoutRecords.forEach((record: WorkoutRecord) => map.set(record.id, record));
    });
    return map;
  }, [workoutRoom]);

  const applySummary = useCallback((recordId: number, summary: WorkoutSocialSummary) => {
    setSummaries((previous) => ({ ...previous, [recordId]: summary }));
  }, []);

  const applyCommentCount = useCallback(
    (recordId: number, commentCount: number) => {
      setSummaries((previous) => ({
        ...previous,
        [recordId]: {
          reactions: previous[recordId]?.reactions ?? recordsById.get(recordId)?.reactions ?? [],
          commentCount,
        },
      }));
    },
    [recordsById],
  );

  const value = useMemo<WorkoutSocialContextValue>(
    () => ({
      summaryOf: (record: WorkoutRecord) =>
        summaries[record.id] ?? {
          reactions: record.reactions ?? [],
          commentCount: record.commentCount ?? 0,
        },
      applySummary,
      applyCommentCount,
    }),
    [summaries, applySummary, applyCommentCount],
  );

  return <WorkoutSocialContext.Provider value={value}>{children}</WorkoutSocialContext.Provider>;
};

export const useWorkoutSocial = (): WorkoutSocialContextValue => {
  const context = useContext(WorkoutSocialContext);
  if (!context) {
    throw new Error('useWorkoutSocial 은 WorkoutSocialProvider 안에서만 사용할 수 있습니다.');
  }
  return context;
};
