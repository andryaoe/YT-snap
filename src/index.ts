import { Hono } from "hono"
import { serve } from "@hono/node-server"
import { fetchVideos } from "./youtube"
import { buildVideoUI } from "./ui"

const app = new Hono()

let videosCache: any[] = []

app.post("/", async (c) => {
  if (videosCache.length === 0) {
    videosCache = await fetchVideos()
  }

  const body = await c.req.json()
  const action = body?.action
  let index = Number(body?.state?.index || 0)

  if (action === "next") index++
  if (action === "prev") index--

  if (index < 0) index = videosCache.length - 1
  if (index >= videosCache.length) index = 0

  const video = videosCache[index]

  return c.json({
    state: { index },
    ui: buildVideoUI(video)
  })
})

const port = process.env.PORT || 3000

serve({
  fetch: app.fetch,
  port: Number(port),
})

console.log("🚀 Snap server running on port " + port)
