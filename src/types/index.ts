export interface Member {
  id: number;
  email: string;
  nickname: string;
  profileUrl: string;
  totalWorkoutDays: number;
  totalPenalty: number;
  createdAt: string;
  role: 'USER' | 'ADMIN' | 'FAMILY';
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
  checkEmailDuplicate: (email: string) => Promise<{ success: boolean }>;
  sendVerificationEmail: (email: string) => Promise<{ success: boolean }>;
  verifyEmailCode: (email: string, code: string) => Promise<{ success: boolean }>;
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

// 주식 관련 타입 정의
export interface StockHolding {
  stockCode: string;
  stockName: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  purchasePrice: number;
  marketValue: number;
  profitLoss: number;
  profitLossRate: number;
  sector: string;
}

export interface StockPortfolio {
  totalMarketValue: number;
  totalBuyValue: number;
  totalProfitLoss: number;
  totalProfitLossRate: number;
  depositToday: number;
  depositD2: number;
  holdings: StockHolding[];
  lastUpdated: string;
}

export interface KoreanInvestmentApiConfig {
  appKey: string;
  appSecret: string;
  baseUrl: string;
}