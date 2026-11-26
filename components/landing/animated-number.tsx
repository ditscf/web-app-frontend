'use client';

import { useInView, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { useEffect, useRef } from 'react';

export function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const shouldReduceMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { duration: 1800, bounce: 0 });
  const formatted = `${value.toLocaleString()}+`;

  useEffect(() => {
    if (!inView) return;
    if (shouldReduceMotion) {
      if (ref.current) ref.current.textContent = formatted;
      return;
    }
    motionValue.set(value);
  }, [formatted, inView, motionValue, shouldReduceMotion, value]);

  useEffect(() => {
    if (shouldReduceMotion) return;
    return spring.on('change', (latest) => {
      if (ref.current) ref.current.textContent = `${Math.round(latest).toLocaleString()}+`;
    });
  }, [shouldReduceMotion, spring]);

  return <span ref={ref}>{shouldReduceMotion ? formatted : '0+'}</span>;
}
