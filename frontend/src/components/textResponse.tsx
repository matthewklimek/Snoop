import Head from 'next/head';
import styles from '@/styles/Home.module.css';
import React, { useState, useEffect, useRef } from 'react';

const TextResponse: React.FC = () => {
  const [text, setText] = useState('');
  const [payload, setPayload] = useState([
    {
      role: 'system',
      content:
        'You are Snoop Dogg, and you make fantastic conversation.',
    },
  ]);
  const [messages, setMessages] = useState(payload);
  const audioRef = useRef<HTMLAudioElement>(null);

  function handleTextChange(e: any) {
    setText(e.target.value);
  }

  function handleTextSubmit() {
    let newMessage = { role: 'user', content: text };
    setPayload([...messages, newMessage]);
  }

  async function getChatResponse() {
    // Fetch JSON data
    const jsonResponse = await fetch('http://localhost:3000/get-text-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    let result = await jsonResponse.json();
    setMessages([...payload, result]);
    

    // Fetch audio stream
    const audioResponse = await fetch('http://localhost:3000/convert-text-to-audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    });
    if (audioResponse.ok) {
      const mediaSource = new MediaSource();
      const audio = audioRef.current;
      if (audio) {
        audio.src = URL.createObjectURL(mediaSource);

        mediaSource.addEventListener('sourceopen', async () => {
          const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg'); // Replace 'audio/mpeg' with the appropriate mime type for your audio format
          const reader = audioResponse.body?.getReader();

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                mediaSource.endOfStream();
                break;
              }

              if (value) {
                sourceBuffer.appendBuffer(value);
                // Add a delay between appending chunks to the buffer
                await new Promise((resolve) => setTimeout(resolve, 100));
              }
            }
          }
        });
      }
    } else {
      console.error('Failed to fetch audio stream');
      console.log(audioResponse);
    }
  }

  useEffect(() => {
    if (payload.length > 1) {
      getChatResponse();
    }
  }, [payload]);

  return (
    <>
      <main className={styles.main}>
        <form className="bg-slate-800 rounded-xl p-10 max-w-3xl w-full mb-5">
          <div className="flex flex-col items-center justify-center space-y-8">
            <h2 className="text-2xl border-b pb-2">
              I'm SnoopGPT! Ask me anything, playa!
            </h2>
            <textarea
              value={text}
              onChange={handleTextChange}
              rows={10}
              className="bg-white text-slate-900 rounded-md w-full p-2 max-w-lg"
            />
            <button
              onClick={handleTextSubmit}
              type="button"
              className="text-white bg-blue-700 hover:bg-blue-800 focus::ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
              >
                Get Response
              </button>
              <audio ref={audioRef} controls autoPlay className="hidden">
                Your browser does not support the audio element.
              </audio>
            </div>
          </form>
          <div className="flex flex-col max-w-3xl w-full">
          {messages && messages.map((message, index) => (
            <div key={index} className={`${message.role === 'assistant' ? 'self-start bg-slate-800' : message.role === 'user' ? 'self-end bg-blue-600' : 'hidden' } p-5 rounded-lg mb-5 max-w-lg`}>
             <p > {`${message.content}`}</p>
             </div>
          ))}
          </div>
        </main>
      </>
    );
  };
  
  export default TextResponse;
