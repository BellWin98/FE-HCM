export interface Member {
  id: number;
  email: string;
  nickname: string;
  profileUrl: string;
  totalWorkoutDays: number;
  totalPenalty: number;
  createdAt: string;
  role: 'USER' | 'ADMIN';
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

export const WORKOUT_TYPES = [
  '헬스(가슴)', 
  '헬스(등)', 
  '헬스(어깨)', 
  '헬스(하체)',  
  '테니스', 
  '러닝', 
  '자전거', 
  '구기종목', 
  '수영', 
  '기타'
] as const;
export type WorkoutType = typeof WORKOUT_TYPES[number];

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

export interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  type: 'TEXT' | 'IMAGE';
  imageUrl?: string;
  readBy: string[];
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  nextCursorId: number | null;
  hasNext: boolean;
}