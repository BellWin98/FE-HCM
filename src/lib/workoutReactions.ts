import type { ReactionEmojiCode } from '@/types';

/**
 * 리액션 이모지 카탈로그.
 *
 * 서버(ReactionEmoji enum)와 목록·순서를 맞춘다. 서버는 리액션이 하나라도 달린 이모지만
 * 내려주므로, 아직 아무도 누르지 않은 이모지까지 보여주는 피커는 이 목록을 기준으로 그린다.
 */
export const REACTION_EMOJIS: ReadonlyArray<{
  code: ReactionEmojiCode;
  symbol: string;
  label: string;
}> = [
  { code: 'MUSCLE', symbol: '💪', label: '근성' },
  { code: 'FIRE', symbol: '🔥', label: '불타오르네' },
  { code: 'CLAP', symbol: '👏', label: '박수' },
  { code: 'THUMBS_UP', symbol: '👍', label: '좋아요' },
  { code: 'PARTY', symbol: '🎉', label: '축하' },
];

export const findReactionEmoji = (code: ReactionEmojiCode) =>
  REACTION_EMOJIS.find((emoji) => emoji.code === code);
