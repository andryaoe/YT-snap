import express, { Request, Response } from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// 1. CORS Harus sangat terbuka untuk validator
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"]
}));

const API_KEY = process.env.YOUTUBE_API_KEY || "";
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || "";

// Fungsi untuk membuat JSON Snap (agar bisa dipanggil di dua tempat)
async function generateSnapJson() {
  const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=1`;
  const yt = await fetch(url);
  const data: any = await yt.json();
  
  if (!data.items || data.items.length === 0) {
    throw new Error("No video found");
  }

  const v = data.items[0];
  return {
    version: "1",
    type: "snap",
    content: {
      body: v.snippet.title,
      image: v.snippet.thumbnails.high.url,
      buttons: [
        {
          label: "▶️ Watch Video",
          type: "link",
          target: `https://www.youtube.com/watch?v=${v.id.videoId}`,
        },
        {
          label: "🔔 Subscribe",
          type: "link",
          target: `https://www.youtube.com/channel/${CHANNEL_ID}?sub_confirmation=1`,
        }
      ],
    },
  };
}

/* =====================================
   UNIFIED ENDPOINT (/frame)
   Dokumentasi menyarankan satu URL bisa 
   melayani HTML dan JSON Snap sekaligus.
   ===================================== */
app.get("/frame", async (req: Request, res: Response) => {
  const acceptHeader = req.headers.accept || "";
  const snapType = "application/vnd.farcaster.snap+json";

  // A. Jika request meminta JSON Snap (Content Negotiation)
  if (acceptHeader.includes(snapType)) {
    try {
      const snapJson = await generateSnapJson();
      res.setHeader("Content-Type", snapType);
      return res.json(snapJson);
    } catch (err) {
      return res.status(500).json({ error: "Snap failed" });
    }
  }

  // B. Jika request dari Browser biasa (HTML)
  res.setHeader("Vary", "Accept"); // Penting untuk caching
  res.setHeader("Link", `<https://${req.get("host")}/frame>; rel="alternate"; type="${snapType}"`);
  
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>YouTube Snap</title>
        <meta property="fc:snap:version" content="1">
      </head>
      <body style="font-family:sans-serif;text-align:center;padding-top:50px;">
        <h2>🎬 YT-Snap Ready</h2>
        <p>Buka URL ini di Warpcast.</p>
      </body>
    </html>
  `);
});

// Endpoint /snap tetap ada sebagai cadangan
app.get("/snap", async (req: Request, res: Response) => {
  try {
    const snapJson = await generateSnapJson();
    res.setHeader("Content-Type", "application/vnd.farcaster.snap+json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(snapJson);
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
