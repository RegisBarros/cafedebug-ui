import { redirect } from "next/navigation";

import { postLoginRedirectRoute } from "@/lib/routes";

export default function HomePage() {
  redirect(postLoginRedirectRoute);
}
