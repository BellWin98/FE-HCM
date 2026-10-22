import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearWorkoutTimer,
  getMeasuredWorkout,
  readWorkoutTimer,
  writeWorkoutTimer,
} from '@/lib/workoutTimer';

const MINUTE = 60 * 1000;

describe('workoutTimer 저장소', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('저장한 측정 상태를 다시 읽어 온다', () => {
    writeWorkoutTimer({ startedAt: 1000, endedAt: null });

    expect(readWorkoutTimer()).toEqual({ startedAt: 1000, endedAt: null });
  });

  it('지우면 null 을 돌려준다', () => {
    writeWorkoutTimer({ startedAt: 1000, endedAt: 2000 });
    clearWorkoutTimer();

    expect(readWorkoutTimer()).toBeNull();
  });

  it('깨진 값이 저장돼 있으면 null 을 돌려준다', () => {
    localStorage.setItem('hcm.workoutTimer', '{not json');

    expect(readWorkoutTimer()).toBeNull();
  });
});

describe('getMeasuredWorkout', () => {
  it('경과 시간을 분 단위로 내림한다', () => {
    const startedAt = new Date(2026, 9, 22, 19, 0, 0).getTime();
    const endedAt = startedAt + 48 * MINUTE + 59 * 1000;

    expect(getMeasuredWorkout({ startedAt, endedAt }).duration).toBe(48);
  });

  it('운동 일자는 자정을 넘겨도 시작한 날이다', () => {
    const startedAt = new Date(2026, 9, 22, 23, 30, 0).getTime();
    const endedAt = startedAt + 60 * MINUTE;

    const { workoutDate } = getMeasuredWorkout({ startedAt, endedAt });

    expect(workoutDate.getDate()).toBe(22);
  });

  it('720분을 넘기면 종료를 잊은 것으로 보고 시간을 비운다', () => {
    const startedAt = new Date(2026, 9, 22, 19, 0, 0).getTime();
    const endedAt = startedAt + 721 * MINUTE;

    const measured = getMeasuredWorkout({ startedAt, endedAt });

    expect(measured.duration).toBeNull();
    expect(measured.exceededMax).toBe(true);
  });
});
