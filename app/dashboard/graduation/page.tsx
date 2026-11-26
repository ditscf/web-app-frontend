import type { Metadata } from 'next';
import { GraduationPage } from '@/components/graduation/graduation-page';

export const metadata: Metadata = {
  title: 'Graduation | DITSCF',
};

export default function GraduationRoute() {
  return <GraduationPage />;
}
