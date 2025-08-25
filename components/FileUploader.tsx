
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
      className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 ${isDragging ? 'border-purple-500 bg-purple-900/20' : 'border-gray-600 hover:border-purple-400 hover:bg-gray-800'}`}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="flex flex-col items-center justify-center text-gray-400">
        <div className={`transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`}>
         {icon}
        </div>
        <p className="mt-2 text-sm">{text}</p>
      </div>
    </div>
  );
};
