import express from "express";
const app = express();
// route test supaya tidak 404
app.get("/", (req, res) => {
    res.send("Railway API is running 🚀");
});
// Railway wajib pakai PORT dari environment
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
