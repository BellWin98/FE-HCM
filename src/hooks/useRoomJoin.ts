import { api } from '@/lib/api';
import { koreanToEnglish } from '@/lib/koreanToEnglish';
import { useState } from 'react';

export const useRoomJoin = () => {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [password, setPassword] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const handleJoinWorkoutRoom = (workoutRoomId: number) => {
    setSelectedRoomId(workoutRoomId);
    setShowPasswordDialog(true);
  };

  const handlePasswordChange = (value: string) => {
    const processedValue = koreanToEnglish(value.replace(/\s/g, ''));
    if (processedValue.length <= 10) {
      setPassword(processedValue);
    }
  };

  const handlePasswordSubmit = async () => {
    setError('');
    if (!selectedRoomId || !password.trim()) return;

    setIsJoining(true);
    try {
      await api.joinWorkoutRoomByEntryCode(selectedRoomId, password);
      setShowPasswordDialog(false);
      setPassword('');
      setSelectedRoomId(null);

      // 방 참여 후 페이지 새로고침
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '방에 입장할 수 없습니다.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleDialogClose = () => {
    setShowPasswordDialog(false);
    setPassword('');
    setSelectedRoomId(null);
    setError('');
  };

  return {
    showPasswordDialog,
    setShowPasswordDialog,
    selectedRoomId,
    setSelectedRoomId,
    password,
    isJoining,
    error,
    handleJoinWorkoutRoom,
    handlePasswordChange,
    handlePasswordSubmit,
    handleDialogClose,
  };
};
