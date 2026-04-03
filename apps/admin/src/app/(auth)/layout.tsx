import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
      />
      <div className="flex min-h-screen flex-col bg-surface">
        <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-6 backdrop-blur-md">
          <span className="font-display text-xl font-bold tracking-tight text-on-surface">
            CafeDebug
          </span>
          {/* Right slot reserved for theme toggle and help — out of scope V1 */}
          <div aria-hidden="true" />
        </header>

        <main className="relative flex flex-grow items-center justify-center p-6">
          {/* Decorative ambient orbs */}
          <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-primary-container/60 blur-3xl" />
            <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-primary-container/30 blur-3xl" />
          </div>

          <div className="relative z-10 w-full">
            {children}
          </div>
        </main>

        <footer className="flex flex-col items-center gap-4 py-8">
          <div className="flex gap-6">
            <a
              href="#"
              className="text-xs text-on-surface-variant underline underline-offset-4 transition-colors hover:text-primary"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-xs text-on-surface-variant underline underline-offset-4 transition-colors hover:text-primary"
            >
              Terms of Service
            </a>
            <a
              href="#"
              className="text-xs text-on-surface-variant underline underline-offset-4 transition-colors hover:text-primary"
            >
              Support
            </a>
          </div>
          <p className="text-xs text-on-surface-variant">
            © 2025 CafeDebug Admin. All rights reserved.
          </p>
        </footer>
      </div>
    </>
  );
}
