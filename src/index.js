import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

async function getLatestVideo() {
  const url =
    `https://www.googleapis.com/youtube/v3/search?` +
    `key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=1`;

  const res = await fetch(url);
  const data = await res.json();
  const video = data.items[0];

  return {
    id: video.id.videoId,
    title: video.snippet.title,
    thumbnail: video.snippet.thumbnails.high.url
  };
}

app.get("/snap", async (req, res) => {
  const accept = req.headers.accept || "";

  // Jika request dari Farcaster → kirim SNAP JSON
  if (accept.includes("application/vnd.farcaster.snap+json")) {
    const video = await getLatestVideo();

    return res.json({
      version: "1",
      title: "My YouTube Channel",
      image: video.thumbnail,
      buttons: [
        {
          label: "▶️ Watch",
          action: {
            type: "open_url",
            url: `https://youtube.com/watch?v=${video.id}`
          }
        },
        {
          label: "🔔 Subscribe",
          action: {
            type: "open_url",
            url: `https://youtube.com/channel/${CHANNEL_ID}`
          }
        },
        {
          label: "📣 Share",
          action: {
            type: "open_url",
            url: "https://warpcast.com/~/compose?text=Check%20this%20video!"
          }
        }
      ]
    });
  }

  // fallback kalau dibuka browser biasa
  res.send("YT Snap is running 🚀");
});

app.listen(3000, () => console.log("Server running on port 3000"));
