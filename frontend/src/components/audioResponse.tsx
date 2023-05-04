import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import { MicIcon } from "./mic-icon";
const AudioResponse: React.FC = () => {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  // const mediaSource = useRef(new MediaSource());
  const [progressBar, setProgressBar] = useState(0);
  const [isResponding, setIsResponding] = useState(false);
  type Message = {
    role: string;
    content: any;
    file?: Blob;
    url?: string;
  };
  const [messages, setMessages] = useState<Message[]>([]);

  const updateMessages = async (
    message: { role: string; content: any },
    file?: Blob
  ) => {
    if (file) {
      // If a file is provided, update the last message with the file and URL
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        const lastMessageIndex = updatedMessages.length - 1;
        const lastMessage = updatedMessages[lastMessageIndex];
        updatedMessages[lastMessageIndex] = {
          ...lastMessage,
          file,
          url: URL.createObjectURL(file),
        };
        return updatedMessages;
      });
    } else {
      // If no file is provided, add a new message
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, message];
        return updatedMessages;
      });
    }
  };

  const addAssistantMessageWithAudio = async (
    message: { role: string; content: any },
    audioBlob: Blob
  ) => {
    setMessages((prevMessages) => {
      const updatedMessages = [
        ...prevMessages,
        {
          ...message,
          file: audioBlob,
          url: URL.createObjectURL(audioBlob),
        },
      ];
      return updatedMessages;
    });
  };

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
        await handleSendAudio(newAudioBlob);
      });

      mediaRecorder.current.start();
    });
  };

  const handleStopRecording = () => {
    setRecording(false);

    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
    }

    if (mediaRecorder.current && mediaRecorder.current.stream) {
      mediaRecorder.current.stream.getTracks().forEach((track) => {
        track.stop();
      });
    }
  };

  const handleSendAudio = async (audio: Blob) => {
    console.log("handleSendAudio5 function called");
    if (!audio) {
      console.log("No audio was sent, exiting out of function");
      return;
    } else {
      console.log("Audio was sent");
    }
    setIsResponding(true);

    const formData = new FormData();
    formData.append("audio", audio, "recording.wav");

    try {
      // get transcription
      const transcription = await axios.post(
        "http://localhost:3000/create-transcription",
        formData
      );

      await updateMessages({
        role: "user",
        content: transcription.data,
      });

      setProgressBar(33);

      const chatCompletion = await axios.post(
        "http://localhost:3000/create-chat-completion",
        transcription.data
      );

      setProgressBar(66);

      // Use Fetch instead of Axios for streaming
      const audioStreamResponse = await fetch(
        "http://localhost:3000/create-audio-stream",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ chatCompletion: chatCompletion.data }),
        }
      );

      setProgressBar(100);

      if (audioStreamResponse.status === 200) {
        const mediaSource = new MediaSource();
        const newAudio = new Audio();
        newAudio.src = URL.createObjectURL(mediaSource);
        newAudio.play();

        const audioChunks: Uint8Array[] = [];

        mediaSource.addEventListener("sourceopen", async () => {
          const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
          if (audioStreamResponse.body === null) return;
          const reader = audioStreamResponse.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              mediaSource.endOfStream();
              break;
            }

            sourceBuffer.appendBuffer(value);
            audioChunks.push(value);
            await new Promise((resolve) =>
              sourceBuffer.addEventListener("updateend", resolve, {
                once: true,
              })
            );
          }

          const audioBlob = new Blob(audioChunks, { type: "audio/mpeg" });

          await addAssistantMessageWithAudio(
            { role: "assistant", content: chatCompletion.data },
            audioBlob
          );
        });

        setIsResponding(false);
      } else {
        console.error("Failed to fetch audio stream");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="my-element">
      <div className="w-screen h-full flex flex-col items-center justify-center">
        <div className="w-full h-1/6 flex flex-col items-center justify-center space-y-6 bg-slate-800">
          <h1 className="text-5xl font-bold">Snoop GPT</h1>
          <div className="max-w-3xl w-full mt-5 px-10">
            <div
              className={`w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 ${
                progressBar === 0 || progressBar === 100 ? "invisible" : ""
              }`}
            >
              <div
                className={`bg-blue-600 h-2.5 rounded-full ${
                  progressBar === 0
                    ? "w-0"
                    : progressBar === 33
                    ? "w-1/3"
                    : progressBar === 66
                    ? "w-2/3"
                    : "w-full"
                }`}
              ></div>
              <p className="">
                {progressBar === 0
                  ? ""
                  : progressBar === 33
                  ? "Snoop is thinking..."
                  : progressBar === 66
                  ? "Snoop is responding..."
                  : ""}
              </p>
            </div>
          </div>
        </div>

        {/* div for middle 70% of the screen */}
        <div className="w-full h-4/6 flex flex-col items-center justify-start overflow-auto">
          <div className="max-w-xl w-full p-10">
            {messages.map((message, index) => {
              if (message.role === "user") {
                return (
                  <div
                    key={index}
                    className="flex flex-row items-center justify-end mb-4"
                  >
                    <div className="flex flex-col items-end justify-end">
                      <p className="bg-blue-500 text-white text-sm rounded-xl px-4 py-2 max-w-xs break-words">
                        {message.content}
                      </p>
                      {message.file && (
                        <div className="mt-2">
                          <audio src={message.url} controls />
                        </div>
                      )}
                    </div>
                  </div>
                );
              } else {
                return (
                  <div
                    key={index}
                    className="flex flex-row items-center justify-start mb-4"
                  >
                    <div className="flex flex-col items-start justify-start">
                      <p className="bg-gray-500 text-white text-sm rounded-xl px-4 py-2 max-w-xs break-words">
                        {message.content}
                      </p>
                      {message.file && (
                        <div className="mt-2">
                          <audio src={message.url} controls />
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>

        {/* div for bottom 20% of the screen */}
        <div className="w-full h-1/6 flex flex-col items-center justify-center bg-slate-800 space-y-6">
          <div className=" aspect-square w-20">
            <button
              className={`${
                isResponding
                  ? `opacity-50 bg-gray-600 cursor-not-allowed hover:bg-gray-600`
                  : ``
              } w-full h-full rounded-full bg-blue-500 text-white p-2 ring-8 ring-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 hover:bg-blue-600 transition duration-200 ease-in-out cursor-pointer `}
              onClick={handleToggleRecording}
              disabled={isResponding}
            >
              {recording ? (
                <MicIcon color={"rgb(256,0,0)"} />
              ) : (
                <MicIcon color={"rgb(256,256,256)"} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioResponse;
