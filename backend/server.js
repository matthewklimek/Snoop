const express = require("express");
const { Readable } = require("stream");
const axios = require("axios");
const app = express();
const cors = require("cors");
const multer = require("multer");
const path = require("path");
require("dotenv").config();
const fs = require("fs");
const { Configuration, OpenAIApi } = require("openai");

app.use(cors());

app.use(express.json());

// handles making the uploaded files accessible to the client
app.use(express.static("public"));

const configuration = new Configuration({
  organization: "org-6cApuEw88AGKMz9mnH2fRxQB",
  apiKey: process.env.OPENAI_API_KEY,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

const openai = new OpenAIApi(configuration);

const messages = [
  {
    role: "system",
    content:
      "You are Snoop Dogg. You talk just like Snoop Dogg, and are friendly and positve. You like to have fun and love making jokes and playfull teasing your conversational partner when the opportunity presents itself.",
  },
];

app.post("/create-transcription", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  try {
    const uploadedAudioStream = fs.createReadStream(req.file.path);
    const transcription = await openai.createTranscription(
      uploadedAudioStream,
      "whisper-1"
    );
    const text = transcription.data.text;

    messages.push({ role: "user", content: text });
    res.status(200).json(text);
  } catch (error) {
    res.status(500).json(`Error transcribing audio: ${error.message}`);
    throw new Error("Error transcribing audio:", error);
  }
});

app.post("/create-chat-completion", async (req, res) => {
  try {
    const chatGPT = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages,
    });

    const chatGPTMessage = chatGPT.data.choices[0].message;
    if (!chatGPTMessage) {
      throw new Error("OpenAI's message didn't get generated");
    }

    messages.push({ role: "assistant", content: chatGPTMessage.content });
    res.status(200).json(chatGPTMessage.content);
  } catch (error) {
    console.error("Error with openai's chat completion:", error);
    res.status(500).json({ message: "Error with openai's chat completion" });
  }
});

app.post("/create-audio-stream", async (req, res) => {
  try {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_SNOOP_ID}/stream`;

    const headers = {
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": process.env.ELEVENLABS_API_KEY,
    };

    const data = {
      text: req.body.chatCompletion,
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.85,
      },
    };

    const response = await axios.post(url, data, {
      headers: headers,
      responseType: "stream",
    });

    // Set response headers for the stream
    res.setHeader("Content-Type", "audio/mpeg");

    response.data.pipe(res);
  } catch (error) {
    console.error("Request error:", error);
    res.status(500).send("Error fetching audio stream");
  }
});

app.get("/", (req, res) => {
  res.status(200).json({ Hello: "World" });
});

app.post("/", (req, res) => {
  res.status(200).json({ Hello: "World" });
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
