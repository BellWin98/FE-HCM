import { Banknote, Camera, MessageCircle, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type FeatureShowcaseItemConfig = {
  id: string;
  icon: LucideIcon;
  label: string;
  labelClassName: string;
  iconBgClassName: string;
  iconColorClassName: string;
  title: string;
  /** 줄바꿈은 \n으로 구분 */
  description: string;
  mediaSrc: string;
  mediaAlt: string;
  placeholderBg: string;
  imagePosition: 'left' | 'right';
};

export const FEATURE_SHOWCASE_ITEMS: FeatureShowcaseItemConfig[] = [
  {
    id: 'dashboard',
    icon: Users,
    label: '운동방 대시보드',
    labelClassName: 'text-indigo-600',
    iconBgClassName: 'bg-indigo-100',
    iconColorClassName: 'text-indigo-600',
    title: '운동기록을 한눈에 확인해요',
    description:
      '각 멤버별 주간 인증 횟수와 미인증 횟수를 볼 수 있어요.\n운동 횟수를 일일이 카운트하지 않아도, 자동으로 집계돼요.',
    mediaSrc: '/images/features/dashboard.gif',
    mediaAlt: '운동방 대시보드 화면',
    placeholderBg: 'bg-gradient-to-br from-indigo-500 to-violet-600',
    imagePosition: 'left',
  },
  {
    id: 'upload',
    icon: Camera,
    label: '운동 인증',
    labelClassName: 'text-emerald-600',
    iconBgClassName: 'bg-emerald-100',
    iconColorClassName: 'text-emerald-600',
    title: '초간단 운동 인증, 10초면 돼요',
    description:
      '운동 인증샷을 올리면, 그 날의 인증이 바로 반영돼요.\n서로의 운동 인증샷을 확인하고, 자극을 주고 받아보세요.',
    mediaSrc: '/images/features/upload.gif',
    mediaAlt: '운동 인증 업로드 화면',
    placeholderBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    imagePosition: 'right',
  },
  {
    id: 'penalty',
    icon: Banknote,
    label: '벌금 관리',
    labelClassName: 'text-amber-600',
    iconBgClassName: 'bg-amber-100',
    iconColorClassName: 'text-amber-600',
    title: '기간별로 벌금을 한눈에 확인해요',
    description:
      '매주 월요일 자정에 자동으로 벌금이 집계돼고,\n주간 운동 횟수가 초기화돼요.',
    mediaSrc: '/images/features/penalty.gif',
    mediaAlt: '벌금 자동 집계 화면',
    placeholderBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    imagePosition: 'left',
  },
  {
    id: 'chat',
    icon: MessageCircle,
    label: '채팅방',
    labelClassName: 'text-violet-600',
    iconBgClassName: 'bg-violet-100',
    iconColorClassName: 'text-violet-600',
    title: '카톡방을 따로 만들 필요가 없어요',
    description:
      '운동방 멤버와의 소통은 헬창마을 안에서 해결하세요.\n멤버들과 한 곳에서 자유롭게 대화를 나눌 수 있어요.',
    mediaSrc: '/images/features/chat.gif',
    mediaAlt: '운동방 채팅 화면',
    placeholderBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
    imagePosition: 'right',
  },
];
