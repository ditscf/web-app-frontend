'use client';

import { ArrowRight, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { SectionHeader } from '@/components/landing/section-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { ministries } from '@/lib/site-content';

const MotionCard = motion.create(Card);

export function Ministries() {
  return (
    <section id="ministries" className="section-shell py-24">
      <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <SectionHeader
          eyebrow="Ministries Showcase"
          title="Every gift has a place to serve."
          text="Teams are built around spiritual discipline, creative excellence, and practical ministry."
        />
        <Button asChild variant="default" size="lg">
          <a href="#contact">
            Find Your Team <ChevronRight size={18} />
          </a>
        </Button>
      </div>
      <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {ministries.map((ministry, index) => (
          <MotionCard
            key={ministry.title}
            className="group overflow-hidden rounded-[2rem] border-slate-200 p-0"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.05 }}
          >
            <div className="relative h-64 overflow-hidden">
              <Image
                src={ministry.image}
                alt=""
                fill
                sizes="(min-width: 1280px) 360px, (min-width: 768px) 50vw, 100vw"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
            </div>
            <div className="p-6">
              <CardTitle className="text-2xl">{ministry.title}</CardTitle>
              <CardDescription className="mt-3">{ministry.description}</CardDescription>
              <div className="mt-5 flex flex-wrap gap-2">
                {ministry.activities.map((activity) => (
                  <Badge key={activity}>{activity}</Badge>
                ))}
              </div>
              <Button variant="ghost" className="mt-5 px-0 text-royal">
                Join Ministry <ArrowRight size={16} />
              </Button>
            </div>
          </MotionCard>
        ))}
      </div>
    </section>
  );
}
