"use client";

import { useState } from "react";

import { useLogout } from "@/features/auth/hooks/use-logout";

type UserMenuProps = {
  userName: string;
  email: string;
  initials: string;
};

export function UserMenu({ userName, email, initials }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { handleLogout, isPending } = useLogout();

  const handleLogoutClick = () => {
    setIsOpen(false);
    handleLogout();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-container-low"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <span className="flex size-8 items-center justify-center rounded-full border border-outline-variant/60 bg-surface-container text-xs font-semibold text-on-surface">
          {initials}
        </span>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <span className="truncate text-sm font-medium text-on-surface">{userName}</span>
          <span className="truncate text-xs text-on-surface-variant">{email}</span>
        </div>
      </button>

      {isOpen && (
        <div
          className="absolute bottom-full left-0 z-50 mb-3 w-full rounded-lg border border-outline-variant bg-surface-container-lowest shadow-md"
          role="menu"
        >
          <button
            onClick={handleLogoutClick}
            disabled={isPending}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-low disabled:opacity-60"
            role="menuitem"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            {isPending ? "Signing out..." : "Sign out"}
          </button>
        </div>
      )}

      {isOpen && (
        <button
          className="fixed inset-0 z-40"
          aria-hidden="true"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
