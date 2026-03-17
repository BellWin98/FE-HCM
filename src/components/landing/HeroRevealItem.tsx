import { HERO_REVEAL_DURATION } from './constants';

type HeroRevealItemProps = {
  children: React.ReactNode;
  delay?: number;
  revealed: boolean;
};

export const HeroRevealItem = ({
  children,
  delay = 0,
  revealed,
}: HeroRevealItemProps) => (
  <div
    className="transition-all ease-out"
    style={{
      transitionDuration: `${HERO_REVEAL_DURATION}ms`,
      transitionDelay: revealed ? `${delay}ms` : '0ms',
      opacity: revealed ? 1 : 0,
      transform: revealed ? 'translateY(0)' : 'translateY(1rem)',
    }}
  >
    {children}
  </div>
);
