function toInt(value: string | number): number {
  if (typeof value === 'number') return value;
  return Number.parseInt(value, 10);
}

export type WorkoutRoomRulesValidationInput = {
  maxMembers: string | number;
  minWeeklyWorkouts: string | number;
  penaltyEnabled?: boolean;
  penaltyPerMiss: string | number;
};

/**
 * Validates room "rules" fields only:
 * - maxMembers
 * - minWeeklyWorkouts
 * - penaltyPerMiss (skipped when penaltyEnabled is explicitly false)
 */
export function validateWorkoutRoomRules(input: WorkoutRoomRulesValidationInput): string | null {
  const minWorkouts = toInt(input.minWeeklyWorkouts);
  if (Number.isNaN(minWorkouts) || minWorkouts < 1 || minWorkouts > 7) {
    return '주간 최소 운동 횟수는 1-7회 사이여야 합니다.';
  }

  if (input.penaltyEnabled !== false) {
    const penalty = toInt(input.penaltyPerMiss);
    if (Number.isNaN(penalty) || penalty < 1000 || penalty > 50000) {
      return '벌금은 1,000원 이상 50,000원 이하여야 합니다.';
    }
  }

  const maxMembersNum = toInt(input.maxMembers);
  if (Number.isNaN(maxMembersNum) || maxMembersNum < 1 || maxMembersNum > 10) {
    return '참여 인원은 1명 이상 10명 이하여야 합니다.';
  }

  return null;
}

/**
 * Formats a room's penalty amount for display, accounting for rooms that run
 * without a fine system (penaltyPerMiss is null in that case).
 */
export function formatPenaltyPerMiss(penaltyPerMiss: number | null | undefined): string {
  if (penaltyPerMiss == null) {
    return '벌금 없음';
  }
  return `벌금 ${penaltyPerMiss.toLocaleString()}원`;
}

/**
 * Earliest Monday a penalty enable/disable toggle may take effect: the first
 * Monday that is at least 7 days from `today`. Mirrors the backend rule in
 * WorkoutRoomService#validatePenaltyEffectiveDate.
 */
export function getEarliestPenaltyEffectiveMonday(today: Date): Date {
  const minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  minDate.setDate(minDate.getDate() + 7);

  const daysUntilMonday = (1 - minDate.getDay() + 7) % 7;
  minDate.setDate(minDate.getDate() + daysUntilMonday);

  return minDate;
}
