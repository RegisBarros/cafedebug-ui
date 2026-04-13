import { NextResponse } from "next/server";

import { clearKnownAuthCookies } from "@/lib/auth/next-response-cookies";
import { logger, observabilityEvents } from "@/lib/observability";

export async function POST() {
  logger.info(observabilityEvents.authLogout, {
    module: "auth",
    action: "logout",
    status: 200
  });

  const response = NextResponse.json({ success: true }, { status: 200 });

  clearKnownAuthCookies(response);

  return response;
}
