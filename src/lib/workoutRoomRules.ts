function toInt(value: string | number): number {
  if (typeof value === 'number') return value;
  return Number.parseInt(value, 10);
}

export type WorkoutRoomRulesValidationInput = {
  maxMembers: string | number;
  minWeeklyWorkouts: string | number;
  penaltyPerMiss: string | number;
};

/**
 * Validates room "rules" fields only:
 * - maxMembers
 * - minWeeklyWorkouts
 * - penaltyPerMiss
 */
export function validateWorkoutRoomRules(input: WorkoutRoomRulesValidationInput): string | null {
  const minWorkouts = toInt(input.minWeeklyWorkouts);
  if (Number.isNaN(minWorkouts) || minWorkouts < 1 || minWorkouts > 7) {
    return '주간 최소 운동 횟수는 1-7회 사이여야 합니다.';
  }

  const penalty = toInt(input.penaltyPerMiss);
  if (Number.isNaN(penalty) || penalty < 1000 || penalty > 50000) {
    return '벌금은 1,000원 이상 50,000원 이하여야 합니다.';
  }

  const maxMembersNum = toInt(input.maxMembers);
  if (Number.isNaN(maxMembersNum) || maxMembersNum < 1 || maxMembersNum > 10) {
    return '참여 인원은 1명 이상 10명 이하여야 합니다.';
  }

  return null;
}

