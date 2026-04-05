"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { appRoutes } from "@/lib/routes";

import { logoutService } from "../services/logout.service";

export const useLogout = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      const result = await logoutService();

      if (result.ok) {
        router.replace(appRoutes.login);
      }
    });
  };

  return {
    handleLogout,
    isPending
  };
};
