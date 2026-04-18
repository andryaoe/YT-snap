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
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const fullUrl = `${protocol}://${req.get("host")}/frame`;

  // 1. HEADER WAJIB (Harus muncul di setiap request)
  res.setHeader("Vary", "Accept");
  res.setHeader("Link", `<${fullUrl}>; rel="alternate"; type="${snapType}"`);

  // 2. LOGIKA SNAP (Jika diminta oleh Warpcast)
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
      });
    } catch (e) {
      return res.status(500).json({ error: "API Error" });
    }
  }

  // 3. LOGIKA FRAME (HTML untuk crawler agar muncul di feed)
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>YouTube Snap</title>
        <meta property="fc:snap:version" content="1">
        <meta property="fc:snap:url" content="${fullUrl}">
        
        <meta property="og:title" content="Latest YouTube Video">
        <meta property="og:image" content="https://i.ytimg.com/vi/twEe-vA3E4g/hqdefault.jpg">
      </head>
      <body style="text-align:center;font-family:sans-serif;padding-top:100px;">
        <h2>🎬 YouTube Snap is Live</h2>
        <p>Open this in Warpcast to interact.</p>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
