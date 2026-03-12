import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserProfile } from '@/types';
import { api } from '@/lib/api';
import { Edit, Calendar, Mail, Award, Target, Zap, User, Camera, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';
import { Alert, AlertDescription } from './ui/alert';

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface UserProfileSectionProps {
  profile: UserProfile | null;
  onProfileUpdate: (profile: UserProfile) => void;
  onMemberUpdate?: (updates: { nickname?: string; bio?: string; profileUrl?: string }) => void;
}

export const UserProfileSection = ({ profile, onProfileUpdate, onMemberUpdate }: UserProfileSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const [editForm, setEditForm] = useState({
    nickname: profile?.nickname || '',
    bio: profile?.bio || '',
  });
  const [error, setError] = useState('');

  const validateForm = () => {
    if (editForm.nickname.length < 2 || editForm.nickname.length > 10) {
      setError('닉네임은 2-10자 사이여야 합니다.');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!profile) return;
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const updatedProfile = await api.updateUserProfile(editForm) as UserProfile;
      onProfileUpdate(updatedProfile);

      // AuthContext의 member 상태도 업데이트
      if (onMemberUpdate) {
        onMemberUpdate({
          nickname: editForm.nickname,
          bio: editForm.bio,
        });
      }

      setIsEditing(false);
      toast.success('프로필이 업데이트되었습니다.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      nickname: profile?.nickname || '',
      bio: profile?.bio || '',
    });
    setError('');
    setIsEditing(false);
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('JPEG, PNG, WebP 형식만 업로드 가능합니다.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      toast.error('파일 크기는 5MB 이하여야 합니다.');
      e.target.value = '';
      return;
    }

    setIsUploadingProfileImage(true);
    try {
      const { profileUrl } = await api.uploadProfileImage(file);
      const updatedProfile = await api.updateUserProfile({ profileUrl }) as UserProfile;
      onProfileUpdate(updatedProfile);
      if (onMemberUpdate) {
        onMemberUpdate({ profileUrl: updatedProfile.profileUrl });
      }
      toast.success('프로필 사진이 변경되었습니다.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '프로필 사진 변경에 실패했습니다.');
    } finally {
      setIsUploadingProfileImage(false);
      e.target.value = '';
    }
  };

  const handleAvatarClick = () => {
    if (isUploadingProfileImage) return;
    profileImageInputRef.current?.click();
  };

  const handleAvatarKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAvatarClick();
    }
  };

  if (!profile) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            프로필 정보를 불러올 수 없습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 프로필 카드 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>프로필</span>
            </CardTitle>
            <Dialog open={isEditing} onOpenChange={(open) => {
              if (!open) {
                setEditForm({
                  nickname: profile?.nickname || '',
                  bio: profile?.bio || '',
                });
                setError('');
              }
              setIsEditing(open);
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  편집
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>프로필 편집</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nickname">닉네임</Label>
                    <Input
                      id="nickname"
                      type="text"
                      placeholder="닉네임 (2-10자)"
                      minLength={2}
                      maxLength={10}
                      value={editForm.nickname}
                      onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value.replace(/\s/g, '') })}
                      onKeyDown={(e) => {
                        if (e.key === ' ') {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio">소개글</Label>
                    <Textarea
                      id="bio"
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="소개글을 입력하세요"
                      rows={3}
                    />
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={handleCancel}>
                      취소
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                      {isLoading ? '저장 중...' : '저장'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            {/* 아바타 */}
            <div className="flex-shrink-0 relative group">
              <input
                ref={profileImageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                id="profile-image-upload"
                aria-label="프로필 사진 변경"
                onChange={handleProfileImageChange}
                disabled={isUploadingProfileImage}
              />
              <label
                htmlFor="profile-image-upload"
                className="block cursor-pointer outline-none"
                tabIndex={0}
                role="button"
                aria-label="프로필 사진 변경"
                onKeyDown={handleAvatarKeyDown}
              >
                <div className="relative rounded-full">
                  <Avatar className="h-24 w-24 ring-2 ring-transparent group-hover:ring-muted transition-shadow">
                    <AvatarImage src={profile.profileUrl} alt={profile.nickname} />
                    <AvatarFallback className="text-lg">
                      {profile.nickname.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isUploadingProfileImage && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
                    </div>
                  )}
                  {!isUploadingProfileImage && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-8 w-8 text-white" aria-hidden />
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* 프로필 정보 */}
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-2xl font-bold">{profile.nickname}</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={profile.role === 'ADMIN' ? 'default' : 'secondary'}>
                    {profile.role === 'ADMIN' ? '관리자' : profile.role === 'FAMILY' ? '가족' : '회원'}
                  </Badge>
                </div>
              </div>

              <div className="text-sm">
                {profile.bio ? (
                  <p className="text-muted-foreground break-words whitespace-pre-line">
                    {profile.bio}
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    아직 등록된 소개글이 없습니다. <br/> 상단의 <span className="font-semibold">편집</span> 버튼을 눌러 소개글을 작성해 보세요.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{profile.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    가입일: {format(new Date(profile.joinedAt), 'yyyy년 MM월 dd일', { locale: ko })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 간단한 통계 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">총 운동일</p>
                <p className="text-2xl font-bold">{profile.totalWorkoutDays}일</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">현재 연속 운동일</p>
                <p className="text-2xl font-bold">{profile.currentStreak}일</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">최장 연속 운동일</p>
                <p className="text-2xl font-bold">{profile.longestStreak}일</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <span className="text-red-500">💰</span>
              <div>
                <p className="text-sm font-medium">총 벌금</p>
                <p className="text-2xl font-bold">{profile.totalPenalty.toLocaleString()}원</p>
              </div>
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
};
