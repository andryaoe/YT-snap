import express, { Request, Response } from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// CORS super longgar agar tidak diblokir emulator
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Accept"]
}));

const API_KEY = process.env.YOUTUBE_API_KEY || "";
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || "";

app.get("/frame", async (req: Request, res: Response) => {
  const snapType = "application/vnd.farcaster.snap+json";
  
  // Deteksi jika yang memanggil adalah Farcaster (lewat Accept header)
  if (req.headers.accept?.includes(snapType)) {
    try {
      const ytUrl = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=1`;
      const ytResponse = await fetch(ytUrl);
      const data: any = await ytResponse.json();
      
      const v = data.items[0];
      const title = v.snippet.title;
      const thumbnail = v.snippet.thumbnails.high.url;

      // Set header secara manual dan tegas
      res.setHeader("Content-Type", snapType);
      res.setHeader("Access-Control-Allow-Origin", "*");
      
      return res.status(200).json({
        version: "1",
        type: "snap",
        content: {
          body: title,
          image: thumbnail
          // Tombol dihapus sementara untuk memastikan tidak ada error URL
        }
      });
    } catch (err) {
      res.setHeader("Content-Type", snapType);
      return res.status(200).json({
        version: "1",
        type: "snap",
        content: { body: "Gagal mengambil data YouTube" }
      });
    }
  }

  // Tampilan Browser & Header Discovery
  res.setHeader("Link", `<https://${req.get("host")}/frame>; rel="alternate"; type="${snapType}"`);
  res.send(`
    <html>
      <head><meta property="fc:snap:version" content="1"></head>
      <body style="text-align:center;padding:50px;">
        <h2>YT-Snap Server Active</h2>
        <p>Gunakan link ini di Warpcast.</p>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on ${PORT}`));
