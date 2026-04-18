import { useAuth } from "@/_core/hooks/useAuth";
import Footer from "@/components/Footer";
import { theme } from "@/styles/design-system";
import { useLocation } from "wouter";

type NavItem = {
  href: string;
  label: string;
};

export default function PortalLayout({
  title,
  subtitle,
  navItems,
  children,
}: {
  title: string;
  subtitle: string;
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: theme.colors.background.primary }}
    >
      <header
        className="border-b sticky top-0 z-20 backdrop-blur"
        style={{
          backgroundColor: "rgba(10, 10, 10, 0.92)",
          borderColor: theme.colors.border.primary,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-5 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="flex items-start gap-4">
              <img
                  src="/logo.svg"
                alt="ET영어전문학원 로고"
                className="h-14 w-14 rounded-2xl border object-cover shadow-lg"
                style={{ borderColor: theme.colors.border.primary }}
              />
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-[0.28em]"
                  style={{ color: theme.colors.accent.secondary }}
                >
                  ET English Academy
                </p>
                <h1
                  className="text-3xl font-bold mt-1"
                  style={{ color: theme.colors.text.primary }}
                >
                  {title}
                </h1>
                <p
                  className="text-sm mt-2"
                  style={{ color: theme.colors.text.tertiary }}
                >
                  {subtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p
                  className="text-sm font-medium"
                  style={{ color: theme.colors.text.primary }}
                >
                  {user?.name || "사용자"}
                </p>
                <p
                  className="text-xs"
                  style={{ color: theme.colors.text.tertiary }}
                >
                  {user?.email || "-"}
                </p>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: theme.colors.background.tertiary,
                  color: theme.colors.text.primary,
                  border: `1px solid ${theme.colors.border.primary}`,
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
                  className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: isActive
                      ? theme.colors.accent.primary
                      : theme.colors.background.tertiary,
                    color: theme.colors.text.primary,
                    border: `1px solid ${
                      isActive
                        ? theme.colors.accent.primary
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
