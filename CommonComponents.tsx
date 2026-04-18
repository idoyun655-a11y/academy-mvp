import React from 'react';
import { theme } from '@/styles/design-system';

// ============================================================================
// Card Component
// ============================================================================

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass';
  padding?: 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', className = '', children, ...props }, ref) => {
    const paddingMap = {
      sm: theme.spacing.md,
      md: theme.spacing.lg,
      lg: theme.spacing.xl,
    };

    const variantStyles = {
      default: `
        background-color: ${theme.colors.background.tertiary};
        border: 1px solid ${theme.colors.border.secondary};
        box-shadow: ${theme.shadows.elevation.sm};
      `,
      elevated: `
        background-color: ${theme.colors.background.tertiary};
        border: 1px solid ${theme.colors.border.primary};
        box-shadow: ${theme.shadows.elevation.lg};
      `,
      glass: `
        background: ${theme.glassmorphism.light.background};
        backdrop-filter: ${theme.glassmorphism.light.backdropFilter};
        border: ${theme.glassmorphism.light.border};
      `,
    };

    return (
      <div
        ref={ref}
        className={`rounded-lg transition-all duration-200 ${className}`}
        style={{
          padding: paddingMap[padding],
        } as React.CSSProperties}
        {...(props as any)}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// ============================================================================
// Badge Component
// ============================================================================

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'md', className = '', children, ...props }, ref) => {
    const variantStyles: Record<string, string> = {
      default: `backgroundColor: ${theme.colors.background.tertiary}; color: ${theme.colors.text.primary}; border: 1px solid ${theme.colors.border.primary};`,
      success: `backgroundColor: ${theme.colors.status.success}20; color: ${theme.colors.status.success}; border: 1px solid ${theme.colors.status.success}40;`,
      error: `backgroundColor: ${theme.colors.status.error}20; color: ${theme.colors.status.error}; border: 1px solid ${theme.colors.status.error}40;`,
      warning: `backgroundColor: ${theme.colors.status.warning}20; color: ${theme.colors.status.warning}; border: 1px solid ${theme.colors.status.warning}40;`,
      info: `backgroundColor: ${theme.colors.status.info}20; color: ${theme.colors.status.info}; border: 1px solid ${theme.colors.status.info}40;`,
    };

    const sizeMap = {
      sm: `padding: ${theme.spacing.xs} ${theme.spacing.sm}; font-size: 12px;`,
      md: `padding: ${theme.spacing.sm} ${theme.spacing.md}; font-size: 13px;`,
      lg: `padding: ${theme.spacing.md} ${theme.spacing.lg}; font-size: 14px;`,
    };

    const variantStyle = variantStyles[variant];
    const sizeStyle = sizeMap[size];
    
    // Parse CSS string to style object
    const parseStyleString = (str: string | undefined) => {
      if (!str) return {};
      const style: Record<string, string> = {};
      const declarations = str.split(';').filter(d => d.trim());
      declarations.forEach(decl => {
        const [prop, value] = decl.split(':');
        if (prop && value) {
          const camelCase = prop.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          style[camelCase] = value.trim();
        }
      });
      return style;
    };

    return (
      <span
        ref={ref}
        className={`inline-flex items-center rounded-full font-medium whitespace-nowrap ${className}`}
        style={{
          ...parseStyleString(variantStyle),
          ...parseStyleString(sizeStyle),
        } as React.CSSProperties}
        {...(props as any)}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// ============================================================================
// Input Component
// ============================================================================

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ size = 'md', leftIcon, rightIcon, error, className = '', ...props }, ref) => {
    const sizeMap = {
      sm: theme.sizes.input.sm,
      md: theme.sizes.input.md,
      lg: theme.sizes.input.lg,
    };

    const inputSize = sizeMap[size];

    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-gray-400">{leftIcon}</span>
          )}
          <input
            ref={ref}
            className={`
              w-full rounded-lg transition-all duration-200
              bg-${theme.colors.background.tertiary}
              text-${theme.colors.text.primary}
              border border-${theme.colors.border.secondary}
              focus:border-${theme.colors.accent.primary}
              focus:outline-none
              placeholder-${theme.colors.text.tertiary}
              disabled:opacity-50 disabled:cursor-not-allowed
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${error ? 'border-red-500' : ''}
              ${className}
            `}
            style={{
              height: inputSize.height,
              padding: inputSize.padding,
              fontSize: inputSize.fontSize,
              backgroundColor: theme.colors.background.tertiary,
              color: theme.colors.text.primary,
              borderColor: error ? theme.colors.status.error : theme.colors.border.secondary,
            } as any}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-gray-400">{rightIcon}</span>
          )}
        </div>
        {error && (
          <p
            className="mt-1 text-sm"
            style={{ color: theme.colors.status.error }}
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ============================================================================
// SearchBar Component
// ============================================================================

interface SearchBarProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  onSearch?: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ onSearch, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearch?.(e.target.value);
      props.onChange?.(e);
    };

    return (
      <Input
        ref={ref}
        type="search"
        placeholder="검색..."
        onChange={handleChange}
        leftIcon="🔍"
        {...(props as any)}
      />
    );
  }
);

SearchBar.displayName = 'SearchBar';

// ============================================================================
// StatCard Component (KPI 카드)
// ============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'default' | 'success' | 'error' | 'warning' | 'info';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  color = 'default',
}) => {
  const colorMap = {
    default: theme.colors.accent.primary,
    success: theme.colors.status.success,
    error: theme.colors.status.error,
    warning: theme.colors.status.warning,
    info: theme.colors.status.info,
  };

  return (
    <Card variant="elevated" padding="lg">
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-sm font-medium"
            style={{ color: theme.colors.text.tertiary }}
          >
            {label}
          </p>
          <p
            className="mt-2 text-3xl font-bold"
            style={{ color: colorMap[color] }}
          >
            {value}
          </p>
        </div>
        {icon && (
          <div
            className="text-2xl"
            style={{ color: colorMap[color] }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

// ============================================================================
// ListItem Component
// ============================================================================

interface ListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  avatar?: React.ReactNode;
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
  onClick?: () => void;
}

export const ListItem = React.forwardRef<HTMLDivElement, ListItemProps>(
  ({ avatar, title, subtitle, rightContent, onClick, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={`
          flex items-center gap-3 p-4 rounded-lg
          border transition-all duration-200 cursor-pointer
          hover:bg-opacity-80 ${className}
        `}
        style={{
          backgroundColor: theme.colors.background.tertiary,
          borderColor: theme.colors.border.secondary,
        } as React.CSSProperties}
        {...(props as any)}
      >
        {avatar && <div className="flex-shrink-0">{avatar}</div>}
        <div className="flex-1 min-w-0">
          <p
            className="font-medium truncate"
            style={{ color: theme.colors.text.primary }}
          >
            {title}
          </p>
          {subtitle && (
            <p
              className="text-sm truncate"
              style={{ color: theme.colors.text.tertiary }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {rightContent && <div className="flex-shrink-0">{rightContent}</div>}
      </div>
    );
  }
);

ListItem.displayName = 'ListItem';

// ============================================================================
// EmptyState Component
// ============================================================================

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {icon && <div className="text-4xl mb-4">{icon}</div>}
      <h3
        className="text-lg font-semibold mb-2"
        style={{ color: theme.colors.text.primary }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="text-sm text-center mb-6"
          style={{ color: theme.colors.text.tertiary }}
        >
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};

export default {
  Card,
  Badge,
  Input,
  SearchBar,
  StatCard,
  ListItem,
  EmptyState,
};
