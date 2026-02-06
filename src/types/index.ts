export interface PageResponse<T> {
  content: T[];
  last: boolean;
  totalPages: number;
  number: number;
  size: number;
}

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
  endDate: string | null;
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
  workoutTypes: string[]; // 여러 운동 종류 (서버에서 항상 배열로 반환)
  duration: number; // minutes
  imageUrls: string[]; // 여러 이미지 URL (서버에서 항상 배열로 반환)
  createdAt: string;
}

export const WORKOUT_TYPES = [
  '헬스(가슴)', 
  '헬스(등)', 
  '헬스(어깨)', 
  '헬스(하체)',
  '유산소',  
  '러닝',
  '걷기',
  '수영',
  '테니스', 
  '자전거', 
  '구기종목', 
  '기타'
] as const;
export type WorkoutType = typeof WORKOUT_TYPES[number];

export interface PenaltyRecord {
  id: number;
  workoutRoomMemberId: string;
  // roomId: string;
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
  updateMember: (updates: Partial<Member>) => void;
}

export interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  type: 'TEXT' | 'IMAGE';
  imageUrl?: string;
  // readBy: string[];
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

// 매매손익 관련 타입 정의
export interface TradingProfitLoss {
  stockCode: string;
  stockName: string;
  tradeDate: string;
  tradeType: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  amount: number;
  profitLoss: number;
  profitLossRate: number;
  fee: number;
  tax: number;
}

export interface TradingProfitLossSummary {
  period: string;
  totalBuyAmount: number;
  totalSellAmount: number;
  totalProfitLoss: number;
  totalProfitLossRate: number;
  totalFee: number;
  totalTax: number;
  tradeCount: number;
  trades: TradingProfitLoss[];
}

export interface TradingProfitLossPeriod {
  startDate: string;
  endDate: string;
  periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
}

// 벌금 계좌 관련 타입 정의
export interface PenaltyAccount {
  id: number;
  roomId: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  createdAt: string;
  updatedAt: string;
}

export interface PenaltyPayment {
  id: number;
  penaltyRecordId: number;
  amount: number;
  paymentMethod: 'BANK_TRANSFER' | 'CASH' | 'OTHER';
  paymentDate: string;
  proofImageUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface PenaltyAccountFormData {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface PenaltyPaymentFormData {
  penaltyRecordId: number;
  amount: number;
  paymentMethod: 'BANK_TRANSFER' | 'CASH' | 'OTHER';
  paymentDate: string;
  proofImage?: File;
  notes?: string;
}

// 마이페이지 관련 타입 정의
export interface UserProfile {
  id: number;
  nickname: string;
  email: string;
  profileUrl?: string;
  bio?: string;
  totalWorkoutDays: number;
  currentStreak: number;
  longestStreak: number;
  totalPenalty: number;
  joinedAt: string;
  role: 'USER' | 'ADMIN' | 'FAMILY';
}

export interface WorkoutFeedItem {
  id: number;
  workoutDate: string;
  workoutTypes: string[]; // 여러 운동 종류 (서버에서 항상 배열로 반환)
  duration: number;
  imageUrls: string[]; // 여러 이미지 URL (서버에서 항상 배열로 반환)
  description?: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: string;
  roomName?: string;
}

export interface WorkoutStats {
  totalWorkouts: number;
  currentStreak: number;
  longestStreak: number;
  weeklyGoal: number;
  weeklyProgress: number;
  monthlyWorkouts: number;
  favoriteWorkoutType: WorkoutType;
  totalDuration: number; // 총 운동 시간 (분)
}

export interface UserSettings {
  notifications: {
    workoutReminder: boolean;
    penaltyAlert: boolean;
    roomUpdates: boolean;
    weeklyReport: boolean;
  };
  privacy: {
    showProfile: boolean;
    showWorkouts: boolean;
    showStats: boolean;
  };
}

// Admin API types (contract-first; backend endpoints TBD)
export interface AdminMemberListParams {
  query?: string;
  role?: 'USER' | 'ADMIN' | 'FAMILY';
  page?: number;
  size?: number;
}

export interface AdminWorkoutRoomListParams {
  query?: string;
  active?: boolean;
  page?: number;
  size?: number;
}

export interface AdminUpdateRoomRequest {
  startDate: string;
  endDate?: string | null;
  maxMembers: number;
  minWeeklyWorkouts: number;
  penaltyPerMiss: number;
}