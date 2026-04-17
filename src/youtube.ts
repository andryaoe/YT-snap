const API_KEY = process.env.YOUTUBE_API_KEY!
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID!

export type Video = {
  id: string
  title: string
  thumbnail: string
}

export async function fetchVideos(): Promise<Video[]> {
  const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet&order=date&maxResults=25`

  const res = await fetch(url)
  const data = await res.json()

  return data.items
    .filter((item: any) => item.id.videoId)
    .map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high.url,
    }))
}
