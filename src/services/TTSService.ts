/**
 * TTSService — wrapper around react-native-tts that supports:
 *
 *   - Listing every TTS voice installed on the device
 *   - Filtering voices by language (hi-IN, en-IN, sa-* falling back to hi-IN, etc.)
 *   - Per-language voice preferences (user can choose male/female/specific voice
 *     for English, a different one for Hindi, etc.) persisted in AsyncStorage
 *   - Detecting when no voice exists for a requested language and surfacing a
 *     deep-link to the OS TTS settings
 *
 * IMPORTANT context for understanding this file:
 *
 *   Voice files (e.g. the Hindi-India female voice) are part of the operating
 *   system, not the app. We cannot bundle them. If a language has no voice
 *   installed, the only fix is for the user to install one via:
 *
 *     Android: Settings → System → Languages → Text-to-speech output →
 *              Install voice data → Hindi (India) → download
 *
 *     iOS:     Settings → Accessibility → Spoken Content → Voices → Hindi →
 *              tap to download
 *
 *   This service exposes openTtsSettings() to deep-link the user there.
 */

import {Platform, Linking, NativeModules} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Tts from 'react-native-tts';

// =============================================================================
// Types
// =============================================================================

export interface Voice {
  id: string;             // platform voice id, e.g. "hi-in-x-hia-local"
  name: string;           // user-readable, e.g. "Lekha" or "Hindi India Female"
  language: string;       // BCP-47, e.g. "hi-IN"
  quality?: number;       // 100-500, higher is better (Android only)
  networkConnectionRequired?: boolean; // iOS: streaming voices need network
  notInstalled?: boolean; // iOS lists downloadable voices too
}

export type LanguageCode = 'en' | 'hi' | 'sa' | 'mr' | 'ta' | 'te';

/** Per-app-language → user's chosen voice id. */
export type VoicePreferences = Partial<Record<LanguageCode, string>>;

// BCP-47 language tags for each app LanguageCode. Multiple acceptable tags per
// code so that we can find the best available voice — e.g. for English we'd
// rather have en-IN if installed.
const LANGUAGE_TAGS: Record<LanguageCode, string[]> = {
  en: ['en-IN', 'en-GB', 'en-US', 'en-AU'],
  hi: ['hi-IN'],
  sa: ['hi-IN'],       // Sanskrit best approximated by Hindi voices
  mr: ['mr-IN'],
  ta: ['ta-IN'],
  te: ['te-IN'],
};

// =============================================================================
// State
// =============================================================================

let initialised = false;
let cachedVoices: Voice[] | null = null;

const STORAGE_KEY = 'dg.v1.voicePreferences';

async function loadPrefs(): Promise<VoicePreferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as VoicePreferences) : {};
  } catch {
    return {};
  }
}

async function savePrefs(prefs: VoicePreferences): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

// =============================================================================
// Public API
// =============================================================================

export const TTSService = {
  async init(): Promise<void> {
    if (initialised) return;
    try {
      await Tts.getInitStatus();
      initialised = true;
    } catch (err: any) {
      if (err?.code === 'no_engine') {
        // No TTS engine at all — Android only. Prompt the user to install one.
        try {
          await Tts.requestInstallEngine();
        } catch {
          // user dismissed; nothing more we can do
        }
      }
    }
  },

  /** Returns every voice the device offers, refreshing the cache on demand. */
  async listVoices(force = false): Promise<Voice[]> {
    if (cachedVoices && !force) return cachedVoices;
    await TTSService.init();
    try {
      const voices = (await Tts.voices()) as Voice[];
      // Filter out broken entries and (on iOS) voices that aren't installed.
      cachedVoices = voices.filter(
        v => !!v?.id && !!v?.language && !v.notInstalled,
      );
      return cachedVoices;
    } catch (err) {
      console.warn('[TTSService] listVoices failed:', err);
      return [];
    }
  },

  /**
   * All voices that can speak the given app language. Returns an empty array
   * if no installed voice matches — caller should show the "install voice"
   * guidance in that case.
   */
  async voicesForLanguage(code: LanguageCode): Promise<Voice[]> {
    const all = await TTSService.listVoices();
    const acceptable = LANGUAGE_TAGS[code] ?? ['en-US'];
    return all.filter(v =>
      acceptable.some(tag => v.language.toLowerCase() === tag.toLowerCase()),
    );
  },

  /** True if at least one installed voice can speak this language. */
  async hasVoiceFor(code: LanguageCode): Promise<boolean> {
    const list = await TTSService.voicesForLanguage(code);
    return list.length > 0;
  },

  /** Get the user's voice preferences across all languages. */
  loadPreferences: loadPrefs,

  /** Save a new voice choice for one language. */
  async setPreferredVoice(
    code: LanguageCode,
    voiceId: string | null,
  ): Promise<void> {
    const prefs = await loadPrefs();
    if (voiceId === null) {
      delete prefs[code];
    } else {
      prefs[code] = voiceId;
    }
    await savePrefs(prefs);
  },

  /** What voice should we use for this language right now? */
  async resolveVoice(code: LanguageCode): Promise<Voice | null> {
    const prefs = await loadPrefs();
    const all = await TTSService.listVoices();
    const preferred = prefs[code];
    if (preferred) {
      const match = all.find(v => v.id === preferred);
      if (match) return match;
    }
    // No preference, or stale preference (voice uninstalled). Auto-pick.
    const list = await TTSService.voicesForLanguage(code);
    if (list.length === 0) return null;
    // Prefer higher-quality voices when the platform reports it.
    const sorted = list
      .slice()
      .sort((a, b) => (b.quality ?? 0) - (a.quality ?? 0));
    return sorted[0];
  },

  /**
   * Speak text in the requested app language. Returns:
   *   - 'ok'         playback started
   *   - 'no-voice'   no voice installed for that language — caller should
   *                  prompt the user to install one
   */
  async speak(
    text: string,
    langCode: LanguageCode = 'en',
    rate = 0.5,
    pitch = 1.0,
  ): Promise<'ok' | 'no-voice'> {
    await TTSService.init();
    Tts.stop();

    const voice = await TTSService.resolveVoice(langCode);
    if (!voice) {
      return 'no-voice';
    }

    try {
      await Tts.setDefaultLanguage(voice.language);
    } catch {
      // some Android engines refuse to set the language separately; ignore
    }
    try {
      await Tts.setDefaultVoice(voice.id);
    } catch (err) {
      console.warn('[TTSService] setDefaultVoice failed:', err);
    }
    Tts.setDefaultRate(rate);
    Tts.setDefaultPitch(pitch);
    Tts.speak(text);
    return 'ok';
  },

  stop(): void {
    Tts.stop();
  },

  /**
   * Deep-link to the OS's TTS settings page so the user can download more
   * voices. Behavior:
   *   - Android: opens system TTS settings if the intent is supported,
   *              otherwise falls back to the general accessibility page.
   *   - iOS:     iOS doesn't expose a deep-link to Spoken Content; opens
   *              the general Settings app and returns false so the UI can
   *              show the manual path.
   * Returns true if a settings page was opened.
   */
  async openTtsSettings(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        // Use the IntentLauncher pattern; react-native-tts itself doesn't
        // expose this so we fall back to a Linking URL that most launchers
        // recognise.
        const StartActivity =
          (NativeModules as any).IntentAndroid?.startActivity ??
          (NativeModules as any).IntentLauncher?.startActivity;
        if (StartActivity) {
          await StartActivity({
            action: 'com.android.settings.TTS_SETTINGS',
          });
          return true;
        }
        // Fallback: open generic settings
        await Linking.sendIntent('android.settings.SETTINGS');
        return true;
      } catch {
        try {
          await Linking.openSettings();
          return true;
        } catch {
          return false;
        }
      }
    }
    if (Platform.OS === 'ios') {
      try {
        await Linking.openSettings();
      } catch {
        // ignore
      }
      return false;
    }
    return false;
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
