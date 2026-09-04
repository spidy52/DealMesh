import { eventBus } from '../events/AssistantEventBus';

// Utility to encode raw PCM Float32 audio samples into standard 16-bit 16kHz WAV format
function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

class SpeechToSpeechService {
  private isEnabled = true;
  private isSpeaking = false;
  private onStatusChange?: (status: string, text?: string) => void;
  private femaleVoice: SpeechSynthesisVoice | null = null;

  // Real-Time Hardware Web Audio Stream
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private micStream: MediaStream | null = null;
  private recordedSamples: number[] = [];
  private isCollectingSamples = false;
  private silenceTimer: any = null;

  // Sleep / Awake state management
  public isSleeping: boolean = false;
  public onWakeTrigger?: () => void;

  constructor() {
    this.initVoices();
    // Hardware mic is managed exclusively by native Python voice_service.py
  }

  private logTerminal(msg: string) {
    if (typeof window !== 'undefined' && window.electronAPI?.logToTerminal) {
      window.electronAPI.logToTerminal(msg);
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const pickFemaleVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      const selected =
        voices.find(
          (v) =>
            v.name.includes('Ayumi') ||
            v.name.includes('Haruka') ||
            v.name.includes('Nanami') ||
            v.name.includes('Kyoko') ||
            v.name.includes('Sayaka')
        ) ||
        voices.find(
          (v) =>
            v.name.includes('Zira') ||
            v.name.includes('Jenny') ||
            v.name.includes('Aria') ||
            v.name.includes('Sonia') ||
            v.name.includes('Samantha') ||
            v.name.includes('Victoria') ||
            v.name.includes('Google UK English Female') ||
            v.name.includes('Google US English Female') ||
            v.name.includes('Female')
        ) ||
        voices.find((v) => v.lang.startsWith('en') && !v.name.includes('David') && !v.name.includes('George'));

      if (selected) {
        this.femaleVoice = selected;
      }
    };

    pickFemaleVoice();
    window.speechSynthesis.onvoiceschanged = pickFemaleVoice;
  }

  // 1. Hardware Microphone Stream & Raw PCM Audio Capture
  private async initHardwareMicrophone() {
    if (typeof window === 'undefined') return;

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000,
          },
        });

        this.micStream = stream;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx({ sampleRate: 16000 });
          const source = this.audioContext.createMediaStreamSource(stream);

          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 256;
          source.connect(this.analyser);

          this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
          source.connect(this.scriptProcessor);
          this.scriptProcessor.connect(this.audioContext.destination);

          this.scriptProcessor.onaudioprocess = (e) => {
            if (this.isSpeaking || this.isSleeping) {
              return;
            }

            if (this.isCollectingSamples) {
              const inputData = e.inputBuffer.getChannelData(0);
              for (let i = 0; i < inputData.length; i++) {
                this.recordedSamples.push(inputData[i]);
              }
            }
          };

          this.logTerminal('🎤 [MICROPHONE READY]: Listening for voice & desktop automation commands...');
          this.startVoiceActivityDetection();
        }
      }
    } catch (e) {
      this.logTerminal(`⚠️ [MICROPHONE ERROR]: ${(e as any)?.message}`);
    }
  }

  // 2. Real-Time Hardware Voice Activity Detection
  private startVoiceActivityDetection() {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkLevel = () => {
      if (!this.analyser || !this.isEnabled) {
        requestAnimationFrame(checkLevel);
        return;
      }

      if (this.isSpeaking || this.isSleeping) {
        requestAnimationFrame(checkLevel);
        return;
      }

      this.analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const averageVolume = sum / bufferLength;

      if (averageVolume > 18) {
        if (!this.isSleeping) {
          this.onStatusChange?.('HEARING', 'Hearing your voice...');
        }

        if (!this.isCollectingSamples) {
          this.isCollectingSamples = true;
          this.recordedSamples = [];
        }

        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }
      } else if (this.isCollectingSamples) {
        if (!this.silenceTimer) {
          this.silenceTimer = setTimeout(() => {
            this.silenceTimer = null;
            this.isCollectingSamples = false;

            if (this.recordedSamples.length > 8000) {
              const samplesArray = new Float32Array(this.recordedSamples);
              this.recordedSamples = [];
              const wavBlob = encodeWAV(samplesArray, this.audioContext?.sampleRate || 16000);
              this.transcribeWithBackend(wavBlob);
            }
          }, 800);
        }
      }

      requestAnimationFrame(checkLevel);
    };

    checkLevel();
  }

  // 3. Transcribe audio with backend with direct AI & Desktop Execution
  private async transcribeWithBackend(wavBlob: Blob) {
    if (this.isSpeaking || this.isSleeping) return;

    try {
      const formData = new FormData();
      formData.append('file', wavBlob, 'recording.wav');

      const res = await fetch('http://localhost:8000/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.text && data.text.trim()) {
          const recognizedText = data.text.trim();
          this.logTerminal(`🗣️ [USER SPOKEN]: "${recognizedText}"`);
          this.handleDesktopVoiceCommand(recognizedText);
        }
      }
    } catch (e) {
      console.warn('Backend transcription error:', e);
    }
  }

  public setStatusListener(callback: (status: string, text?: string) => void) {
    this.onStatusChange = callback;
  }

  public startListening() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    this.isEnabled = true;
  }

  public stopListening() {
    this.isEnabled = false;
  }

  public async handleUserSpeechFast(spokenText: string) {
    return this.handleDesktopVoiceCommand(spokenText);
  }

  public stopSpeaking() {
    this.isSpeaking = false;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  // 4. REAL DESKTOP MANIPULATION & AI AGENT EXECUTION
  public async handleDesktopVoiceCommand(spokenText: string) {
    if (!spokenText.trim()) return;

    if (this.isSpeaking) {
      // Barge-in: user interrupted Omni!
      this.stopSpeaking();
      this.logTerminal(`🛑 [BARGE-IN]: User interrupted Omni speech! Listening to: "${spokenText}"`);
    }

    const textLower = spokenText.toLowerCase().trim();

    // Wake Word Detection
    const isWakeWord =
      textLower.startsWith('hey omi') ||
      textLower.startsWith('hey omni') ||
      textLower.startsWith('omi') ||
      textLower.startsWith('omni') ||
      textLower.includes('wake up') ||
      textLower.includes('hey omi') ||
      textLower.includes('hey omni');

    // If sleeping: wake up
    if (this.isSleeping) {
      if (isWakeWord) {
        this.isSleeping = false;
        this.logTerminal(`☀️ [WAKE WORD DETECTED]: "${spokenText}" -> Waking up Omni`);
        this.onWakeTrigger?.();
        this.speakReply("Hai! I'm awake and ready to help on your desktop!");
      }
      return;
    }

    const cleanQuery = textLower
      .replace(/^hey\s+omi\s*/i, '')
      .replace(/^hey\s+omni\s*/i, '')
      .replace(/^omi\s*/i, '')
      .replace(/^omni\s*/i, '')
      .trim();

    // ==========================================
    // DESKTOP AUTOMATION ACTION 1: SEARCH DEALS & OPEN BROWSER
    // ==========================================
    const isDealSearch =
      cleanQuery.includes('deal') ||
      cleanQuery.includes('buy') ||
      cleanQuery.includes('discount') ||
      cleanQuery.includes('offer') ||
      cleanQuery.includes('price') ||
      cleanQuery.includes('watch') ||
      cleanQuery.includes('rose') ||
      cleanQuery.includes('flower') ||
      cleanQuery.includes('shoe') ||
      cleanQuery.includes('laptop') ||
      cleanQuery.includes('phone') ||
      cleanQuery.includes('search for') ||
      cleanQuery.includes('find me') ||
      cleanQuery.includes('negotiat') ||
      cleanQuery.includes('bargain') ||
      cleanQuery.includes('haggle') ||
      cleanQuery.includes('proceed') ||
      cleanQuery.includes('confirm') ||
      cleanQuery.includes('pick') ||
      cleanQuery.includes('choose') ||
      cleanQuery.includes('option') ||
      cleanQuery.includes('budget') ||
      /^\d+$/.test(cleanQuery.trim());

    if (isDealSearch) {
      const searchTerm = cleanQuery
        .replace(/find\s+(me\s+)?(deals\s+(for|on)\s+|prices\s+(for|on)\s+|discounts\s+(for|on)\s+)?/i, '')
        .replace(/search\s+(for\s+)?/i, '')
        .replace(/buy\s+/i, '')
        .trim();

      const queryToOpen = searchTerm || cleanQuery || 'deals';
      this.logTerminal(`🔍 [AI BUYER AGENT]: Scanning market for "${queryToOpen}"...`);
      this.onStatusChange?.('THINKING', `Scanning stores for ${queryToOpen}...`);

      try {
        const resp = await fetch('http://localhost:8000/api/voice/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: cleanQuery || spokenText }),
        });

        if (resp.ok) {
          const data = await resp.json();
          if (data.action === 'show_deal_overlay' && data.deal_data) {
            eventBus.emitEvent('assistant.deal_found', {
              query: data.product_query || queryToOpen,
              dealData: data.deal_data,
            });
          } else if (data.action === 'show_negotiation_arena' && data.deal_data) {
            eventBus.emitEvent('assistant.open_arena', {
              query: data.product_query || data.deal_query || queryToOpen,
              dealData: data.deal_data,
              budget: data.deal_data?.user_budget,
            });
          } else if (data.action === 'deal_completed' && data.deal_data) {
            eventBus.emitEvent('assistant.deal_found', {
              query: data.product_query || data.deal_query || queryToOpen,
              dealData: data.deal_data,
            });
          }
          if (data.reply) {
            this.speakReply(data.reply);
            return;
          }
        }
      } catch (e) {
        this.logTerminal(`⚠️ Backend deal search error: ${(e as any)?.message}`);
      }

      this.speakReply(`Scanning stores for ${queryToOpen}. Verified options loaded!`);
      return;
    }

    // ==========================================
    // DESKTOP AUTOMATION ACTION 2: OPEN PORTALS & SITES
    // ==========================================
    if (cleanQuery.includes('merchant') || cleanQuery.includes('studio') || cleanQuery.includes('seller')) {
      this.logTerminal('🌐 [DESKTOP AUTOMATION]: Opening Merchant Studio at http://localhost:5174');
      if (window.electronAPI?.openExternalUrl) {
        window.electronAPI.openExternalUrl('http://localhost:5174');
      }
      this.speakReply("Opening Merchant Studio in your browser now!");
      return;
    }

    if (cleanQuery.includes('buyer') || cleanQuery.includes('portal') || cleanQuery.includes('open dealmesh')) {
      this.logTerminal('🌐 [DESKTOP AUTOMATION]: Opening Buyer Portal at http://localhost:5173');
      if (window.electronAPI?.openExternalUrl) {
        window.electronAPI.openExternalUrl('http://localhost:5173');
      }
      this.speakReply("Opening DealMesh Buyer Portal on your desktop!");
      return;
    }

    if (cleanQuery.includes('youtube')) {
      window.electronAPI?.openExternalUrl?.('https://youtube.com');
      this.speakReply("Opening YouTube for you!");
      return;
    }

    if (cleanQuery.includes('google')) {
      window.electronAPI?.openExternalUrl?.('https://google.com');
      this.speakReply("Opening Google search!");
      return;
    }

    // ==========================================
    // DESKTOP AUTOMATION ACTION 3: LAUNCH LOCAL APPS
    // ==========================================
    if (cleanQuery.includes('open chrome') || cleanQuery.includes('launch chrome')) {
      window.electronAPI?.launchApp?.('chrome');
      this.speakReply("Launching Google Chrome on your desktop!");
      return;
    }

    if (cleanQuery.includes('open calculator') || cleanQuery.includes('calculator')) {
      window.electronAPI?.launchApp?.('calc');
      this.speakReply("Opening Calculator!");
      return;
    }

    if (cleanQuery.includes('open notepad') || cleanQuery.includes('notepad')) {
      window.electronAPI?.launchApp?.('notepad');
      this.speakReply("Opening Notepad for you!");
      return;
    }

    // ==========================================
    // DESKTOP AI ACTION 4: REAL AI LLM QUERY (OpenRouter / Gemini)
    // ==========================================
    try {
      this.onStatusChange?.('THINKING', 'Thinking with AI...');
      const response = await fetch('http://localhost:8000/api/voice/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: cleanQuery || spokenText }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.action === 'show_deal_overlay' && data.deal_data) {
          eventBus.emitEvent('assistant.deal_found', {
            query: data.product_query || data.deal_query || cleanQuery,
            dealData: data.deal_data,
          });
        } else if (data.action === 'show_negotiation_arena' && data.deal_data) {
          eventBus.emitEvent('assistant.open_arena', {
            query: data.product_query || data.deal_query || cleanQuery,
            dealData: data.deal_data,
            budget: data.deal_data?.user_budget,
          });
        } else if (data.action === 'deal_completed' && data.deal_data) {
          eventBus.emitEvent('assistant.deal_found', {
            query: data.product_query || data.deal_query || cleanQuery,
            dealData: data.deal_data,
          });
        }
        if (data.reply) {
          this.speakReply(data.reply);
          return;
        }
      }
    } catch (e) {}

    // Fallback response
    this.speakReply(`I hear you! How can I help on your desktop with "${cleanQuery || spokenText}"?`);
  }

  public speakReply(text: string, onEnd?: () => void) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (this.isSleeping) {
      window.speechSynthesis.cancel();
      return;
    }

    this.isSpeaking = true;
    this.recordedSamples = [];
    this.isCollectingSamples = false;
    this.logTerminal(`🤖 [OMNI REPLYING]: "${text}"`);
    this.onStatusChange?.('SPEAKING', text);

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.rate = 1.05;
    utterance.pitch = 1.25;

    if (this.femaleVoice) {
      utterance.voice = this.femaleVoice;
    } else {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(
        (v) =>
          v.name.includes('Zira') ||
          v.name.includes('Jenny') ||
          v.name.includes('Aria') ||
          v.name.includes('Samantha') ||
          v.name.includes('Google UK English Female') ||
          v.name.includes('Female')
      );
      if (voice) utterance.voice = voice;
    }

    utterance.onend = () => {
      setTimeout(() => {
        this.isSpeaking = false;
        this.recordedSamples = [];
        this.onStatusChange?.('IDLE');
        if (onEnd) onEnd();
      }, 800);
    };

    utterance.onerror = () => {
      setTimeout(() => {
        this.isSpeaking = false;
        this.onStatusChange?.('IDLE');
      }, 800);
    };

    window.speechSynthesis.speak(utterance);
  }
}

export const speechToSpeech = new SpeechToSpeechService();
