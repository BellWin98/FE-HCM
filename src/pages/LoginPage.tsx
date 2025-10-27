import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

const SAVED_EMAIL_KEY = 'saved_email';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberEmail, setRememberEmail] = useState(false);
  const { login, isAuthenticated, loading } = useAuth();

  // 컴포넌트 마운트 시 저장된 이메일 불러오기
  useEffect(() => {
    const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, []);

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

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      await login(email, password);

      // 로그인 성공 시 이메일 저장 처리
      if (rememberEmail) {
        localStorage.setItem(SAVED_EMAIL_KEY, email);
      } else {
        localStorage.removeItem(SAVED_EMAIL_KEY);
      }
    } catch (err) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">로그인</CardTitle>
          <CardDescription className="text-center">
            헬창마을에 오신 것을 환영합니다
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
                onChange={(e) => {
                  const convertedValue = koreanToEnglish(e.target.value.replace(/\s/g, ''));
                  setEmail(convertedValue);
                }}
                onKeyDown={(e) => {
                  if (e.key === ' ') {
                    e.preventDefault();
                  }
                }}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
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
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberEmail"
                checked={rememberEmail}
                onCheckedChange={(checked) => setRememberEmail(checked as boolean)}
                disabled={loading}
              />
              <Label
                htmlFor="rememberEmail"
                className="text-sm font-normal cursor-pointer"
              >
                이메일 저장
              </Label>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              로그인
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            계정이 없으신가요?{' '}
            <Link to="/register" className="text-blue-600 hover:underline">
              회원가입
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

export default LoginPage;