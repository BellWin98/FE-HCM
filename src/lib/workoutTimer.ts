/**
 * 운동 측정(시작 → 종료) 상태.
 *
 * 1초마다 숫자를 세지 않고 시작 시각만 폰(localStorage)에 남긴다. 앱을 닫거나 화면이 꺼져도 다시 열면
 * 현재 시각 - 시작 시각으로 경과 시간을 다시 계산한다. 시작과 종료는 같은 폰에서 하므로 서버에는 저장하지 않는다.
 */

const STORAGE_KEY = 'hcm.workoutTimer';
const MINUTE_MS = 60 * 1000;

// 인증 화면의 운동 시간 최대치. 이보다 길면 종료 버튼을 잊은 것으로 본다.
export const MAX_WORKOUT_MINUTES = 720;

export interface WorkoutTimerState {
  startedAt: number;
  // 운동 종료를 누른 시각. 아직 운동 중이면 null.
  endedAt: number | null;
}

export interface MeasuredWorkout {
  // 자정을 넘겨도 운동을 시작한 날로 인증한다.
  workoutDate: Date;
  duration: number | null;
  exceededMax: boolean;
}

const isTimerState = (value: unknown): value is WorkoutTimerState => {
  if (typeof value !== 'object' || value === null) return false;
  const { startedAt, endedAt } = value as Record<string, unknown>;
  return typeof startedAt === 'number' && (endedAt === null || typeof endedAt === 'number');
};

export const readWorkoutTimer = (): WorkoutTimerState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isTimerState(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const writeWorkoutTimer = (state: WorkoutTimerState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 저장소를 못 쓰는 환경(사생활 보호 모드 등)에서는 화면 상태만으로 측정한다.
  }
};

export const clearWorkoutTimer = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 위와 같은 이유로 무시한다.
  }
};

export const getElapsedMs = (state: WorkoutTimerState, now: number): number =>
  Math.max((state.endedAt ?? now) - state.startedAt, 0);

export const getMeasuredWorkout = (state: WorkoutTimerState, now: number = Date.now()): MeasuredWorkout => {
  const minutes = Math.floor(getElapsedMs(state, now) / MINUTE_MS);
  const exceededMax = minutes > MAX_WORKOUT_MINUTES;
  const startedAt = new Date(state.startedAt);

  return {
    workoutDate: new Date(startedAt.getFullYear(), startedAt.getMonth(), startedAt.getDate()),
    duration: exceededMax ? null : minutes,
    exceededMax,
  };
};

export const formatElapsed = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':');
};
