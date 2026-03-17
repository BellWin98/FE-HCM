import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const today = new Date();
today.setHours(0, 0, 0, 0);

export const useRestDay = () => {
  const navigate = useNavigate();

  const { member } = useAuth();
  const [showRestDialog, setShowRestDialog] = useState(false);
  const [restReason, setRestReason] = useState('');
  const [restStartDate, setRestStartDate] = useState<Date | undefined>(new Date());
  const [restEndDate, setRestEndDate] = useState<Date | undefined>(new Date());
  const [showRestSuccessDialog, setShowRestSuccessDialog] = useState(false);
  const [isRegisteringRest, setIsRegisteringRest] = useState(false);
  const [error, setError] = useState('');

  const handleRestRegister = () => {
    setRestStartDate(today);

    // 종료일 - 가장 최근 enabled 날짜 찾기 (일요일 중에서)
    const nextSunday = new Date(today);
    const nextMonday = new Date(today);
    // 다음 일요일 찾기
    const daysUntilSunday = (7 - nextSunday.getDay()) % 7;
    if (daysUntilSunday === 0 && nextSunday.getDay() === 0) {
      // 오늘이 일요일이면 오늘을 선택
      setRestEndDate(nextSunday);
    } else {
      nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
      if (nextMonday > nextSunday) {
        nextSunday.setDate(nextSunday.getDate() + 7);
      }
      setRestEndDate(nextSunday);
    }

    setShowRestDialog(true);
  };

  const handleRestSubmit = async () => {
    setError('');
    if (!restReason.trim() || !restStartDate || !restEndDate) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    if (restStartDate > restEndDate) {
      setError('시작일은 종료일보다 이전이어야 합니다.');
      return;
    }

    setIsRegisteringRest(true);
    const fmRestStartDate = format(restStartDate, 'yyyy-MM-dd');
    const fmRestEndDate = format(restEndDate, 'yyyy-MM-dd');
    
    try {
      await api.registerRestDay({
        reason: restReason,
        startDate: fmRestStartDate,
        endDate: fmRestEndDate
      });

      setShowRestDialog(false);
      setRestReason('');
      setRestStartDate(new Date());
      setRestEndDate(new Date());

      api.notifyAllRoomMembers({
        title: `${member.nickname}님이 휴식일을 등록했어요!`,
        body: `${fmRestStartDate} ~ ${fmRestEndDate}`,
        type: "REST",
      }).catch((notifyErr) => {
        console.warn('휴식 알림 전송 실패', notifyErr);
      });

      setShowRestSuccessDialog(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '휴식일을 등록할 수 없습니다.');
    } finally {
      setIsRegisteringRest(false);
    }
  };

  const handleRestSuccessDialogClose = () => {
    setShowRestSuccessDialog(false);
    navigate('/dashboard');
  };

  const handleRestDialogClose = () => {
    setShowRestDialog(false);
    setRestReason('');
    setError('');
  };

  return {
    showRestDialog,
    setShowRestDialog,
    showRestSuccessDialog,
    restReason,
    setRestReason,
    restStartDate,
    setRestStartDate,
    restEndDate,
    setRestEndDate,
    isRegisteringRest,
    error,
    today,
    handleRestRegister,
    handleRestSubmit,
    handleRestDialogClose,
    handleRestSuccessDialogClose,
  };
};
