const API_BASE_URL = 'http://localhost:8080/api';

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
    const token = localStorage.getItem('token');
    return {
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);
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

  // Dashboard API
  async getDashboard() {
    return this.request('/dashboard');
  }
}

export const api = new ApiClient();