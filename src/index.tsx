import { Button, Frog } from 'frog'
import { serve } from '@hono/node-server'

// 1. Inisialisasi State untuk menyimpan index video yang sedang dilihat
type State = {
  index: number
}

export const app = new Frog<{ State: State }>({
  initialState: { index: 0 },
  title: 'YouTube @andryaoe.eth',
})

// 2. Fungsi untuk mengambil data video terbaru dari YouTube
async function getVideos() {
  const API_KEY = 'AIzaSyAZL9gU6nAHLLy4RA00T8LdqjwAddZUPgQ'
  const CHANNEL_ID = 'UCtsoONeSvOP-RznVk0iYOGw'
  const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=10&type=video`
  
  try {
    const res = await fetch(url)
    const data = await res.json()
    return data.items || []
  } catch (error) {
    console.error("Gagal mengambil data YouTube", error)
    return []
  }
}

// 3. Definisi Frame Utama
app.frame('/', async (c) => {
  const { deriveState } = c
  const videos = await getVideos()
  
  // Logika navigasi index berdasarkan tombol yang diklik
  const state = deriveState((previousState) => {
    if (c.buttonValue === 'next') {
      if (previousState.index < videos.length - 1) previousState.index++
    }
    if (c.buttonValue === 'prev') {
      if (previousState.index > 0) previousState.index--
    }
  })

  // Jika gagal memuat video
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
  const title = currentVideo.snippet.title
  const thumbnail = currentVideo.snippet.thumbnails.high.url

  // 4. Render Tampilan Snap
  return c.res({
    image: thumbnail,
    intents: [
      <Button value="prev">⬅️ Prev</Button>,
      <Button value="next">Next ➡️</Button>,
      <Button.Link href={`https://youtu.be/${videoId}`}>📺 Play</Button.Link>,
      <Button.Link href="https://youtube.com/@andryaoe?sub_confirmation=1">🔔 Subscribe</Button.Link>,
      <Button.Link href={`https://warpcast.com/~/compose?text=Cek video terbaru dari @andryaoe.eth!&embeds[]=${encodeURIComponent('https://' + c.req.header('host'))}`}>
        📤 Share
      </Button.Link>
    ],
  })
})

// 5. Konfigurasi Server untuk Railway
const port = Number(process.env.PORT) || 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port,
})

export default app
