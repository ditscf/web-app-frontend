import type { Metadata } from 'next';
import { OfferingsPage } from '@/components/offerings/offerings-page';

export const metadata: Metadata = {
  title: 'Offerings | DITSCF',
};

export default function OfferingsRoute() {
  return <OfferingsPage />;
}
