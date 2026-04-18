import express, { Request, Response } from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

const API_KEY = process.env.YOUTUBE_API_KEY || "";
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || "";

app.get("/frame", async (req: Request, res: Response) => {
  const snapType = "application/vnd.farcaster.snap+json";
  const protocol = "https";
  const host = req.get("host");
  const fullUrl = `${protocol}://${host}/frame`;

  // 1. Deteksi apakah ini request dari Farcaster (lewat Accept Header atau User-Agent)
  const isSnapRequest = 
    req.headers.accept?.includes(snapType) || 
    req.headers["user-agent"]?.includes("Farcaster") ||
    req.query.json === "true";

  if (isSnapRequest) {
    try {
      const ytUrl = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=1`;
      const ytRes = await fetch(ytUrl);
      const data: any = await ytRes.json();
      
      const v = data.items[0];
      const videoId = v.id.videoId;
      const title = v.snippet.title;
      const thumbnail = v.snippet.thumbnails.high.url;

      res.setHeader("Content-Type", snapType);
      res.setHeader("Access-Control-Allow-Origin", "*");
      
      return res.json({
        version: "1",
        type: "snap",
        content: {
          body: title,
          image: thumbnail,
          buttons: [
            {
              label: "▶️ Tonton Video",
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
      });
    } catch (e) {
      res.setHeader("Content-Type", snapType);
      return res.status(200).json({
        version: "1",
        type: "snap",
        content: { body: "Error loading YouTube data" }
      });
    }
  }

  // 2. Jika diakses Browser, berikan Meta Tags Frame v2 (PENTING untuk Preview)
  res.setHeader("Vary", "Accept");
  res.setHeader("Link", `<${fullUrl}>; rel="alternate"; type="${snapType}"`);
  
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>YouTube Snap</title>
        <meta property="fc:frame" content="v2">
        <meta property="fc:snap:version" content="1">
        <meta property="fc:snap:url" content="${fullUrl}">
        
        <meta property="og:title" content="YouTube Latest Video">
        <meta property="og:image" content="https://i.ytimg.com/vi/twEe-vA3E4g/hqdefault.jpg">
        <meta property="og:description" content="Click to watch latest video">
      </head>
      <body style="text-align:center; font-family:sans-serif; padding:50px; background:#f4f4f4;">
        <div style="background:white; padding:20px; border-radius:15px; display:inline-block; box-shadow:0 4px 10px rgba(0,0,0,0.1)">
          <h2>🎬 YouTube Snap Status: Aktif</h2>
          <p>Jika Anda melihat ini di browser, server sudah berjalan.</p>
          <p>Buka di Warpcast untuk melihat Snap.</p>
        </div>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
