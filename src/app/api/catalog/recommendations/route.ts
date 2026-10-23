import { NextResponse } from "next/server";
import { getSaavnRecommendations } from "@/lib/saavn";
import { getSessionUserRaw } from "@/lib/auth-server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const artist = searchParams.get("artist") || undefined;
  const genre = searchParams.get("genre") || undefined;
  const seedId = searchParams.get("seedId") || undefined;
  const seedTitle = searchParams.get("seedTitle") || undefined;
  const excludeStr = searchParams.get("exclude") || "";
  const excludeIds = excludeStr ? excludeStr.split(",").filter(Boolean) : [];
  if (seedId) excludeIds.push(seedId);

  // Retrieve logged-in user taste profile if present
  let userGenres: string[] | undefined = undefined;
  let userArtists: string[] | undefined = undefined;

  try {
    const user = await getSessionUserRaw();
    if (user?.taste) {
      userGenres = user.taste.preferredGenres;
      userArtists = user.taste.preferredArtists;
    }
  } catch {
    // Session retrieval is optional
  }

  try {
    const tracks = await getSaavnRecommendations({
      artistName: artist,
      genre,
      seedTitle,
      excludeIds,
      userGenres,
      userArtists,
    });
    return NextResponse.json({ tracks });
  } catch (e) {
    return NextResponse.json({ tracks: [], error: (e as Error).message });
  }
}
