import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Member, AuthContextType } from '@/types';
import { api } from '@/lib/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
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
    if (storedMember) {
      setMember(JSON.parse(storedMember));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.login(email, password) as Member;
      localStorage.setItem('member', JSON.stringify(response));
      setMember(response);
    } catch (error) {
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, nickname: string) => {
    setLoading(true);
    try {
      const response = await api.register(email, password, nickname) as Member;
      localStorage.setItem('member', JSON.stringify(response));
      setMember(response);
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

  const logout = async () => {
    await api.logout();
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
    logout,
    loading,
    checkEmailDuplicate,
    sendVerificationEmail,
    verifyEmailCode,
    updateMember,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};