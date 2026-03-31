import { loginHandler } from "@/features/auth/server/login.handler";

export async function POST(request: Request) {
  return loginHandler(request);
}
