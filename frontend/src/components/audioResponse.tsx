import axios from "axios";
import styles from "@/styles/Home.module.css";
import React, { useState, useEffect, useRef } from "react";

const AudioResponse: React.FC = () => {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const [text, setText] = useState("");
  const [payload, setPayload] = useState([
    {
      role: "system",
      content: "You are Snoop Dogg, and you make fantastic conversation.",
    },
  ]);
  const [messages, setMessages] = useState(payload);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleToggleRecording = () => {
    if (recording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  const handleStartRecording = () => {
    setRecording(true);

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      mediaRecorder.current = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.current.addEventListener(
        "dataavailable",
        (event: BlobEvent) => {
          audioChunks.push(event.data);
        }
      );

      mediaRecorder.current.addEventListener("stop", async () => {
        const newAudioBlob = new Blob(audioChunks);
        setAudioBlob(newAudioBlob);
        setProcessing(false);
        await handleSendAudio(newAudioBlob);
      });

      mediaRecorder.current.start();
      setProcessing(false);
    });
  };

  const handleStopRecording = () => {
    setRecording(false);

    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
    }
  };

  const handleSendAudio = async (audio: Blob) => {
    console.log(!audio);
    if (!audio) return;

    const formData = new FormData();
    formData.append("audio", audio, "recording.wav");

    try {
      // Fetch audio stream
      const audioResponse = await axios.post(
        "http://localhost:3000/respond-to-input-audio",
        formData,
        { responseType: "blob" } // specify the response type as "blob"
      );

      if (audioResponse.status === 200) {
        const mediaSource = new MediaSource();
        const audio = audioRef.current;
        if (audio) {
          audio.src = URL.createObjectURL(mediaSource);

          mediaSource.addEventListener("sourceopen", async () => {
            const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
            const blob = await audioResponse.data;
            const stream = blob.stream(); // create a ReadableStream from the Blob

            if (stream) {
              const reader = stream.getReader(); // get the stream reader

              // Play the audio after appending the first chunk
              let isFirstChunk = true;
              while (true) {
                const { done, value } = await reader.read();

                if (done) {
                  mediaSource.endOfStream();
                  break;
                }

                if (value) {
                  sourceBuffer.appendBuffer(value);

                  if (isFirstChunk) {
                    isFirstChunk = false;
                    audio.play();
                  }

                  // Add a delay between appending chunks to the buffer
                  await new Promise((resolve) => setTimeout(resolve, 100));
                }
              }
            }
          });
        }
      } else {
        console.error("Failed to fetch audio stream");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <>
      <main>
        <div className="w-screen h-screen flex flex-col items-center justify-center">
          <h1 className="text-3xl pb-20">Snoop GPT-4</h1>
          <div className="aspect-square w-full max-w-xl p-10">
            <button
              className="w-full h-full rounded-full bg-blue-500 text-white font-bold ring-8 ring-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 hover:bg-blue-600 transition duration-200 ease-in-out cursor-pointer "
              onClick={handleToggleRecording}
              disabled={processing}
            >
              {recording ? "He's Listening" : "Press to Start Recording"}
            </button>
          </div>
        </div>
        {/* {audioBlob && <audio src={URL.createObjectURL(audioBlob)} controls />} */}
        <audio ref={audioRef} controls autoPlay hidden>
          Your browser does not support the audio element.
        </audio>
      </main>
    </>
  );
};

export default AudioResponse;
