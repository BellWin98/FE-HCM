import { ReactNode } from 'react';
import { Header } from './Header';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
  variant?: 'default' | 'dark';
}

export const Layout = ({ children, variant = 'default' }: LayoutProps) => {
  const isDark = variant === 'dark';
  return (
    <div className={cn('min-h-screen min-h-[100dvh] overflow-x-hidden', isDark ? 'bg-gray-950' : 'bg-gray-50')}>
      <Header />
      <main className="mx-auto w-full max-w-5xl px-4 py-4 sm:py-6 pb-safe">
        {children}
      </main>
    </div>
  );
};