// Web stub for react-native-tts — delegates to the Web Speech API.

let defaultLang = 'en-US';
let defaultRate = 0.5;
let defaultPitch = 1.0;
const eventListeners = new Map<string, Function[]>();

function emit(event: string, data?: any): void {
  (eventListeners.get(event) ?? []).forEach(cb => cb(data));
}

const Tts = {
  async getInitStatus(): Promise<void> {
    if (!('speechSynthesis' in window)) {
      throw {code: 'no_engine'};
    }
  },

  async requestInstallEngine(): Promise<void> {},

  stop(): void {
    window.speechSynthesis?.cancel();
  },

  async setDefaultLanguage(lang: string): Promise<void> {
    defaultLang = lang;
  },

  setDefaultRate(rate: number): void {
    defaultRate = rate;
  },

  setDefaultPitch(pitch: number): void {
    defaultPitch = pitch;
  },

  speak(text: string): void {
    const synth = window.speechSynthesis;
    if (!synth) {
      return;
    }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = defaultLang;
    utterance.rate = defaultRate;
    utterance.pitch = defaultPitch;
    utterance.onstart = () => emit('tts-start');
    utterance.onend = () => emit('tts-finish');
    utterance.onerror = () => emit('tts-error');
    synth.speak(utterance);
  },

  addEventListener(
    event: string,
    callback: Function,
  ): {remove: () => void} {
    const listeners = eventListeners.get(event) ?? [];
    listeners.push(callback);
    eventListeners.set(event, listeners);
    return {
      remove: () => {
        const updated = (eventListeners.get(event) ?? []).filter(
          l => l !== callback,
        );
        eventListeners.set(event, updated);
      },
    };
  },
};

export default Tts;
