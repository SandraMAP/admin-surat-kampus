import { ReactNode } from 'react';
import { Header } from './Header';
import { MobileNav } from './MobileNav';

interface StudentLayoutProps {
  children: ReactNode;
}

export function StudentLayout({ children }: StudentLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pb-20 md:pb-8">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
