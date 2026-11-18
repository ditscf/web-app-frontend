import type { Metadata } from 'next';
import { YearClosurePage } from '@/components/year-closure/year-closure-page';

export const metadata: Metadata = {
  title: 'Year closure | DITSCF',
};

export default function YearClosureRoute() {
  return <YearClosurePage />;
}
