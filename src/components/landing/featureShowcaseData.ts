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
    title: '운동기록을 확인해요',
    description:
      '친구들의 운동 기록을 한눈에 볼 수 있어요.',
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
      '친구들의 운동 인증샷을 확인하고,\n서로 동기부여를 주고 받아보세요.',
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
    title: '기간별로 벌금을 확인해요',
    description:
      '벌금제 운동방은 매주 월요일에 자동으로 벌금이 집계돼요.',
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
      '친구들과 헬창마을에서 대화를 나눌 수 있어요.',
    mediaSrc: '/images/features/chat.gif',
    mediaAlt: '운동방 채팅 화면',
    placeholderBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
    imagePosition: 'right',
  },
];
