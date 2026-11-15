'use client';

import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AnimatedNumber } from '@/components/landing/animated-number';
import { Button } from '@/components/ui/button';
import { featuredEvent, heroImages, heroStats } from '@/lib/site-content';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

export function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-[100svh] overflow-hidden bg-sidebar text-sidebar-foreground"
    >
      <div className="absolute inset-0">
        <div className="grid h-full grid-cols-1 sm:grid-cols-3">
          {heroImages.map((image, index) => (
            <motion.div
              key={image.src}
              className={index === 0 ? 'bg-cover bg-center' : 'hidden bg-cover bg-center sm:block'}
              style={{ backgroundImage: `url(${image.src})` }}
              initial={{ scale: 1.08, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.4, delay: index * 0.16 }}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-linear-to-r from-sidebar via-sidebar/88 to-sidebar/35" />
      </div>

      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-6xl items-center px-4 pt-28 pb-16">
        <div className="grid w-full items-end gap-10 lg:grid-cols-[1fr_22rem]">
          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.8 }}>
            <div className="mb-6 inline-flex items-center gap-2 border border-sidebar-foreground/15 bg-sidebar-foreground/10 px-3 py-1.5 text-xs font-semibold tracking-widest uppercase backdrop-blur-sm">
              <Sparkles size={14} className="text-sidebar-primary" />
              Dar es Salaam Institute of Technology
            </div>
            <h1 className="max-w-4xl text-5xl leading-[0.98] font-bold tracking-tight md:text-6xl xl:text-7xl">
              One Family For Gospel.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-sidebar-foreground/75">
              Worship, discipleship, outreach, and leadership for students at the Dar es Salaam
              Institute of Technology.
            </p>
            <div className="mt-8 flex flex-col items-start gap-4">
              <Button asChild size="lg">
                <Link href="/auth/signin">
                  Join Fellowship <ArrowRight size={18} />
                </Link>
              </Button>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
                <a
                  href="#ministries"
                  className="text-sidebar-foreground/80 underline-offset-4 hover:text-sidebar-foreground hover:underline"
                >
                  Explore Ministries
                </a>
                <a
                  href="#events"
                  className="text-sidebar-foreground/80 underline-offset-4 hover:text-sidebar-foreground hover:underline"
                >
                  Upcoming Events
                </a>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-card/92 p-5 text-foreground shadow-overlay ring-1 ring-foreground/5 backdrop-blur-md"
            initial={{ opacity: 0, y: 34 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
          >
            <p className="text-xs font-semibold tracking-widest text-accent uppercase">This year</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {heroStats.map((stat) => (
                <div key={stat.label} className="bg-muted p-4">
                  <strong className="block text-2xl font-bold text-accent">
                    <AnimatedNumber value={stat.value} />
                  </strong>
                  <span className="mt-1 block text-xs font-semibold text-muted-foreground">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-5 bg-sidebar p-4 text-sidebar-foreground">
              <p className="text-sm text-sidebar-foreground/70">Next gathering</p>
              <h2 className="mt-2 text-xl font-bold">{featuredEvent.title}</h2>
              <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                <span>{featuredEvent.schedule}</span>
                <Play size={18} className="shrink-0 text-sidebar-primary" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
