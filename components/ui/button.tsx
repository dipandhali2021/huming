'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'solid' | 'outline' | 'ghost' | 'accent';
type Size = 'sm' | 'md' | 'lg' | 'icon' | 'iconLg';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variants: Record<Variant, string> = {
  solid: 'bg-vellum text-abyss hover:bg-white active:bg-white/90',
  accent:
    'bg-vellum text-abyss hover:bg-white active:bg-white/90 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.9)]',
  outline:
    'border border-white/14 bg-white/4 text-vellum hover:border-white/28 hover:bg-white/8',
  ghost: 'text-mist hover:bg-white/8 hover:text-vellum',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-2.5 text-[12px]',
  md: 'h-10 gap-2 rounded-xl px-4 text-[13px]',
  lg: 'h-12 gap-2 rounded-xl px-6 text-[14px]',
  icon: 'size-8 rounded-full',
  iconLg: 'size-10 rounded-full',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'solid', size = 'md', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-semibold tracking-tight',
        'transition-[background-color,border-color,color,filter,transform] duration-150',
        'disabled:pointer-events-none disabled:opacity-40',
        'active:scale-[0.97]',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
