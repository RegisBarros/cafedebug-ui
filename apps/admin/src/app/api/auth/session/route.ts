import { sessionHandler } from "@/features/auth/server/session.handler";

export async function GET(request: Request) {
  return sessionHandler(request);
}
