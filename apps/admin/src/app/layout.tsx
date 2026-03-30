import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@cafedebug/design-tokens/styles.css";
import "./globals.css";
import { AppProviders } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "CafeDebug Admin",
    template: "%s | CafeDebug Admin"
  },
  description: "CafeDebug backoffice scaffold for authenticated admin workflows."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en-US" data-theme="light">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
