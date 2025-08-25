
import React from 'react';

interface AudioPlayerProps {
  src: string;
  title: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, title }) => {
  return (
    <div className="w-full bg-gray-900/80 rounded-lg p-4 border border-gray-800">
      <p className="text-sm font-semibold text-gray-300 mb-3">{title}</p>
      <audio controls src={src} className="w-full">
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};