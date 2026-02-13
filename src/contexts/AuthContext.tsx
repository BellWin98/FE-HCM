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

  const socialLogin = async (accessToken: string, refreshToken: string) => {
    setLoading(true);
    try {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      const currentMember = await api.getCurrentUser() as Member;

      localStorage.setItem('member', JSON.stringify(currentMember));
      setMember(currentMember);
    } catch (error) {
      localStorage.removeItem('member');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
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

  // 이메일 중복 확인
  const checkEmailDuplicate = async (email: string) => {
    try {
      await api.checkEmailDuplicate(email);
      return { success: true };
    } catch (error) {
      throw new Error(error.message);
    }
  };

  // 이메일 인증 코드 발송
  const sendVerificationEmail = async (email: string) => {
    try {
      await api.sendVerificationEmail(email);
      return { success: true };
    } catch (error) {
      throw new Error(error.message);
    }
  };

  // 이메일 인증 코드 확인
  const verifyEmailCode = async (email: string, code: string) => {
    try {
      await api.verifyEmailCode(email, code);
      return { success: true };
    } catch (error) {
      throw new Error(error.message);
    }
  };

  const logout = () => {
    localStorage.removeItem('member');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    // localStorage.clear();
    setMember(null);
  };

  const updateMember = (updates: Partial<Member>) => {
    if (member) {
      const updatedMember = { ...member, ...updates };
      setMember(updatedMember);
      localStorage.setItem('member', JSON.stringify(updatedMember));
    }
  };

  const value: AuthContextType = {
    member: member,
    isAuthenticated: !!member,
    login,
    register,
    socialLogin,
    logout,
    loading,
    checkEmailDuplicate,
    sendVerificationEmail,
    verifyEmailCode,
    updateMember,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};