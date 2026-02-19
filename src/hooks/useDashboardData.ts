import { api } from '@/lib/api';
import { WorkoutRoom, WorkoutRoomDetail } from '@/types';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const useDashboardData = () => {
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(false);
  const [joinedRooms, setJoinedRooms] = useState<WorkoutRoom[]>([]);
  const [availableWorkoutRooms, setAvailableWorkoutRooms] = useState<WorkoutRoom[]>([]);
  const [currentWorkoutRoom, setCurrentWorkoutRoom] = useState<WorkoutRoomDetail | null>(null);

  const isMemberInWorkoutRoom = joinedRooms.length > 0;

  useEffect(() => {
    const loadDashboardStats = async () => {
      setIsLoading(true);
      try {
        const [myRooms, allRooms] = await Promise.all([
          api.getMyJoinedWorkoutRooms() as Promise<WorkoutRoom[]>,
          api.getAvailableWorkoutRooms() as Promise<WorkoutRoom[]>,
        ]);
        setJoinedRooms(myRooms);
        setAvailableWorkoutRooms(allRooms);

        // 라우터 state에 currentWorkoutRoom이 오면 우선 반영
        const state = location.state as { currentWorkoutRoom?: WorkoutRoomDetail } | null;
        if (state?.currentWorkoutRoom) {
          setCurrentWorkoutRoom(state.currentWorkoutRoom);
          try {
            localStorage.setItem('lastViewedWorkoutRoomId', String(state.currentWorkoutRoom.workoutRoomInfo?.id));
          } catch {
            // ignore: storage may be unavailable
          }
        } else if (myRooms.length > 0) {
          let restored: WorkoutRoomDetail | null = null;
          try {
            const lastId = localStorage.getItem('lastViewedWorkoutRoomId');
            if (lastId) {
              const roomId = Number(lastId);
              const isJoined = myRooms.some((r) => r.id === roomId);
              if (isJoined) {
                restored = await api.getWorkoutRoomDetail(roomId) as WorkoutRoomDetail;
              }
            }
          } catch {
            // ignore: best-effort restore
          }

          if (restored) {
            setCurrentWorkoutRoom(restored);
          } else {
            const firstRoomId = myRooms[0].id;
            const detail = await api.getWorkoutRoomDetail(firstRoomId) as WorkoutRoomDetail;
            setCurrentWorkoutRoom(detail);
            try {
              localStorage.setItem('lastViewedWorkoutRoomId', String(firstRoomId));
            } catch {
              // ignore
            }
          }
        }
      } catch {
        setJoinedRooms([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardStats();
  }, [location.state]);

  return {
    isLoading,
    isMemberInWorkoutRoom,
    joinedRooms,
    availableWorkoutRooms,
    setAvailableWorkoutRooms,
    currentWorkoutRoom,
    setCurrentWorkoutRoom,
  };
};
