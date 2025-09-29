import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";
import { ChatHistoryResponse, PenaltyPayment, PenaltyRecord } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: { "Content-Type": "application/json" },
    });

    // 요청 인터셉터 → 토큰 자동 주입
    this.axiosInstance.interceptors.request.use((config) => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        if (config.headers && (config.headers as any).set) {
          (config.headers as any).set("Authorization", `Bearer ${token}`);
        } else {
          config.headers = {
            ...(config.headers as any),
            Authorization: `Bearer ${token}`,
          } as any;
        }
      }
      return config;
    });

    // 응답 인터셉터 → 401 발생 시 토큰 재발급 후 재시도
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          try {
            await this.refreshAccessToken();
            // 새 토큰으로 헤더 갱신 후 요청 재시도
            const config = error.config as AxiosRequestConfig;
            const newToken = localStorage.getItem("accessToken");
            if (newToken) {
              if (config.headers && (config.headers as any).set) {
                (config.headers as any).set("Authorization", `Bearer ${newToken}`);
              } else {
                config.headers = {
                  ...(config.headers as any),
                  Authorization: `Bearer ${newToken}`,
                } as any;
              }
            }
            return this.axiosInstance(config);
          } catch (refreshError) {
            localStorage.clear();
            alert("로그인 유효시간이 만료되었습니다.");
            window.location.reload();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) throw new Error("No refresh token available");

    const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
    const newAccessToken = res.data?.data?.accessToken || res.data?.accessToken;

    if (newAccessToken) {
      localStorage.setItem("accessToken", newAccessToken);
      return newAccessToken;
    }
    throw new Error("Invalid refresh token response");
  }

  // request wrapper (fetch 버전의 request와 동일한 역할)
  async request<T>(endpoint: string, options: AxiosRequestConfig = {}): Promise<T> {
    try {
      const response = await this.axiosInstance.request({
        url: endpoint,
        ...options,
      });
      return response.data.data || response.data;
    } catch (error) {
      // const message =
      //   error.response?.data?.message || `HTTP error! status: ${error.response?.status}`;
      // console.error(message);
      throw new Error(error);
    }
  }

  async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    try {
      const response = await this.axiosInstance.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.data || response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || `HTTP error! status: ${error.response?.status}`;
      console.error("File upload failed:", message);
      throw new Error(message);
    }
  }

  // Auth APIs
  async login(email: string, password: string) {
    return this.request("/auth/login", {
      method: "POST",
      data: { email, password },
    });
  }

  async register(email: string, password: string, nickname: string) {
    return this.request("/auth/register", {
      method: "POST",
      data: { email, password, nickname },
    });
  }

  async checkEmailDuplicate(email: string) {
    return this.request("/auth/check-email", {
      method: "POST",
      data: { email },
    });
  }

  async sendVerificationEmail(email: string) {
    return this.request("/auth/send-verification", {
      method: "POST",
      data: { email },
    });
  }

  async verifyEmailCode(email: string, code: string) {
    return this.request("/auth/verify-email", {
      method: "POST",
      data: { email, code },
    });
  }

  async getCurrentUser() {
    return this.request("/auth/me");
  }

  // Room APIs (예시)
  async createWorkoutRoom(workoutRoomData: unknown) {
    return this.request("/workout/rooms", {
      method: "POST",
      data: workoutRoomData,
    });
  }

  async joinWorkoutRoomByEntryCode(workoutRoomId: number, entryCode: string) {
    return this.request(`/workout/rooms/join/${workoutRoomId}`, {
      method: "POST",
      params: { entryCode },
    });
  }

  async getCurrentWorkoutRoom() {
    return this.request("/workout/rooms/current");
  }

  async getAvailableWorkoutRooms() {
    return this.request("/workout/rooms");
  }

  async isMemberInWorkoutRoom() {
    return this.request("/workout/rooms/validate");
  }

  async getMyJoinedWorkoutRooms() {
    return this.request("/workout/rooms/joined");
  }

  async getWorkoutRoomDetail(roomId: number) {
    return this.request(`/workout/rooms/joined/${roomId}`);
  }

  async searchUsers(nickname: string) {
    return this.request(`/rooms/search-users`, { params: { nickname } });
  }

  async leaveRoom() {
    return this.request("/rooms/leave", { method: "DELETE" });
  }

  // Workout APIs
  async uploadWorkout(
    workoutData: { workoutDate: string; workoutType: string; duration: number },
    imageFile: File
  ) {
    const formData = new FormData();
    formData.append("workoutDate", workoutData.workoutDate);
    formData.append("workoutType", workoutData.workoutType);
    formData.append("duration", workoutData.duration.toString());
    formData.append("image", imageFile);

    return this.uploadFile("/workouts", formData);
  }

  async getMyWorkouts() {
    return this.request("/workouts/my");
  }

  async deleteWorkout(workoutId: number) {
    return this.request(`/workouts/${workoutId}`, { method: "DELETE" });
  }

  // Rest APIs
  async registerRestDay(restData: { reason: string; startDate: string; endDate: string }) {
    return this.request("/rest", { method: "POST", data: restData });
  }

  async getChatHistory(roomId: number, cursorId?: number | null): Promise<ChatHistoryResponse> {
    const endpoint = cursorId
      ? `/chat/rooms/${roomId}/messages?cursorId=${cursorId}&size=20`
      : `/chat/rooms/${roomId}/messages?size=20`;
    return this.request<ChatHistoryResponse>(endpoint);
  }

  async updateLastRead(roomId: number): Promise<void> {
    return this.request(`/chat/rooms/${roomId}/read`, { method: "POST" });
  }

  // Stock APIs
  async getStockPortfolio() {
    return this.request("/stock/portfolio");
  }

  async getStockPrice(stockCode: string) {
    return this.request(`/stock/price/${stockCode}`);
  }

  async getStockInfo(stockCode: string) {
    return this.request(`/stock/info/${stockCode}`);
  }

  async refreshStockData() {
    return this.request("/stock/refresh", { method: "POST" });
  }

  async getTradingProfitLoss(period: { startDate: string; endDate: string; periodType: string }) {
    return this.request("/stock/trading-profit-loss", {
      method: "POST",
      data: period,
    });
  }

  // Penalty APIs
  async getPenaltyAccount(roomId: number) {
    return this.request(`/penalty/rooms/${roomId}/account`);
  }

  async upsertPenaltyAccount(roomId: number, accountData: { bankName: string; accountNumber: string; accountHolder: string }) {
    return this.request(`/penalty/rooms/${roomId}/account`, {
      method: "POST",
      data: accountData,
    });
  }

  async deletePenaltyAccount(roomId: number) {
    return this.request(`/penalty/rooms/${roomId}/account`, { method: "DELETE" });
  }

  async getPenaltyRecords(roomId: number) {
    // TEMP: Mock data until backend implementation is ready
    // const today = new Date();
    // const startOfWeek = new Date(today);
    // startOfWeek.setDate(today.getDate() - 7);
    // const twoWeeksAgoStart = new Date(today);
    // twoWeeksAgoStart.setDate(today.getDate() - 14);
    // const twoWeeksAgoEnd = new Date(today);
    // twoWeeksAgoEnd.setDate(today.getDate() - 8);

    // const mockRecords: PenaltyRecord[] = [
    //   // User 101 (나)
    //   {
    //     id: 1,
    //     workoutRoomMemberId: "101",
    //     roomId: String(roomId),
    //     weekStartDate: twoWeeksAgoStart.toISOString(),
    //     weekEndDate: twoWeeksAgoEnd.toISOString(),
    //     requiredWorkouts: 4,
    //     actualWorkouts: 4,
    //     penaltyAmount: 0,
    //     isPaid: true,
    //     paidAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    //   },
    //   {
    //     id: 2,
    //     workoutRoomMemberId: "101",
    //     roomId: String(roomId),
    //     weekStartDate: startOfWeek.toISOString(),
    //     weekEndDate: today.toISOString(),
    //     requiredWorkouts: 5,
    //     actualWorkouts: 3,
    //     penaltyAmount: 20000,
    //     isPaid: false,
    //   },
    //   {
    //     id: 3,
    //     workoutRoomMemberId: "101",
    //     roomId: String(roomId),
    //     weekStartDate: new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    //     weekEndDate: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    //     requiredWorkouts: 4,
    //     actualWorkouts: 2,
    //     penaltyAmount: 30000,
    //     isPaid: false,
    //   },
    //   // User 102 (다른 멤버 A)
    //   {
    //     id: 4,
    //     workoutRoomMemberId: "102",
    //     roomId: String(roomId),
    //     weekStartDate: twoWeeksAgoStart.toISOString(),
    //     weekEndDate: twoWeeksAgoEnd.toISOString(),
    //     requiredWorkouts: 4,
    //     actualWorkouts: 3,
    //     penaltyAmount: 10000,
    //     isPaid: true,
    //     paidAt: new Date(today.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    //   },
    //   {
    //     id: 5,
    //     workoutRoomMemberId: "102",
    //     roomId: String(roomId),
    //     weekStartDate: startOfWeek.toISOString(),
    //     weekEndDate: today.toISOString(),
    //     requiredWorkouts: 5,
    //     actualWorkouts: 5,
    //     penaltyAmount: 0,
    //     isPaid: true,
    //   },
    //   // User 103 (다른 멤버 B)
    //   {
    //     id: 6,
    //     workoutRoomMemberId: "103",
    //     roomId: String(roomId),
    //     weekStartDate: startOfWeek.toISOString(),
    //     weekEndDate: today.toISOString(),
    //     requiredWorkouts: 5,
    //     actualWorkouts: 2,
    //     penaltyAmount: 30000,
    //     isPaid: false,
    //   },
    // ];

    // return new Promise<PenaltyRecord[]>((resolve) => {
    //   setTimeout(() => resolve(mockRecords), 200);
    // });
    return this.request(`/penalty/rooms/${roomId}/records`);
  }

  async payPenalty(
    penaltyRecordId: number,
    paymentData: { amount: number; paymentMethod: string; paymentDate: string; notes?: string },
    proofImage?: File
  ) {
    if (proofImage) {
      const formData = new FormData();
      formData.append("amount", paymentData.amount.toString());
      formData.append("paymentMethod", paymentData.paymentMethod);
      formData.append("paymentDate", paymentData.paymentDate);
      if (paymentData.notes) {
        formData.append("notes", paymentData.notes);
      }
      formData.append("proofImage", proofImage);

      return this.uploadFile(`/penalty/records/${penaltyRecordId}/payment`, formData);
    } else {
      return this.request(`/penalty/records/${penaltyRecordId}/payment`, {
        method: "POST",
        data: paymentData,
      });
    }
  }

  async getPenaltyPayments(penaltyRecordId: number) {
    // TEMP: Mock data per record id
    const mockPaymentsMap: Record<number, PenaltyPayment[]> = {
      1: [
        {
          id: 1001,
          penaltyRecordId: 1,
          amount: 0,
          paymentMethod: "BANK_TRANSFER",
          paymentDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
          notes: "주차 내 목표 달성으로 벌금 없음",
        },
      ],
      2: [
        {
          id: 2001,
          penaltyRecordId: 2,
          amount: 10000,
          paymentMethod: "BANK_TRANSFER",
          paymentDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          notes: "1차 부분 납부",
        },
      ],
      3: [],
    };

    const result = mockPaymentsMap[penaltyRecordId] ?? [];
    return new Promise<PenaltyPayment[]>((resolve) => {
      setTimeout(() => resolve(result), 150);
    });

    // return this.request(`/penalty/records/${penaltyRecordId}/payments`);
  }

  // Payment APIs
  async createPaymentOrder(penaltyRecordId: number, amount: number, orderId: string) {
    return this.request("/payment/orders", {
      method: "POST",
      data: {
        penaltyRecordId,
        amount,
        orderId,
      },
    });
  }

  async confirmPayment(paymentKey: string, orderId: string, amount: number) {
    return this.request("/payment/confirm", {
      method: "POST",
      data: {
        paymentKey,
        orderId,
        amount,
      },
    });
  }

  async cancelPayment(paymentKey: string, cancelReason: string) {
    return this.request("/payment/cancel", {
      method: "POST",
      data: {
        paymentKey,
        cancelReason,
      },
    });
  }
}

export const api = new ApiClient();
