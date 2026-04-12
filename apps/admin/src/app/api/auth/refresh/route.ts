import { refreshHandler } from "@/features/auth/server/refresh.handler";

export async function POST(request: Request) {
  return refreshHandler(request);
}
