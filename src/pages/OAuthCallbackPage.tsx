import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { socialLogin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (!accessToken || !refreshToken) {
      toast({
        title: '소셜 로그인에 실패했어요.',
        description: '토큰 정보가 유효하지 않습니다. 다시 시도해주세요.',
        variant: 'destructive',
      });
      navigate('/login', { replace: true });
      return;
    }

    const handleSocialCallback = async () => {
      try {
        await socialLogin(accessToken, refreshToken);
        navigate('/dashboard', { replace: true });
      } catch (error) {
        toast({
          title: '소셜 로그인에 실패했어요.',
          description: '잠시 후 다시 시도해주세요.',
          variant: 'destructive',
        });
        navigate('/login', { replace: true });
      }
    };

    handleSocialCallback();
  }, [searchParams, socialLogin, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <p className="text-gray-600 text-sm">소셜 로그인 처리 중입니다...</p>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;

