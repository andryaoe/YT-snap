/* =============================== SNAP DISCOVERY PAGE =============================== */
app.get("/frame", (req, res) => {
  // Pastikan URL di bawah ini adalah URL publik Railway Anda yang mengarah ke JSON /snap
  res.setHeader(
    "Link",
    `<https://yt-snap-production.up.railway.app/snap>; rel="alternate"; type="application/vnd.farcaster.snap+json"`
  );
  
  // Tambahkan Content-Type HTML agar crawler yakin ini halaman web
  res.setHeader("Content-Type", "text/html");
  
  res.send(`
    <html>
      <head>
        <title>YouTube Snap</title>
        <meta property="fc:snap:version" content="1">
        <meta property="fc:snap:url" content="https://yt-snap-production.up.railway.app/snap">
      </head>
      <body style="font-family:sans-serif;text-align:center;padding-top:40px">
        <h2>🎬 Farcaster Snap Ready</h2>
        <p>Open this link in Warpcast to see the Snap.</p>
      </body>
    </html>
  `);
});

/* =============================== SNAP JSON ENDPOINT =============================== */
app.get("/snap", async (req, res) => {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?` +
      `key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=1`;

    const yt = await fetch(url);
    const data: any = await yt.json();
    const v = data.items[0];

    const videoId = v.id.videoId;
    const title = v.snippet.title;
    const thumbnail = v.snippet.thumbnails.high.url;

    // WAJIB: Atur Content-Type JSON Snap
    res.setHeader("Content-Type", "application/vnd.farcaster.snap+json");
    res.setHeader("Access-Control-Allow-Origin", "*"); // Izinkan Farcaster menarik data

    res.json({
      version: "1",
      type: "snap", // HARUS ADA
      content: {    // SEMUA PROPERTI VISUAL HARUS DI DALAM CONTENT
        body: title,
        image: thumbnail,
        buttons: [
          {
            label: "▶️ Play Video",
            type: "link", // Gunakan 'type', bukan 'action' (tergantung versi SDK yang dipakai)
            target: `https://www.youtube.com/watch?v=${videoId}`,
          },
          {
            label: "🔔 Subscribe",
            type: "link",
            target: `https://www.youtube.com/channel/${CHANNEL_ID}?sub_confirmation=1`,
          },
          {
            label: "🔁 Share",
            type: "link",
            target: `https://warpcast.com/~/compose?text=Watch this video&embeds[]=https://yt-snap-production.up.railway.app/frame`,
          }
        ],
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Snap error" });
  }
});
