import express from "express";
import fetch from "node-fetch";
const app = express();
const PORT = process.env.PORT || 3000;
// endpoint JSON videos (SUDAH ADA)
app.get("/videos", async (req, res) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=6`;
    const yt = await fetch(url);
    const data = await yt.json();
    const videos = data.items
        .filter((v) => v.id.videoId)
        .map((v) => ({
        id: v.id.videoId,
        title: v.snippet.title,
        thumbnail: v.snippet.thumbnails.high.url,
    }));
    res.json({ videos });
});
// ⭐ ENDPOINT FRAME (INI YG PALING PENTING)
app.get("/", async (req, res) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=1`;
    const yt = await fetch(url);
    const data = await yt.json();
    const video = data.items[0];
    const videoId = video.id.videoId;
    const title = video.snippet.title;
    const thumbnail = video.snippet.thumbnails.high.url;
    const watchUrl = `https://youtube.com/watch?v=${videoId}`;
    const subscribeUrl = `https://youtube.com/channel/${channelId}?sub_confirmation=1`;
    res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>${title}</title>

    <meta property="og:title" content="${title}" />
    <meta property="og:image" content="${thumbnail}" />

    <meta name="fc:frame" content="vNext" />
    <meta name="fc:frame:image" content="${thumbnail}" />

    <meta name="fc:frame:button:1" content="▶ Play Video" />
    <meta name="fc:frame:button:1:action" content="link" />
    <meta name="fc:frame:button:1:target" content="${watchUrl}" />

    <meta name="fc:frame:button:2" content="🔔 Subscribe" />
    <meta name="fc:frame:button:2:action" content="link" />
    <meta name="fc:frame:button:2:target" content="${subscribeUrl}" />

    <meta name="fc:frame:button:3" content="🔁 Share Frame" />
    <meta name="fc:frame:button:3:action" content="post" />
  </head>
  <body>
    Latest video frame
  </body>
  </html>
  `);
});
app.listen(PORT, () => console.log("Server running"));
