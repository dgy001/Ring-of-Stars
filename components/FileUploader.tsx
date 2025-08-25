
import React, { useState, useCallback } from 'react';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  accept: string;
  icon: React.ReactNode;
  text: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload, accept, icon, text }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  }, [onFileUpload]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${isDragging ? 'border-white bg-gray-800' : 'hover:border-gray-700'}`}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        aria-label={text}
      />
      <div className="flex flex-col items-center justify-center text-gray-400 pointer-events-none">
        <div className={`transition-transform duration-300 w-16 h-16 bg-gray-800/80 rounded-full flex items-center justify-center ${isDragging ? 'scale-110' : ''}`}>
         {icon}
        </div>
        <p className="mt-4 text-sm font-semibold">{text}</p>
        <p className="mt-1 text-xs text-gray-500">or click to browse</p>
      </div>
    </div>
  );
};