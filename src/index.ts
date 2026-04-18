import express, { Request, Response } from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.YOUTUBE_API_KEY || "";
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || "";

/* =============================== GET YOUTUBE VIDEOS =============================== */
app.get("/videos", async (req: Request, res: Response) => {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=6`;
    const yt = await fetch(url);
    const data: any = await yt.json();
    
    const videos = data.items.map((v: any) => ({
      id: v.id.videoId,
      title: v.snippet.title,
      thumbnail: v.snippet.thumbnails.high.url,
    }));
    
    res.json({ videos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch YouTube videos" });
  }
});

/* =============================== SNAP DISCOVERY PAGE =============================== */
app.get("/frame", (req: Request, res: Response) => {
  res.setHeader(
    "Link",
    `<https://${req.get("host")}/snap>; rel="alternate"; type="application/vnd.farcaster.snap+json"`
  );
  res.send(`
    <html>
      <head>
        <title>YouTube Snap</title>
        <meta property="fc:snap:version" content="1">
      </head>
      <body style="font-family:sans-serif;text-align:center;padding-top:40px">
        <h2>🎬 Farcaster Snap Ready</h2>
        <p>Open this link in Warpcast to see the Snap.</p>
      </body>
    </html>
  `);
});

/* =============================== SNAP JSON ENDPOINT =============================== */
app.get("/snap", async (req: Request, res: Response) => {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=1`;
    const yt = await fetch(url);
    const data: any = await yt.json();
    
    if (!data.items || data.items.length === 0) {
      return res.status(404).json({ error: "No videos found" });
    }

    const v = data.items[0];
    const videoId = v.id.videoId;
    const title = v.snippet.title;
    const thumbnail = v.snippet.thumbnails.high.url;

    res.setHeader("Content-Type", "application/vnd.farcaster.snap+json");
    res.setHeader("Access-Control-Allow-Origin", "*");

    res.json({
      version: "1",
      type: "snap",
      content: {
        body: title,
        image: thumbnail,
        buttons: [
          {
            label: "▶️ Play Video",
            type: "link",
            target: `https://www.youtube.com/watch?v=${videoId}`,
          },
          {
            label: "🔔 Subscribe",
            type: "link",
            target: `https://www.youtube.com/channel/${CHANNEL_ID}?sub_confirmation=1`,
          }
        ],
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Snap error" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
