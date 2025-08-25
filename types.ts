
export interface Status {
  state: 'idle' | 'processing' | 'success' | 'error';
  message: string;
}

export interface AudioFeatures {
  duration: number;
  channelData: Float32Array[];
  sampleRate: number;
  spectrogram: Uint8Array[];
  onsets: { time: number; energy: number }[];
}

export interface StegoHeader {
    magic: string;
    mimeType: string;
    payloadLength: number;
    bitsPerChannel: number;
}
