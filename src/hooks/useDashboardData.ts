import { api } from '@/lib/api';
import { WorkoutRoom, WorkoutRoomDetail } from '@/types';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const useDashboardData = () => {
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(false);
  const [isMemberInWorkoutRoom, setIsMemberInWorkoutRoom] = useState(false);
  const [availableWorkoutRooms, setAvailableWorkoutRooms] = useState<WorkoutRoom[]>([]);
  const [currentWorkoutRoom, setCurrentWorkoutRoom] = useState<WorkoutRoomDetail | null>(null);

  useEffect(() => {
    const loadDashboardStats = async () => {
      setIsLoading(true);
      const isMemberInRoom = await api.isMemberInWorkoutRoom() as boolean;
      setIsMemberInWorkoutRoom(isMemberInRoom);
      const rooms = await api.getAvailableWorkoutRooms() as WorkoutRoom[];
      setAvailableWorkoutRooms(rooms);

      // 라우터 state에 currentWorkoutRoom이 오면 우선 반영
      const state = location.state as { currentWorkoutRoom?: WorkoutRoomDetail } | null;
      if (state?.currentWorkoutRoom) {
        setCurrentWorkoutRoom(state.currentWorkoutRoom);
        try {
          localStorage.setItem('lastViewedWorkoutRoomId', String(state.currentWorkoutRoom.workoutRoomInfo.id));
        } catch {
          // ignore: storage may be unavailable
        }
      } else if (isMemberInRoom) {
        let restored: WorkoutRoomDetail | null = null;
        try {
          const lastId = localStorage.getItem('lastViewedWorkoutRoomId');
          if (lastId) {
            restored = await api.getWorkoutRoomDetail(Number(lastId)) as WorkoutRoomDetail;
          }
        } catch {
          // ignore: best-effort restore
        }

        if (restored) {
          setCurrentWorkoutRoom(restored);
        } else {
          const currentRoom = await api.getCurrentWorkoutRoom() as WorkoutRoomDetail;
          setCurrentWorkoutRoom(currentRoom);
        }
      }
      setIsLoading(false);
    };

    loadDashboardStats();
  }, [isMemberInWorkoutRoom, location.state]);

  return {
    isLoading,
    isMemberInWorkoutRoom,
    availableWorkoutRooms,
    setAvailableWorkoutRooms,
    currentWorkoutRoom,
    setCurrentWorkoutRoom,
  };
};
