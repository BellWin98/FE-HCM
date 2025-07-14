import axios, { AxiosError, type AxiosInstance, type AxiosResponse } from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// 토큰 관리 유틸리티
const getAuthToken = (): string | null => {
    return localStorage.getItem('accessToken');
};

// API 클라이언트 인스턴스 생성
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터
apiClient.interceptors.request.use(
    (config) => {
        const token = getAuthToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    (error: AxiosError) => {
        if (error.response) {
            const status = error.response.status;
            const errorData = error.response.data as any;

            switch (status) {
                case 401:
                    toast.error('로그인이 필요합니다.');
                    localStorage.clear();
                    window.location.href = '/login';
                    break;
                case 403:
                    toast.error('접근 권한이 없습니다.');
                    break;
                case 404:
                    toast.error('요청한 리소스를 찾을 수 없습니다.');
                    break;
                case 500:
                    toast.error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
                    break;
                default:
                    toast.error(errorData?.message || '오류가 발생했습니다.');
                    break;
            }
        } else if (error.request) {
            // 요청은 보냈으나 응답을 받지 못함
            toast.error('서버와 통신할 수 없습니다. 네트워크 연결을 확인해주세요.');
        } else {
            // 요청 설정 중 에러 발생
            toast.error('요청 중 오류가 발생했습니다.');            
        }

        return Promise.reject(error);
    }
);

export default apiClient;