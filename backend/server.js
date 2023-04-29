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
    content: "You are Snoop Dogg and and you make great conversation",
  },
];

const createTranscription = async (uploadedAudioPath) => {
  try {
    const uploadedAudioStream = fs.createReadStream(uploadedAudioPath);
    const transcription = await openai.createTranscription(
      uploadedAudioStream,
      "whisper-1"
    );
    const text = transcription.data.text;

    messages.push({ role: "user", content: text });
    return messages;
  } catch (error) {
    throw new Error("Error transcribing audio:", error);
  }
};

const createChatCompletion = async (messages) => {
  try {
    const chatGPT = await openai.createChatCompletion({
      model: "gpt-4",
      messages,
    });

    const chatGPTMessage = chatGPT.data.choices[0].message;
    if (!chatGPTMessage) {
      throw new Error("OpenAI's message didn't get generated");
    }

    messages.push({ role: "assistant", content: chatGPTMessage.content });
    return chatGPTMessage.content;
  } catch (error) {
    console.error("Error with openai's chat completion:", error);
    throw error;
  }
};

const createAudioStream = async (textResponse) => {
  try {
    const CHUNK_SIZE = 1024;
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_SNOOP_ID}/stream`;

    const headers = {
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": process.env.ELEVENLABS_API_KEY,
    };

    const data = {
      text: textResponse,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.76,
      },
    };

    const response = await axios({
      method: "post",
      url: url,
      data: data,
      headers: headers,
      responseType: "stream",
    });

    const audioStream = new Readable({
      read(size) {
        // Do nothing
      },
      destroy(err, callback) {
        response.data.destroy();
        callback(err);
      },
    });

    response.data.on("data", (chunk) => {
      audioStream.push(chunk);
    });

    response.data.on("end", () => {
      audioStream.push(null);
    });

    return audioStream;
  } catch (error) {
    console.error("Request error:", error);
    throw new Error("Error fetching audio stream");
  }
};

app.post(
  "/respond-to-input-audio",
  upload.single("audio"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const messages = await createTranscription(req.file.path);

    const textResponse = await createChatCompletion(messages);

    const audioStream = await createAudioStream(textResponse);

    console.log(messages);

    res.setHeader("Content-Type", "audio/mpeg");
    audioStream.pipe(res);
  }
);

app.get("/", (req, res) => {
  res.status(200).json({ Hello: "World" });
});

app.post("/", (req, res) => {
  console.log(req.body);
  res.status(200).json({ Hello: "World" });
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
