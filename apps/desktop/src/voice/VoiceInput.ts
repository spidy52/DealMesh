export class VoiceInput {
  private recognition: any = null;
  private isListening = false;

  constructor(
    private onResult: (text: string) => void,
    private onError: (err: any) => void
  ) {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      this.recognition = new SpeechRec();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        this.isListening = false;
        this.onResult(text);
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        this.onError(event);
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };
    }
  }

  start() {
    if (!this.recognition || this.isListening) return;
    try {
      this.isListening = true;
      this.recognition.start();
    } catch (e) {
      this.isListening = false;
    }
  }

  stop() {
    if (!this.recognition || !this.isListening) return;
    try {
      this.recognition.stop();
      this.isListening = false;
    } catch (e) {}
  }
}
