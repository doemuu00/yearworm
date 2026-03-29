'use client';

import { type ButtonHTMLAttributes, forwardRef } from 'react';
import LoadingSpinner from './LoadingSpinner';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-primary to-on-primary-container text-on-primary font-headline font-bold shadow-[0_12px_32px_rgba(40,223,181,0.25)] hover:brightness-110 active:brightness-95',
  secondary:
    'bg-surface-bright/20 backdrop-blur-md text-on-surface border border-outline-variant/20 font-headline font-bold hover:bg-surface-bright/30 active:bg-surface-bright/40',
  outline:
    'border-2 border-white/20 text-white font-headline font-bold hover:bg-white/10 hover:border-white/30 active:bg-white/15',
  ghost:
    'text-white/70 font-headline font-bold hover:text-white hover:bg-white/5 active:bg-white/10',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm gap-2',
  md: 'px-6 py-3 text-base gap-2',
  lg: 'px-8 h-16 text-lg gap-3',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      disabled,
      children,
      className = '',
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          'inline-flex items-center justify-center rounded-xl transition-all duration-200 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4aa]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e1a]',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth ? 'w-full' : '',
          className,
        ].join(' ')}
        {...props}
      >
        {loading && (
          <LoadingSpinner
            size={size === 'lg' ? 'md' : 'sm'}
            className={
              variant === 'primary'
                ? '!border-[#0a0e1a]/30 !border-t-[#0a0e1a]'
                : ''
            }
          />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
