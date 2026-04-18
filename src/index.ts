import express from "express";
import { getVideos } from "./youtube.js";

const app = express();

app.get("/", (req, res) => {
  res.send("YT Snap API running");
});

app.get("/videos", async (req, res) => {
  const pageToken = req.query.pageToken as string | undefined;

  try {
    const data = await getVideos(pageToken);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});


// ===============================
// FARCASTER FRAME ROUTE
// ===============================
app.get("/frame", async (req, res) => {
  try {
    const data = await getVideos();
    const video = data.items[0];

    const videoUrl = `https://youtube.com/watch?v=${video.id}`;
    const thumbnail = video.thumbnail;
    const title = video.title;

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="og:title" content="${title}" />
          <meta property="og:image" content="${thumbnail}" />

          <meta name="fc:frame" content="vNext" />
          <meta name="fc:frame:image" content="${thumbnail}" />

          <meta name="fc:frame:button:1" content="▶️ Watch Video" />
          <meta name="fc:frame:button:1:action" content="link" />
          <meta name="fc:frame:button:1:target" content="${videoUrl}" />

          <meta name="fc:frame:button:2" content="🔔 Subscribe" />
          <meta name="fc:frame:button:2:action" content="link" />
          <meta name="fc:frame:button:2:target" content="https://youtube.com/channel/UCtsoONeSvOP-RznVk0iYOGw" />

          <meta name="fc:frame:button:3" content="🔁 Share Cast" />
          <meta name="fc:frame:button:3:action" content="link" />
          <meta name="fc:frame:button:3:target" content="https://warpcast.com/~/compose?text=Check%20this%20video%20🔥%20${videoUrl}" />
        </head>
        <body>
          Latest video frame
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send("Frame error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running " + PORT));
