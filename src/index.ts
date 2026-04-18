import express from "express";
import fetch from "node-fetch";

const app = express();
const port = process.env.PORT || 3000;

const API_KEY = process.env.YOUTUBE_API_KEY!;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID!;

app.get("/", (req, res) => {
  res.send("YT Snap API running 🚀");
});

//
// 1️⃣ Endpoint ambil video terbaru
//
app.get("/videos", async (req, res) => {
  try {
    const ytUrl =
      `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}` +
      `&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=1`;

    const response = await fetch(ytUrl);
    const data = await response.json();

    const video = data.items[0];

    res.json({
      title: video.snippet.title,
      thumbnail: video.snippet.thumbnails.high.url,
      videoId: video.id.videoId,
      url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
    });
  } catch (err) {
    res.status(500).send("Error fetching YouTube");
  }
});

//
// 2️⃣ ⭐ ENDPOINT FRAME FARCASTER ⭐
//
app.get("/frame", async (req, res) => {
  try {
    const ytUrl =
      `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}` +
      `&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=1`;

    const response = await fetch(ytUrl);
    const data = await response.json();
    const video = data.items[0];

    const videoUrl = `https://www.youtube.com/watch?v=${video.id.videoId}`;
    const thumbnail = video.snippet.thumbnails.high.url;
    const title = video.snippet.title;

    res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="og:title" content="${title}" />
        <meta property="og:image" content="${thumbnail}" />

        <meta name="fc:frame" content="vNext" />
        <meta name="fc:frame:image" content="${thumbnail}" />
        <meta name="fc:frame:button:1" content="▶️ Play Video" />
        <meta name="fc:frame:button:1:action" content="link" />
        <meta name="fc:frame:button:1:target" content="${videoUrl}" />

        <meta name="fc:frame:button:2" content="🔔 Subscribe" />
        <meta name="fc:frame:button:2:action" content="link" />
        <meta name="fc:frame:button:2:target" content="https://www.youtube.com/channel/${CHANNEL_ID}" />

      </head>
      <body>
        Farcaster Frame Ready
      </body>
    </html>
    `);
  } catch (err) {
    res.status(500).send("Frame error");
  }
});

app.listen(port, () => {
  console.log("Server running on port " + port);
});
