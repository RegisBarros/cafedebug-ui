import { PlaceholderPanel } from "@/features/placeholders/placeholder-panel";

type ComingSoonPageProps = {
  title: string;
  route: string;
  summary: string;
};

export function ComingSoonPage({ title, route, summary }: ComingSoonPageProps) {
  return (
    <PlaceholderPanel
      title={title}
      description={summary}
      status="Disabled in V1"
    >
      <p className="text-sm text-on-surface-variant">
        Route <code className="rounded bg-surface-container-high px-1.5 py-0.5 text-xs text-on-surface">{route}</code> stays accessible for direct
        navigation, while the menu entry remains disabled for the first admin milestone.
      </p>
    </PlaceholderPanel>
  );
}
