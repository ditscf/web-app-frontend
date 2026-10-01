import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ditscfLogoImage } from '@/lib/site-content';

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-navy text-white navy-grid">
      <div className="absolute inset-0 bg-royal-radial" />
      <div className="section-shell relative flex min-h-screen flex-col py-6">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src={ditscfLogoImage} alt="DITSCF Logo" className="h-10 w-auto object-contain" priority />
            <span>
              <strong className="block text-sm font-black tracking-wide text-gold">DITSCF</strong>
              <small className="hidden text-xs text-white/65 sm:block">One Family For Gospel</small>
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/78 transition hover:text-gold"
          >
            <ArrowLeft size={16} /> Back to home
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center py-10">{children}</div>
      </div>
    </main>
  );
}
