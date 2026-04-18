import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.YOUTUBE_API_KEY!;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID!;

//
// GET YOUTUBE VIDEOS (sudah jalan)
//
app.get("/videos", async (req, res) => {
  try {
    const url =
      `https://www.googleapis.com/youtube/v3/search?` +
      `key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=6`;

    const yt = await fetch(url);
    const data = await yt.json();

    const videos = data.items.map((v: any) => ({
      id: v.id.videoId,
      title: v.snippet.title,
      thumbnail: v.snippet.thumbnails.high.url,
    }));

    res.json({ videos });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch YouTube videos" });
  }
});

//
// SNAP DISCOVERY PAGE (ini yang kurang tadi)
//
app.get("/frame", (req, res) => {
  res.setHeader(
    "Link",
    `<https://yt-snap-production.up.railway.app/snap>; rel="alternate"; type="application/vnd.farcaster.snap+json"`
  );

  res.send(`
    <html>
      <head>
        <title>YouTube Snap</title>
      </head>
      <body style="font-family:sans-serif;text-align:center;padding-top:40px">
        <h2>🎬 Farcaster Snap Ready</h2>
        <p>Open this link in Warpcast to see the Snap.</p>
      </body>
    </html>
  `);
});

//
// SNAP JSON ENDPOINT (ini yang akan dibaca Farcaster)
//
app.get("/snap", async (req, res) => {
  try {
    const url =
      `https://www.googleapis.com/youtube/v3/search?` +
      `key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=1`;

    const yt = await fetch(url);
    const data = await yt.json();
    const v = data.items[0];

    const videoId = v.id.videoId;
    const title = v.snippet.title;
    const thumbnail = v.snippet.thumbnails.high.url;

    res.json({
      version: "1",
      image: thumbnail,
      buttons: [
        {
          label: "▶️ Play Video",
          action: "link",
          target: `https://www.youtube.com/watch?v=${videoId}`,
        },
        {
          label: "🔔 Subscribe",
          action: "link",
          target: `https://www.youtube.com/channel/${CHANNEL_ID}?sub_confirmation=1`,
        },
        {
          label: "🔁 Share",
          action: "link",
          target: `https://warpcast.com/~/compose?text=Watch this video&embeds[]=https://yt-snap-production.up.railway.app/frame`,
        },
      ],
    });
  } catch (err) {
    res.status(500).json({ error: "Snap error" });
  }
});

app.listen(PORT, () => console.log("Server running"));
