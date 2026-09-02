export interface PageResponse<T> {
  content: T[];
  last: boolean;
  totalPages: number;
  totalElements?: number;
  number: number;
  size: number;
}

export interface Member {
  id: number;
  email: string;
  nickname: string;
  profileUrl: string;
  bio?: string;
  totalWorkoutDays: number;
  totalPenalty: number;
  createdAt: string;
  role: 'USER' | 'ADMIN' | 'FAMILY';
}

export interface WorkoutRoom {
  id: number;
  name: string;
  minWeeklyWorkouts: number;
  penaltyEnabled: boolean;
  penaltyPerMiss: number | null;
  pendingPenaltyEnabled?: boolean | null;
  pendingPenaltyPerMiss?: number | null;
  penaltyChangeEffectiveDate?: string | null;
  maxMembers: number;
  currentMembers: number;
  ownerNickname: string;
  isActive: boolean;
  entryCode?: string;
}

export interface SchedulePenaltyChangeRequest {
  penaltyEnabled: boolean;
  penaltyPerMiss?: number;
  effectiveDate: string;
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
  bio?: string;
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
  reactions: ReactionCount[]; // 리액션이 하나라도 달린 이모지만 (개수 내림차순)
  commentCount: number;
}

// ─── 운동 인증 리액션 / 댓글 ────────────────────────────────────────────────
// 이모지 문자가 아니라 코드로 주고받는다(백엔드 ReactionEmoji enum 과 1:1).

export type ReactionEmojiCode = 'MUSCLE' | 'FIRE' | 'CLAP' | 'THUMBS_UP' | 'PARTY';

export interface ReactionCount {
  emoji: ReactionEmojiCode;
  symbol: string; // 화면에 그릴 이모지 문자
  count: number;
  reactedByMe: boolean;
}

/** 리액션 등록/취소 후 서버가 돌려주는 갱신된 집계. */
export interface WorkoutSocialSummary {
  reactions: ReactionCount[];
  commentCount: number;
}

export interface ReactionMember {
  memberId: number;
  nickname: string;
  profileUrl?: string;
  emoji: ReactionEmojiCode;
  symbol: string;
}

export interface WorkoutComment {
  id: number;
  memberId: number;
  nickname: string;
  profileUrl?: string;
  content: string;
  createdAt: string;
  mine: boolean; // 내가 쓴 댓글인지 (삭제 버튼 노출 판단용)
}

export interface WorkoutResponse {
  workoutDate: string;
  workoutTypes: string[]; // 여러 운동 종류 (서버에서 항상 배열로 반환)
  duration: number; // minutes
  imageUrls: string[]; // 여러 이미지 URL (서버에서 항상 배열로 반환)
  memberTotalWorkoutDays: number;
}

export const WORKOUT_TYPES = [
  '헬스(가슴)', 
  '헬스(등)', 
  '헬스(어깨)', 
  '헬스(하체)',
  '크로스핏',
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

// 운동 피드 기간 타입
export type WorkoutFeedPeriod = 'ALL' | 'WEEK' | 'MONTH';

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
  socialLogin: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  checkEmailDuplicate: (email: string) => Promise<{ success: boolean }>;
  sendVerificationEmail: (email: string) => Promise<{ success: boolean }>;
  verifyEmailCode: (email: string, code: string) => Promise<{ success: boolean }>;
  updateMember: (updates: Partial<Member>) => void;
}

export type ChatMessageType = 'TEXT' | 'IMAGE' | 'READ_STATUS' | 'SYSTEM';

export const isChatContentType = (type: ChatMessageType | string): boolean => {
  return type === 'TEXT' || type === 'IMAGE';
};

export const isSystemChatType = (type: ChatMessageType | string): boolean => {
  return type === 'READ_STATUS' || type === 'SYSTEM';
};

export interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  type: ChatMessageType;
  imageUrl?: string;
  unreadCount?: number;
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
  /** 전일 종가 대비 변동률(%) - API에서 제공 시 표시 */
  dayChangeRate?: number;
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
  periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'ALL' | 'CUSTOM';
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
  createdAt: string;
  /** 대표 인증이 저장된 방 이름. 방별 내역은 rooms 를 쓴다. */
  roomName?: string;
  /**
   * 이 인증이 저장된 방 전체와 방별 리액션/댓글.
   *
   * 운동 인증 한 번은 참여 중인 방 수만큼 레코드로 저장되고 피드는 그걸 하루 한 장으로 묶어 보여준다.
   * 리액션/댓글은 방마다 따로 달리므로, 남기거나 열 때는 여기 담긴 recordId 를 써야 한다.
   */
  rooms?: WorkoutFeedRoom[];
  /** 방 전체를 합친 집계 (리액션이 하나라도 달린 이모지만, 개수 내림차순) */
  reactions: ReactionCount[];
  /** 방 전체를 합친 댓글 수 */
  commentCount: number;
}

export interface WorkoutFeedRoom {
  roomId: number;
  roomName: string;
  /** 이 방에 저장된 운동 인증 id. 리액션/댓글 API 는 이 id 로 호출한다. */
  recordId: number;
  reactions: ReactionCount[];
  commentCount: number;
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
  maxMembers: number;
  minWeeklyWorkouts: number;
  penaltyPerMiss: number;
}