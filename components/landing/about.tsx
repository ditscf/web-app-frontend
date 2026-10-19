'use client';

import { motion } from 'framer-motion';
import { SectionHeader } from '@/components/landing/section-header';
import { Card } from '@/components/ui/card';
import { aboutImage, pillars } from '@/lib/site-content';

export function About() {
  return (
    <section
      id='about'
      className='mx-auto grid w-full max-w-6xl gap-10 px-4 py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-center'
    >
      <motion.div
        className='relative min-h-[480px] overflow-hidden bg-cover bg-center shadow-lg'
        style={{ backgroundImage: `url(${aboutImage.src})` }}
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className='absolute inset-0 bg-linear-to-t from-sidebar/90 via-sidebar/20 to-transparent' />
        <div className='absolute bottom-6 left-6 right-6 border border-sidebar-foreground/20 bg-sidebar-foreground/10 p-5 shadow-lg backdrop-blur-2xl'>
          <p className='font-bold text-sidebar-foreground'>
            Faith that becomes formation.
          </p>
          <p className='mt-2 text-sm leading-6 text-sidebar-foreground/80'>
            DITSCF exists to help students encounter Christ, grow in the Word,
            discover purpose, and serve with excellence on campus and beyond.
          </p>
        </div>
      </motion.div>
      <div>
        <SectionHeader
          eyebrow='About DITSCF'
          title='A fellowship shaped for spiritual depth and public impact.'
          text='We are a Christ-centered student movement at DIT committed to worship, discipleship, evangelism, leadership development, and community transformation.'
        />
        <div className='mt-10 grid gap-3 sm:grid-cols-2'>
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Card key={pillar.label} className='flex items-center gap-3 p-4'>
                <span className='grid size-11 place-items-center bg-accent/10 text-accent'>
                  <Icon size={20} />
                </span>
                <strong>{pillar.label}</strong>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
