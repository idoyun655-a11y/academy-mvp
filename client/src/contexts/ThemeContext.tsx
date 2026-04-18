import React from "react";

type ThemeProviderProps = React.PropsWithChildren<{
  defaultTheme?: "dark" | "light";
}>;

export function ThemeProvider({
  children,
  defaultTheme = "dark",
}: ThemeProviderProps) {
  return <div data-theme={defaultTheme}>{children}</div>;
}
