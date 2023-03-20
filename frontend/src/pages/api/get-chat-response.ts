// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  ChatCompletionRequestMessageRoleEnum,
  Configuration,
  OpenAIApi,
} from 'openai';

type Data = {};

const configuration = new Configuration({
  organization: 'org-6cApuEw88AGKMz9mnH2fRxQB',
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const userMessage: string = req.body;

  const messages = req.body;
  console.log(messages);

  const chatGPT = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages,
  });

  const chatGPTMessage = chatGPT.data.choices[0].message;
  // console.log(chatGPTMessage);

  if (!chatGPTMessage) {
    throw new Error("OpenAI's message doesn't exist.");
  }

  res.status(200).json(chatGPTMessage);
}
