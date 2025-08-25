
import React from 'react';

interface AudioPlayerProps {
  src: string;
  title: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, title }) => {
  return (
    <div className="w-full bg-gray-800 rounded-lg p-4 shadow-md border border-gray-700">
      <p className="text-sm font-semibold text-gray-300 mb-2">{title}</p>
      <audio controls src={src} className="w-full">
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};
