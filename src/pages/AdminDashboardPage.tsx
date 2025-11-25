import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import AdminUsersSection from '@/components/admin/AdminUsersSection';
import AdminRoomsSection from '@/components/admin/AdminRoomsSection';
import AdminAccessLogsSection from '@/components/admin/AdminAccessLogsSection';

const AdminDashboardPage = () => {
  const { member } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    if (member && member.role !== 'ADMIN') {
      navigate('/dashboard', { replace: true });
    }
  }, [member, navigate]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-700 text-white rounded-xl p-4 md:p-6 shadow-lg">
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs md:text-sm uppercase tracking-widest opacity-80">Admin Console</p>
                <h1 className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">운영자 메뉴</h1>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="bg-white/20 text-white text-xs md:text-sm">
                  {member?.nickname}
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white text-xs md:text-sm">
                  ROLE · {member?.role}
                </Badge>
              </div>
            </div>
            <p className="text-xs md:text-base text-white/80">
              회원·운동방·접속 기록을 한 곳에서 관리하세요.
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full gap-1">
            <TabsTrigger value="users" className="text-xs sm:text-sm">유저 관리</TabsTrigger>
            <TabsTrigger value="rooms" className="text-xs sm:text-sm">운동방 관리</TabsTrigger>
            <TabsTrigger value="logs" className="text-xs sm:text-sm">접속 기록</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <AdminUsersSection />
          </TabsContent>

          <TabsContent value="rooms" className="space-y-4">
            <AdminRoomsSection />
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <AdminAccessLogsSection />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboardPage;

