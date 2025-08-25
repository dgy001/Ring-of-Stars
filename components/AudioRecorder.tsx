import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IconMic, IconStop, IconLoader } from './Icons';

interface AudioRecorderProps {
  onRecordingComplete: (file: File) => void;
}

type Status = 'idle' | 'permission' | 'recording' | 'error';

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete }) => {
  const [status, setStatus] = useState<Status>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  
  const clearTimer = () => {
    if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
    }
  };

  const startTimer = () => {
    setRecordingTime(0);
    timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
    }, 1000);
  };
  
  const handleStartRecording = useCallback(async () => {
    setStatus('permission');
    setError(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = event => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const audioFile = new File([audioBlob], `recording.${mimeType.split('/')[1] || 'webm'}`, { type: mimeType });
          onRecordingComplete(audioFile);
          stream.getTracks().forEach(track => track.stop()); // Release microphone
          setStatus('idle');
        };
        
        mediaRecorderRef.current.start();
        setStatus('recording');
        startTimer();

      } catch (err) {
        console.error("Error accessing microphone:", err);
        setError("Microphone access was denied. Please enable it in your browser settings.");
        setStatus('error');
      }
    } else {
       setError("Audio recording is not supported by your browser.");
       setStatus('error');
    }
  }, [onRecordingComplete]);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      clearTimer();
    }
  }, []);
  
  useEffect(() => {
      return () => { // Cleanup on unmount
          clearTimer();
      }
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  };

  const renderButtonContent = () => {
      switch (status) {
          case 'idle':
              return <><IconMic /><span>Record Audio</span></>;
          case 'permission':
              return <><IconLoader /><span>Awaiting permission...</span></>;
          case 'recording':
              return <><IconStop className="text-red-400 w-5 h-5" /><span>Stop Recording ({formatTime(recordingTime)})</span></>;
          case 'error':
               return <><IconMic /><span>Try Recording Again</span></>;
      }
  };
  
  return (
    <div className="text-center">
      <button
        onClick={status === 'recording' ? handleStopRecording : handleStartRecording}
        disabled={status === 'permission'}
        className={`w-full flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-lg transition-colors duration-300
            ${status === 'recording' ? 'bg-red-900/50 hover:bg-red-900 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-200'}
            disabled:bg-gray-800/50 disabled:cursor-not-allowed`}
      >
        {renderButtonContent()}
      </button>
      {status === 'error' && <p className="text-red-400 text-sm mt-3">{error}</p>}
    </div>
  );
};