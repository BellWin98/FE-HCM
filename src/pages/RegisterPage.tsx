import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const { register, isAuthenticated, loading } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const validateForm = () => {
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return false;
    }

    if (nickname.length < 2 || nickname.length > 10) {
      setError('닉네임은 2-10자 사이여야 합니다.');
      return false;
    }

    if (password.length < 8 || password.length > 20) {
      setError('비밀번호는 8-20자 사이여야 합니다.');
      return false;
    }

    if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password)) {
      setError('비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.');
      return false;
    }

    if (confirmPassword.length < 8 || confirmPassword.length > 20) {
      setError('확인 비밀번호는 8-20자 사이여야 합니다.');
      return false;
    }

    if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(confirmPassword)) {
      setError('확인 비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.');
      return false;
    }

    if (password !== confirmPassword) {
      setError('비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      return false;
    }

    if (!email || !password || !confirmPassword || !nickname) {
      setError('모든 필드를 입력해주세요.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    try {
      await register(email, password, nickname);
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">회원가입</CardTitle>
          <CardDescription className="text-center">
            친구들과 운동 습관을 만들어보세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임</Label>
              <Input
                id="nickname"
                type="text"
                placeholder="닉네임 (2-10자)"
                minLength={2}
                maxLength={10}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="8-20자, 영문/숫자/특수문자 포함"
                value={password}
                minLength={8}
                maxLength={20}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                value={confirmPassword}
                minLength={8}
                maxLength={20}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              회원가입
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              로그인
            </Link>
          </div>
          <div className="mt-4 text-center text-sm">
            <Link to="/" className="text-blue-600 hover:underline">
              홈으로 가기
            </Link>
          </div>          
        </CardContent>
      </Card>
    </div>
  );
}

export default RegisterPage;