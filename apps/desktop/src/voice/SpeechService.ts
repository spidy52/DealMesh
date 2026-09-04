import { PetPersonality } from '../state/petStore';

class SpeechService {
  private synth: SpeechSynthesis | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.synth = window.speechSynthesis;
    }
  }

  speak(text: string, personality: PetPersonality = 'Playful') {
    if (!this.synth) return;

    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // Cute Japanese female pitch & pacing
    utterance.pitch = 1.25;
    utterance.rate = 1.04;

    const voices = this.synth.getVoices();
    const japaneseFemaleVoice = voices.find(
      (v) =>
        v.name.includes('Ayumi') ||
        v.name.includes('Haruka') ||
        v.name.includes('Nanami') ||
        v.name.includes('Kyoko') ||
        v.name.includes('Sayaka') ||
        (v.lang.startsWith('ja') && (v.name.includes('Female') || v.name.includes('Google') || v.name.includes('Microsoft'))) ||
        v.lang === 'ja-JP' ||
        v.lang === 'ja'
    ) || voices.find(
      (v) =>
        v.name.includes('Google UK English Female') ||
        v.name.includes('Samantha') ||
        v.name.includes('Victoria') ||
        v.name.includes('Karen') ||
        v.name.includes('Zira')
    );

    if (japaneseFemaleVoice) {
      utterance.voice = japaneseFemaleVoice;
    }

    this.synth.speak(utterance);
  }

  stop() {
    this.synth?.cancel();
  }
}

export const speechService = new SpeechService();
