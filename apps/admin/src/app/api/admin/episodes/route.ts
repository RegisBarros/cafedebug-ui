import { episodesListHandler } from "@/features/episodes/server/episodes-list.handler";
import { episodesCreateHandler } from "@/features/episodes/server/episodes-create.handler";

export async function GET(request: Request) {
  return episodesListHandler(request);
}

export async function POST(request: Request) {
  return episodesCreateHandler(request);
}
