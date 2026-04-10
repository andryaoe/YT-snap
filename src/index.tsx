import { Button, Frog } from 'frog'
import { handle } from 'hono/vercel' // Adaptor standar

type State = {
  index: number
}

export const app = new Frog<{ State: State }>({
  initialState: { index: 0 },
  title: 'YouTube Andryaoe',
})

async function getVideos() {
  const API_KEY = 'AIzaSyAZL9gU6nAHLLy4RA00T8LdqjwAddZUPgQ'
  const CHANNEL_ID = 'UCtsoONeSvOP-RznVk0iYOGw'
  const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=10&type=video`
  
  try {
    const res = await fetch(url)
    const data = await res.json()
    return data.items || []
  } catch (error) {
    return []
  }
}

app.frame('/', async (c) => {
  const { deriveState } = c
  const videos = await getVideos()
  
  const state = deriveState((previousState) => {
    if (c.buttonValue === 'next' && previousState.index < videos.length - 1) previousState.index++
    if (c.buttonValue === 'prev' && previousState.index > 0) previousState.index--
  })

  if (videos.length === 0) {
    return c.res({
      image: (
        <div style={{ color: 'white', display: 'flex', background: 'black', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', fontSize: 40 }}>
          Gagal memuat video.
        </div>
      ),
      intents: [<Button.Reset>Coba Lagi</Button.Reset>]
    })
  }

  const currentVideo = videos[state.index]
  const videoId = currentVideo.id.videoId
  const thumbnail = currentVideo.snippet.thumbnails.high.url

  return c.res({
    image: thumbnail,
    intents: [
      <Button value="prev">⬅️ Prev</Button>,
      <Button value="next">Next ➡️</Button>,
      <Button.Link href={`https://youtu.be/${videoId}`}>📺 Play</Button.Link>,
      <Button.Link href="https://youtube.com/@andryaoe?sub_confirmation=1">🔔 Subscribe</Button.Link>,
      <Button.Link href={`https://warpcast.com/~/compose?text=Cek video terbaru @andryaoe.eth!&embeds[]=${encodeURIComponent('https://' + c.req.header('host'))}`}>
        📤 Share
      </Button.Link>
    ],
  })
})

export default app
