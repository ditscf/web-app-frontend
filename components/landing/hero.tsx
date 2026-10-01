'use client';

import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AnimatedNumber } from '@/components/landing/animated-number';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { featuredEvent, heroImages, heroStats } from '@/lib/site-content';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

export function Hero() {
  return (
    <section id="home" className="relative min-h-screen overflow-hidden bg-navy text-white">
      <div className="absolute inset-0">
        <div className="grid h-full grid-cols-3">
          {heroImages.map((image, index) => (
            <motion.div
              key={image.src}
              className="bg-cover bg-center"
              style={{ backgroundImage: `url(${image.src})` }}
              initial={{ scale: 1.08, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.4, delay: index * 0.16 }}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/82 to-royal/30" />
        <div className="absolute inset-0 bg-royal-radial" />
      </div>

      <div className="section-shell relative flex min-h-screen items-center pt-28">
        <div className="grid w-full items-end gap-12 lg:grid-cols-[1fr_390px]">
          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.8 }}>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
              <Sparkles size={16} className="text-gold" />
              Dar es Salaam Institute of Technology
            </div>
            <h1 className="max-w-5xl text-6xl font-black leading-[0.95] tracking-tight md:text-7xl xl:text-8xl">
              One Family For Gospel.
            </h1>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild variant="gold" size="lg">
                <Link href="/auth/signin">
                  Join Fellowship <ArrowRight size={18} />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#ministries">Explore Ministries</a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#events">Upcoming Events</a>
              </Button>
            </div>
          </motion.div>

          <motion.div
            className="glass rounded-[2rem] p-5 text-navy shadow-premium"
            initial={{ opacity: 0, y: 34 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
          >
            <div className="rounded-[1.5rem] bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black uppercase tracking-[0.18em] text-royal">Live Impact</span>
                <Badge variant="soft">2026</Badge>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {heroStats.map((stat) => (
                  <div key={stat.label} className="rounded-3xl bg-slate-50 p-4">
                    <strong className="block text-2xl font-black text-royal">
                      <AnimatedNumber value={stat.value} />
                    </strong>
                    <span className="mt-1 block text-xs font-semibold text-slate-500">{stat.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-3xl bg-navy p-4 text-white">
                <p className="text-sm text-white/70">Next gathering</p>
                <h3 className="mt-2 text-xl font-black">{featuredEvent.title}</h3>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span>{featuredEvent.schedule}</span>
                  <Play size={18} className="text-gold" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
