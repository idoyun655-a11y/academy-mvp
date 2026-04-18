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
    const variantStyles = {
      primary: `
        background-color: ${theme.colors.accent.primary};
        color: ${theme.colors.text.primary};
        border: none;
        &:hover:not(:disabled) {
          background-color: ${theme.colors.accent.secondary};
          box-shadow: ${theme.shadows.interactive.hover};
        }
        &:active:not(:disabled) {
          box-shadow: ${theme.shadows.interactive.active};
        }
      `,
      secondary: `
        background-color: ${theme.colors.background.tertiary};
        color: ${theme.colors.text.primary};
        border: 1px solid ${theme.colors.border.primary};
        &:hover:not(:disabled) {
          background-color: ${theme.colors.border.primary};
        }
      `,
      tertiary: `
        background-color: transparent;
        color: ${theme.colors.accent.primary};
        border: none;
        &:hover:not(:disabled) {
          background-color: ${theme.colors.background.tertiary};
        }
      `,
      danger: `
        background-color: ${theme.colors.status.error};
        color: ${theme.colors.text.primary};
        border: none;
        &:hover:not(:disabled) {
          opacity: 0.9;
        }
      `,
      success: `
        background-color: ${theme.colors.status.success};
        color: ${theme.colors.text.primary};
        border: none;
        &:hover:not(:disabled) {
          opacity: 0.9;
        }
      `,
      ghost: `
        background-color: transparent;
        color: ${theme.colors.text.primary};
        border: none;
        &:hover:not(:disabled) {
          background-color: ${theme.colors.background.tertiary};
        }
      `,
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
