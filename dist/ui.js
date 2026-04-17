export function buildVideoUI(video) {
    return {
        type: "vstack",
        children: [
            {
                type: "image",
                src: video.thumbnail,
                aspectRatio: "16:9"
            },
            {
                type: "text",
                value: video.title,
                size: "lg",
                weight: "bold"
            },
            {
                type: "hstack",
                children: [
                    { type: "button", label: "⬅ Prev", action: "prev" },
                    { type: "button", label: "▶ Play", url: `https://youtu.be/${video.id}` },
                    { type: "button", label: "Next ➡", action: "next" }
                ]
            },
            {
                type: "hstack",
                children: [
                    {
                        type: "button",
                        label: "Subscribe",
                        url: "https://youtube.com/channel/UCtsoONeSvOP-RznVk0iYOGw?sub_confirmation=1"
                    },
                    {
                        type: "button",
                        label: "Share Snap",
                        action: "share"
                    }
                ]
            }
        ]
    };
}
