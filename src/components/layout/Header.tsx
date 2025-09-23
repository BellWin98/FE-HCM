import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Settings, LogOut, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Header = () => {
  const { member, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div 
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">HCM</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">헬창마을</h1>
        </div>

        {isAuthenticated ? (
          <div className="flex items-center space-x-4">
            {/* 주식 현황 메뉴 - FAMILY, ADMIN 권한만 표시 */}
            {(member?.role === 'FAMILY' || member?.role === 'ADMIN') && (
              <Button 
                variant="outline" 
                onClick={() => navigate('/stock/portfolio')}
                className="flex items-center space-x-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span>주식 현황</span>
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>
                    {member?.nickname?.slice(0,2)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{member?.nickname}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {member?.email}
                    </p>
                  </div>
                </div>
                {/* <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>프로필</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>설정</span>
                </DropdownMenuItem> */}
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>로그아웃</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => navigate('/login')}>
              로그인
            </Button>
            <Button onClick={() => navigate('/register')}>
              회원가입
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};