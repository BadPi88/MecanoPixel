import type { ButtonHTMLAttributes } from 'react';

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export function PixelButton({
  variant = 'primary',
  className = '',
  children,
  ...props
}: PixelButtonProps) {
  return (
    <button
      type="button"
      className={`pixel-btn pixel-btn--${variant} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
