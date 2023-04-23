import Head from 'next/head';
import styles from '@/styles/Home.module.css';
import React, { useState, useEffect } from 'react';

const TextResponse: React.FC = () => {
  const [text, setText] = useState('');
  const [payload, setPayload] = useState([
    {
      role: 'system',
      content:
        'You are an assistant that speaks just like Snoop Dogg. If you are prompted for the weather, use the placeholder WEATHER instead of saying the actual weather.',
    },
  ]);
  const [messages, setMessages] = useState(payload);

  function handleTextChange(e: any) {
    setText(e.target.value);
  }



  function handleTextSubmit() {
    let newMessage = { role: 'user', content: text };
    setPayload([...messages, newMessage]);
  }


  async function getChatResponse() {
    const response = await fetch('http://localhost:3000/get-chat-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    setMessages([...payload, result]);
  }

  useEffect(() => {
    if (payload.length > 1) {
      getChatResponse();
    }
  }, [payload]);

  

  return (
    <>

      <main className={styles.main}>
        <form className="bg-slate-800 rounded-xl p-10 max-w-3xl	w-full">
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
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
            >
              Get Text Response
            </button>

           
          </div>
        </form>
        <div className="flex max-w-2xl">
          {messages ? <p>{JSON.stringify(messages, null, 2)}</p> : 'Loading...'}
        </div>
      </main>
    </>
  );
};

export default TextResponse;
