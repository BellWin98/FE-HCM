import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Mail, Clock } from 'lucide-react';

// 한글을 영어로 변환하는 함수
const koreanToEnglish = (text: string): string => {
  const koreanMap: { [key: string]: string } = {
    // 자음
    'ㄱ': 'r', 'ㄲ': 'R', 'ㄴ': 's', 'ㄷ': 'e', 'ㄸ': 'E', 'ㄹ': 'f',
    'ㅁ': 'a', 'ㅂ': 'q', 'ㅃ': 'Q', 'ㅅ': 't', 'ㅆ': 'T', 'ㅇ': 'd',
    'ㅈ': 'w', 'ㅉ': 'W', 'ㅊ': 'c', 'ㅋ': 'z', 'ㅌ': 'x', 'ㅍ': 'v', 'ㅎ': 'g',
    // 모음
    'ㅏ': 'k', 'ㅐ': 'o', 'ㅑ': 'i', 'ㅒ': 'O', 'ㅓ': 'j', 'ㅔ': 'p',
    'ㅕ': 'u', 'ㅖ': 'P', 'ㅗ': 'h', 'ㅘ': 'hk', 'ㅙ': 'ho', 'ㅚ': 'hl',
    'ㅛ': 'y', 'ㅜ': 'n', 'ㅝ': 'nj', 'ㅞ': 'np', 'ㅟ': 'nl', 'ㅠ': 'b', 'ㅡ': 'm', 'ㅢ': 'ml', 'ㅣ': 'l',
    // 완성된 글자
    '가': 'rk', '각': 'rk', '간': 'rks', '갇': 'rke', '갈': 'rkf', '갉': 'rka', '갊': 'rkq', '갋': 'rkt', '갌': 'rkd', '갍': 'rkw', '갎': 'rkc', '갏': 'rkz',
    '나': 'sk', '낙': 'sk', '난': 'sks', '낟': 'ske', '날': 'skf', '낡': 'ska', '낢': 'skq', '낣': 'skt', '낤': 'skd', '낥': 'skw', '낦': 'skc', '낧': 'skz',
    '다': 'ek', '닥': 'ek', '단': 'eks', '닫': 'eke', '달': 'ekf', '닭': 'eka', '닮': 'ekq', '닯': 'ekt', '닰': 'ekd', '닱': 'ekw', '닲': 'ekc', '닳': 'ekz',
    '라': 'fk', '락': 'fk', '란': 'fks', '랃': 'fke', '랄': 'fkf', '랅': 'fka', '랆': 'fkq', '랇': 'fkt', '랈': 'fkd', '랉': 'fkw', '랊': 'fkc', '랋': 'fkz',
    '마': 'ak', '막': 'ak', '만': 'aks', '맏': 'ake', '말': 'akf', '맑': 'aka', '맒': 'akq', '맓': 'akt', '맔': 'akd', '맕': 'akw', '맖': 'akc', '맗': 'akz',
    '바': 'qk', '박': 'qk', '반': 'qks', '받': 'qke', '발': 'qkf', '밝': 'qka', '밞': 'qkq', '밟': 'qkt', '밠': 'qkd', '밡': 'qkw', '밢': 'qkc', '밣': 'qkz',
    '사': 'tk', '삭': 'tk', '산': 'tks', '삳': 'tke', '살': 'tkf', '삵': 'tka', '삶': 'tkq', '삷': 'tkt', '삸': 'tkd', '삹': 'tkw', '삺': 'tkc', '삻': 'tkz',
    '아': 'dk', '악': 'dk', '안': 'dks', '앋': 'dke', '알': 'dkf', '앍': 'dka', '앎': 'dkq', '앏': 'dkt', '앐': 'dkd', '앑': 'dkw', '앒': 'dkc', '앓': 'dkz',
    '자': 'wk', '작': 'wk', '잔': 'wks', '잗': 'wke', '잘': 'wkf', '잚': 'wka', '잛': 'wkq', '잜': 'wkt', '잝': 'wkd', '잞': 'wkw', '잟': 'wkc', '잠': 'wkz',
    '차': 'ck', '착': 'ck', '찬': 'cks', '찯': 'cke', '찰': 'ckf', '찱': 'cka', '찲': 'ckq', '찳': 'ckt', '찴': 'ckd', '찵': 'ckw', '찶': 'ckc', '찷': 'ckz',
    '카': 'zk', '칵': 'zk', '칸': 'zks', '칻': 'zke', '칼': 'zkf', '칽': 'zka', '칾': 'zkq', '칿': 'zkt', '캀': 'zkd', '캁': 'zkw', '캂': 'zkc', '캃': 'zkz',
    '타': 'xk', '탁': 'xk', '탄': 'xks', '탇': 'xke', '탈': 'xkf', '탉': 'xka', '탊': 'xkq', '탋': 'xkt', '탌': 'xkd', '탍': 'xkw', '탎': 'xkc', '탏': 'xkz',
    '파': 'vk', '팩': 'vk', '판': 'vks', '팯': 'vke', '팰': 'vkf', '팱': 'vka', '팲': 'vkq', '팳': 'vkt', '팴': 'vkd', '팵': 'vkw', '팶': 'vkc', '팷': 'vkz',
    '하': 'gk', '학': 'gk', '한': 'gks', '핟': 'gke', '할': 'gkf', '핡': 'gka', '핢': 'gkq', '핣': 'gkt', '핤': 'gkd', '핥': 'gkw', '핦': 'gkc', '핧': 'gkz'
  };

  return text.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, (char) => koreanMap[char] || char);
};

export const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 이메일 관련 상태
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable' | 'verifying' | 'verified'>('idle');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const { register, isAuthenticated, loading, checkEmailDuplicate, sendVerificationEmail, verifyEmailCode } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // 카운트다운 타이머
  const startCountdown = () => {
    setCountdown(300); // 5분
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 이메일 중복 확인
  const handleEmailCheck = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return;
    }
    setEmailStatus('checking');
    setError('');
    try {
      const result = await checkEmailDuplicate(email);
      if (result) {
        setEmailStatus('available');
        setSuccess('사용 가능한 이메일입니다.');
        setError('');
      }
    } catch (err) {
      if (err.message == '이미 존재하는 이메일입니다.') {
        setEmailStatus('unavailable');
        setSuccess('');
      } else {
        setEmailStatus('idle');
        setError('이메일 확인 중 오류가 발생했습니다.');
      }
    }
  };

  // 인증 코드 발송
  const handleSendVerification = async () => {
    if (emailStatus !== 'available') {
      setError('먼저 이메일 중복 확인을 해주세요.');
      return;
    }

    try {
      await sendVerificationEmail(email);
      setVerificationSent(true);
      setSuccess('인증 코드가 이메일로 발송되었습니다.');
      setError('');
      startCountdown();
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증 코드 발송에 실패했습니다.');
    }
  };

  // 인증 코드 확인
  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setError('인증 코드를 입력해주세요.');
      return;
    }

    setEmailStatus('verifying');
    try {
      await verifyEmailCode(email, verificationCode);
      setEmailStatus('verified');
      setIsEmailVerified(true);
      setSuccess('이메일 인증이 완료되었습니다.');
      setError('');
    } catch (err) {
      setEmailStatus('available');
      setError(err instanceof Error ? err.message : '인증 코드가 올바르지 않습니다.');
    }
  };

  const validateForm = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return false;
    }

    if (!isEmailVerified) {
      setError('이메일 인증을 완료해주세요.');
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-brand-bg p-4 pb-safe">
      <Card className="w-full max-w-md bg-brand-surface border border-white/10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center text-brand-foreground">회원가입</CardTitle>
          <CardDescription className="text-center text-brand-foreground/80">
            친구들과 운동 습관을 만들어보세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이메일 입력 및 중복 확인 */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-brand-foreground">이메일</Label>
              <div className="flex space-x-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => {
                    const convertedValue = koreanToEnglish(e.target.value.replace(/\s/g, ''));
                    setEmail(convertedValue);
                    setEmailStatus('idle');
                    setIsEmailVerified(false);
                    setVerificationSent(false);
                    setVerificationCode('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === ' ') {
                      e.preventDefault();
                    }
                  }}
                  disabled={loading || isEmailVerified}
                  className="flex-1 bg-white/5 border-white/20 text-brand-foreground placeholder:text-brand-foreground/50"
                />
                <Button
                  type="button"
                  onClick={handleEmailCheck}
                  disabled={loading || !email || emailStatus === 'verified'}
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {emailStatus === 'checking' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : emailStatus === 'verified' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    '중복확인'
                  )}
                </Button>
              </div>
              
              {/* 이메일 상태 표시 */}
              {emailStatus === 'available' && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>사용 가능한 이메일입니다</span>
                </div>
              )}
              {emailStatus === 'unavailable' && (
                <div className="flex items-center space-x-2 text-sm text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span>이미 사용 중인 이메일입니다</span>
                </div>
              )}
            </div>

            {/* 이메일 인증 코드 발송 */}
            {emailStatus === 'available' && !verificationSent && (
              <Button
                type="button"
                onClick={handleSendVerification}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <Mail className="mr-2 h-4 w-4" />
                인증 코드 발송
              </Button>
            )}

            {/* 인증 코드 입력 */}
            {verificationSent && !isEmailVerified && (
              <div className="space-y-2">
                <Label htmlFor="verificationCode" className="text-brand-foreground">인증 코드</Label>
                <div className="flex space-x-2">
                  <Input
                    id="verificationCode"
                    type="text"
                    placeholder="6자리 인증 코드"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    disabled={loading}
                    maxLength={6}
                    className="flex-1 bg-white/5 border-white/20 text-brand-foreground placeholder:text-brand-foreground/50"
                  />
                  <Button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={loading || !verificationCode || emailStatus === 'verifying'}
                    variant="outline"
                    size="sm"
                  >
                    {emailStatus === 'verifying' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      '확인'
                    )}
                  </Button>
                </div>
                
                {/* 카운트다운 및 재발송 */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1 text-brand-foreground/70">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(countdown)}</span>
                  </div>
                  {countdown === 0 && (
                    <Button
                      type="button"
                      onClick={handleSendVerification}
                      disabled={loading}
                      variant="ghost"
                      size="sm"
                      className="text-brand-primary hover:text-brand-primary/90"
                    >
                      재발송
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* 이메일 인증 완료 표시 */}
            {isEmailVerified && (
              <div className="flex items-center space-x-2 text-sm text-brand-primary bg-brand-primary/20 p-2 rounded-md">
                <CheckCircle className="h-4 w-4" />
                <span>이메일 인증이 완료되었습니다</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nickname" className="text-brand-foreground">닉네임</Label>
              <Input
                id="nickname"
                type="text"
                placeholder="닉네임 (2-10자)"
                minLength={2}
                maxLength={10}
                value={nickname}
                onChange={(e) => setNickname(e.target.value.replace(/\s/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === ' ') {
                    e.preventDefault();
                  }
                }}
                disabled={loading}
                className="bg-white/5 border-white/20 text-brand-foreground placeholder:text-brand-foreground/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-brand-foreground">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="8-20자, 영문/숫자/특수문자 포함"
                value={password}
                minLength={8}
                maxLength={20}
                onChange={(e) => {
                  const convertedValue = koreanToEnglish(e.target.value.replace(/\s/g, ''));
                  setPassword(convertedValue);
                }}
                onKeyDown={(e) => {
                  if (e.key === ' ') {
                    e.preventDefault();
                  }
                }}
                disabled={loading}
                className="bg-white/5 border-white/20 text-brand-foreground placeholder:text-brand-foreground/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-brand-foreground">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                value={confirmPassword}
                minLength={8}
                maxLength={20}
                onChange={(e) => {
                  const convertedValue = koreanToEnglish(e.target.value.replace(/\s/g, ''));
                  setConfirmPassword(convertedValue);
                }}
                onKeyDown={(e) => {
                  if (e.key === ' ') {
                    e.preventDefault();
                  }
                }}
                disabled={loading}
                className="bg-white/5 border-white/20 text-brand-foreground placeholder:text-brand-foreground/50"
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* {success && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )} */}
            
            <Button type="submit" className="w-full bg-brand-primary text-brand-bg hover:bg-brand-primary/90" disabled={loading || !isEmailVerified}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              회원가입
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-brand-foreground/80">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-brand-primary hover:underline">
              로그인
            </Link>
          </div>
          <div className="mt-4 text-center text-sm">
            <Link to="/" className="text-brand-primary hover:underline">
              홈으로 가기
            </Link>
          </div>          
        </CardContent>
      </Card>
    </div>
  );
}

export default RegisterPage;