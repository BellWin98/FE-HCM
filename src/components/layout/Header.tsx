import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Settings, LogOut, BarChart3, Menu, X, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export const Header = () => {
  const { member, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
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
          <>
            {/* 데스크톱 메뉴 */}
            {!isMobile && (
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
                    <DropdownMenuItem onClick={() => handleNavigation('/mypage')}>
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>마이페이지</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>로그아웃</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* 모바일 메뉴 */}
            {isMobile && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2"
                >
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => navigate('/login')} size="sm">
              로그인
            </Button>
            <Button onClick={() => navigate('/register')} size="sm">
              회원가입
            </Button>
          </div>
        )}
      </div>

      {/* 모바일 메뉴 드롭다운 */}
      {isMobile && isAuthenticated && isMobileMenuOpen && (
        <div className="border-t bg-white shadow-lg">
          <div className="px-4 py-3 space-y-3">
            {/* 사용자 정보 */}
            <div className="flex items-center space-x-3 pb-3 border-b">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {member?.nickname?.slice(0,2)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{member?.nickname}</p>
                <p className="text-sm text-gray-600">{member?.email}</p>
              </div>
            </div>

            {/* 주식 현황 메뉴 - FAMILY, ADMIN 권한만 표시 */}
            {(member?.role === 'FAMILY' || member?.role === 'ADMIN') && (
              <Button 
                variant="outline" 
                onClick={() => handleNavigation('/stock/portfolio')}
                className="w-full justify-start"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                <span>주식 현황</span>
              </Button>
            )}

            {/* 마이페이지 */}
            <Button 
              variant="outline" 
              onClick={() => handleNavigation('/mypage')}
              className="w-full justify-start"
            >
              <UserCircle className="h-4 w-4 mr-2" />
              <span>마이페이지</span>
            </Button>

            {/* 로그아웃 */}
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="w-full justify-start text-red-600 hover:text-red-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>로그아웃</span>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};