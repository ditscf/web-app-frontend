'use client';

import { BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { SectionHeader } from '@/components/landing/section-header';
import { Badge } from '@/components/ui/badge';
import { attendanceBars, platformFeatures } from '@/lib/site-content';

export function DigitalPlatform() {
  return (
    <section id="platform" className="relative overflow-hidden bg-navy py-24 text-white navy-grid">
      <div className="absolute inset-0 bg-royal-radial" />
      <div className="section-shell relative grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <SectionHeader
            tone="dark"
            eyebrow="Digital Transformation"
            title="Introducing the future DITSCF Management Platform."
            text="A modern operational system for members, leaders, ministries, events, attendance, communication, and reporting."
          />
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {platformFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.label}
                  className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur"
                >
                  <Icon size={20} className="text-gold" />
                  <strong>{feature.label}</strong>
                </div>
              );
            })}
          </div>
        </div>
        <motion.div
          className="rounded-[2rem] border border-white/10 bg-white/10 p-4 shadow-premium backdrop-blur"
          initial={{ opacity: 0, y: 30, rotateX: 8 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="rounded-[1.5rem] bg-white p-5 text-navy">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <strong>DITSCF Command Center</strong>
              <Badge variant="live">Live</Badge>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-[0.7fr_1.3fr]">
              <div className="space-y-3">
                {platformFeatures.slice(0, 4).map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.label} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                      <Icon size={17} className="text-royal" />
                      <span className="text-xs font-bold">{feature.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-sm font-black text-slate-500">Attendance Overview</span>
                  <BarChart3 size={18} className="text-royal" />
                </div>
                <div className="flex h-44 items-end gap-3">
                  {attendanceBars.map((height, index) => (
                    <div
                      key={height + index}
                      className="flex-1 rounded-t-2xl bg-royal"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
