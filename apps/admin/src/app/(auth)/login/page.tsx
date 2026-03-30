import { LoginForm, resolveLoginStatusMessage } from "@/features/auth";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const reason =
    typeof resolvedSearchParams.reason === "string"
      ? resolvedSearchParams.reason
      : undefined;
  const statusMessage = resolveLoginStatusMessage(reason);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <LoginForm
        {...(statusMessage ? { initialStatusMessage: statusMessage } : {})}
      />
    </main>
  );
}
