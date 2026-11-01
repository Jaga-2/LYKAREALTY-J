import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Square,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { PROPERTIES } from '../data/properties';
import { Property, Language } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { voiceService, VoiceState, VoiceError, LOCALE_MAP } from '../services/voiceService';
import { formatCurrency } from '../utils/currency';
import { crmService } from '../services/crmService';
import { useAuth } from '../context/AuthContext';
import { processClientAssistantTurn } from '../services/clientAssistantEngine';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onSelectProperty?: (property: Property) => void;
  onOpenConsultation?: (title?: string) => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  source?: 'gemini' | 'ollama' | 'fallback';
  quotaExceeded?: boolean;
  propertyRecommendations?: any[];
  suggestions?: string[];
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  initialQuery,
  onSelectProperty,
  onOpenConsultation
}) => {
  const { language: appLanguage } = useLanguage();
  const { currency } = useCurrency();
  const { currentUser } = useAuth();

  // Selected assistant language (en / ar / ta / tanglish)
  const [voiceLang, setVoiceLang] = useState<Language>(appLanguage);
  // Conversation Context for Multi-Turn Continuity & Relative Searches
  const [conversationContext, setConversationContext] = useState<any>({});
  const [input, setInput] = useState(initialQuery || '');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice States
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [autoListenContinuous, setAutoListenContinuous] = useState(false);
  const [currentlySpeakingMsgId, setCurrentlySpeakingMsgId] = useState<string | null>(null);
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.0);
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  const [leadCreatedNotice, setLeadCreatedNotice] = useState<string | null>(null);

  const handleCreateVoiceLead = async (notes: string, propertyTitle?: string) => {
    setIsCreatingLead(true);
    try {
      const lead = await crmService.createVoiceLead({
        clientName: currentUser?.name || 'Private Advisory Patron',
        phone: currentUser?.phone || '+971 50 842 0000',
        email: currentUser?.email || 'patron@sovereign-inquiry.com',
        notes: notes || 'Client registered acquisition mandate through LYKA AI Voice Assistant session.',
        propertyTitle: propertyTitle || 'Dubai Prime Portfolio',
        budget: { min: 100000, max: 250000 }
      });
      setLeadCreatedNotice(`Inquiry #${lead.id.slice(-4)} created! Assigned to ${lead.assignedAgentName}.`);
      setTimeout(() => setLeadCreatedNotice(null), 7000);
    } catch (e: any) {
      console.error('Failed to create voice lead:', e);
    } finally {
      setIsCreatingLead(false);
    }
  };

  // Initial Natural Real-Estate Consultant greeting
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-msg',
      sender: 'ai',
      text:
        voiceLang === 'ta'
          ? 'வணக்கம்! லைகா ரியாலிட்டிக்கு உங்களை அன்புடன் வரவேற்கிறேன். துபாயில் உங்களுக்கு ஏற்ற சிறந்த இல்லங்களை தேர்வு செய்ய உதவுவதில் மகிழ்ச்சி. நீங்கள் வாடகைக்கு அல்லது வாங்குவதற்கு என்ன வகையான சொத்தை தேடுகிறீர்கள்?'
          : voiceLang === 'ar'
          ? 'أهلاً بكم في دار لايكا العقارية! يسعدني جداً مساعدتكم في استكشاف أرقى عقارات دبي. ما الذي تتطلعون إليه اليوم، شراء أم إيجار؟'
          : voiceLang === 'tanglish'
          ? 'Vanakkam bro! LYKA Realty la Dubai property options ah explore pannanum. Rent ah buy ah?'
          : "Hello! Welcome to LYKA Realty. I'm happy to help you explore Dubai properties. What are you looking for today?",
      timestamp: 'Just now',
      source: 'gemini',
      suggestions:
        voiceLang === 'ta'
          ? [
              'துபாய் மரினாவில் 2 படுக்கையறை அடுக்குமாடி குடியிருப்பு',
              'பாம் ஜுமேராவில் வாடகை வில்லாக்கள்',
              'வருடத்திற்கு AED 120,000 பட்ஜெட் வாடகை இல்லங்கள்',
              'ஆலோசகருடன் நேரடி பார்வைக்கு ஏற்பாடு செய்க'
            ]
          : voiceLang === 'ar'
          ? [
              'شقق غرفتين نوم في دبي مارينا',
              'فلل فاخرة للإيجار في نخلة جميرا',
              'ميزانيتي 120,000 درهم سنوياً',
              'حجز موعد معاينة مع مستشار عقاري'
            ]
          : voiceLang === 'tanglish'
          ? [
              'Dubai Marina la 2-bedroom apartment ah show pannunga',
              'Palm Jumeirah la villa rental ah venum',
              'AED 120,000 per year budget',
              'Private viewing kooda arrange pannunga'
            ]
          : [
              'Show me 2-bedroom apartments in Dubai Marina',
              'I want a luxury villa in Palm Jumeirah',
              'My budget is AED 120,000 per year',
              'Show me rental properties',
              'Arrange a private viewing with an agent'
            ]
    }
  ]);

  // Sync assistant language if app language changes
  useEffect(() => {
    setVoiceLang(appLanguage);
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome-msg') {
        return [
          {
            ...prev[0],
            text:
              appLanguage === 'ta'
                ? 'வணக்கம்! லைகா ரியாலிட்டிக்கு உங்களை அன்புடன் வரவேற்கிறேன். துபாயில் உங்களுக்கு ஏற்ற சிறந்த இல்லங்களை தேர்வு செய்ய உதவுவதில் மகிழ்ச்சி. நீங்கள் வாடகைக்கு அல்லது வாங்குவதற்கு என்ன வகையான சொத்தை தேடுகிறீர்கள்?'
                : appLanguage === 'ar'
                ? 'أهلاً بكم في دار لايكا العقارية! يسعدني جداً مساعدتكم في استكشاف أرقى عقارات دبي. ما الذي تتطلعون إليه اليوم، شراء أم إيجار؟'
                : appLanguage === 'tanglish'
                ? 'Vanakkam bro! LYKA Realty la Dubai property options ah explore pannanum. Rent ah buy ah?'
                : "Hello! Welcome to LYKA Realty. I'm happy to help you explore Dubai properties. What are you looking for today?",
            suggestions:
              appLanguage === 'ta'
                ? [
                    'துபாய் மரினாவில் 2 படுக்கையறை அடுக்குமாடி குடியிருப்பு',
                    'பாம் ஜுமேராவில் வாடகை வில்லாக்கள்',
                    'வருடத்திற்கு AED 120,000 பட்ஜெட் வாடகை இல்லங்கள்',
                    'ஆலோசகருடன் நேரடி பார்வைக்கு ஏற்பாடு செய்க'
                  ]
                : appLanguage === 'ar'
                ? [
                    'شقق غرفتين نوم في دبي مارينا',
                    'فلل فاخرة للإيجار في نخلة جميرا',
                    'ميزانيتي 120,000 درهم سنوياً',
                    'حجز موعد معاينة مع مستشار عقاري'
                  ]
                : appLanguage === 'tanglish'
                ? [
                    'Dubai Marina la 2-bedroom apartment ah show pannunga',
                    'Palm Jumeirah la villa rental ah venum',
                    'AED 120,000 per year budget',
                    'Private viewing kooda arrange pannunga'
                  ]
                : [
                    'Show me 2-bedroom apartments in Dubai Marina',
                    'I want a luxury villa in Palm Jumeirah',
                    'My budget is AED 120,000 per year',
                    'Show me rental properties',
                    'Arrange a private viewing with an agent'
                  ]
          }
        ];
      }
      return prev;
    });
  }, [appLanguage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, interimTranscript]);

  // Stop speech when modal closes
  useEffect(() => {
    if (!isOpen) {
      voiceService.stopListening();
      voiceService.stopSpeaking();
      setVoiceState('idle');
      setCurrentlySpeakingMsgId(null);
    }
  }, [isOpen]);

  // Trigger speak for AI response
  const speakText = useCallback(
    (text: string, msgId: string) => {
      if (isMuted) return;

      setCurrentlySpeakingMsgId(msgId);
      setIsSpeechPaused(false);
      setVoiceState('speaking');

      voiceService.speak(text, voiceLang, {
        onStart: () => {
          setVoiceState('speaking');
          setIsSpeechPaused(false);
        },
        onEnd: () => {
          setCurrentlySpeakingMsgId(null);
          setIsSpeechPaused(false);
          setVoiceState('idle');

          // If continuous conversation is on, automatically prompt listening for next turn
          if (autoListenContinuous) {
            setTimeout(() => {
              handleStartVoiceInput();
            }, 500);
          }
        },
        onError: () => {
          setCurrentlySpeakingMsgId(null);
          setIsSpeechPaused(false);
          setVoiceState('idle');
        },
        onPause: () => setIsSpeechPaused(true),
        onResume: () => setIsSpeechPaused(false)
      });
    },
    [isMuted, voiceLang, autoListenContinuous]
  );

  // Send message to Backend AI Proxy Endpoint (/api/assistant)
  const processQuery = async (queryText: string) => {
    const text = queryText.trim();
    if (!text) return;

    // Stop active TTS if user speaks or sends new query
    voiceService.stopSpeaking();
    setCurrentlySpeakingMsgId(null);

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: 'Just now'
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setInterimTranscript('');
    setIsLoading(true);
    setVoiceState('processing');
    setVoiceError(null);

    // Build conversation history (last 4 messages for context)
    const historyPayload = messages.slice(-4).map((m) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      text: m.text
    }));

    try {

      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          language: voiceLang,
          conversationContext,
          conversationHistory: historyPayload
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const reply = data.reply || 'I am happy to assist you with exploring verified Dubai properties.';
      const newMsgId = `ai-${Date.now()}`;

      // Update multi-turn context
      if (data.conversationContext) {
        setConversationContext(data.conversationContext);
        if (data.conversationContext.preferredLanguage && data.conversationContext.preferredLanguage !== voiceLang) {
          setVoiceLang(data.conversationContext.preferredLanguage);
        }
      }

      if (data.leadCreated) {
        setLeadCreatedNotice(
          voiceLang === 'ta'
            ? 'உங்கள் பார்வை விருப்பம் பதிவு செய்யப்பட்டு, எங்கள் ஆலோசகருக்கு அனுப்பப்பட்டுள்ளது!'
            : voiceLang === 'ar'
            ? 'تم تسجيل طلب المعاينة وإحالته إلى المستشار العقاري المعتمد بنجاح!'
            : 'Private viewing request recorded! A Senior Consultant will contact you shortly.'
        );
        setTimeout(() => setLeadCreatedNotice(null), 8000);
      }

      const aiMsg: Message = {
        id: newMsgId,
        sender: 'ai',
        text: reply,
        timestamp: 'Just now',
        source: data.source || 'gemini',
        quotaExceeded: !!data.quotaExceeded,
        propertyRecommendations: data.propertyRecommendations || []
      };

      setMessages((prev) => [...prev, aiMsg]);
      setVoiceState('idle');

      // Speak response using browser SpeechSynthesis
      speakText(reply, newMsgId);
    } catch (err: any) {
      console.warn('[AI Assistant] Assistant fetch error:', err);
      // Graceful conversational fallback on network error or offline mode
      const fallbackResult = processClientAssistantTurn(
        text,
        conversationContext,
        historyPayload,
        voiceLang
      );

      const fallbackMsgId = `ai-${Date.now()}`;
      const fallbackMsg: Message = {
        id: fallbackMsgId,
        sender: 'ai',
        text: fallbackResult.reply,
        timestamp: 'Just now',
        source: 'fallback',
        quotaExceeded: true,
        propertyRecommendations: fallbackResult.propertyRecommendations || []
      };

      if (fallbackResult.context) {
        setConversationContext(fallbackResult.context);
        if (fallbackResult.context.preferredLanguage && fallbackResult.context.preferredLanguage !== voiceLang) {
          setVoiceLang(fallbackResult.context.preferredLanguage);
        }
      }

      setMessages((prev) => [...prev, fallbackMsg]);
      setVoiceState('idle');
      speakText(fallbackResult.reply, fallbackMsgId);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // MICROPHONE VOICE INPUT HANDLERS
  // -------------------------------------------------------------
  const handleStartVoiceInput = () => {
    if (voiceState === 'listening') {
      voiceService.stopListening();
      setVoiceState('idle');
      return;
    }

    // Stop any active speech before listening
    voiceService.stopSpeaking();
    setCurrentlySpeakingMsgId(null);
    setVoiceError(null);
    setInterimTranscript('');

    const started = voiceService.startListening(voiceLang, {
      onStart: () => {
        setVoiceState('listening');
      },
      onInterimResult: (interim) => {
        setInterimTranscript(interim);
      },
      onFinalResult: (final) => {
        setInterimTranscript('');
        setVoiceState('idle');
        processQuery(final);
      },
      onError: (err: VoiceError) => {
        setVoiceState(err.code === 'not-allowed' ? 'denied' : 'idle');
        setVoiceError(err.message);
        setInterimTranscript('');
      },
      onEnd: () => {
        setVoiceState((prev) => (prev === 'listening' ? 'idle' : prev));
      }
    });

    if (!started && !voiceService.isSpeechRecognitionSupported()) {
      setVoiceState('unsupported');
      setVoiceError('Speech recognition is not supported in this browser. Please type below.');
    }
  };

  const handleStopListening = () => {
    voiceService.stopListening();
    setVoiceState('idle');
    if (interimTranscript.trim()) {
      processQuery(interimTranscript);
      setInterimTranscript('');
    }
  };

  // -------------------------------------------------------------
  // SPEECH PLAYBACK CONTROLS
  // -------------------------------------------------------------
  const handleTogglePlayPause = (msg: Message) => {
    if (currentlySpeakingMsgId === msg.id) {
      if (isSpeechPaused) {
        voiceService.resumeSpeaking();
        setIsSpeechPaused(false);
      } else {
        voiceService.pauseSpeaking();
        setIsSpeechPaused(true);
      }
    } else {
      speakText(msg.text, msg.id);
    }
  };

  const handleStopAudio = () => {
    voiceService.stopSpeaking();
    setCurrentlySpeakingMsgId(null);
    setIsSpeechPaused(false);
    setVoiceState('idle');
  };

  const handleToggleMute = () => {
    if (!isMuted) {
      voiceService.stopSpeaking();
      setCurrentlySpeakingMsgId(null);
      setIsSpeechPaused(false);
    }
    setIsMuted(!isMuted);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeechSpeed(newSpeed);
    voiceService.setSpeedRate(newSpeed);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative w-full max-w-3xl bg-[#faf9f7] rounded-[4px] border border-[#c5a880]/50 shadow-2xl overflow-hidden flex flex-col h-[700px] max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Bar */}
        <div className="bg-[#142B3B] text-white px-6 py-4 flex items-center justify-between border-b border-[#C5A46D]/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-10 rounded-[2px] bg-[#0E1D27] border border-[#C5A46D]/60 flex items-center justify-center text-[#C5A46D] shadow-md overflow-hidden">
              <img src="/assets/lyka-original-logo.png" alt="LYKA Realty logo" className="h-full w-full object-contain bg-[#0E1D27] p-1" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="label-caps text-[#C5A46D] text-[10px] tracking-widest font-semibold uppercase">
                  AI Real Estate Consultant
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Voice Assistant Ready" />
                <span className="text-[10px] text-[#C5A46D] bg-[#142B3B] border border-[#C5A46D]/40 px-1.5 py-0.2 rounded font-mono">
                  73,727 Verified Properties
                </span>
              </div>
              <h3 className="font-editorial text-base text-white font-medium">
                LYKA AI Voice Assistant · Dubai Real Estate
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher for Voice & Chat */}
            <div className="flex items-center bg-[#0E1D27] rounded-[2px] border border-[#C5A46D]/40 p-0.5 text-xs">
              <button
                onClick={() => setVoiceLang('en')}
                className={`px-2 py-1 rounded-[2px] text-[11px] font-semibold transition-all ${
                  voiceLang === 'en' ? 'bg-[#C5A46D] text-[#142B3B]' : 'text-[#888] hover:text-white'
                }`}
                title="English"
              >
                EN
              </button>
              <button
                onClick={() => setVoiceLang('ar')}
                className={`px-2 py-1 rounded-[2px] text-[11px] font-semibold transition-all ${
                  voiceLang === 'ar' ? 'bg-[#C5A46D] text-[#142B3B]' : 'text-[#888] hover:text-white'
                }`}
                title="العربية (Arabic)"
              >
                عربي
              </button>
              <button
                onClick={() => setVoiceLang('ta')}
                className={`px-2 py-1 rounded-[2px] text-[11px] font-semibold transition-all ${
                  voiceLang === 'ta' ? 'bg-[#C5A46D] text-[#142B3B]' : 'text-[#888] hover:text-white'
                }`}
                title="தமிழ் (Tamil)"
              >
                தமிழ்
              </button>
              <button
                onClick={() => setVoiceLang('tanglish')}
                className={`px-2 py-1 rounded-[2px] text-[11px] font-semibold transition-all ${
                  voiceLang === 'tanglish' ? 'bg-[#C5A46D] text-[#142B3B]' : 'text-[#888] hover:text-white'
                }`}
                title="Tanglish"
              >
                Tanglish
              </button>
            </div>

            {/* Mute Toggle */}
            <button
              onClick={handleToggleMute}
              className={`p-2 rounded-[2px] border transition-colors ${
                isMuted
                  ? 'bg-rose-950/60 text-rose-300 border-rose-600/40'
                  : 'bg-white/10 text-[#C5A46D] border-[#C5A46D]/30 hover:bg-white/20'
              }`}
              title={isMuted ? 'Voice Responses Muted' : 'Voice Responses Active'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-[#dadad8] hover:text-white rounded-[2px] transition-colors"
              aria-label="Close assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Voice Status Banner with Real-Time Soundwaves */}
        <div className="bg-[#0E1D27] text-white px-6 py-2.5 border-b border-[#C5A46D]/20 flex flex-wrap items-center justify-between text-xs shrink-0 gap-2">
          <div className="flex items-center gap-3">
            {voiceState === 'listening' && (
              <div className="flex items-center gap-2.5 text-[#C5A46D] font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span>Listening in {LOCALE_MAP[voiceLang].label}...</span>
              </div>
            )}

            {voiceState === 'processing' && (
              <div className="flex items-center gap-2 text-[#C5A46D]">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-[#C5A46D]" />
                <span>Reviewing Dubai properties...</span>
              </div>
            )}

            {voiceState === 'speaking' && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Volume2 className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                  <span>Consultant Speaking ({LOCALE_MAP[voiceLang].label})...</span>
                </div>
                <button
                  onClick={handleStartVoiceInput}
                  className="px-2.5 py-1 rounded-[2px] bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] tracking-wider uppercase transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                  title="Interrupt AI speaking and speak immediately (Barge-in)"
                >
                  <Square className="w-2.5 h-2.5 fill-current" />
                  <span>Interrupt & Speak</span>
                </button>
              </div>
            )}

            {/* Animated Soundwave Frequency Bars when Active */}
            {(voiceState === 'speaking' || voiceState === 'listening') && (
              <div className="flex items-center gap-1 h-5 px-2 py-0.5 bg-black/40 rounded border border-[#C5A46D]/40">
                <span className="w-1 bg-[#C5A46D] rounded-full animate-pulse h-3" />
                <span className="w-1 bg-[#C5A46D] rounded-full animate-pulse h-5" style={{ animationDelay: '150ms' }} />
                <span className="w-1 bg-[#C5A46D] rounded-full animate-pulse h-2" style={{ animationDelay: '300ms' }} />
                <span className="w-1 bg-[#C5A46D] rounded-full animate-pulse h-4" style={{ animationDelay: '200ms' }} />
                <span className="w-1 bg-[#C5A46D] rounded-full animate-pulse h-5" style={{ animationDelay: '100ms' }} />
                <span className="w-1 bg-[#C5A46D] rounded-full animate-pulse h-3" style={{ animationDelay: '250ms' }} />
              </div>
            )}

            {voiceState === 'denied' && (
              <div className="flex items-center gap-2 text-rose-400">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Microphone permission was denied. You can continue typing below.</span>
              </div>
            )}

            {voiceState === 'unsupported' && (
              <div className="flex items-center gap-2 text-amber-300">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Speech recognition is not available in this browser. Please type below.</span>
              </div>
            )}

            {voiceState === 'idle' && (
              <div className="flex items-center gap-2 text-[#aaa]">
                <Mic className="w-3.5 h-3.5 text-[#C5A46D]" />
                <span>
                  Tap microphone or type. Language:{' '}
                  <strong className="text-white">{LOCALE_MAP[voiceLang].label}</strong>
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-[11px] text-[#aaa]">
            {/* Speed Selector */}
            <div className="flex items-center gap-1">
              <span>Speech Speed:</span>
              {[1.0, 1.15, 1.25].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    speechSpeed === s ? 'bg-[#C5A46D] text-[#142B3B]' : 'hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Continuous conversation loop toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={autoListenContinuous}
                onChange={(e) => setAutoListenContinuous(e.target.checked)}
                className="accent-[#C5A46D] w-3.5 h-3.5 rounded"
              />
              <span>Auto-listen after reply</span>
            </label>
          </div>
        </div>

        {/* Lead Created Notice Banner */}
        {leadCreatedNotice && (
          <div className="px-6 py-2.5 bg-emerald-950 text-emerald-100 text-xs flex items-center justify-between border-b border-emerald-700 animate-fadeIn">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{leadCreatedNotice}</span>
            </span>
            <button
              onClick={() => setLeadCreatedNotice(null)}
              className="text-emerald-400 hover:text-white text-[11px] font-bold ml-2 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Message Transcript Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#f6f4ef]">
          {messages.map((m) => {
            const isSpeakingThis = currentlySpeakingMsgId === m.id;

            return (
              <div
                key={m.id}
                className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-[2px] bg-[#142B3B] border border-[#C5A46D]/50 text-[#C5A46D] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-[3px] p-4 text-xs leading-relaxed shadow-sm transition-all ${
                    m.sender === 'user'
                      ? 'bg-[#142B3B] text-white'
                      : isSpeakingThis
                      ? 'bg-white border-2 border-[#C5A46D] text-[#142B3B] ring-4 ring-[#C5A46D]/15'
                      : 'bg-white border border-[#C5A46D]/20 text-[#142B3B]'
                  }`}
                >
                  {/* AI Message Header / Audio Player Controls */}
                  {m.sender === 'ai' && (
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#eee] text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#142B3B] uppercase tracking-wider">
                          {m.source === 'gemini'
                            ? 'Gemini 2.5 Flash'
                            : m.source === 'ollama'
                            ? 'Ollama Cloud'
                            : 'LYKA Real Estate Consultant'}
                        </span>
                        {m.quotaExceeded && (
                          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-semibold border border-amber-300">
                            Offline Engine Active
                          </span>
                        )}
                      </div>

                      {/* Speech Playback Controls */}
                      <div className="flex items-center gap-1 text-[#666]">
                        <button
                          onClick={() => handleTogglePlayPause(m)}
                          className="p-1 hover:text-[#142B3B] transition-colors flex items-center gap-1 font-semibold cursor-pointer"
                          title={isSpeakingThis && !isSpeechPaused ? 'Pause Voice' : 'Play / Replay Voice'}
                        >
                          {isSpeakingThis && !isSpeechPaused ? (
                            <>
                              <Pause className="w-3 h-3 text-[#142B3B]" />
                              <span>Pause</span>
                            </>
                          ) : isSpeakingThis && isSpeechPaused ? (
                            <>
                              <Play className="w-3 h-3 text-emerald-600" />
                              <span>Resume</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3 text-[#142B3B]" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>

                        {isSpeakingThis && (
                          <button
                            onClick={handleStopAudio}
                            className="p-1 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Stop Voice"
                          >
                            <Square className="w-2.5 h-2.5 fill-current" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="whitespace-pre-line leading-relaxed">{m.text}</div>

                  {/* Connected Property Recommendation Cards */}
                  {m.propertyRecommendations && m.propertyRecommendations.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#C5A46D]/20 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-[#142B3B] tracking-wider block">
                        Verified Dubai Database Matches:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {m.propertyRecommendations.map((prop: any) => {
                          const fullProp = PROPERTIES.find((p) => String(p.id) === String(prop.id)) || prop;
                          return (
                            <div
                              key={prop.id}
                              className="bg-[#faf9f7] rounded-[2px] border border-[#C5A46D]/30 p-2.5 flex flex-col justify-between hover:border-[#C5A46D] transition-colors"
                            >
                              <div>
                                <div className="flex items-center justify-between text-[11px] font-semibold text-[#142B3B] mb-0.5">
                                  <span className="truncate">{prop.title}</span>
                                  <span className="text-[9px] uppercase px-1 rounded bg-[#142B3B] text-[#C5A46D]">
                                    {prop.location}
                                  </span>
                                </div>
                                <div className="text-[10px] text-[#666]">
                                  {formatCurrency(prop.priceAED, currency)} · {prop.bedrooms} BHK · {prop.purpose || 'For Rent'}
                                </div>
                                {prop.matchReason && (
                                  <div className="text-[10px] text-[#142B3B] bg-[#142B3B]/5 px-2 py-1 rounded-[2px] border border-[#142B3B]/15 mt-1.5 font-medium leading-tight">
                                    🎯 {prop.matchReason}
                                  </div>
                                )}
                              </div>

                              <div className="mt-2 pt-2 border-t border-[#eee] flex items-center justify-between text-[10px] gap-2">
                                <button
                                  onClick={() => {
                                    onClose();
                                    onSelectProperty?.(fullProp);
                                  }}
                                  className="text-[#142B3B] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                                >
                                  View Details <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  onClick={() => handleCreateVoiceLead(`Priority interest in ${prop.title} via Voice Session`, prop.title)}
                                  disabled={isCreatingLead}
                                  className="text-[#142B3B] hover:text-[#C5A46D] font-semibold bg-[#C5A46D]/20 hover:bg-[#C5A46D]/30 px-2 py-0.5 rounded-[2px] transition-colors cursor-pointer"
                                  title="Persist this inquiry directly into the CRM database"
                                >
                                  + Book Viewing
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Suggested Quick Inquiries */}
                  {m.suggestions && (
                    <div className="mt-3 pt-3 border-t border-[#C5A46D]/15 space-y-1.5">
                      <span className="text-[10px] uppercase font-semibold text-[#888] tracking-wider block">
                        Suggested Follow-Up Inquiries:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {m.suggestions.map((s, idx) => (
                          <button
                            key={idx}
                            onClick={() => processQuery(s)}
                            className="text-[11px] text-[#142B3B] bg-[#142B3B]/5 hover:bg-[#142B3B]/15 border border-[#142B3B]/20 px-2.5 py-1 rounded-[2px] text-left transition-colors cursor-pointer"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {m.sender === 'user' && (
                  <div className="w-8 h-8 rounded-[2px] bg-[#C5A46D] text-[#142B3B] flex items-center justify-center shrink-0 mt-0.5 shadow-sm font-bold">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Real-time Interim Live Transcript Preview while speaking */}
          {voiceState === 'listening' && interimTranscript && (
            <div className="flex gap-3 justify-end animate-fadeIn">
              <div className="max-w-[85%] rounded-[3px] p-3.5 text-xs bg-[#142B3B]/90 text-white border border-[#C5A46D]/60 italic shadow-md">
                <span className="text-[10px] block uppercase font-mono text-[#C5A46D] mb-1">
                  Listening in real-time...
                </span>
                "{interimTranscript}"
              </div>
              <div className="w-8 h-8 rounded-[2px] bg-[#C5A46D] text-[#142B3B] flex items-center justify-center shrink-0">
                <Mic className="w-4 h-4 animate-ping" />
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-[#75777a] italic p-2">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-[#C5A46D]" />
              Consultant is searching verified properties...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error notification banner if any */}
        {voiceError && (
          <div className="px-6 py-2 bg-rose-50 border-t border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              {voiceError}
            </span>
            <button
              onClick={() => setVoiceError(null)}
              className="text-rose-600 hover:text-rose-900 font-bold ml-2 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Bottom Hybrid Voice & Text Input Controls */}
        <div className="p-4 bg-white border-t border-[#C5A46D]/30 shrink-0 space-y-2">
          
          <div className="flex items-center gap-2">
            
            {/* Primary Microphone Trigger Button */}
            <button
              type="button"
              onClick={handleStartVoiceInput}
              disabled={isLoading}
              className={`p-3 rounded-[3px] border transition-all cursor-pointer flex items-center justify-center relative shadow-sm ${
                voiceState === 'listening'
                  ? 'bg-rose-600 text-white border-rose-700 ring-4 ring-rose-200 animate-pulse'
                  : 'bg-[#142B3B] text-[#C5A46D] hover:bg-[#0e1d27] hover:border-[#C5A46D] border-[#C5A46D]/50'
              }`}
              title={
                voiceState === 'listening'
                  ? 'Tap to stop listening & send'
                  : `Tap to speak in ${LOCALE_MAP[voiceLang].label}`
              }
            >
              {voiceState === 'listening' ? (
                <Square className="w-5 h-5 fill-current" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            {/* Text Input Fallback Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                processQuery(input);
              }}
              className="flex-1 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  voiceLang === 'ta'
                    ? 'துபாய் சொகுசு இல்லங்கள் பற்றி பேசவும் அல்லது தட்டச்சு செய்யவும்...'
                    : voiceLang === 'ar'
                    ? 'تحدث بالصوت أو اكتب استفسارك حول عقارات دبي...'
                    : 'Speak or type your inquiry (e.g. 2-bedroom in Dubai Marina, budget AED 100k)...'
                }
                className="flex-1 px-4 py-2.5 bg-[#faf9f7] border border-[#C5A46D]/30 rounded-[2px] text-xs text-[#142B3B] placeholder-[#888] focus:outline-none focus:border-[#C5A46D]"
              />

              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-2.5 bg-[#142B3B] hover:bg-[#0e1d27] disabled:opacity-50 text-[#C5A46D] rounded-[2px] border border-[#C5A46D]/50 transition-colors flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>

          </div>

          {/* Privacy & Engine Transparency Note */}
          <div className="flex flex-wrap items-center justify-between text-[10px] text-[#75777a] pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Zero Minute Limit · Local Web Speech STT & TTS · No Audio Stored
            </span>
            <span>
              Powered by LYKA Gemini 2.5 Flash Proxy with Sovereign Central Bank Fallbacks
            </span>
          </div>

        </div>

      </div>

    </div>
  );
};
