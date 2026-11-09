
require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/generate", async (req, res) => {
    try {
        const { prompt, width = 512, height = 512 } = req.body;

        if (!process.env.POLLINATIONS_API_KEY) {
            return res.status(500).json({ error: "API key missing." });
        }

        if (!prompt || !prompt.trim()) {
            return res.status(400).json({ error: "Enter a prompt." });
        }

        const url = new URL(
            "https://gen.pollinations.ai/image/" +
            encodeURIComponent(prompt.trim())
        );

        url.searchParams.set("model", "black-forest-labs/flux.1-schnell");
        url.searchParams.set("width", String(width));
        url.searchParams.set("height", String(height));

        console.log("Generating:", prompt);

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${process.env.POLLINATIONS_API_KEY}`
            },
            signal: AbortSignal.timeout(180000)
        });

        if (!response.ok) {
            const details = await response.text();
            console.error("Pollinations:", response.status, details);

            return res.status(response.status).json({
                error: `Image service error: HTTP ${response.status}`
            });
        }

        const image = Buffer.from(await response.arrayBuffer());

        res.setHeader(
            "Content-Type",
            response.headers.get("content-type") || "image/jpeg"
        );

        res.setHeader("Cache-Control", "no-store");
        res.send(image);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Generation failed: " + error.message
        });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log("Picture Generator running at http://localhost:3000");
});
