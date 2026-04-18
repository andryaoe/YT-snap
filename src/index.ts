import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// 1. Middleware CORS & OPTIONS
// Penting agar validator Farcaster tidak terhalang kebijakan keamanan browser/crawler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

const API_KEY = process.env.YOUTUBE_API_KEY || "";
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || "";

/**
 * Fungsi pembantu untuk mengambil data video terbaru dari YouTube
 */
async function getLatestVideo() {
  const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=1`;
  const response = await fetch(url);
  const data: any = await response.json();

  if (!data.items || data.items.length === 0) {
    throw new Error("No videos found or API Key invalid");
  }

  const v = data.items[0];
  return {
    videoId: v.id.videoId,
    title: v.snippet.title,
    thumbnail: v.snippet.thumbnails.high.url
  };
}

/**
 * ENDPOINT UTAMA (/frame)
 * Melayani HTML untuk browser dan JSON untuk Farcaster Snap
 */
app.get("/frame", async (req: Request, res: Response) => {
  const acceptHeader = req.headers.accept || "";
  const snapType = "application/vnd.farcaster.snap+json";
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.get("host");
  const fullUrl = `${protocol}://${host}/frame`;

  // A. Logika untuk Farcaster Snap (Content Negotiation)
  if (acceptHeader.includes(snapType)) {
    try {
      const video = await getLatestVideo();
      res.setHeader("Content-Type", snapType);
      return res.json({
        version: "1",
        type: "snap",
        content: {
          body: video.title,
          image: video.thumbnail,
          buttons: [
            {
              label: "▶️ Tonton Video",
              type: "link",
              target: `https://www.youtube.com/watch?v=${video.videoId}`
            },
            {
              label: "🔔 Subscribe",
              type: "link",
              target: `https://www.youtube.com/channel/${CHANNEL_ID}?sub_confirmation=1`
            }
          ]
        }
      });
    } catch (err) {
      console.error("Snap Error:", err);
      res.setHeader("Content-Type", snapType);
      return res.status(500).json({ error: "Gagal memuat data YouTube" });
    }
  }

  // B. Logika untuk Browser (HTML Discovery)
  res.setHeader("Vary", "Accept");
  res.setHeader("Link", `<${fullUrl}>; rel="alternate"; type="${snapType}"`);
  
  res.send(`
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>YouTube Snap Ready</title>
        <meta property="fc:snap:version" content="1">
        <meta property="fc:snap:url" content="${fullUrl}">
        <style>
          body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f2f5; }
          .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
          code { background: #eee; padding: 5px 10px; border-radius: 4px; word-break: break-all; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>🎬 YT-Snap Siap!</h2>
          <p>Gunakan URL di bawah ini pada Farcaster Snap Validator:</p>
          <code>${fullUrl}</code>
        </div>
      </body>
    </html>
  `);
});

/**
 * ENDPOINT CADANGAN (/snap)
 * Hanya untuk memastikan JSON bisa diakses langsung jika diperlukan
 */
app.get("/snap", async (req: Request, res: Response) => {
  try {
    const video = await getLatestVideo();
    res.setHeader("Content-Type", "application/vnd.farcaster.snap+json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json({
      version: "1",
      type: "snap",
      content: {
        body: video.title,
        image: video.thumbnail,
        buttons: [
          {
            label: "▶️ Tonton Video",
            type: "link",
            target: `https://www.youtube.com/watch?v=${video.videoId}`
          }
        ]
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di port ${PORT}`);
});
