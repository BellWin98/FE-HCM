import { describe, expect, it } from 'vitest';
import {
  formatPenaltyPerMiss,
  getEarliestPenaltyEffectiveMonday,
  validateWorkoutRoomRules,
} from './workoutRoomRules';

describe('validateWorkoutRoomRules', () => {
  it('벌금제도가 켜져 있으면 벌금액이 범위를 벗어날 때 에러를 반환한다', () => {
    const error = validateWorkoutRoomRules({
      maxMembers: 5,
      minWeeklyWorkouts: 3,
      penaltyEnabled: true,
      penaltyPerMiss: 500, // 최소 1000원 미만
    });

    expect(error).toBe('벌금은 1,000원 이상 50,000원 이하여야 합니다.');
  });

  it('벌금제도가 꺼져 있으면 벌금액이 범위를 벗어나도 통과한다', () => {
    const error = validateWorkoutRoomRules({
      maxMembers: 5,
      minWeeklyWorkouts: 3,
      penaltyEnabled: false,
      penaltyPerMiss: 0,
    });

    expect(error).toBeNull();
  });

  it('penaltyEnabled를 생략하면 기존과 동일하게 벌금액을 검증한다(하위 호환)', () => {
    const error = validateWorkoutRoomRules({
      maxMembers: 5,
      minWeeklyWorkouts: 3,
      penaltyPerMiss: 500,
    });

    expect(error).toBe('벌금은 1,000원 이상 50,000원 이하여야 합니다.');
  });
});

describe('getEarliestPenaltyEffectiveMonday', () => {
  it('오늘이 토요일이면 최소 7일 이후의 월요일(오늘로부터 9일 뒤)을 반환한다', () => {
    const saturday = new Date(2026, 6, 18); // 2026-07-18 (토)
    const result = getEarliestPenaltyEffectiveMonday(saturday);

    expect(result).toEqual(new Date(2026, 6, 27)); // 2026-07-27 (월)
  });

  it('오늘이 월요일이면 정확히 7일 뒤의 다음 월요일을 반환한다', () => {
    const monday = new Date(2026, 6, 20); // 2026-07-20 (월)
    const result = getEarliestPenaltyEffectiveMonday(monday);

    expect(result).toEqual(new Date(2026, 6, 27)); // 2026-07-27 (월)
  });

  it('반환된 날짜는 항상 월요일이다', () => {
    for (let offset = 0; offset < 7; offset += 1) {
      const today = new Date(2026, 6, 18 + offset);
      const result = getEarliestPenaltyEffectiveMonday(today);
      expect(result.getDay()).toBe(1);
    }
  });
});

describe('formatPenaltyPerMiss', () => {
  it('금액이 있으면 천 단위 콤마와 함께 표시한다', () => {
    expect(formatPenaltyPerMiss(5000)).toBe('벌금 5,000원');
  });

  it('null이면 벌금 없음으로 표시한다', () => {
    expect(formatPenaltyPerMiss(null)).toBe('벌금 없음');
  });
});
