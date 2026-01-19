import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();

// /* ✅ ALLOWED ORIGINS */
// const allowedOrigins = [
//   "ai-powerd-frontend.vercel.app",

// ];

app.use(cors({origin:"https://ai-powerd.up.railway.app"}))

app.use(express.json());

const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/* ✅ HEALTH CHECK */
app.get("/", (req, res) => {
  res.send("AI Code Review API is running");
});

/* ✅ REVIEW ENDPOINT */
app.post("/review", async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code?.trim()) {
      return res.status(400).json({ error: "Code is required" });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "Missing Gemini API key" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a strict senior software engineer.
Review the following ${language}.
Return only markdown with sections:
## Summary
## Bugs
## Improvements

${code}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    const review =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text)
        .join("") || "No response from AI";

    res.json({ review });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
