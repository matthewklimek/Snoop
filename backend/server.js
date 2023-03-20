const express = require('express');
const app = express();
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();
const fs = require('fs');
const { Configuration, OpenAIApi } = require('openai');

app.use(cors());

app.use(express.json());

// handles making the uploaded files accessible to the client
app.use(express.static('public'));

const configuration = new Configuration({
  organization: 'org-6cApuEw88AGKMz9mnH2fRxQB',
  apiKey: process.env.OPENAI_API_KEY,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

const openai = new OpenAIApi(configuration);

app.post('/convert-text-to-speech', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }
  // const filename = req.file.filename;

  const m4aFilePath = `./public/AskingSnoop1.m4a`;
  console.log(m4aFilePath);
  console.log('file exists: ', fs.existsSync(m4aFilePath));
  const m4aFile = fs.createReadStream(m4aFilePath);
  // console.log('m4afile: ', m4aFile);
  const transcription = await openai.createTranscription(m4aFile, 'whisper-1');

  res.status(200).json(transcription.data);
});

app.post('/get-chat-response', async (req, res) => {
  const messages = req.body;

  const chatGPT = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages,
  });

  const chatGPTMessage = chatGPT.data.choices[0].message;

  if (!chatGPTMessage) {
    throw new Error("OpenAI's message doesn't exist.");
  }

  res.status(200).json(chatGPTMessage);
});

app.get('/', (req, res) => {
  res.status(200).json({ Hello: 'World' });
});

app.post('/', (req, res) => {
  console.log(req.body);
  res.status(200).json({ Hello: 'World' });
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
