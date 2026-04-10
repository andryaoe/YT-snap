import * as FrogModule from 'frog'
import { serve } from '@hono/node-server'

// Deteksi letak Frog (tergantung versi library yang terinstal)
const Frog = (FrogModule as any).Frog || (FrogModule as any).default?.Frog || (FrogModule as any).default
const Button = (Frog as any).Button || (FrogModule as any).Button

type State = {
  index: number
}

// Inisialisasi app
export const app = new Frog({
  initialState: { index: 0 },
  title: 'YouTube @andryaoe.eth',
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
  const { deriveState, buttonValue } = c
  const videos = await getVideos()
  
  const state = deriveState((previousState: State) => {
    if (buttonValue === 'next' && previousState.index < videos.length - 1) previousState.index++
    if (buttonValue === 'prev' && previousState.index > 0) previousState.index--
  })

  if (videos.length === 0) {
    return c.res({
      image: (
        <div style={{ color: 'white', display: 'flex', background: 'black', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', fontSize: 40 }}>
          Gagal memuat video YouTube.
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
      <Button.Link href={`https://warpcast.com/~/compose?text=Cek video terbaru @andryaoe.eth!&embeds[]=${encodeURIComponent('https://' + (c.req.header('host') || ''))}`}>
        📤 Share
      </Button.Link>
    ],
  })
})

const port = Number(process.env.PORT) || 3000
console.log(`Server started on port ${port}`)

serve({
  fetch: (app as any).fetch,
  port,
})

export default app
