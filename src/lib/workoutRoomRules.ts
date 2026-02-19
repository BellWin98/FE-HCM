export function formatDateToYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayYmd(): string {
  return formatDateToYmd(new Date());
}

export function parseDateLikeToDate(value?: string | null): Date | undefined {
  if (!value) return undefined;

  // Prefer stable yyyy-mm-dd parsing (local time).
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (m) {
    const yyyy = Number(m[1]);
    const mm = Number(m[2]);
    const dd = Number(m[3]);
    const d = new Date(yyyy, mm - 1, dd);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }

  // Fallback: ISO-like string.
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function toInt(value: string | number): number {
  if (typeof value === 'number') return value;
  return Number.parseInt(value, 10);
}

export type WorkoutRoomRulesValidationInput = {
  startDate?: Date;
  endDate?: Date;
  enableEndDate: boolean;
  maxMembers: string | number;
  minWeeklyWorkouts: string | number;
  penaltyPerMiss: string | number;
  todayYmd?: string;
  /**
   * When true, start/end date must be today or later.
   * - CreateRoom: true (default)
   * - Admin edit: usually false (allow editing already-started rooms)
   */
  enforceNotPast?: boolean;
};

/**
 * Validates room "rules" fields only:
 * - startDate, endDate(optional)
 * - maxMembers
 * - minWeeklyWorkouts
 * - penaltyPerMiss
 *
 * Returns error message (Korean) or null when valid.
 */
export function validateWorkoutRoomRules(input: WorkoutRoomRulesValidationInput): string | null {
  // const todayYmd = input.todayYmd ?? getTodayYmd();
  // const enforceNotPast = input.enforceNotPast ?? true;

  // if (!input.startDate) {
  //   return '운동 인증 시작일을 설정해주세요.';
  // }

  // if (enforceNotPast && formatDateToYmd(input.startDate) < todayYmd) {
  //   return '시작일은 오늘 이후여야 합니다.';
  // }

  // // Start date: Monday only (CreateRoom UX rule)
  // if (input.startDate.getDay() !== 1) {
  //   return '시작일은 월요일만 선택 가능합니다.';
  // }

  // if (input.enableEndDate && input.endDate) {
  //   if (input.startDate >= input.endDate) {
  //     return '종료일은 시작일보다 늦어야 합니다.';
  //   }
  //   if (enforceNotPast && formatDateToYmd(input.endDate) < todayYmd) {
  //     return '종료일은 오늘 이후여야 합니다.';
  //   }
  //   // End date: Sunday only (CreateRoom UX rule)
  //   if (input.endDate.getDay() !== 0) {
  //     return '종료일은 일요일만 선택 가능합니다.';
  //   }
  // }

  const minWorkouts = toInt(input.minWeeklyWorkouts);
  if (Number.isNaN(minWorkouts) || minWorkouts < 1 || minWorkouts > 7) {
    return '주간 최소 운동 횟수는 1-7회 사이여야 합니다.';
  }

  const penalty = toInt(input.penaltyPerMiss);
  if (Number.isNaN(penalty) || penalty < 1000 || penalty > 50000) {
    return '벌금은 1,000원 이상 50,000원 이하여야 합니다.';
  }

  const maxMembersNum = toInt(input.maxMembers);
  if (Number.isNaN(maxMembersNum) || maxMembersNum < 2 || maxMembersNum > 10) {
    return '참여 인원은 2명 이상 10명 이하여야 합니다.';
  }

  return null;
}

