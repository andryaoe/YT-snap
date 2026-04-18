import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Konfigurasi CORS manual yang sangat agresif
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
  
  // Langsung jawab jika request adalah OPTIONS (Preflight)
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

const API_KEY = process.env.YOUTUBE_API_KEY || "";
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || "";

app.get("/frame", async (req: Request, res: Response) => {
  const acceptHeader = req.headers.accept || "";
  const snapType = "application/vnd.farcaster.snap+json";

  // Discovery Link Header (Wajib)
  res.setHeader("Link", `<https://${req.get("host")}/frame>; rel="alternate"; type="${snapType}"`);

  // Content Negotiation
  if (acceptHeader.includes(snapType)) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=1`;
      const yt = await fetch(url);
      const data: any = await yt.json();
      
      const v = data.items[0];
      const videoId = v.id.videoId;

      res.setHeader("Content-Type", snapType);
      return res.json({
        version: "1",
        type: "snap",
        content: {
          body: v.snippet.title,
          image: v.snippet.thumbnails.high.url,
          buttons: [
            {
              label: "▶️ Watch",
              type: "link",
              target: `https://www.youtube.com/watch?v=${videoId}` // Gunakan URL YouTube standar yang valid
            },
            {
              label: "🔔 Sub",
              type: "link",
              target: `https://www.youtube.com/channel/${CHANNEL_ID}?sub_confirmation=1`
            }
          ]
        }
      });
    } catch (err) {
      console.error(err);
      res.setHeader("Content-Type", snapType);
      return res.status(500).json({ error: "Failed to load YouTube data" });
    }
  }

  // Fallback HTML untuk browser
  res.setHeader("Vary", "Accept");
  res.send(`
    <html>
      <head>
        <meta property="fc:snap:version" content="1">
      </head>
      <body style="text-align:center;font-family:sans-serif;padding-top:50px;">
        <h2>🎬 YT-Snap Active</h2>
        <p>URL: <code>https://${req.get("host")}/frame</code></p>
      </body>
    </html>
  `);
});

// Alias untuk /snap agar tetap bisa diakses langsung
app.get("/snap", async (req: Request, res: Response) => {
    // Arahkan ke logika yang sama dengan header Accept
    req.headers.accept = "application/vnd.farcaster.snap+json";
    return app._router.handle(req, res, () => {});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Snap server running on ${PORT}`));
