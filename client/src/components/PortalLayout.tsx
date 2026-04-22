import { useAuth } from "@/_core/hooks/useAuth";
import Footer from "@/components/Footer";
import PortalNotificationBell from "@/components/PortalNotificationBell";
import { theme } from "@/styles/design-system";
import { portalLightThemeVars, uiThemeVars } from "@/styles/runtime-theme";
import { useLocation } from "wouter";

type NavItem = {
  href: string;
  label: string;
};

type PortalLayoutProps = {
  title: string;
  subtitle: string;
  navItems: NavItem[];
  children: React.ReactNode;
  variant?: "default" | "portal-light";
};

export default function PortalLayout({
  title,
  subtitle,
  navItems,
  children,
  variant = "default",
}: PortalLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const isLightPortal = variant === "portal-light";
  const homeHref = user?.role === "parent" ? "/parent" : "/student";

  return (
    <div
      className="min-h-screen"
      style={{
        ...(isLightPortal ? portalLightThemeVars : {}),
        backgroundColor: uiThemeVars.bgPrimary,
        backgroundImage: isLightPortal
          ? "radial-gradient(circle at top left, rgba(37, 99, 235, 0.08), transparent 30%), radial-gradient(circle at top right, rgba(45, 212, 191, 0.12), transparent 28%)"
          : undefined,
      }}
    >
      <header
        className="sticky top-0 z-20 border-b backdrop-blur"
        style={{
          background: isLightPortal
            ? "linear-gradient(135deg, rgba(37, 99, 235, 0.96) 0%, rgba(14, 165, 233, 0.94) 52%, rgba(45, 212, 191, 0.90) 100%)"
            : "rgba(10, 10, 10, 0.92)",
          borderColor: isLightPortal ? "rgba(255, 255, 255, 0.28)" : theme.colors.border.primary,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-5 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <button
              type="button"
              onClick={() => setLocation(homeHref)}
              className="flex items-start gap-4 text-left"
            >
              <img
                src="/logo.png"
                alt="ET영어전문학원 로고"
                className="h-14 w-14 rounded-2xl border object-cover shadow-lg"
                style={{
                  borderColor: isLightPortal ? "rgba(255, 255, 255, 0.38)" : theme.colors.border.primary,
                  backgroundColor: isLightPortal ? "rgba(255, 255, 255, 0.18)" : undefined,
                }}
              />
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-[0.28em]"
                  style={{ color: isLightPortal ? "rgba(255, 255, 255, 0.84)" : theme.colors.accent.secondary }}
                >
                  ET English Academy
                </p>
                <h1
                  className="mt-1 text-3xl font-bold"
                  style={{ color: isLightPortal ? "#ffffff" : theme.colors.text.primary }}
                >
                  {title}
                </h1>
                <p
                  className="mt-2 text-sm"
                  style={{ color: isLightPortal ? "rgba(255, 255, 255, 0.82)" : theme.colors.text.tertiary }}
                >
                  {subtitle}
                </p>
              </div>
            </button>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <PortalNotificationBell variant={variant} />
              <div
                className="rounded-2xl px-4 py-3 text-right"
                style={{
                  backgroundColor: isLightPortal ? "rgba(255, 255, 255, 0.14)" : "transparent",
                }}
              >
                <p
                  className="text-sm font-medium"
                  style={{ color: isLightPortal ? "#ffffff" : theme.colors.text.primary }}
                >
                  {user?.name || "사용자"}
                </p>
                <p
                  className="text-xs"
                  style={{ color: isLightPortal ? "rgba(255, 255, 255, 0.82)" : theme.colors.text.tertiary }}
                >
                  {user?.email || "-"}
                </p>
              </div>
              <button
                onClick={logout}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: isLightPortal ? "#ffffff" : theme.colors.background.tertiary,
                  color: isLightPortal ? "#1d4ed8" : theme.colors.text.primary,
                  border: `1px solid ${isLightPortal ? "rgba(255, 255, 255, 0.24)" : theme.colors.border.primary}`,
                }}
              >
                로그아웃
              </button>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => setLocation(item.href)}
                  className="rounded-full px-4 py-2 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: isActive
                      ? isLightPortal
                        ? "#ffffff"
                        : theme.colors.accent.primary
                      : isLightPortal
                        ? "rgba(255, 255, 255, 0.16)"
                        : theme.colors.background.tertiary,
                    color: isActive
                      ? isLightPortal
                        ? "#1d4ed8"
                        : theme.colors.text.primary
                      : isLightPortal
                        ? "#ffffff"
                        : theme.colors.text.primary,
                    border: `1px solid ${
                      isActive
                        ? isLightPortal
                          ? "#ffffff"
                          : theme.colors.accent.primary
                        : isLightPortal
                          ? "rgba(255, 255, 255, 0.28)"
                          : theme.colors.border.primary
                    }`,
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
      <Footer />
    </div>
  );
}
