"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      // next-themes' anti-flash <script> only needs to run from the server HTML. On the client,
      // a non-JS type marks it as a data block so React 19 doesn't warn about an inert script tag.
      scriptProps={{ type: typeof window === "undefined" ? undefined : "application/json" }}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
