import express from "express";
import { getVideos } from "./youtube.js";
const app = express();
app.get("/", (req, res) => {
    res.send("YT Snap API running 🚀");
});
app.get("/videos", async (req, res) => {
    const pageToken = req.query.pageToken;
    try {
        const data = await getVideos(pageToken);
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch videos" });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
