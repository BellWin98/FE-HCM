import { ReactNode } from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto w-full max-w-5xl px-4 py-4 sm:py-6">
        {children}
      </main>
    </div>
  );
};