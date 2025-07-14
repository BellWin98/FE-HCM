import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Member, AuthContextType } from '@/types';
import { api } from '@/lib/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 로컬 스토리지에서 사용자 정보 확인
    const storedMember = localStorage.getItem('member');
    const accessToken = localStorage.getItem('accessToken');
    
    if (storedMember && accessToken) {
      setMember(JSON.parse(storedMember));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.login(email, password);
      const { member: loginMember, accessToken, refreshToken } = response as { member: Member; accessToken: string, refreshToken: string };
      
      localStorage.setItem('member', JSON.stringify(loginMember));
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setMember(loginMember);
    } catch (error) {
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, nickname: string) => {
    setLoading(true);
    try {
      // 실제 API 호출
      const response = await api.register(email, password, nickname);

      // response의 타입이 unknown일 수 있으므로 타입 단언 또는 체크 필요
      // 예시: { member: Member, accessToken: string } 형태라고 가정
      const { member: registeredMember, accessToken, refreshToken } = response as { member: Member; accessToken: string, refreshToken: string };

      localStorage.setItem('member', JSON.stringify(registeredMember));
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setMember(registeredMember);
    } catch (error) {
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // localStorage.removeItem('user');
    // localStorage.removeItem('token');
    localStorage.clear();
    setMember(null);
  };

  const value: AuthContextType = {
    user: member,
    isAuthenticated: !!member,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};