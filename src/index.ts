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
  const acceptHeader = req.headers.accept || "";
  const snapType = "application/vnd.farcaster.snap+json";

  // A. Jika request meminta JSON Snap
  if (acceptHeader.includes(snapType) || req.query.json === "true") {
    try {
      const ytUrl = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=1`;
      const ytResponse = await fetch(ytUrl);
      const data: any = await ytResponse.json();
      
      if (!data.items || data.items.length === 0) {
        throw new Error("No video found");
      }

      const videoId = data.items[0].id.videoId;
      const title = data.items[0].snippet.title;
      const thumbnail = data.items[0].snippet.thumbnails.high.url;

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
              label: "🔁 Share Snap",
              type: "link",
              target: `https://warpcast.com/~/compose?text=Check out this video!&embeds[]=https://${req.get("host")}/frame`
            }
          ]
        }
      });
    } catch (err) {
      res.setHeader("Content-Type", snapType);
      return res.status(500).json({ error: "YouTube API Error" });
    }
  }

  // B. Jika request dari Browser (HTML Discovery)
  res.setHeader("Link", `<https://${req.get("host")}/frame>; rel="alternate"; type="${snapType}"`);
  res.send(`
    <html>
      <head>
        <meta property="fc:snap:version" content="1">
        <meta property="fc:snap:url" content="https://${req.get("host")}/frame">
      </head>
      <body style="text-align:center;padding-top:50px;font-family:sans-serif;">
        <h2>🎬 YouTube Snap Status: Active</h2>
        <p>Gunakan link ini di Farcaster.</p>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
