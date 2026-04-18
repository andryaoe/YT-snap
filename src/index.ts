import express, { Request, Response } from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Konfigurasi CORS yang lebih spesifik untuk Farcaster
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Accept"]
}));

const API_KEY = process.env.YOUTUBE_API_KEY || "";
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || "";

app.get("/frame", async (req: Request, res: Response) => {
  const snapType = "application/vnd.farcaster.snap+json";
  const host = req.get("host");
  const fullUrl = `https://${host}/frame`;

  // 1. LOGIKA RESPONS SNAP (JSON)
  // Dipicu saat Warpcast meminta data interaktif
  const isSnapRequest = 
    req.headers.accept?.includes(snapType) || 
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
      return res.json({
        version: "1",
        type: "snap",
        content: {
          body: title,
          image: thumbnail,
          buttons: [
            {
              label: "▶️ Tonton di YouTube",
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
        content: { body: "Gagal memuat video terbaru." }
      });
    }
  }

  // 2. LOGIKA RESPONS BROWSER (HTML dengan Meta Tags v2)
  // Penting agar "Preview" muncul di Feed Warpcast
  res.setHeader("Vary", "Accept");
  res.setHeader("Link", `<${fullUrl}>; rel="alternate"; type="${snapType}"`);

  // Meta Tag Frame v2 dalam format JSON string
  const frameV2Config = JSON.stringify({
    version: "next",
    imageUrl: "https://i.ytimg.com/vi/twEe-vA3E4g/hqdefault.jpg", // Thumbnail default
    button: {
      title: "Cek Video Terbaru",
      action: {
        type: "launch_frame",
        name: "YouTube Snap",
        url: fullUrl,
        splashImageUrl: "https://i.ytimg.com/vi/twEe-vA3E4g/default.jpg",
        splashBackgroundColor: "#ffffff"
      }
    }
  });

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>YouTube Snap v2</title>
        <meta name="fc:frame" content='${frameV2Config}' />
        
        <meta property="fc:snap:version" content="1">
        <meta property="fc:snap:url" content="${fullUrl}">
        
        <meta property="og:title" content="YouTube Latest Video">
        <meta property="og:image" content="https://i.ytimg.com/vi/twEe-vA3E4g/hqdefault.jpg">
        <meta property="og:description" content="Klik untuk melihat video terbaru dari channel Andryaoe">
      </head>
      <body style="text-align:center; font-family:sans-serif; padding:50px; background:#f4f4f4;">
        <div style="background:white; padding:30px; border-radius:20px; display:inline-block; box-shadow:0 10px 25px rgba(0,0,0,0.1); max-width:400px;">
          <h2 style="color:#ff0000;">🎬 YouTube Snap v2</h2>
          <hr>
          <p>Server ini dikonfigurasi untuk <b>Farcaster Snap & Frame v2</b>.</p>
          <p style="font-size:0.9em; color:#666;">Silakan salin link ini dan tempel di Warpcast untuk melihat hasilnya.</p>
          <code style="background:#eee; padding:5px; border-radius:5px; display:block; word-break:break-all;">${fullUrl}</code>
        </div>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server Frame v2 berjalan di port ${PORT}`));
