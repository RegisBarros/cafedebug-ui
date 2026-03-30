import { EpisodeEditorPage } from "@/features/episodes/episode-editor-page";

type EditEpisodePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditEpisodePage({ params }: EditEpisodePageProps) {
  const { id } = await params;

  return <EpisodeEditorPage id={id} mode="edit" />;
}
