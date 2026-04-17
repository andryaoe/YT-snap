const API_KEY = process.env.YOUTUBE_API_KEY!;
const CHANNEL_ID = process.env.CHANNEL_ID!;

export type Video = {
  id: string;
  title: string;
  thumbnail: string;
};

export async function getVideos(pageToken?: string) {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");

  url.searchParams.set("key", API_KEY);
  url.searchParams.set("channelId", CHANNEL_ID);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("order", "date");
  url.searchParams.set("maxResults", "6");
  url.searchParams.set("type", "video");

  if (pageToken) url.searchParams.set("pageToken", pageToken);

  const res = await fetch(url.toString());
  const data = await res.json();

  const videos: Video[] = data.items.map((item: any) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails.high.url,
  }));

  return {
    videos,
    nextPageToken: data.nextPageToken,
    prevPageToken: data.prevPageToken,
  };
}
