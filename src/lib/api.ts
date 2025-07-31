import { ChatHistoryResponse } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// API 유틸리티 함수
class ApiClient {
  private getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  private getFormDataHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      localStorage.clear();
      alert('로그인 유효시간이 만료되었습니다.');
      window.location.reload();
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    const newAccessToken = data.data?.accessToken || data.accessToken;
    
    if (newAccessToken) {
      localStorage.setItem('accessToken', newAccessToken);
      return newAccessToken;
    }
    
    throw new Error('Invalid refresh token response');
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        try {
          await this.refreshAccessToken();
          const retryConfig: RequestInit = {
            ...config,
            headers: this.getAuthHeaders(),
          };
          const retryResponse = await fetch(url, retryConfig);

          if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${retryResponse.status}`);
          }
          const retryData = await retryResponse.json();
          return retryData.data || retryData;
        } catch (refreshError) {
          throw new Error('Authentication failed. Please login again.');
        }
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error(error.message);
      throw error;
    }
  }

  async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      method: 'POST',
      headers: this.getFormDataHeaders(),
      body: formData,
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        try {
          await this.refreshAccessToken();
          const retryConfig: RequestInit = {
            ...config,
            headers: this.getFormDataHeaders(),
          };
          const retryResponse = await fetch(url, retryConfig);
          
          if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${retryResponse.status}`);
          }

          const retryData = await retryResponse.json();
          return retryData.data || retryData;
        } catch (refreshError) {
          throw new Error('Authentication failed. Please login again.');
        }
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  // Auth APIs
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, nickname: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, nickname }),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Room APIs
  async createWorkoutRoom(workoutRoomData: unknown) {
    return this.request('/workout/rooms', {
      method: 'POST',
      body: JSON.stringify(workoutRoomData),
    });
  }

  async joinWorkoutRoomByEntryCode(workoutRoomId: number, entryCode: string) {
    return this.request(`/workout/rooms/join/${workoutRoomId}?entryCode=${encodeURIComponent(entryCode)}`, {
      method: 'POST',
    });
  }

  async getCurrentWorkoutRoom() {
    return this.request('/workout/rooms/current');
  }

  async getAvailableWorkoutRooms() {
    return this.request('/workout/rooms');
  }

  async isMemberInWorkoutRoom() {
    return this.request('/workout/rooms/validate');
  }


  async searchUsers(nickname: string) {
    return this.request(`/rooms/search-users?nickname=${encodeURIComponent(nickname)}`);
  }

  async leaveRoom() {
    return this.request('/rooms/leave', {
      method: 'DELETE',
    });
  }

  // Workout APIs
  async uploadWorkout(workoutData: { workoutDate: string; workoutType: string; duration: number; }, imageFile: File) {
    const formData = new FormData();
    formData.append('workoutDate', workoutData.workoutDate);
    formData.append('workoutType', workoutData.workoutType);
    formData.append('duration', workoutData.duration.toString());
    formData.append('image', imageFile);

    return this.uploadFile('/workouts', formData);
  }

  async getMyWorkouts() {
    return this.request('/workouts/my');
  }

  async deleteWorkout(workoutId: number) {
    return this.request(`/workouts/${workoutId}`, {
      method: 'DELETE',
    });
  }

  // Rest Day APIs
  async registerRestDay(restData: { reason: string; startDate: string; endDate: string }) {
    return this.request('/rest', {
      method: 'POST',
      body: JSON.stringify(restData),
    });
  }

  async getChatHistory(roomId: number, cursorId?: number | null): Promise<ChatHistoryResponse> {
    const endpoint = cursorId
      ? `/chat/rooms/${roomId}/messages?cursorId=${cursorId}&size=20`
      : `/chat/rooms/${roomId}/messages?size=20`;
    return this.request<ChatHistoryResponse>(endpoint);
  }

  // '읽음' 상태 업데이트 API 호출 메서드 추가
  async updateLastRead(roomId: number): Promise<void> {
    return this.request(`/chat/rooms/${roomId}/read`, {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();