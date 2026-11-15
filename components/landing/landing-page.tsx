'use client';

import { MotionConfig } from 'framer-motion';
import { About } from '@/components/landing/about';
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
    <MotionConfig reducedMotion="user">
      <main className="bg-background">
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
        <Footer />
      </main>
    </MotionConfig>
  );
}
