import type { AudioFeatures, StegoHeader } from '../types';

const MAGIC_NUMBER = 'AUDORB'; // Audio Orbit
const BITS_PER_CHANNEL = 2; // Using 2 bits per color channel (R,G,B) = 6 bits per pixel
const CANVAS_SIZE = 1024; // Fixed canvas size for consistency

/**
 * A simple pseudo-random number generator for deterministic results based on a seed.
 */
function mulberry32(a: number) {
    return function() {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

/**
 * Generates a unique, deterministic triadic color palette based on audio features.
 */
const generateColorPalette = (features: AudioFeatures): [string, string, string] => {
    // Create a seed from audio data for deterministic colors
    const seed = features.spectrogram.slice(0, 100).reduce((acc, frame, i) => acc + frame.reduce((a, b) => a + b, i + 1), 1);
    const random = mulberry32(seed);

    const baseHue = random() * 360;
    
    // Create a triadic color scheme (three colors evenly spaced on the color wheel)
    const hue1 = baseHue;
    const hue2 = (baseHue + 120) % 360;
    const hue3 = (baseHue + 240) % 360;

    const saturation = 75; // Vibrant but not overly saturated
    const lightness = 60; // Bright enough to glow on a dark background

    return [
        `hsl(${hue1}, ${saturation}%, ${lightness}%)`,
        `hsl(${hue2}, ${saturation}%, ${lightness}%)`,
        `hsl(${hue3}, ${saturation}%, ${lightness}%)`,
    ];
};


// --- ENCODING ---

export const audioToImage = async (audioFile: File, onProgress: (message: string) => void): Promise<string> => {
    const audioContext = new AudioContext();
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    
    onProgress('Extracting audio features...');
    const features = await extractAudioFeatures(audioBuffer);

    onProgress('Generating celestial orbits...');
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not get canvas context');

    drawOrbit(ctx, features);
    
    onProgress('Embedding audio data...');
    // We embed the original file bytes to preserve headers and format
    await embedDataInCanvas(ctx, arrayBuffer, audioFile.type);

    onProgress('Finalizing image...');
    return canvas.toDataURL('image/png');
};

const extractAudioFeatures = async (buffer: AudioBuffer): Promise<AudioFeatures> => {
    const channelData = Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i));
    const sampleRate = buffer.sampleRate;
    const duration = buffer.duration;
    
    // Simple feature extraction for visualization
    const offlineContext = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, sampleRate);
    const source = offlineContext.createBufferSource();
    source.buffer = buffer;
    
    const analyser = offlineContext.createAnalyser();
    analyser.fftSize = 512;
    const frequencyBinCount = analyser.frequencyBinCount;
    
    source.connect(analyser);

    const spectrogram: Uint8Array[] = [];
    const onsets: { time: number; energy: number }[] = [];
    let lastEnergy = 0;

    // Using ScriptProcessorNode to analyze frames during offline rendering.
    const frameSize = 1024;
    const scriptProcessor = offlineContext.createScriptProcessor(frameSize, buffer.numberOfChannels, buffer.numberOfChannels);

    scriptProcessor.onaudioprocess = () => {
        // Check if rendering is still within the duration of the audio clip
        if (offlineContext.currentTime < duration) {
            const freqData = new Uint8Array(frequencyBinCount);
            analyser.getByteFrequencyData(freqData);
            spectrogram.push(new Uint8Array(freqData));
            
            // Onset detection (simplified spectral flux)
            const currentEnergy = freqData.reduce((sum, val) => sum + val * val, 0);
            const energyIncrease = currentEnergy - lastEnergy;
            if (energyIncrease > 1e6) { // Heuristic threshold
                onsets.push({ time: offlineContext.currentTime, energy: currentEnergy });
            }
            lastEnergy = currentEnergy;
        }
    };

    analyser.connect(scriptProcessor);
    scriptProcessor.connect(offlineContext.destination);
    
    source.start(0);
    await offlineContext.startRendering();

    return { duration, channelData, sampleRate, spectrogram, onsets };
};

const drawOrbit = (ctx: CanvasRenderingContext2D, features: AudioFeatures) => {
    const { width, height } = ctx.canvas;
    const centerX = width / 2;
    const centerY = height / 2;

    // Pure black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    
    const palette = generateColorPalette(features);

    // Faint background stars
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 400; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.random() * 0.8;
        const alpha = Math.random() * 0.5 + 0.1;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
        ctx.fill();
    }

    // Use 'lighter' for additive light effect
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';

    const timeSteps = features.spectrogram.length;
    const freqBins = features.spectrogram[0]?.length || 1;
    
    // Draw three layers of orbital rings for depth
    for (let layer = 0; layer < 3; layer++) {
        const baseRadius = width * (0.12 + layer * 0.08);
        const waviness = 15 + layer * 10;

        for (let t = 0; t < timeSteps; t++) {
            const angle = (t / timeSteps) * Math.PI * 2;
            const freqData = features.spectrogram[t];
            
            for (let f = 1; f < freqBins; f += 4) { // Start at 1 to ignore DC offset
                const energy = freqData[f] / 255;
                if (energy < 0.2) continue;

                const freqRatio = f / freqBins;
                let color: string;
                if (freqRatio < 0.2) {
                    color = palette[0]; // Low frequencies
                } else if (freqRatio < 0.5) {
                    color = palette[1]; // Mid frequencies
                } else {
                    color = palette[2]; // High frequencies
                }
                
                const radialLength = height * 0.08 * energy; // Narrower ring bursts
                const wave = Math.sin(t / 15 + layer * 2 + f / 5) * waviness;
                const startRadius = baseRadius + wave;
                const endRadius = startRadius + radialLength;

                ctx.beginPath();
                const startX = centerX + startRadius * Math.cos(angle);
                const startY = centerY + startRadius * Math.sin(angle);
                const endX = centerX + endRadius * Math.cos(angle);
                const endY = centerY + endRadius * Math.sin(angle);
                
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.strokeStyle = color;
                ctx.globalAlpha = energy * 0.5;
                ctx.stroke();
            }
        }
    }
    ctx.globalAlpha = 1;

    // Onset flares
    features.onsets.forEach(onset => {
        const angle = (onset.time / features.duration) * Math.PI * 2;
        const intensity = Math.min(1, onset.energy / 5e7);
        if (intensity < 0.2) return;
        
        const startX = centerX + (width * 0.1) * Math.cos(angle);
        const startY = centerY + (width * 0.1) * Math.sin(angle);
        const endX = centerX + (width * 0.45) * Math.cos(angle);
        const endY = centerY + (width * 0.45) * Math.sin(angle);

        const grad = ctx.createLinearGradient(startX, startY, endX, endY);
        grad.addColorStop(0, `rgba(255, 255, 255, ${intensity * 0.8})`);
        grad.addColorStop(1, `rgba(255, 255, 255, 0)`);

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1 + intensity * 2.0;
        ctx.stroke();
    });

    ctx.globalCompositeOperation = 'source-over';
};


const embedDataInCanvas = async (ctx: CanvasRenderingContext2D, payload: ArrayBuffer, mimeType: string) => {
    const header: StegoHeader = {
        magic: MAGIC_NUMBER,
        mimeType: mimeType.padEnd(32, '\0'), // Pad to fixed length
        payloadLength: payload.byteLength,
        bitsPerChannel: BITS_PER_CHANNEL,
    };
    
    const headerJson = JSON.stringify(header);
    const headerBytes = new TextEncoder().encode(headerJson);
    const headerLengthBytes = new Uint8Array(4); // 32-bit integer for header length
    new DataView(headerLengthBytes.buffer).setUint32(0, headerBytes.length, false); // Big-endian

    const finalPayload = new Uint8Array(headerLengthBytes.length + headerBytes.length + payload.byteLength);
    finalPayload.set(headerLengthBytes, 0);
    finalPayload.set(headerBytes, headerLengthBytes.length);
    finalPayload.set(new Uint8Array(payload), headerLengthBytes.length + headerBytes.length);

    const { width, height } = ctx.canvas;
    const capacity = width * height * 3 * BITS_PER_CHANNEL / 8; // in bytes
    if (finalPayload.length > capacity) {
        throw new Error(`Audio file is too large (${(finalPayload.length / 1024 / 1024).toFixed(2)}MB) for a ${width}x${height} image.`);
    }

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const bitMask = (1 << BITS_PER_CHANNEL) - 1;
    const clearMask = 0xFF << BITS_PER_CHANNEL;

    let byteIndex = 0;
    let bitIndex = 0;
    
    for (let i = 0; i < data.length; i += 4) {
        for (let j = 0; j < 3; j++) { // R, G, B channels
            if (byteIndex >= finalPayload.length) break;
            
            const bitsToEmbed = (finalPayload[byteIndex] >> bitIndex) & bitMask;
            data[i + j] = (data[i + j] & clearMask) | bitsToEmbed;
            
            bitIndex += BITS_PER_CHANNEL;
            if (bitIndex >= 8) {
                bitIndex = 0;
                byteIndex++;
            }
        }
         if (byteIndex >= finalPayload.length) break;
    }

    ctx.putImageData(imageData, 0, 0);
};

// --- DECODING ---

export const imageToAudio = async (imageFile: File, onProgress: (message: string) => void): Promise<string> => {
    const imageUrl = URL.createObjectURL(imageFile);
    const img = new Image();
    
    const imageLoadPromise = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = imageUrl;
    });

    await imageLoadPromise;
    onProgress('Image loaded, getting pixel data...');

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
     if (!ctx) throw new Error('Could not get canvas context');
    ctx.drawImage(img, 0, 0);
    
    onProgress('Extracting embedded data...');
    const extractedBytes = extractDataFromCanvas(ctx);

    onProgress('Parsing header...');
    const headerLengthView = new DataView(extractedBytes.buffer, 0, 4);
    const headerLength = headerLengthView.getUint32(0, false);
    
    const headerBytes = extractedBytes.slice(4, 4 + headerLength);
    const headerJson = new TextDecoder().decode(headerBytes);
    const header: StegoHeader = JSON.parse(headerJson);

    if (header.magic !== MAGIC_NUMBER) {
        throw new Error('Not a valid Audio Orbit image. This may be a different type of encoded image.');
    }
    
    const payloadOffset = 4 + headerLength;
    const payloadBytes = extractedBytes.slice(payloadOffset, payloadOffset + header.payloadLength);

    const blob = new Blob([payloadBytes], { type: header.mimeType.trim() });
    return URL.createObjectURL(blob);
};

const extractDataFromCanvas = (ctx: CanvasRenderingContext2D): Uint8Array => {
    const { width, height } = ctx.canvas;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const bitMask = (1 << BITS_PER_CHANNEL) - 1;
    
    const maxBytes = width * height * 3 * BITS_PER_CHANNEL / 8;
    const extractedBytes = new Uint8Array(maxBytes);
    
    let currentByte = 0;
    let bitCount = 0;
    let byteIndex = 0;

    for (let i = 0; i < data.length; i += 4) {
        for (let j = 0; j < 3; j++) { // R, G, B channels
             const bits = data[i + j] & bitMask;
             currentByte |= (bits << bitCount);
             bitCount += BITS_PER_CHANNEL;

             if (bitCount >= 8) {
                 extractedBytes[byteIndex++] = currentByte;
                 currentByte = 0;
                 bitCount = 0;
             }
        }
    }
    
    return extractedBytes;
};