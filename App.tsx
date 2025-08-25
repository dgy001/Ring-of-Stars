import React, { useState, useRef, useCallback } from 'react';
import { FileUploader } from './components/FileUploader';
import { AudioPlayer } from './components/AudioPlayer';
import { IconLoader, IconMusic, IconPhoto, IconWand, IconDownload } from './components/Icons';
import { audioToImage, imageToAudio } from './services/audioCodec';
import type { Status } from './types';
import { AudioRecorder } from './components/AudioRecorder';

const App: React.FC = () => {
    const [originalAudio, setOriginalAudio] = useState<File | null>(null);
    const [encodedImage, setEncodedImage] = useState<string | null>(null);
    const [imageToDecode, setImageToDecode] = useState<File | null>(null);
    const [decodedAudio, setDecodedAudio] = useState<string | null>(null);
    
    const [status, setStatus] = useState<Status>({ state: 'idle', message: '' });
    const [activeTab, setActiveTab] = useState<'encode' | 'decode'>('encode');

    const handleAudioUpload = (file: File) => {
        setOriginalAudio(file);
        setEncodedImage(null);
        setStatus({ state: 'idle', message: '' });
    };

    const handleImageUpload = (file: File) => {
        setImageToDecode(file);
        setDecodedAudio(null);
        setStatus({ state: 'idle', message: '' });
    };

    const handleEncode = async () => {
        if (!originalAudio) return;
        setStatus({ state: 'processing', message: 'Analyzing audio features...' });
        try {
            const imageUrl = await audioToImage(originalAudio, (progressMessage) => {
                setStatus({ state: 'processing', message: progressMessage });
            });
            setEncodedImage(imageUrl);
            setStatus({ state: 'success', message: 'Encoding complete! Right-click the image to save.' });
        } catch (error) {
            console.error(error);
            setStatus({ state: 'error', message: `Encoding failed: ${error instanceof Error ? error.message : String(error)}` });
        }
    };

    const handleDecode = async () => {
        if (!imageToDecode) return;
        setStatus({ state: 'processing', message: 'Reading image data...' });
        try {
            const audioUrl = await imageToAudio(imageToDecode, (progressMessage) => {
                setStatus({ state: 'processing', message: progressMessage });
            });
            setDecodedAudio(audioUrl);
            setStatus({ state: 'success', message: 'Decoding complete!' });
        } catch (error) {
            console.error(error);
            setStatus({ state: 'error', message: `Decoding failed: ${error instanceof Error ? error.message : 'Invalid or corrupted image.'}` });
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col items-center p-4 sm:p-8">
            <div className="w-full max-w-4xl">
                <header className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-400 to-green-300">
                        Audio Orbit
                    </h1>
                    <p className="text-gray-400 mt-2">Transform sound into celestial orbits of light.</p>
                </header>

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl shadow-cyan-900/10 border border-gray-700">
                    <div className="flex border-b border-gray-700">
                        <TabButton name="encode" activeTab={activeTab} setActiveTab={setActiveTab}>Encode</TabButton>
                        <TabButton name="decode" activeTab={activeTab} setActiveTab={setActiveTab}>Decode</TabButton>
                    </div>
                    
                    <div className="p-6 sm:p-8">
                        {activeTab === 'encode' ? (
                            <EncodeTab
                                originalAudio={originalAudio}
                                encodedImage={encodedImage}
                                onAudioUpload={handleAudioUpload}
                                onEncode={handleEncode}
                                status={status}
                            />
                        ) : (
                            <DecodeTab
                                imageToDecode={imageToDecode}
                                decodedAudio={decodedAudio}
                                onImageUpload={handleImageUpload}
                                onDecode={handleDecode}
                                status={status}
                            />
                        )}
                    </div>
                </div>

                 <div className="mt-8 text-sm text-gray-400">
                    <details className="bg-gray-800/50 rounded-lg border border-gray-700 transition-all duration-300">
                        <summary className="font-semibold text-gray-200 p-3 cursor-pointer hover:bg-gray-700/50 rounded-lg list-none flex justify-between items-center group">
                            <span>How does this work?</span>
                            <span className="text-xs text-gray-500 transform transition-transform duration-200 group-open:rotate-90 mr-2">▶</span>
                        </summary>
                        <div className="p-3 pt-0 border-t border-gray-700">
                            <p className="text-gray-400">
                                This tool embeds the raw bytes of your audio file into the least significant bits of an image's color data (a technique called steganography). The visual "orbit" is a creative representation of your audio's frequency spectrum, but it doesn't store the sound itself. This means the original audio can be perfectly reconstructed from the image, bit for bit.
                            </p>
                        </div>
                    </details>
                </div>
            </div>
        </div>
    );
};

const TabButton: React.FC<{name: 'encode' | 'decode', activeTab: string, setActiveTab: (tab: 'encode' | 'decode') => void, children: React.ReactNode}> = ({ name, activeTab, setActiveTab, children }) => (
    <button
        onClick={() => setActiveTab(name)}
        className={`w-1/2 py-3 text-center font-medium transition-colors duration-300 ${activeTab === name ? 'bg-cyan-600/20 text-cyan-300 border-b-2 border-cyan-400' : 'text-gray-400 hover:bg-gray-700/50'}`}
        aria-selected={activeTab === name}
    >
        {children}
    </button>
);


const EncodeTab: React.FC<{
    originalAudio: File | null;
    encodedImage: string | null;
    onAudioUpload: (file: File) => void;
    onEncode: () => void;
    status: Status;
}> = ({ originalAudio, encodedImage, onAudioUpload, onEncode, status }) => (
    <div className="space-y-6">
        <div>
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">1. Provide Audio</h2>
            <FileUploader
                onFileUpload={onAudioUpload}
                accept="audio/*"
                icon={<IconMusic />}
                text={originalAudio ? `Selected: ${originalAudio.name}` : "Drag & drop an audio file or click to select"}
            />
            <div className="flex items-center my-4">
                <div className="flex-grow border-t border-gray-600"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
                <div className="flex-grow border-t border-gray-600"></div>
            </div>
            <AudioRecorder onRecordingComplete={onAudioUpload} />
        </div>

        {originalAudio && (
            <div>
                <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">2. Generate Orbit</h2>
                <AudioPlayer src={URL.createObjectURL(originalAudio)} title="Original Audio" />
                <button
                    onClick={onEncode}
                    disabled={status.state === 'processing'}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-900/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300"
                >
                    {status.state === 'processing' ? <IconLoader /> : <IconWand />}
                    <span>{status.state === 'processing' ? status.message : 'Generate Image'}</span>
                </button>
            </div>
        )}

        {encodedImage && (
            <div>
                <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">3. Your Audio Orbit</h2>
                <p className="text-sm text-gray-400 mb-2">{status.message}</p>
                 <a href={encodedImage} download="audio-orbit.png" className="block relative group">
                    <img src={encodedImage} alt="Encoded Audio Orbit" className="rounded-lg w-full border-2 border-transparent group-hover:border-cyan-400 transition-all duration-300" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <IconDownload />
                        <span className="ml-2 font-semibold">Download Image</span>
                    </div>
                </a>
            </div>
        )}
        
        {status.state === 'error' && <p className="text-red-400 text-sm">{status.message}</p>}
    </div>
);


const DecodeTab: React.FC<{
    imageToDecode: File | null;
    decodedAudio: string | null;
    onImageUpload: (file: File) => void;
    onDecode: () => void;
    status: Status;
}> = ({ imageToDecode, decodedAudio, onImageUpload, onDecode, status }) => (
    <div className="space-y-6">
        <div>
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">1. Upload Orbit Image</h2>
            <FileUploader
                onFileUpload={onImageUpload}
                accept="image/png"
                icon={<IconPhoto />}
                text={imageToDecode ? `Selected: ${imageToDecode.name}` : "Drag & drop a PNG image or click to select"}
            />
        </div>
        
        {imageToDecode && (
             <div>
                <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">2. Decode Audio</h2>
                <img src={URL.createObjectURL(imageToDecode)} alt="Image to decode" className="rounded-lg max-h-48 w-auto mx-auto mb-4 border border-gray-600" />
                <button
                    onClick={onDecode}
                    disabled={status.state === 'processing'}
                    className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-900/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300"
                >
                    {status.state === 'processing' ? <IconLoader /> : <IconWand />}
                    <span>{status.state === 'processing' ? status.message : 'Decode Audio'}</span>
                </button>
            </div>
        )}

        {decodedAudio && (
             <div>
                <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">3. Your Decoded Audio</h2>
                <AudioPlayer src={decodedAudio} title="Decoded Audio" />
            </div>
        )}
        
        {status.state === 'error' && <p className="text-red-400 text-sm">{status.message}</p>}
    </div>
);

export default App;