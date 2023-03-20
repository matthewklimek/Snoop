// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import nextConnect from 'next-connect';
// import { Configuration, OpenAIApi } from 'openai';

type Data = {};

// const configuration = new Configuration({
//   organization: 'org-6cApuEw88AGKMz9mnH2fRxQB',
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const openai = new OpenAIApi(configuration);
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads');
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    const filename = `${file.fieldname}-${Date.now()}.${ext}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });

const handler = nextConnect<NextApiRequest, NextApiResponse>();

handler.use(upload.single('file'));

handler.post((req, res) => {
  try {
    const file = (req as any).file;
    console.log('File uploaded:', file.filename);
    res.status(200).json({ filename: file.filename });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed.' });
  }
});

export default handler;

// const resp = await openai.createTranscription(
//   fs.createReadStream('audio.mp3'),
//   'whisper-1'
// );

//   if (!chatGPTMessage) {
//     throw new Error("OpenAI's message doesn't exist.");
//   }
