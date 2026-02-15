import { ReactNode } from 'react';
import { Header } from './Header';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
  /** 'workout' = Deep Black (brand-bg) for workout flow; 'default' = light for stock/admin */
  variant?: 'default' | 'workout';
}

export const Layout = ({ children, variant = 'workout' }: LayoutProps) => {
  const isWorkout = variant === 'workout';
  return (
    <div className={cn('min-h-screen min-h-[100dvh] overflow-x-hidden', isWorkout ? 'bg-brand-bg' : 'bg-gray-50')}>
      <Header />
      <main className="mx-auto w-full max-w-5xl px-4 py-4 sm:py-6 pb-safe">
        {children}
      </main>
    </div>
  );
};