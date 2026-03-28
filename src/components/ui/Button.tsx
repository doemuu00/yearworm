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
    'bg-[#00d4aa] text-[#0a0e1a] font-bold hover:bg-[#00e4b8] active:bg-[#00c09a] shadow-lg shadow-[#00d4aa]/20',
  secondary:
    'bg-[#8b5cf6] text-white font-semibold hover:bg-[#9d6ff8] active:bg-[#7c4fe0] shadow-lg shadow-[#8b5cf6]/20',
  outline:
    'border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/30 active:bg-white/15',
  ghost:
    'text-white/70 hover:text-white hover:bg-white/5 active:bg-white/10',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm gap-2',
  md: 'px-6 py-3 text-base gap-2',
  lg: 'px-8 py-4 text-lg gap-3',
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
