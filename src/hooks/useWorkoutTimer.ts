import { useCallback, useEffect, useState } from 'react';
import {
  clearWorkoutTimer,
  readWorkoutTimer,
  writeWorkoutTimer,
  type WorkoutTimerState,
} from '@/lib/workoutTimer';

interface UseWorkoutTimerResult {
  timer: WorkoutTimerState | null;
  now: number;
  start: () => void;
  finish: () => void;
  cancel: () => void;
}

/**
 * 대시보드 카드의 운동 측정 상태. 저장은 `@/lib/workoutTimer` 가 맡고, 여기서는 운동 중일 때만 1초마다
 * 화면을 다시 그린다.
 */
export const useWorkoutTimer = (): UseWorkoutTimerResult => {
  const [timer, setTimer] = useState<WorkoutTimerState | null>(() => readWorkoutTimer());
  const [now, setNow] = useState<number>(() => Date.now());
  const isRunning = timer !== null && timer.endedAt === null;

  useEffect(() => {
    if (!isRunning) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [isRunning]);

  const save = useCallback((next: WorkoutTimerState | null) => {
    if (next) {
      writeWorkoutTimer(next);
    } else {
      clearWorkoutTimer();
    }
    setTimer(next);
  }, []);

  const start = useCallback(() => save({ startedAt: Date.now(), endedAt: null }), [save]);

  const finish = useCallback(() => {
    if (!timer) return;
    save({ ...timer, endedAt: Date.now() });
  }, [save, timer]);

  const cancel = useCallback(() => save(null), [save]);

  return { timer, now, start, finish, cancel };
};
