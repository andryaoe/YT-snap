import express, { Request, Response } from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Konfigurasi CORS sangat penting untuk Crawler
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Accept", "X-Farcaster-Assets-Proxy-Url"]
}));

const API_KEY = process.env.YOUTUBE_API_KEY || "";
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || "";

app.get("/frame", async (req: Request, res: Response) => {
  const snapType = "application/vnd.farcaster.snap+json";
  const fullUrl = `https://${req.get("host")}/frame`;

  // --- LANGKAH 1: HTTP HEADER DISCOVERY (SESUAI DOKUMENTASI) ---
  // Header ini wajib ada agar crawler tahu URL ini memiliki konten Snap
  res.setHeader("Link", `<${fullUrl}>; rel="alternate"; type="${snapType}"`);
  res.setHeader("Vary", "Accept");

  // --- LANGKAH 2: CEK APAKAH REQUEST ADALAH SNAP ---
  if (req.headers.accept === snapType || req.query.json === "true") {
    try {
      const ytUrl = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=1`;
      const ytRes = await fetch(ytUrl);
      const data: any = await ytRes.json();
      
      const v = data.items[0];
      const videoId = v.id.videoId;
      const title = v.snippet.title;
      const thumbnail = v.snippet.thumbnails.high.url;

      // Set Content-Type murni sesuai standar
      res.setHeader("Content-Type", snapType);
      return res.status(200).send(JSON.stringify({
        version: "1",
        type: "snap",
        content: {
          body: title,
          image: thumbnail,
          buttons: [
            {
              label: "▶️ Watch Video",
              type: "link",
              target: `https://www.youtube.com/watch?v=${videoId}`
            },
            {
              label: "🔔 Subscribe",
              type: "link",
              target: `https://www.youtube.com/channel/${CHANNEL_ID}?sub_confirmation=1`
            }
          ]
        }
      }));
    } catch (e) {
      res.setHeader("Content-Type", snapType);
      return res.status(500).json({ error: "YouTube API Fail" });
    }
  }

  // --- LANGKAH 3: HTML FALLBACK (DENGAN META TAGS) ---
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>YouTube Snap</title>
        <meta property="fc:snap:version" content="1">
        <meta property="fc:snap:url" content="${fullUrl}">
        
        <meta property="fc:frame" content="vNext">
        <meta property="fc:frame:image" content="https://i.ytimg.com/vi/twEe-vA3E4g/hqdefault.jpg">
        <meta property="fc:frame:button:1" content="View Latest Video">
        <meta property="fc:frame:button:1:action" content="link">
        <meta property="fc:frame:button:1:target" content="${fullUrl}">

        <meta property="og:title" content="YouTube @andryaoe.eth">
        <meta property="og:image" content="https://i.ytimg.com/vi/twEe-vA3E4g/hqdefault.jpg">
      </head>
      <body style="text-align:center; padding:50px; font-family:sans-serif;">
        <h2>YouTube Snap Server</h2>
        <p>Protokol: <b>${snapType}</b></p>
        <p>Status: <b>Online</b></p>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server berjalan di port ${PORT}`));
