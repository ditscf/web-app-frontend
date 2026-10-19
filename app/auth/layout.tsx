import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ditscfLogoImage } from '@/lib/site-content';

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="navy-grid relative min-h-screen overflow-hidden bg-sidebar text-sidebar-foreground">
      <div className="absolute inset-0 bg-brand-radial" />
      <div className="mx-auto w-full max-w-6xl px-4 relative flex min-h-screen flex-col py-6">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src={ditscfLogoImage} alt="DITSCF Logo" className="h-10 w-auto object-contain" priority />
            <span>
              <strong className="block text-sm font-bold tracking-wide text-sidebar-primary">DITSCF</strong>
              <small className="hidden text-xs text-sidebar-foreground/65 sm:block">One Family For Gospel</small>
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-sidebar-foreground/78 transition hover:text-sidebar-foreground"
          >
            <ArrowLeft size={16} /> Back to home
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center py-10">{children}</div>
      </div>
    </main>
  );
}
