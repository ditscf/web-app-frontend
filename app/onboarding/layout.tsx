import Image from 'next/image';
import { CurrentActorProvider } from '@/components/auth/current-actor-provider';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { ditscfLogoImage } from '@/lib/site-content';

export default function OnboardingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <CurrentActorProvider>
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-16 max-w-2xl items-center justify-between gap-4 px-4 sm:px-6">
            <Image src={ditscfLogoImage} alt="DITSCF" className="h-9 w-auto object-contain" priority />
            <SignOutButton />
          </div>
        </header>
        <main className="px-4 py-8 sm:px-6 sm:py-12">{children}</main>
      </div>
    </CurrentActorProvider>
  );
}
