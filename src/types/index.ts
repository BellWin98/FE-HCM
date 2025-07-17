export interface Member {
  id: number;
  email: string;
  nickname: string;
  profileUrl: string;
  totalWorkoutDays: number;
  totalPenalty: number;
  createdAt: string;
}

export interface WorkoutRoom {
  id: number;
  name: string;
  minWeeklyWorkouts: number;
  penaltyPerMiss: number;
  startDate: string;
  endDate: string;
  maxMembers: number;
  currentMembers: number;
  ownerNickname: string;
  isActive: boolean;
}

export interface WorkoutRoomDetail {
  workoutRoomInfo: WorkoutRoom | null;
  workoutRoomMembers: RoomMember[];
  currentMemberTodayWorkoutRecord: WorkoutRecord | null;
}

export interface RoomMember {
  id: number;
  nickname: string;
  profileUrl: string;
  totalWorkouts: number;
  weeklyWorkouts: number;
  totalPenalty: number;
  isOnBreak: boolean;
  joinedAt: string;
  workoutRecords: WorkoutRecord[];
  restInfoList: RestInfo[];
}

export interface WorkoutRecord {
  id: number;
  workoutDate: string;
  workoutType: WorkoutType;
  duration: number; // minutes
  imageUrl: string;
  createdAt: string;
}

export type WorkoutType = 
  | '헬스' 
  | '러닝' 
  | '수영' 
  | '사이클링' 
  | '요가' 
  | '필라테스' 
  | '기타';

export interface PenaltyRecord {
  id: number;
  userId: string;
  roomId: string;
  weekStartDate: string;
  weekEndDate: string;
  requiredWorkouts: number;
  actualWorkouts: number;
  penaltyAmount: number;
  isPaid: boolean;
  paidAt?: string;
}

export interface RestInfo {
  id: number;
  reason: string;
  startDate: string;
  endDate: string;
}

export interface AuthContextType {
  member: Member | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}