import { useCallback } from 'react';

export interface VoiceSettingsConfig {
  voiceName?: string;
  pitch?: number;
  rate?: number;
}

export function useSpeechSynthesis(settings?: VoiceSettingsConfig) {
  const speak = useCallback((text: string, overridePitch?: number, overrideRate?: number) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // Cancel any active speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = overridePitch ?? settings?.pitch ?? 1.0;
    utterance.rate = overrideRate ?? settings?.rate ?? 1.0;
    utterance.lang = 'en-US';

    // Select chosen or natural voice
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice: SpeechSynthesisVoice | undefined;

    if (settings?.voiceName && settings.voiceName !== 'default') {
      selectedVoice = voices.find((v) => v.name === settings.voiceName);
    }

    if (!selectedVoice) {
      selectedVoice = voices.find(
        (v) =>
          v.name.includes('Natural') ||
          v.name.includes('Google UK English Female') ||
          v.name.includes('Google US English') ||
          v.name.includes('Jenny') ||
          v.name.includes('Zira') ||
          v.name.includes('Samantha') ||
          v.lang === 'en-US'
      );
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, [settings?.voiceName, settings?.pitch, settings?.rate]);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return { speak, stop };
}
