import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AdminStateVariant = 'loading' | 'error' | 'empty' | 'info';

interface AdminStateBlockProps {
  variant?: AdminStateVariant;
  title?: ReactNode;
  description?: ReactNode;
  /**
   * Optional extra content (e.g. tips) shown under description,
   * but above the action button.
   */
  children?: ReactNode;
  /**
   * When provided, renders a primary action button.
   */
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export const AdminStateBlock = ({
  variant = 'info',
  title,
  description,
  children,
  onAction,
  actionLabel,
  className,
}: AdminStateBlockProps) => {
  const finalTitle =
    title ??
    (variant === 'error'
      ? '정보를 불러오지 못했습니다.'
      : variant === 'empty'
      ? '데이터가 없습니다.'
      : null);

  const finalDescription =
    description ??
    (variant === 'loading'
      ? '불러오는 중...'
      : variant === 'error'
      ? '잠시 후 다시 시도해주세요.'
      : null);

  return (
    <div
      className={cn(
        'rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground md:p-8 md:text-base',
        className,
      )}
    >
      {finalTitle ? <div className="font-medium text-foreground">{finalTitle}</div> : null}
      {finalDescription ? <div className={cn(finalTitle && 'mt-1')}>{finalDescription}</div> : null}
      {children}
      {onAction ? (
        <div className="mt-4">
          <Button variant="outline" className="w-full sm:w-auto" type="button" onClick={onAction}>
            {actionLabel ?? '다시 시도'}
          </Button>
        </div>
      ) : null}
    </div>
  );
};

