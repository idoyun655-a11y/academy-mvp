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
  const navScrollerStyle = { scrollbarWidth: "none" } as const;

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
        <div className="mx-auto max-w-7xl space-y-3 px-3 py-4 sm:px-4 sm:py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <button
              type="button"
              onClick={() => setLocation(homeHref)}
              className="flex min-w-0 items-start gap-3 text-left sm:gap-4"
            >
              <img
                src="/logo.png"
                alt="ET영어전문학원 로고"
                className="h-14 w-14 flex-shrink-0 rounded-2xl border object-cover shadow-lg"
                style={{
                  borderColor: isLightPortal ? "rgba(255, 255, 255, 0.38)" : theme.colors.border.primary,
                  backgroundColor: isLightPortal ? "rgba(255, 255, 255, 0.18)" : undefined,
                }}
              />
              <div className="min-w-0 flex-1">
                <p
                  className="text-[10px] font-semibold uppercase leading-none tracking-[0.24em] sm:text-xs sm:tracking-[0.28em]"
                  style={{ color: isLightPortal ? "rgba(255, 255, 255, 0.84)" : theme.colors.accent.secondary }}
                >
                  ET English Academy
                </p>
                <h1
                  className="mt-2 break-keep text-[2.05rem] font-bold leading-[1.02] sm:text-4xl"
                  style={{ color: isLightPortal ? "#ffffff" : theme.colors.text.primary }}
                >
                  {title}
                </h1>
                <p
                  className="mt-3 max-w-[26rem] text-sm leading-6 sm:text-base"
                  style={{ color: isLightPortal ? "rgba(255, 255, 255, 0.82)" : theme.colors.text.tertiary }}
                >
                  {subtitle}
                </p>
              </div>
            </button>

            <div className="grid grid-cols-[56px_minmax(0,1fr)] gap-3 xl:min-w-[320px] xl:grid-cols-1">
              <div className="flex items-start xl:hidden">
                <PortalNotificationBell variant={variant} />
              </div>
              <div className="min-w-0 space-y-2 xl:flex xl:items-center xl:justify-end xl:gap-3 xl:space-y-0">
                <div className="hidden xl:block">
                  <PortalNotificationBell variant={variant} />
                </div>
                <div
                  className="min-w-0 rounded-2xl px-4 py-3 text-left xl:text-right"
                  style={{
                    backgroundColor: isLightPortal ? "rgba(255, 255, 255, 0.14)" : "transparent",
                  }}
                >
                  <p
                    className="truncate text-sm font-medium"
                    style={{ color: isLightPortal ? "#ffffff" : theme.colors.text.primary }}
                  >
                    {user?.name || "사용자"}
                  </p>
                  <p
                    className="truncate text-xs"
                    style={{ color: isLightPortal ? "rgba(255, 255, 255, 0.82)" : theme.colors.text.tertiary }}
                  >
                    {user?.email || "-"}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="w-full rounded-xl px-4 py-3 text-sm font-semibold transition-colors xl:w-auto xl:rounded-lg xl:px-4 xl:py-2"
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
          </div>

          <nav
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
            style={navScrollerStyle}
          >
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => setLocation(item.href)}
                  className="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors"
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

      <main className="mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-8">{children}</main>
      <Footer />
    </div>
  );
}
