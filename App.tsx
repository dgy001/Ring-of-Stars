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
        setDecodedAudio(null);
        setImageToDecode(null);
        setStatus({ state: 'idle', message: '' });
    };

    const handleImageUpload = (file: File) => {
        setImageToDecode(file);
        setDecodedAudio(null);
        setOriginalAudio(null);
        setEncodedImage(null);
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
            setStatus({ state: 'success', message: 'Encoding complete! Click the image to save.' });
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
        <div className="min-h-screen bg-black text-gray-300 font-sans flex flex-col items-center p-4 sm:p-8">
            <div className="w-full max-w-4xl relative">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-48 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent blur-3xl opacity-50 -z-10"></div>
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-12 w-1/2 max-w-2xl h-64 bg-gradient-to-r from-purple-500/10 via-transparent to-green-500/10 blur-3xl opacity-60 -z-10"></div>

                <header className="text-center my-16 sm:my-24">
                    <h1 className="text-6xl sm:text-8xl font-extrabold text-white tracking-tighter">
                        Audio Orbit
                    </h1>
                    <p className="text-gray-400 mt-4 text-lg max-w-2xl mx-auto">Transform sound into celestial orbits of light and back again.</p>
                </header>

                <div className="flex justify-center mb-12">
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-1 rounded-full flex items-center space-x-1">
                        <TabButton name="encode" activeTab={activeTab} setActiveTab={setActiveTab}>Encode Audio</TabButton>
                        <TabButton name="decode" activeTab={activeTab} setActiveTab={setActiveTab}>Decode Image</TabButton>
                    </div>
                </div>
                
                <main>
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
                </main>

                 <div className="mt-24 text-sm text-gray-500">
                    <details className="bg-transparent rounded-lg border border-gray-800 transition-all duration-300 max-w-2xl mx-auto">
                        <summary className="font-semibold text-gray-300 p-4 cursor-pointer hover:bg-gray-900 rounded-lg list-none flex justify-between items-center group">
                            <span>How does this work?</span>
                            <span className="text-xs text-gray-500 transform transition-transform duration-200 group-open:rotate-90 mr-2">▶</span>
                        </summary>
                        <div className="p-4 pt-0 border-t border-gray-800">
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
        className={`px-6 py-2 text-sm font-semibold rounded-full transition-colors duration-300 focus:outline-none ${activeTab === name ? 'bg-gray-200 text-black' : 'text-gray-300 hover:bg-gray-800'}`}
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
    <div className="space-y-12 max-w-xl mx-auto">
        <div>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4 text-center">1. Provide Audio</h2>
            <FileUploader
                onFileUpload={onAudioUpload}
                accept="audio/*"
                icon={<IconMusic />}
                text={originalAudio ? `Selected: ${originalAudio.name}` : "Drag & drop an audio file"}
            />
            <div className="flex items-center my-6">
                <div className="flex-grow border-t border-gray-800"></div>
                <span className="flex-shrink mx-4 text-gray-600 text-sm">OR</span>
                <div className="flex-grow border-t border-gray-800"></div>
            </div>
            <AudioRecorder onRecordingComplete={onAudioUpload} />
        </div>

        {originalAudio && (
            <div>
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4 text-center">2. Generate Orbit</h2>
                <AudioPlayer src={URL.createObjectURL(originalAudio)} title="Original Audio" />
                <button
                    onClick={onEncode}
                    disabled={status.state === 'processing'}
                    className="mt-6 w-full flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-black font-bold py-3 px-4 rounded-lg transition-colors duration-300"
                >
                    {status.state === 'processing' ? <IconLoader /> : <IconWand />}
                    <span>{status.state === 'processing' ? status.message : 'Generate Image'}</span>
                </button>
            </div>
        )}

        {encodedImage && (
            <div>
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4 text-center">3. Your Audio Orbit</h2>
                <p className="text-sm text-gray-400 mb-2 text-center">{status.message}</p>
                 <a href={encodedImage} download="orbit.png" className="block relative group">
                    <img src={encodedImage} alt="Encoded Audio Orbit" className="rounded-lg w-full" />
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                        <IconDownload />
                        <span className="mt-2 font-semibold text-sm">Download Image</span>
                    </div>
                </a>
            </div>
        )}
        
        {status.state === 'error' && <p className="text-red-400 text-sm mt-4 text-center">{status.message}</p>}
    </div>
);


const DecodeTab: React.FC<{
    imageToDecode: File | null;
    decodedAudio: string | null;
    onImageUpload: (file: File) => void;
    onDecode: () => void;
    status: Status;
}> = ({ imageToDecode, decodedAudio, onImageUpload, onDecode, status }) => (
    <div className="space-y-12 max-w-xl mx-auto">
        <div>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4 text-center">1. Upload Orbit Image</h2>
            <FileUploader
                onFileUpload={onImageUpload}
                accept="image/png"
                icon={<IconPhoto />}
                text={imageToDecode ? `Selected: ${imageToDecode.name}` : "Drag & drop your Orbit PNG"}
            />
        </div>
        
        {imageToDecode && (
             <div>
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4 text-center">2. Decode Audio</h2>
                <img src={URL.createObjectURL(imageToDecode)} alt="Image to decode" className="rounded-lg max-h-48 w-auto mx-auto mb-6 border border-gray-800" />
                <button
                    onClick={onDecode}
                    disabled={status.state === 'processing'}
                    className="w-full flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-black font-bold py-3 px-4 rounded-lg transition-colors duration-300"
                >
                    {status.state === 'processing' ? <IconLoader /> : <IconWand />}
                    <span>{status.state === 'processing' ? status.message : 'Decode Audio'}</span>
                </button>
            </div>
        )}

        {decodedAudio && (
             <div>
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4 text-center">3. Your Decoded Audio</h2>
                <AudioPlayer src={decodedAudio} title="Decoded Audio" />
            </div>
        )}
        
        {status.state === 'error' && <p className="text-red-400 text-sm mt-4 text-center">{status.message}</p>}
    </div>
);

export default App;