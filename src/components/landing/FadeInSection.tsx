import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

type FadeInSectionProps = {
  children: React.ReactNode;
};

/** useInView 기반 페이드인 (주석 섹션/고객 후기 등 재사용 가능) */
export const FadeInSection = ({ children }: FadeInSectionProps) => {
  const { ref, isInView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      )}
    >
      {children}
    </div>
  );
};
