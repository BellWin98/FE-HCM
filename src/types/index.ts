export interface Member {
  id: string;
  email: string;
  nickname: string;
  createdAt: string;
  totalWorkoutDays: number;
  achievementRate: number;
  totalPenalty: number;
}

export interface WorkoutRoom {
  id: string;
  name: string;
  minWeeklyWorkouts: number;
  penaltyPerMiss: number;
  startDate: string;
  endDate: string;
  maxMembers: number;
  currentMembers: number;
  ownerId: string;
  ownerNickname: string;
  inviteCode: string;
  members: RoomMember[];
  isActive: boolean;
}

export interface RoomMember {
  id: string;
  userId: string;
  nickname: string;
  joinedAt: string;
  weeklyWorkouts: number;
  weeklyGoal: number;
  totalPenalty: number;
  isOnBreak: boolean;
}

export interface WorkoutRecord {
  id: string;
  userId: string;
  roomId: string;
  date: string;
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
  id: string;
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

export interface RestPeriod {
  id: string;
  userId: string;
  roomId: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  reviewedAt?: string;
}

export interface AuthContextType {
  user: Member | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface DashboardStats {
  todayWorkout: WorkoutRecord | null;
  weeklyProgress: {
    current: number;
    goal: number;
    percentage: number;
  };
  currentRoom: WorkoutRoom | null;
  pendingPenalties: number;
}