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
  const host = req.get("host");
  const fullUrl = `https://${host}/frame`;

  // 1. LOGIKA UNTUK SNAP (JSON)
  if (req.headers.accept?.includes(snapType) || req.query.json === "true") {
    try {
      const ytUrl = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=1`;
      const ytRes = await fetch(ytUrl);
      const data: any = await ytRes.json();
      
      const v = data.items[0];
      const videoId = v.id.videoId;
      const title = v.snippet.title;
      const thumbnail = v.snippet.thumbnails.high.url;

      res.setHeader("Content-Type", snapType);
      return res.json({
        version: "1",
        type: "snap",
        content: {
          body: title,
          image: thumbnail,
          buttons: [
            {
              label: "▶️ Watch on YouTube",
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
      return res.status(200).json({ version: "1", type: "snap", content: { body: "YouTube API Error" } });
    }
  }

  // 2. LOGIKA UNTUK PREVIEW (HTML)
  // Gunakan Meta Tags Frame v1 (Legacy) + v2 agar Warpcast tidak bingung
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>YouTube Snap</title>
        
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://i.ytimg.com/vi/twEe-vA3E4g/hqdefault.jpg" />
        <meta property="fc:frame:button:1" content="Check Latest Video" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="${fullUrl}?json=true" />

        <meta property="fc:snap:version" content="1">
        <meta property="fc:snap:url" content="${fullUrl}">
        
        <meta property="og:title" content="YouTube Snap">
        <meta property="og:image" content="https://i.ytimg.com/vi/twEe-vA3E4g/hqdefault.jpg">
      </head>
      <body style="text-align:center; padding:50px; font-family:sans-serif;">
        <h2>Server Aktif!</h2>
        <p>Buka di aplikasi Warpcast untuk melihat interaksi Snap.</p>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Running on port ${PORT}`));
