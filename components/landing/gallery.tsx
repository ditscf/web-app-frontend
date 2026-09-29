'use client';

import { Camera } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { SectionHeader } from '@/components/landing/section-header';
import { cn } from '@/lib/utils';
import { gallery } from '@/lib/site-content';

export function Gallery() {
  return (
    <section className="bg-slate-50 py-24">
      <div className="section-shell">
        <SectionHeader
          center
          eyebrow="Gallery"
          title="Worship, prayer, outreach, conferences, and fellowship life."
        />
        <div className="mt-14 columns-1 gap-5 sm:columns-2 lg:columns-3">
          {gallery.map((item, index) => (
            <motion.figure
              key={item.label}
              className="mb-5 break-inside-avoid overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-royal/5"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: index * 0.05 }}
            >
              <div className={cn('relative', index % 2 === 0 ? 'h-80' : 'h-56')}>
                <Image
                  src={item.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="flex items-center gap-2 p-5 font-black text-navy">
                <Camera size={18} className="text-gold" />
                {item.label}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
