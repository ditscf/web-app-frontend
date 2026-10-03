import { CurrentActorProvider } from '@/components/auth/current-actor-provider';
import { Sidebar } from '@/components/dashboard/sidebar';
import { RequireOnboardingComplete } from '@/components/onboarding/require-onboarding-complete';

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <CurrentActorProvider>
      <RequireOnboardingComplete>
        <Sidebar>
          {children}
        </Sidebar>
      </RequireOnboardingComplete>
    </CurrentActorProvider>
  );
}
