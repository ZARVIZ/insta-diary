import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/generate-caption", async (req, res) => {
  try {
    const { text, theme } = req.body;

    const prompt = `
You are a creative caption generator.
Generate a short emotional caption (1 line only).
Theme: ${theme}
Diary text: ${text}
Caption:
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
    });

    const caption = response.choices[0].message.content.trim();

  res.json({ caption });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate caption" });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});