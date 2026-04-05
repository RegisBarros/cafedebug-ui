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
    <html lang="en-US" data-theme="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
