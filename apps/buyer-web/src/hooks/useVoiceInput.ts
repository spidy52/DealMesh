import { useState, useEffect, useCallback, useRef } from 'react';

interface VoiceInputOptions {
  onWakeWord?: () => void;
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
  wakeWords?: string[];
}

export function useVoiceInput({
  onWakeWord,
  onResult,
  onError,
  wakeWords = ['hey omni', 'hey omi', 'omni', 'omi'],
}: VoiceInputOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isAwake, setIsAwake] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const processSpeech = useCallback(
    (text: string) => {
      const lower = text.toLowerCase().trim();

      // Check for wake word in speech
      const detectedWake = wakeWords.some((w) => lower.includes(w));

      if (detectedWake) {
        setIsAwake(true);
        if (onWakeWord) onWakeWord();

        // Extract command after wake word if present
        let cleanQuery = lower;
        for (const w of wakeWords) {
          if (cleanQuery.includes(w)) {
            cleanQuery = cleanQuery.replace(w, '').replace(/^[,\s]+/, '');
          }
        }

        if (cleanQuery.length > 2) {
          onResult(cleanQuery);
        }
      } else if (isAwake) {
        // Already awake, process direct speech
        onResult(lower);
      }
    },
    [isAwake, onWakeWord, onResult, wakeWords]
  );

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const simulated = 'Hey Omni, find me formal watches under ₹3,000';
      setTranscript(simulated);
      setIsAwake(true);
      if (onWakeWord) onWakeWord();
      onResult('find me formal watches under ₹3,000');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        processSpeech(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Voice recognition:', event.error);
        if (onError) onError(event.error);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      console.warn('Voice start error:', err);
      setIsListening(false);
    }
  }, [processSpeech, onWakeWord, onResult, onError]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setIsAwake(false);
  }, []);

  return {
    isListening,
    isAwake,
    transcript,
    isSupported,
    startListening,
    stopListening,
    setIsAwake,
  };
}
