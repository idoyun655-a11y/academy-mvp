import React from "react";
import { theme } from "@/styles/design-system";
import { uiThemeVars } from "@/styles/runtime-theme";

function parseStyleString(str: string | undefined) {
  if (!str) return {};
  const style: Record<string, string> = {};
  const declarations = str.split(";").filter((d) => d.trim());
  declarations.forEach((decl) => {
    const [prop, value] = decl.split(":");
    if (prop && value) {
      const camelCase = prop.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      style[camelCase] = value.trim();
    }
  });
  return style;
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "glass";
  padding?: "sm" | "md" | "lg";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", padding = "md", className = "", children, style, ...props }, ref) => {
    const paddingMap = {
      sm: theme.spacing.md,
      md: theme.spacing.lg,
      lg: theme.spacing.xl,
    };

    const variantStyles = {
      default: `
        background-color: ${uiThemeVars.surface};
        border: 1px solid ${uiThemeVars.borderSecondary};
        box-shadow: ${theme.shadows.elevation.sm};
      `,
      elevated: `
        background-color: ${uiThemeVars.surface};
        border: 1px solid ${uiThemeVars.borderPrimary};
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
          ...parseStyleString(variantStyles[variant]),
          padding: paddingMap[padding],
          ...(style as React.CSSProperties),
        } as React.CSSProperties}
        {...(props as any)}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "error" | "warning" | "info";
  size?: "sm" | "md" | "lg";
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", size = "md", className = "", children, style, ...props }, ref) => {
    const variantStyles: Record<string, string> = {
      default: `background-color: ${uiThemeVars.surfaceAlt}; color: ${uiThemeVars.textPrimary}; border: 1px solid ${uiThemeVars.borderPrimary};`,
      success: `background-color: ${theme.colors.status.success}20; color: ${theme.colors.status.success}; border: 1px solid ${theme.colors.status.success}40;`,
      error: `background-color: ${theme.colors.status.error}20; color: ${theme.colors.status.error}; border: 1px solid ${theme.colors.status.error}40;`,
      warning: `background-color: ${theme.colors.status.warning}20; color: ${theme.colors.status.warning}; border: 1px solid ${theme.colors.status.warning}40;`,
      info: `background-color: ${theme.colors.status.info}20; color: ${theme.colors.status.info}; border: 1px solid ${theme.colors.status.info}40;`,
    };

    const sizeMap = {
      sm: `padding: ${theme.spacing.xs} ${theme.spacing.sm}; font-size: 12px;`,
      md: `padding: ${theme.spacing.sm} ${theme.spacing.md}; font-size: 13px;`,
      lg: `padding: ${theme.spacing.md} ${theme.spacing.lg}; font-size: 14px;`,
    };

    return (
      <span
        ref={ref}
        className={`inline-flex items-center rounded-full font-medium whitespace-nowrap ${className}`}
        style={{
          ...parseStyleString(variantStyles[variant]),
          ...parseStyleString(sizeMap[size]),
          ...(style as React.CSSProperties),
        } as React.CSSProperties}
        {...(props as any)}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: "sm" | "md" | "lg";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ size = "md", leftIcon, rightIcon, error, className = "", style, ...props }, ref) => {
    const sizeMap = {
      sm: theme.sizes.input.sm,
      md: theme.sizes.input.md,
      lg: theme.sizes.input.lg,
    };

    const inputSize = sizeMap[size];

    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {leftIcon ? <span className="absolute left-3 text-gray-400">{leftIcon}</span> : null}
          <input
            ref={ref}
            className={`
              w-full rounded-lg transition-all duration-200
              focus:outline-none
              disabled:opacity-50 disabled:cursor-not-allowed
              ${leftIcon ? "pl-10" : ""}
              ${rightIcon ? "pr-10" : ""}
              ${className}
            `}
            style={{
              height: inputSize.height,
              padding: inputSize.padding,
              fontSize: inputSize.fontSize,
              backgroundColor: uiThemeVars.surfaceAlt,
              color: uiThemeVars.textPrimary,
              borderColor: error ? theme.colors.status.error : uiThemeVars.borderSecondary,
              borderWidth: "1px",
              borderStyle: "solid",
              ...(style as React.CSSProperties),
            } as React.CSSProperties}
            {...props}
          />
          {rightIcon ? <span className="absolute right-3 text-gray-400">{rightIcon}</span> : null}
        </div>
        {error ? (
          <p className="mt-1 text-sm" style={{ color: theme.colors.status.error }}>
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";

interface SearchBarProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  onSearch?: (value: string) => void;
  size?: "sm" | "md" | "lg";
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
        placeholder="검색.."
        onChange={handleChange}
        leftIcon="🔍"
        {...(props as any)}
      />
    );
  },
);

SearchBar.displayName = "SearchBar";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: "default" | "success" | "error" | "warning" | "info";
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  color = "default",
}) => {
  const colorMap = {
    default: uiThemeVars.accentPrimary,
    success: uiThemeVars.success,
    error: uiThemeVars.error,
    warning: uiThemeVars.warning,
    info: uiThemeVars.info,
  };

  return (
    <Card variant="elevated" padding="lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: uiThemeVars.textTertiary }}>
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold" style={{ color: colorMap[color] }}>
            {value}
          </p>
        </div>
        {icon ? (
          <div className="text-2xl" style={{ color: colorMap[color] }}>
            {icon}
          </div>
        ) : null}
      </div>
    </Card>
  );
};

interface ListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  avatar?: React.ReactNode;
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
  onClick?: () => void;
}

export const ListItem = React.forwardRef<HTMLDivElement, ListItemProps>(
  ({ avatar, title, subtitle, rightContent, onClick, className = "", style, ...props }, ref) => {
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
          backgroundColor: uiThemeVars.surface,
          borderColor: uiThemeVars.borderSecondary,
          ...(style as React.CSSProperties),
        } as React.CSSProperties}
        {...(props as any)}
      >
        {avatar ? <div className="flex-shrink-0">{avatar}</div> : null}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate" style={{ color: uiThemeVars.textPrimary }}>
            {title}
          </p>
          {subtitle ? (
            <p className="text-sm truncate" style={{ color: uiThemeVars.textTertiary }}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {rightContent ? <div className="flex-shrink-0">{rightContent}</div> : null}
      </div>
    );
  },
);

ListItem.displayName = "ListItem";

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
      {icon ? <div className="text-4xl mb-4">{icon}</div> : null}
      <h3 className="text-lg font-semibold mb-2" style={{ color: uiThemeVars.textPrimary }}>
        {title}
      </h3>
      {description ? (
        <p className="text-sm text-center mb-6" style={{ color: uiThemeVars.textTertiary }}>
          {description}
        </p>
      ) : null}
      {action ? <div>{action}</div> : null}
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
