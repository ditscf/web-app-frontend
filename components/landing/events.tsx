'use client';

import { ArrowRight, CalendarDays } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { SectionHeader } from '@/components/landing/section-header';
import { Badge } from '@/components/ui/badge';
import { events, featuredEvent, gallery } from '@/lib/site-content';

const marqueeItems = [...gallery, ...gallery];

export function Events() {
  return (
    <section
      id='events'
      className='overflow-hidden bg-sidebar py-20 text-sidebar-foreground'
    >
      <div className='mx-auto w-full max-w-6xl px-4'>
        <SectionHeader
          tone='dark'
          eyebrow='Events & Programs'
          title='Moments that become spiritual milestones.'
          text='From worship nights to outreach missions, DITSCF programs are designed to form believers and impact communities.'
        />
        <div className='mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
          <div className='relative min-h-[520px] overflow-hidden shadow-lg'>
            <Image
              src={featuredEvent.image}
              alt=''
              fill
              sizes='(min-width: 1024px) 640px, 100vw'
              className='object-cover'
            />
            <div className='absolute inset-0 bg-linear-to-t from-sidebar via-sidebar/42 to-transparent' />
            <div className='absolute bottom-0 left-0 right-0 p-8'>
              <Badge className='bg-primary px-2 py-0.5 text-primary-foreground'>
                Featured Event
              </Badge>
              <h3 className='mt-4 text-3xl font-bold leading-tight'>{featuredEvent.title}</h3>
              <p className='mt-4 max-w-xl leading-7 text-sidebar-foreground/72'>
                {featuredEvent.description}
              </p>
            </div>
          </div>
          <div className='grid gap-4'>
            {events.map((event, index) => (
              <motion.div
                key={event}
                className='flex items-center justify-between border border-sidebar-foreground/10 bg-sidebar-foreground/8 p-5 backdrop-blur-sm'
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.04 }}
              >
                <div className='flex items-center gap-4'>
                  <span className='grid size-12 place-items-center bg-sidebar-primary/20 text-sidebar-primary'>
                    <CalendarDays size={20} />
                  </span>
                  <strong>{event}</strong>
                </div>
                <ArrowRight size={18} className='text-sidebar-primary' />
              </motion.div>
            ))}
          </div>
        </div>
        <div className='mask-fade mt-16 overflow-hidden'>
          <div className='flex w-max animate-marquee gap-4'>
            {marqueeItems.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                className='relative h-40 w-64 overflow-hidden'
              >
                <Image
                  src={item.image}
                  alt={item.label}
                  fill
                  sizes='256px'
                  className='object-cover'
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
