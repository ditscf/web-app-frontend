'use client';

import { Mail, MapPin, MessageCircleHeart, Send } from 'lucide-react';
import type { FormEvent } from 'react';
import { SectionHeader } from '@/components/landing/section-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { contactFields, socialLinks } from '@/lib/site-content';

export function Contact() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <section id="contact" className="section-shell grid gap-10 py-24 lg:grid-cols-[0.85fr_1.15fr]">
      <div>
        <SectionHeader
          eyebrow="Contact & Prayer"
          title="Connect, join, serve, or send a prayer request."
          text="Whether you are a new student, current member, alumni, or ministry partner, DITSCF is ready to walk with you."
        />
        <div className="mt-8 space-y-4">
          <p className="flex items-center gap-3 font-semibold text-slate-700">
            <MapPin className="text-royal" /> DIT Main Campus, Dar es Salaam, Tanzania
          </p>
          <p className="flex items-center gap-3 font-semibold text-slate-700">
            <Mail className="text-royal" /> info@ditscf.or.tz
          </p>
          <div className="flex gap-3 pt-3">
            {socialLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Button key={link.label} variant="light" size="icon" type="button" aria-label={link.label}>
                  <Icon size={18} />
                </Button>
              );
            })}
          </div>
        </div>
      </div>
      <Card className="rounded-[2rem] p-5 md:p-7">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            {contactFields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>{field.label}</Label>
                <Input id={field.id} name={field.id} type={field.type ?? 'text'} autoComplete={field.autoComplete} />
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="message">How can we help?</Label>
            <Textarea id="message" name="message" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button variant="default" size="lg" type="submit">
              Submit Contact Form <Send size={18} />
            </Button>
            <Button variant="gold" size="lg" type="button">
              Send Prayer Request <MessageCircleHeart size={18} />
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}
