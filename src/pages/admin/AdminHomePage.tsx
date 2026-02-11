import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Users, List, Settings } from 'lucide-react';

const AdminHomePage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold md:text-2xl">관리자 홈</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">요약 및 빠른 링크</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                회원 관리
              </CardTitle>
              <CardDescription>회원 목록 검색 및 역할 변경</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link to="/admin/members">회원 목록으로</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                운동방 관리
              </CardTitle>
              <CardDescription>전체 운동방 목록 및 규칙 수정</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link to="/admin/rooms">운동방 목록으로</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                내 운동방
              </CardTitle>
              <CardDescription>ADMIN 전용 내 운동방 보기</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link to="/admin/my-rooms">내 운동방으로</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AdminHomePage;
