// Voice Service: Hybrid Browser Web Speech API Architecture (STT & TTS)
// - SpeechRecognition (STT): Free, client-side, zero cloud per-minute costs
// - SpeechSynthesis (TTS): Free, browser-native, zero audio streaming billing
// Supported Locales: English (en-US), Arabic (ar-AE / ar-SA), Tamil (ta-IN)

import { Language } from '../types';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'paused' | 'denied' | 'unsupported';

export interface VoiceError {
  code: 'not-allowed' | 'no-speech' | 'audio-capture' | 'network' | 'unsupported' | 'unknown';
  message: string;
}

// Locale mapping for Web Speech API
export const LOCALE_MAP: Record<Language, { stt: string; ttsPrefix: string; label: string; samplePhrase: string }> = {
  en: {
    stt: 'en-US',
    ttsPrefix: 'en',
    label: 'English (US / UK)',
    samplePhrase: 'Tell me about Palm Jumeirah Sky Palace and projected yields'
  },
  ar: {
    stt: 'ar-AE',
    ttsPrefix: 'ar',
    label: 'العربية (الإمارات / الشرق الأوسط)',
    samplePhrase: 'أخبرني عن فلل جزيرة جميرا باي وتفاصيل الإقامة الذهبية'
  },
  ta: {
    stt: 'ta-IN',
    ttsPrefix: 'ta',
    label: 'தமிழ் (இந்தியா / சிங்கப்பூர்)',
    samplePhrase: 'துபாய் பாம் ஜுமேரா வில்லாக்கள் மற்றும் வருவாய் விவரங்களை கூறுங்கள்'
  },
  tanglish: {
    stt: 'ta-IN',
    ttsPrefix: 'ta',
    label: 'Tanglish (Tamil in English letters)',
    samplePhrase: 'Bro, show me Dubai Marina apartments and rent options in a simple mix of English and Tamil'
  }
};

class VoiceService {
  private recognition: any = null;
  private isListeningActive = false;
  private voices: SpeechSynthesisVoice[] = [];
  private speechRate = 1.0;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.initVoices();
  }

  // Check SpeechRecognition support
  public isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  // Check SpeechSynthesis support
  public isSpeechSynthesisSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  // Initialize browser voices asynchronously
  private initVoices() {
    if (!this.isSpeechSynthesisSupported()) return;
    const loadVoices = () => {
      this.voices = window.speechSynthesis.getVoices();
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  // -------------------------------------------------------------
  // SPEECH RECOGNITION (SPEECH-TO-TEXT)
  // -------------------------------------------------------------

  public startListening(
    language: Language,
    callbacks: {
      onStart?: () => void;
      onInterimResult?: (transcript: string) => void;
      onFinalResult?: (transcript: string) => void;
      onError?: (error: VoiceError) => void;
      onEnd?: () => void;
    }
  ): boolean {
    if (!this.isSpeechRecognitionSupported()) {
      callbacks.onError?.({
        code: 'unsupported',
        message: 'Speech recognition is not supported in this browser. Please use Google Chrome desktop/Android or type your inquiry.'
      });
      return false;
    }

    try {
      this.stopListening();

      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionClass();

      const localeConfig = LOCALE_MAP[language] || LOCALE_MAP.en;
      this.recognition.lang = localeConfig.stt;
      this.recognition.continuous = false; // Turn-based cycle for crisp customer queries
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListeningActive = true;
        callbacks.onStart?.();
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptChunk;
          } else {
            interimTranscript += transcriptChunk;
          }
        }

        if (interimTranscript) {
          callbacks.onInterimResult?.(interimTranscript);
        }
        if (finalTranscript) {
          callbacks.onFinalResult?.(finalTranscript);
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListeningActive = false;
        let error: VoiceError;

        switch (event.error) {
          case 'not-allowed':
          case 'permission-denied':
            error = {
              code: 'not-allowed',
              message: 'Microphone permission denied. Please allow microphone access in your browser address bar.'
            };
            break;
          case 'no-speech':
            error = {
              code: 'no-speech',
              message: 'No speech detected. Please tap the microphone and speak again.'
            };
            break;
          case 'audio-capture':
            error = {
              code: 'audio-capture',
              message: 'No active microphone input found. Please verify your audio settings.'
            };
            break;
          case 'network':
            error = {
              code: 'network',
              message: 'Network issue during speech recognition. You can continue typing below.'
            };
            break;
          case 'aborted':
            return; // Normal user cancellation
          default:
            error = {
              code: 'unknown',
              message: `Voice recognition notice: ${event.error || 'Please try again'}`
            };
        }

        callbacks.onError?.(error);
      };

      this.recognition.onend = () => {
        this.isListeningActive = false;
        callbacks.onEnd?.();
      };

      this.recognition.start();
      return true;
    } catch (err: any) {
      this.isListeningActive = false;
      callbacks.onError?.({
        code: 'unknown',
        message: err?.message || 'Failed to initialize speech recognition'
      });
      return false;
    }
  }

  public stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.recognition = null;
    }
    this.isListeningActive = false;
  }

  public abortListening() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {
        // ignore
      }
      this.recognition = null;
    }
    this.isListeningActive = false;
  }

  public getIsListening(): boolean {
    return this.isListeningActive;
  }

  // -------------------------------------------------------------
  // SPEECH SYNTHESIS (TEXT-TO-SPEECH)
  // -------------------------------------------------------------

  public getAvailableVoicesForLanguage(language: Language): SpeechSynthesisVoice[] {
    if (!this.voices || this.voices.length === 0) {
      this.voices = window.speechSynthesis?.getVoices() || [];
    }
    const targetPrefix = LOCALE_MAP[language]?.ttsPrefix || 'en';
    return this.voices.filter(v => v.lang.toLowerCase().startsWith(targetPrefix.toLowerCase()));
  }

  // Select best natural voice
  private selectBestVoice(language: Language): SpeechSynthesisVoice | null {
    const localeConfig = LOCALE_MAP[language] || LOCALE_MAP.en;
    const prefix = localeConfig.ttsPrefix;

    if (!this.voices || this.voices.length === 0) {
      this.voices = window.speechSynthesis?.getVoices() || [];
    }

    // Filter matching language prefix
    const matching = this.voices.filter(v => v.lang.toLowerCase().startsWith(prefix.toLowerCase()));
    if (matching.length === 0) {
      return this.voices[0] || null;
    }

    // High quality heuristics: prefer voices containing Google, Natural, Premium, Siri, or default
    const preferred = matching.find(v =>
      v.name.includes('Natural') ||
      v.name.includes('Google') ||
      v.name.includes('Premium') ||
      v.name.includes('Enhanced')
    );

    return preferred || matching[0];
  }

  // Strip markdown, asterisks, bullet points, and URLs for spoken audio
  public cleanTextForSpeech(text: string): string {
    return text
      .replace(/https?:\/\/\S+/g, '') // remove URLs
      .replace(/\*\*(.*?)\*\*/g, '$1') // remove bold asterisks
      .replace(/\*(.*?)\*/g, '$1') // remove italics
      .replace(/#{1,6}\s+/g, '') // remove heading markers
      .replace(/[`~_]/g, '') // remove markdown symbols
      .replace(/^\s*[-•*]\s+/gm, '') // remove bullet points
      .replace(/\s+/g, ' ') // normalize whitespace
      .trim();
  }

  public speak(
    text: string,
    language: Language,
    callbacks?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
      onPause?: () => void;
      onResume?: () => void;
    }
  ): boolean {
    if (!this.isSpeechSynthesisSupported()) {
      callbacks?.onError?.(new Error('SpeechSynthesis not supported'));
      return false;
    }

    this.stopSpeaking();

    const clean = this.cleanTextForSpeech(text);
    if (!clean) return false;

    const utterance = new SpeechSynthesisUtterance(clean);
    this.currentUtterance = utterance;

    const bestVoice = this.selectBestVoice(language);
    if (bestVoice) {
      utterance.voice = bestVoice;
      utterance.lang = bestVoice.lang;
    } else {
      utterance.lang = LOCALE_MAP[language]?.stt || 'en-US';
    }

    utterance.rate = this.speechRate;
    utterance.pitch = 1.0;

    utterance.onstart = () => callbacks?.onStart?.();
    utterance.onend = () => {
      this.currentUtterance = null;
      callbacks?.onEnd?.();
    };
    utterance.onerror = (e) => {
      this.currentUtterance = null;
      callbacks?.onError?.(e);
    };
    utterance.onpause = () => callbacks?.onPause?.();
    utterance.onresume = () => callbacks?.onResume?.();

    window.speechSynthesis.speak(utterance);
    return true;
  }

  public pauseSpeaking() {
    if (this.isSpeechSynthesisSupported() && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  }

  public resumeSpeaking() {
    if (this.isSpeechSynthesisSupported() && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }

  public stopSpeaking() {
    if (this.isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
  }

  public isSpeaking(): boolean {
    return !!(this.isSpeechSynthesisSupported() && window.speechSynthesis.speaking);
  }

  public isPaused(): boolean {
    return !!(this.isSpeechSynthesisSupported() && window.speechSynthesis.paused);
  }

  public setSpeedRate(rate: number) {
    this.speechRate = Math.max(0.75, Math.min(1.5, rate));
  }

  public getSpeedRate(): number {
    return this.speechRate;
  }
}

export const voiceService = new VoiceService();
