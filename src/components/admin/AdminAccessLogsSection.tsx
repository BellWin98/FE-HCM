import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { AccessLog, PageResponse } from '@/types';
import { Loader2, MonitorSmartphone } from 'lucide-react';

export const AdminAccessLogsSection = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getUserAccessLogs({
        keyword: keyword || undefined,
        size: 100,
      });
      const list = Array.isArray(response)
        ? response
        : (response as PageResponse<AccessLog>).content ?? [];
      setLogs(list);
    } catch (error) {
      toast({
        title: '오류',
        description: error.message || '접속 기록을 불러올 수 없습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [keyword, toast]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2 text-emerald-600">
          <MonitorSmartphone className="h-5 w-5" />
          <CardTitle className="text-xl font-bold">유저 접속 기록</CardTitle>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="닉네임, 이메일, IP 로 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1"
          />
          <Button variant="outline" onClick={loadLogs} disabled={isLoading} className="sm:w-auto">
            새로고침
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            불러오는 중...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">접속 기록이 없습니다.</div>
        ) : (
          <>
            {/* 데스크톱 테이블 뷰 */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>사용자</TableHead>
                    <TableHead>IP / 위치</TableHead>
                    <TableHead>디바이스</TableHead>
                    <TableHead>일시</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="font-medium">{log.nickname}</div>
                        <div className="text-xs text-muted-foreground">{log.email}</div>
                      </TableCell>
                      <TableCell>
                        <div>{log.ipAddress}</div>
                        <div className="text-xs text-muted-foreground">{log.location || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <div>{log.deviceType || '-'}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {log.userAgent || ''}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(log.loggedInAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* 모바일 카드 뷰 */}
            <div className="md:hidden space-y-4">
              {logs.map((log) => (
                <Card key={log.id} className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base truncate">{log.nickname}</div>
                        <div className="text-sm text-muted-foreground truncate">{log.email}</div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t text-sm">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-muted-foreground shrink-0">IP 주소</span>
                        <span className="font-medium text-right">{log.ipAddress}</span>
                      </div>
                      {log.location && (
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-muted-foreground shrink-0">위치</span>
                          <span className="text-right">{log.location}</span>
                        </div>
                      )}
                      {log.deviceType && (
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-muted-foreground shrink-0">디바이스</span>
                          <span className="text-right">{log.deviceType}</span>
                        </div>
                      )}
                      {log.userAgent && (
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground text-xs">User Agent</span>
                          <span className="text-xs break-all">{log.userAgent}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      접속 일시: {new Date(log.loggedInAt).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminAccessLogsSection;

