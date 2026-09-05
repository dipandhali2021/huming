'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={1}
    className={cn(
      'flex min-h-[34px] w-full resize-none border-none bg-transparent px-3 py-1.5',
      'text-[15px] leading-[1.5] font-medium tracking-[-0.01em] text-vellum',
      'placeholder:font-normal placeholder:text-ash',
      'focus-visible:ring-0 focus-visible:outline-none',
      'disabled:cursor-not-allowed disabled:opacity-50',
      '[scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
