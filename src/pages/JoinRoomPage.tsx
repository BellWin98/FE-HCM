import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { savePendingJoinCode } from '@/lib/pendingJoinCode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

const JoinRoomPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const code = (searchParams.get('code') ?? '').trim().toUpperCase();

  useEffect(() => {
    if (loading || isAuthenticated) return;
    if (code) {
      savePendingJoinCode(code);
    }
    navigate('/login', { replace: true });
  }, [loading, isAuthenticated, code, navigate]);

  const handleJoin = async () => {
    if (!code) return;
    setIsJoining(true);
    setError('');
    try {
      await api.joinWorkoutRoomByCode(code);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '방에 입장할 수 없습니다.');
    } finally {
      setIsJoining(false);
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>초대 코드가 없어요</CardTitle>
            <CardDescription>공유받은 링크에 입장 코드가 포함되어 있는지 확인해주세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/dashboard">
              <Button className="w-full">대시보드로 이동</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>운동방 초대</CardTitle>
          <CardDescription>
            입장 코드 <span className="font-mono font-semibold">{code}</span>로 운동방에 참여할까요?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button className="w-full" onClick={handleJoin} disabled={isJoining}>
            {isJoining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            참여하기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinRoomPage;
