import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors({origin:"https://ai-powerd-frontend.onrender.com"}));
app.use(express.json());

const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post("/review", async (req, res) => {
    try {
        const { code, language } = req.body;

        if (!code) return res.status(400).json({ message: "Code is required" });
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: "Missing API key on server" });
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
                                    text: `You are a strict and concise code reviewer. 
Review the following ${language || "code"} and output your review directly as text, not reasoning steps.
Provide 3 sections: Summary, Bugs, Improvements.\n\n${code}`
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.7,
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
            data?.candidates[0]?.content?.parts?.map((part) => part.text)?.join('') || 'No response from AI Model';

        res.json({ review });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/", (req, res) => res.send("Server is running"));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
