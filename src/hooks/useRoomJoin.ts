import { api } from '@/lib/api';
import { koreanToEnglish } from '@/lib/koreanToEnglish';
import { useState } from 'react';

export const useRoomJoin = () => {
  const [showRoomCodeDialog, setShowRoomCodeDialog] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const openRoomCodeDialog = () => {
    setRoomCode('');
    setError('');
    setShowRoomCodeDialog(true);
  };

  const handleRoomCodeChange = (value: string) => {
    const processedValue = koreanToEnglish(value.replace(/\s/g, '')).toUpperCase();
    if (processedValue.length <= 10) {
      setRoomCode(processedValue);
    }
  };

  const handleCodeSubmit = async () => {
    setError('');
    if (!roomCode.trim()) return;

    setIsJoining(true);
    try {
      await api.joinWorkoutRoomByCode(roomCode.trim());
      setShowRoomCodeDialog(false);
      setRoomCode('');

      // 방 참여 후 페이지 새로고침
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '방에 입장할 수 없습니다.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleDialogClose = () => {
    setShowRoomCodeDialog(false);
    setRoomCode('');
    setError('');
  };

  return {
    showRoomCodeDialog,
    setShowRoomCodeDialog,
    roomCode,
    isJoining,
    error,
    openRoomCodeDialog,
    handleRoomCodeChange,
    handleCodeSubmit,
    handleDialogClose,
  };
};
