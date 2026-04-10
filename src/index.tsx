import { createRequire } from 'module'
const require = createRequire(import.meta.url)

const { Frog, Button } = require('frog')
const { serve } = require('@hono/node-server')

export const app = new Frog({
  title: 'YouTube @andryaoe.eth',
  initialState: {
    index: 0
  }
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
  
  const state = deriveState((previousState) => {
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
      <Button.Link href="https://youtube.com/@andryaoe?sub_confirmation=1">🔔 Subscribe</Button.Link>
    ],
  })
})

const port = Number(process.env.PORT) || 3000
console.log(`🚀 Server otewe di port ${port}`)

serve({
  fetch: app.fetch,
  port,
})
