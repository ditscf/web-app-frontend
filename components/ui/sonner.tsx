'use client';

import * as React from 'react';
import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert } from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster({ style, toastOptions, ...props }: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="top-center"
      icons={{
        success: <CircleCheck size={18} className="text-royal" />,
        info: <Info size={18} className="text-royal" />,
        warning: <TriangleAlert size={18} className="text-gold" />,
        error: <CircleAlert size={18} className="text-red-600" />,
        loading: <LoaderCircle size={18} className="animate-spin text-royal" />,
      }}
      style={
        {
          fontFamily: 'inherit',
          '--normal-bg': '#ffffff',
          '--normal-text': '#07142F',
          '--normal-border': '#e2e8f0',
          '--border-radius': '1rem',
          ...style,
        } as React.CSSProperties
      }
      toastOptions={{
        ...toastOptions,
        classNames: {
          toast: '!text-sm !shadow-xl !shadow-royal/5',
          title: '!font-bold',
          description: '!text-slate-600',
          ...toastOptions?.classNames,
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
