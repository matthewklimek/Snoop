import Head from 'next/head';
import AudioResponse from '../components/audioResponse';

export default function Home() {
  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta
          name="description"
          content="A web app that used OpenAI's API to communicate with a Snoop Dogg inspired Chatbot"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <AudioResponse />
    </>
  );
}
