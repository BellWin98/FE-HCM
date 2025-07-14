import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Calendar, Loader2, Copy, Check } from 'lucide-react';

export default function JoinRoomPage() {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    id: string;
    nickname: string;
    joinedDate: string;
    hasActiveRoom: boolean;
  }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!inviteCode.trim()) {
      setError('초대 코드를 입력해주세요.');
      return;
    }

    if (inviteCode.length !== 8) {
      setError('초대 코드는 8자리여야 합니다.');
      return;
    }

    setLoading(true);
    try {
      // TODO: 실제 API 호출로 교체
      await new Promise(resolve => setTimeout(resolve, 1500));
      navigate('/dashboard');
    } catch (err) {
      setError('유효하지 않은 초대 코드입니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setError('최소 2자 이상 입력해주세요.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      // TODO: 실제 API 호출로 교체
      const mockResults = [
        {
          id: '1',
          nickname: '운동러버123',
          joinedDate: '2024-01-15',
          hasActiveRoom: false,
        },
        {
          id: '2', 
          nickname: '헬스맨',
          joinedDate: '2024-02-20',
          hasActiveRoom: true,
        },
      ];
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSearchResults(mockResults);
    } catch (err) {
      setError('사용자 검색에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (userId: string, nickname: string) => {
    try {
      // TODO: 실제 API 호출로 교체
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(`${nickname}님에게 초대 메시지를 보냈습니다.`);
    } catch (err) {
      setError('초대 메시지 전송에 실패했습니다.');
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText('ABC12345');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>방 참여하기</CardTitle>
            <CardDescription>
              초대 코드를 입력하거나 친구를 검색해서 방에 참여해보세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="code" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="code">초대 코드</TabsTrigger>
                <TabsTrigger value="search">친구 검색</TabsTrigger>
              </TabsList>

              <TabsContent value="code" className="space-y-6">
                <div className="space-y-4">
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold mb-2">내 방의 초대 코드</h3>
                    <div className="flex items-center justify-center space-x-2">
                      <code className="bg-white px-3 py-2 rounded border text-lg font-mono">
                        ABC12345
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyInviteCode}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      친구들에게 이 코드를 공유해보세요
                    </p>
                  </div>

                  <form onSubmit={handleJoinByCode} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-code">친구의 초대 코드 입력</Label>
                      <Input
                        id="invite-code"
                        placeholder="8자리 초대 코드를 입력하세요"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        maxLength={8}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      방 참여하기
                    </Button>
                  </form>
                </div>
              </TabsContent>

              <TabsContent value="search" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="친구 닉네임을 검색하세요 (최소 2자)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button onClick={handleSearchUsers} disabled={loading}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-medium">검색 결과</h3>
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="font-medium text-blue-600">
                                {user.nickname.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{user.nickname}</p>
                              <p className="text-sm text-muted-foreground">
                                가입일: {user.joinedDate}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {user.hasActiveRoom && (
                              <Badge variant="secondary">참여 중</Badge>
                            )}
                            <Button
                              size="sm"
                              onClick={() => handleInviteUser(user.id, user.nickname)}
                              disabled={user.hasActiveRoom}
                            >
                              초대하기
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchQuery.length >= 2 && searchResults.length === 0 && !loading && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>검색 결과가 없습니다.</p>
                      <p className="text-sm">다른 닉네임으로 검색해보세요.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="mt-6 pt-6 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/dashboard')}
              >
                대시보드로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}