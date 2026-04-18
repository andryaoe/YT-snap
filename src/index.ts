import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

const API_KEY = process.env.YOUTUBE_API_KEY!;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID!;

app.get("/videos", async (req, res) => {
  try {
    const url =
      `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}` +
      `&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=1`;

    const response = await fetch(url);
    const data = await response.json();

    const video = data.items[0];

    res.json({
      title: video.snippet.title,
      thumbnail: video.snippet.thumbnails.high.url,
      videoId: video.id.videoId,
      url: `https://www.youtube.com/watch?v=${video.id.videoId}`
    });
  } catch (err) {
    res.status(500).send("Error fetching YouTube data");
  }
});

app.get("/frame", async (req, res) => {
  const api = "https://yt-snap-production.up.railway.app/videos";
  const r = await fetch(api);
  const vid = await r.json();

  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <meta property="og:title" content="${vid.title}" />
    <meta property="og:image" content="${vid.thumbnail}" />
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${vid.thumbnail}" />
    <meta property="fc:frame:button:1" content="▶️ Play" />
    <meta property="fc:frame:button:1:action" content="link" />
    <meta property="fc:frame:button:1:target" content="${vid.url}" />
    <meta property="fc:frame:button:2" content="🔔 Subscribe" />
    <meta property="fc:frame:button:2:action" content="link" />
    <meta property="fc:frame:button:2:target" content="https://youtube.com/channel/${CHANNEL_ID}" />
  </head>
  <body>Farcaster Frame</body>
  </html>
  `);
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
