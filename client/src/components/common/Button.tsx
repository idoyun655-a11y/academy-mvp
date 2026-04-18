import React from 'react';
import { theme } from '@/styles/design-system';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isFullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isFullWidth = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const variantStyles: Record<string, React.CSSProperties> = {
      primary: {
        backgroundColor: theme.colors.accent.primary,
        color: theme.colors.text.primary,
        border: 'none',
      },
      secondary: {
        backgroundColor: theme.colors.background.tertiary,
        color: theme.colors.text.primary,
        border: `1px solid ${theme.colors.border.primary}`,
      },
      tertiary: {
        backgroundColor: 'transparent',
        color: theme.colors.accent.primary,
        border: 'none',
      },
      danger: {
        backgroundColor: theme.colors.status.error,
        color: theme.colors.text.primary,
        border: 'none',
      },
      success: {
        backgroundColor: theme.colors.status.success,
        color: theme.colors.text.primary,
        border: 'none',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: theme.colors.text.primary,
        border: 'none',
      },
    };

    const sizeStyles = {
      xs: theme.sizes.button.xs,
      sm: theme.sizes.button.sm,
      md: theme.sizes.button.md,
      lg: theme.sizes.button.lg,
    };

    const buttonSize = sizeStyles[size];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center justify-center gap-2
          rounded-lg font-medium transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isFullWidth ? 'w-full' : ''}
          ${className}
        `}
        style={{
          ...variantStyles[variant],
          height: buttonSize.height,
          padding: buttonSize.padding,
          fontSize: buttonSize.fontSize,
        } as React.CSSProperties}
        {...(props as any)}
      >
        {isLoading && <span className="animate-spin">⏳</span>}
        {!isLoading && leftIcon && <span>{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span>{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
