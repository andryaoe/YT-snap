import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = process.env.YOUTUBE_API_KEY!;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID!;

// endpoint ambil video youtube
app.get("/videos", async (req, res) => {
  try {
    const url =
      `https://www.googleapis.com/youtube/v3/search?` +
      `key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=6`;

    const yt = await fetch(url);
    const data: any = await yt.json();

    const videos = data.items
      .filter((v: any) => v.id.videoId)
      .map((v: any) => ({
        id: v.id.videoId,
        title: v.snippet.title,
        thumbnail: v.snippet.thumbnails.high.url,
      }));

    res.json({ videos });
  } catch (err) {
    res.status(500).json({ error: "cannot get video" });
  }
});

// ⭐ FARCASTER FRAME ENDPOINT
app.get("/frame", async (req, res) => {
  try {
    const api = await fetch(`https://yt-snap-production.up.railway.app/videos`);
    const json: any = await api.json();
    const video = json.videos[0];

    const videoUrl = `https://youtube.com/watch?v=${video.id}`;

    res.send(`
    <html>
      <head>
        <title>YouTube Frame</title>

        <meta property="og:title" content="${video.title}" />
        <meta property="og:image" content="${video.thumbnail}" />

        <meta name="fc:frame" content="vNext" />
        <meta name="fc:frame:image" content="${video.thumbnail}" />

        <meta name="fc:frame:button:1" content="▶ Play Video" />
        <meta name="fc:frame:button:1:action" content="link" />
        <meta name="fc:frame:button:1:target" content="${videoUrl}" />

        <meta name="fc:frame:button:2" content="Subscribe ❤️" />
        <meta name="fc:frame:button:2:action" content="link" />
        <meta name="fc:frame:button:2:target" content="https://youtube.com/channel/${CHANNEL_ID}" />

        <meta name="fc:frame:button:3" content="Share 🔁" />
        <meta name="fc:frame:button:3:action" content="link" />
        <meta name="fc:frame:button:3:target" content="https://warpcast.com/~/compose?text=Check%20this%20video%20🔥%20${videoUrl}" />

      </head>
      <body>Farcaster Frame Ready</body>
    </html>
    `);
  } catch (err) {
    res.send("Frame error");
  }
});

app.listen(PORT, () => console.log("Server running"));
