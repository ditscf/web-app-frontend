'use client';

import { MessageCircleHeart } from 'lucide-react';
import { SectionHeader } from '@/components/landing/section-header';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { testimonials } from '@/lib/site-content';

export function Testimonials() {
  return (
    <section className='bg-muted py-24'>
      <div className='mx-auto w-full max-w-6xl px-4'>
        <SectionHeader
          center
          eyebrow='Testimonials'
          title='Stories from students and associates.'
        />
        <div className='mt-14 grid gap-5 lg:grid-cols-3'>
          {testimonials.map((item) => (
            <Card key={item.name} className='p-7'>
              <span className='grid size-12 place-items-center bg-primary/20 text-primary'>
                <MessageCircleHeart size={22} />
              </span>
              <p className='mt-6 text-lg leading-8 text-foreground'>
                “{item.quote}”
              </p>
              <Separator className='mt-7' />
              <div className='pt-5'>
                <strong className='block text-foreground'>{item.name}</strong>
                <span className='text-sm font-semibold text-muted-foreground'>
                  {item.role}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
