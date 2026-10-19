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
    <section
      id='home'
      className='relative min-h-screen overflow-hidden bg-sidebar text-sidebar-foreground'
    >
      <div className='absolute inset-0'>
        <div className='grid h-full grid-cols-3'>
          {heroImages.map((image, index) => (
            <motion.div
              key={image.src}
              className='bg-cover bg-center'
              style={{ backgroundImage: `url(${image.src})` }}
              initial={{ scale: 1.08, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.4, delay: index * 0.16 }}
            />
          ))}
        </div>
        <div className='absolute inset-0 bg-linear-to-r from-sidebar via-sidebar/82 to-sidebar/30' />
        <div className='absolute inset-0 bg-sidebar/10' />
      </div>

      <div className='mx-auto w-full max-w-6xl px-4 relative flex min-h-screen items-center pt-28'>
        <div className='grid w-full items-end gap-12 lg:grid-cols-[1fr_390px]'>
          <motion.div
            initial='hidden'
            animate='show'
            variants={fadeUp}
            transition={{ duration: 0.8 }}
          >
            <div className='mb-6 inline-flex items-center gap-2 border border-sidebar-foreground/15 bg-sidebar-foreground/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest backdrop-blur-sm'>
              <Sparkles size={14} className='text-sidebar-primary' />
              Dar es Salaam Institute of Technology
            </div>
            <h1 className='max-w-4xl text-5xl font-bold leading-[0.98] tracking-tight md:text-6xl xl:text-7xl'>
              One Family For Gospel.
            </h1>
            <div className='mt-8 flex flex-wrap gap-3'>
              <Button asChild size='lg'>
                <Link href='/auth/signin'>
                  Join Fellowship <ArrowRight size={18} />
                </Link>
              </Button>
              <Button
                asChild
                variant='outline'
                size='lg'
                className='border-sidebar-foreground/25 bg-sidebar-foreground/10 text-sidebar-foreground hover:bg-sidebar-foreground/15 hover:text-sidebar-foreground'
              >
                <a href='#ministries'>Explore Ministries</a>
              </Button>
              <Button
                asChild
                variant='outline'
                size='lg'
                className='border-sidebar-foreground/25 bg-sidebar-foreground/10 text-sidebar-foreground hover:bg-sidebar-foreground/15 hover:text-sidebar-foreground'
              >
                <a href='#events'>Upcoming Events</a>
              </Button>
            </div>
          </motion.div>

          <motion.div
            className='bg-card/80 p-5 text-foreground shadow-lg ring-1 ring-foreground/5 backdrop-blur-xl'
            initial={{ opacity: 0, y: 34 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
          >
            <div className='flex items-center justify-between'>
              <span className='text-xs font-semibold uppercase tracking-widest text-accent'>
                Live Impact
              </span>
              <Badge variant='secondary'>2026</Badge>
            </div>
            <div className='mt-5 grid grid-cols-2 gap-3'>
              {heroStats.map((stat) => (
                <div key={stat.label} className='bg-muted p-4'>
                  <strong className='block text-2xl font-bold text-accent'>
                    <AnimatedNumber value={stat.value} />
                  </strong>
                  <span className='mt-1 block text-xs font-semibold text-muted-foreground'>
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
            <div className='mt-5 bg-sidebar p-4 text-sidebar-foreground'>
              <p className='text-sm text-sidebar-foreground/70'>
                Next gathering
              </p>
              <h3 className='mt-2 text-xl font-bold'>{featuredEvent.title}</h3>
              <div className='mt-4 flex items-center justify-between text-sm'>
                <span>{featuredEvent.schedule}</span>
                <Play size={18} className='text-sidebar-primary' />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
