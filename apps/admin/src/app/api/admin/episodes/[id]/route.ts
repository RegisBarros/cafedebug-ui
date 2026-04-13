import { episodesDetailHandler } from "@/features/episodes/server/episodes-detail.handler";
import { episodesUpdateHandler } from "@/features/episodes/server/episodes-update.handler";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return episodesDetailHandler(request, context);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return episodesUpdateHandler(request, context);
}
