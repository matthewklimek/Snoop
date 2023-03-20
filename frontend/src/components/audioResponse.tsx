import React, { useRef, useState } from 'react';

const AudioResponse: React.FC = () => {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);

  const handleStartRecording = () => {
    setRecording(true);

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      mediaRecorder.current = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.current.addEventListener(
        'dataavailable',
        (event: BlobEvent) => {
          audioChunks.push(event.data);
        }
      );

      mediaRecorder.current.addEventListener('stop', () => {
        setAudioBlob(new Blob(audioChunks));
      });

      mediaRecorder.current.start();
    });
  };

  const handleStopRecording = () => {
    setRecording(false);

    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
  };

  const handleSendAudio = async () => {
    if (!audioBlob) return;

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    try {
      const response = await fetch('https://example.com/upload-audio', {
        method: 'POST',
        body: formData,
      });

      console.log('Response:', response);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <button onClick={handleStartRecording} disabled={recording}>
        Start Recording
      </button>
      <button onClick={handleStopRecording} disabled={!recording}>
        Stop Recording
      </button>
      {audioBlob && <audio src={URL.createObjectURL(audioBlob)} controls />}
      <button onClick={handleSendAudio} disabled={!audioBlob}>
        Send Audio
      </button>
    </div>
  );
};

export default AudioResponse;
