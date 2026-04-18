import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const API = "https://yt-snap-production.up.railway.app/videos";

app.get("/", (req, res) => {
  res.send("YT SNAP API RUNNING");
});

app.get("/frame", async (req, res) => {
  try {
    const r = await fetch(API);
    const data: any = await r.json();
    const video = data.videos[0];

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>YT Snap</title>

        <meta property="og:title" content="${video.title}" />
        <meta property="og:image" content="${video.thumbnail}" />

        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${video.thumbnail}" />

        <meta property="fc:frame:button:1" content="▶️ Watch" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="https://youtube.com/watch?v=${video.id}" />

        <meta property="fc:frame:button:2" content="❤️ Subscribe" />
        <meta property="fc:frame:button:2:action" content="link" />
        <meta property="fc:frame:button:2:target" content="https://youtube.com/channel/${process.env.YOUTUBE_CHANNEL_ID}" />

        <meta property="fc:frame:button:3" content="🔁 Share" />
        <meta property="fc:frame:button:3:action" content="link" />
        <meta property="fc:frame:button:3:target" content="https://warpcast.com/~/compose?text=Check%20this%20video" />
      </head>
      <body>
        Frame Ready
      </body>
    </html>
    `;

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (err) {
    res.send("Frame error");
  }
});

app.listen(PORT, () => console.log("Server running"));
