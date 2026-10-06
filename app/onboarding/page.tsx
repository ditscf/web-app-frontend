import type { Metadata } from 'next';
import { OnboardingForm } from '@/components/onboarding/onboarding-form';

export const metadata: Metadata = {
  title: 'Choose your ministries | DITSCF',
};

export default function OnboardingPage() {
  return <OnboardingForm />;
}
