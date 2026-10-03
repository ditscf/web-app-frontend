import { CurrentActorProvider } from '@/components/auth/current-actor-provider';
import { Sidebar } from '@/components/dashboard/sidebar';

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <CurrentActorProvider>
      <Sidebar>
        {children}
      </Sidebar>
    </CurrentActorProvider>
  );
}
