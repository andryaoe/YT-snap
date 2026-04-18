import express, { Request, Response } from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// 1. Konfigurasi CORS (Sangat Penting untuk Farcaster Validator)
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.YOUTUBE_API_KEY || "";
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || "";

/* =============================== 
   GET YOUTUBE VIDEOS (API BIASA)
   =============================== */
app.get("/videos", async (req: Request, res: Response) => {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=6`;
    const yt = await fetch(url);
    const data: any = await yt.json();
    
    if (!data.items) {
      return res.status(404).json({ error: "No videos found" });
    }

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

/* =====================================
   SNAP DISCOVERY PAGE (/frame)
   Halaman ini yang dimasukkan ke Validator
   ===================================== */
app.get("/frame", (req: Request, res: Response) => {
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const fullUrl = `${protocol}://${req.get("host")}/snap`;
  
  // Header Link: Cara utama Farcaster Crawler menemukan Snap Anda
  res.setHeader(
    "Link",
    `<${fullUrl}>; rel="alternate"; type="application/vnd.farcaster.snap+json"`
  );
  
  res.setHeader("Content-Type", "text/html");
  
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>YouTube Snap</title>
        <meta property="fc:snap:version" content="1">
        <meta property="fc:snap:url" content="${fullUrl}">
      </head>
      <body style="font-family:sans-serif;text-align:center;padding-top:50px;background-color:#f4f4f9;">
        <div style="max-width:500px;margin:auto;background:white;padding:20px;border-radius:15px;box-shadow:0 4px 6px rgba(0,0,0,0.1)">
          <h2>🎬 YT-Snap is Ready!</h2>
          <p>Copy this URL and paste it into Warpcast or the Farcaster Snap Validator.</p>
          <div style="background:#eee;padding:10px;border-radius:5px;word-break:break-all;">
            <code>${protocol}://${req.get("host")}/frame</code>
          </div>
        </div>
      </body>
    </html>
  `);
});

/* =====================================
   SNAP JSON ENDPOINT (/snap)
   Data JSON yang sebenarnya dibaca Warpcast
   ===================================== */
app.get("/snap", async (req: Request, res: Response) => {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=1`;
    const yt = await fetch(url);
    const data: any = await yt.json();
    
    if (!data.items || data.items.length === 0) {
      return res.status(404).json({ error: "YouTube data not found. Check API Key/Channel ID." });
    }

    const v = data.items[0];
    const videoId = v.id.videoId;
    const title = v.snippet.title;
    const thumbnail = v.snippet.thumbnails.high.url;

    // WAJIB: Atur Content-Type khusus Farcaster Snap
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
            label: "▶️ Watch Video",
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
    console.error("Snap error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Frame URL: http://localhost:${PORT}/frame`);
});
