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
        <div className="mx-auto max-w-7xl space-y-2 px-3 py-3 sm:space-y-3 sm:px-4 sm:py-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <button
              type="button"
              onClick={() => setLocation(homeHref)}
              className="flex min-w-0 items-start gap-3 text-left sm:gap-4"
            >
              <img
                src="/logo.png"
                alt="ET영어전문학원 로고"
                className="h-10 w-10 flex-shrink-0 rounded-2xl border object-cover shadow-lg sm:h-14 sm:w-14"
                style={{
                  borderColor: isLightPortal ? "rgba(255, 255, 255, 0.38)" : theme.colors.border.primary,
                  backgroundColor: isLightPortal ? "rgba(255, 255, 255, 0.18)" : undefined,
                }}
              />
              <div className="min-w-0 flex-1">
                <p
                  className="text-[9px] font-semibold uppercase leading-none tracking-[0.22em] sm:text-xs sm:tracking-[0.28em]"
                  style={{ color: isLightPortal ? "rgba(255, 255, 255, 0.84)" : theme.colors.accent.secondary }}
                >
                  ET English Academy
                </p>
                <h1
                  className="mt-1.5 break-keep text-[1.7rem] font-bold leading-[1.04] sm:mt-2 sm:text-4xl"
                  style={{ color: isLightPortal ? "#ffffff" : theme.colors.text.primary }}
                >
                  {title}
                </h1>
                <p
                  className="mt-1.5 max-w-[22rem] text-xs leading-5 sm:mt-3 sm:max-w-[26rem] sm:text-base sm:leading-6"
                  style={{ color: isLightPortal ? "rgba(255, 255, 255, 0.82)" : theme.colors.text.tertiary }}
                >
                  {subtitle}
                </p>
              </div>
            </button>

            <div className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-start gap-2 xl:min-w-[320px] xl:grid-cols-1">
              <div className="flex items-start">
                <div className="scale-90 sm:scale-100">
                  <PortalNotificationBell variant={variant} />
                </div>
              </div>
              <div className="col-span-2 flex min-w-0 items-center gap-2 xl:col-span-1 xl:flex xl:items-center xl:justify-end xl:gap-3">
                <div
                  className="min-w-0 flex-1 rounded-2xl px-3 py-2 text-left xl:flex-none xl:px-4 xl:py-3 xl:text-right"
                  style={{
                    backgroundColor: isLightPortal ? "rgba(255, 255, 255, 0.14)" : "transparent",
                  }}
                >
                  <p
                    className="truncate text-xs font-medium sm:text-sm"
                    style={{ color: isLightPortal ? "#ffffff" : theme.colors.text.primary }}
                  >
                    {user?.name || "사용자"}
                  </p>
                  <p
                    className="truncate text-[11px] sm:text-xs"
                    style={{ color: isLightPortal ? "rgba(255, 255, 255, 0.82)" : theme.colors.text.tertiary }}
                  >
                    {user?.email || "-"}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition-colors sm:text-sm xl:w-auto xl:rounded-lg xl:px-4 xl:py-2"
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
            className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 sm:gap-2 sm:pb-1"
            style={navScrollerStyle}
          >
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => setLocation(item.href)}
                  className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm"
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

      <main className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-8">{children}</main>
      <Footer />
    </div>
  );
}
