/**
 * TTSService — thin wrapper around react-native-tts.
 *
 * Usage:
 *   await TTSService.init();
 *   await TTSService.speak('नमस्ते', 'hi');
 *   TTSService.stop();
 */

import Tts from 'react-native-tts';

// BCP-47 language tags for each app LanguageCode
const LANGUAGE_TAG: Record<string, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  sa: 'hi-IN',   // Sanskrit uses the Hindi engine as the closest available
  mr: 'mr-IN',
  ta: 'ta-IN',
  te: 'te-IN',
};

let initialised = false;

export const TTSService = {
  async init(): Promise<void> {
    if (initialised) return;
    try {
      await Tts.getInitStatus();
      initialised = true;
    } catch (err: any) {
      if (err?.code === 'no_engine') {
        // On Android, prompt the user to install a TTS engine.
        await Tts.requestInstallEngine();
      }
    }
  },

  async speak(
    text: string,
    langCode = 'en',
    rate = 0.5,
    pitch = 1.0,
  ): Promise<void> {
    await TTSService.init();
    Tts.stop();
    const lang = LANGUAGE_TAG[langCode] ?? 'en-US';
    await Tts.setDefaultLanguage(lang);
    Tts.setDefaultRate(rate);
    Tts.setDefaultPitch(pitch);
    Tts.speak(text);
  },

  stop(): void {
    Tts.stop();
  },

  /** Listen for the 'tts-finish' event. Returns an unsubscribe fn. */
  onFinish(cb: () => void): () => void {
    const listener = Tts.addEventListener('tts-finish', cb);
    return () => listener.remove();
  },

  /** Listen for 'tts-start'. Returns an unsubscribe fn. */
  onStart(cb: () => void): () => void {
    const listener = Tts.addEventListener('tts-start', cb);
    return () => listener.remove();
  },
};
