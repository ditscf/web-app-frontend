import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { BrandLockup } from '@/components/landing/brand-lockup';

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="navy-grid relative min-h-screen overflow-hidden bg-sidebar text-sidebar-foreground">
      <div className="absolute inset-0 bg-brand-radial" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6">
        <header className="flex items-center justify-between gap-4">
          <BrandLockup />
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-sidebar-foreground/80 transition-colors hover:text-sidebar-foreground"
          >
            <ArrowLeft size={16} /> Back to home
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center py-10">{children}</div>
      </div>
    </main>
  );
}
