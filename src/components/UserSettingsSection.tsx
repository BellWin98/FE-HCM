import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { UserSettings } from '@/types';
import { api } from '@/lib/api';
import { Settings, Bell, Shield, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface UserSettingsSectionProps {
  settings: UserSettings | null;
  onSettingsUpdate: (settings: UserSettings) => void;
}

export const UserSettingsSection = ({ settings, onSettingsUpdate }: UserSettingsSectionProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [localSettings, setLocalSettings] = useState<UserSettings | null>(settings);

  const handleNotificationChange = (key: keyof UserSettings['notifications'], value: boolean) => {
    if (!localSettings) return;
    
    setLocalSettings({
      ...localSettings,
      notifications: {
        ...localSettings.notifications,
        [key]: value
      }
    });
  };

  const handlePrivacyChange = (key: keyof UserSettings['privacy'], value: boolean) => {
    if (!localSettings) return;
    
    setLocalSettings({
      ...localSettings,
      privacy: {
        ...localSettings.privacy,
        [key]: value
      }
    });
  };

  const handleSave = async () => {
    if (!localSettings) return;
    
    setIsLoading(true);
    try {
      const updatedSettings = await api.updateUserSettings(localSettings) as UserSettings;
      onSettingsUpdate(updatedSettings);
      toast.success('설정이 저장되었습니다.');
    } catch (error) {
      toast.error('설정 저장에 실패했습니다.');
      console.error('Settings save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setLocalSettings(settings);
  };

  if (!localSettings) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            설정 정보를 불러올 수 없습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(settings);

  return (
    <div className="space-y-6">
      {/* 알림 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>알림 설정</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="workout-reminder">운동 알림</Label>
                <p className="text-sm text-muted-foreground">
                  운동 시간이 되면 알림을 받습니다
                </p>
              </div>
              <Switch
                id="workout-reminder"
                checked={localSettings.notifications.workoutReminder}
                onCheckedChange={(checked) => handleNotificationChange('workoutReminder', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="penalty-alert">벌금 알림</Label>
                <p className="text-sm text-muted-foreground">
                  벌금 발생 시 알림을 받습니다
                </p>
              </div>
              <Switch
                id="penalty-alert"
                checked={localSettings.notifications.penaltyAlert}
                onCheckedChange={(checked) => handleNotificationChange('penaltyAlert', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="room-updates">방 업데이트</Label>
                <p className="text-sm text-muted-foreground">
                  운동방의 새로운 소식을 받습니다
                </p>
              </div>
              <Switch
                id="room-updates"
                checked={localSettings.notifications.roomUpdates}
                onCheckedChange={(checked) => handleNotificationChange('roomUpdates', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weekly-report">주간 리포트</Label>
                <p className="text-sm text-muted-foreground">
                  주간 운동 리포트를 받습니다
                </p>
              </div>
              <Switch
                id="weekly-report"
                checked={localSettings.notifications.weeklyReport}
                onCheckedChange={(checked) => handleNotificationChange('weeklyReport', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 개인정보 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>개인정보 설정</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-profile">프로필 공개</Label>
                <p className="text-sm text-muted-foreground">
                  다른 사용자가 내 프로필을 볼 수 있습니다
                </p>
              </div>
              <Switch
                id="show-profile"
                checked={localSettings.privacy.showProfile}
                onCheckedChange={(checked) => handlePrivacyChange('showProfile', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-workouts">운동 기록 공개</Label>
                <p className="text-sm text-muted-foreground">
                  다른 사용자가 내 운동 기록을 볼 수 있습니다
                </p>
              </div>
              <Switch
                id="show-workouts"
                checked={localSettings.privacy.showWorkouts}
                onCheckedChange={(checked) => handlePrivacyChange('showWorkouts', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-stats">통계 공개</Label>
                <p className="text-sm text-muted-foreground">
                  다른 사용자가 내 운동 통계를 볼 수 있습니다
                </p>
              </div>
              <Switch
                id="show-stats"
                checked={localSettings.privacy.showStats}
                onCheckedChange={(checked) => handlePrivacyChange('showStats', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 저장 버튼 */}
      {hasChanges && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">변경사항이 있습니다</p>
                <p className="text-sm text-muted-foreground">
                  설정을 저장하거나 되돌릴 수 있습니다
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleReset}>
                  되돌리기
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? '저장 중...' : '저장'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 계정 관리 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>계정 관리</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              비밀번호 변경
            </Button>
            <Button variant="outline" className="w-full justify-start">
              이메일 변경
            </Button>
            <Separator />
            <Button variant="destructive" className="w-full justify-start">
              계정 삭제
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
