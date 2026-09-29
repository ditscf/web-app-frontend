'use client';

import { motion } from 'framer-motion';
import { SectionHeader } from '@/components/landing/section-header';
import { Card } from '@/components/ui/card';
import { aboutImage, pillars } from '@/lib/site-content';

export function About() {
  return (
    <section id="about" className="section-shell grid gap-12 py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <motion.div
        className="relative min-h-[560px] overflow-hidden rounded-[2rem] bg-cover bg-center shadow-premium"
        style={{ backgroundImage: `url(${aboutImage.src})` }}
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/20 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 rounded-[1.5rem] bg-white/92 p-5 backdrop-blur">
          <p className="font-black text-navy">Faith that becomes formation.</p>
          <p className="mt-2 text-sm leading-6 text-navy">
            DITSCF exists to help students encounter Christ, grow in the Word, discover purpose, and serve
            with excellence on campus and beyond.
          </p>
        </div>
      </motion.div>
      <div>
        <SectionHeader
          eyebrow="About DITSCF"
          title="A fellowship shaped for spiritual depth and public impact."
          text="We are a Christ-centered student movement at DIT committed to worship, discipleship, evangelism, leadership development, and community transformation."
        />
        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Card key={pillar.label} className="flex items-center gap-3 rounded-3xl p-4">
                <span className="grid size-11 place-items-center rounded-2xl bg-royal/10 text-royal">
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
