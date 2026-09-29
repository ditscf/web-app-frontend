'use client';

import { About } from '@/components/landing/about';
import { Contact } from '@/components/landing/contact';
import { Events } from '@/components/landing/events';
import { Footer } from '@/components/landing/footer';
import { Gallery } from '@/components/landing/gallery';
import { Header } from '@/components/landing/header';
import { Hero } from '@/components/landing/hero';
import { Impact } from '@/components/landing/impact';
import { Leadership } from '@/components/landing/leadership';
import { Ministries } from '@/components/landing/ministries';
import { DigitalPlatform } from '@/components/landing/platform';
import { Testimonials } from '@/components/landing/testimonials';
import { Values } from '@/components/landing/values';

export function LandingPage() {
  return (
    <main className="bg-white">
      <Header />
      <Hero />
      <About />
      <Values />
      <Ministries />
      <Events />
      <Impact />
      <Testimonials />
      <DigitalPlatform />
      <Leadership />
      <Gallery />
      <Contact />
      <Footer />
    </main>
  );
}
