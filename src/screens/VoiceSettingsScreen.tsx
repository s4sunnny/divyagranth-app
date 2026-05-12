import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';

import {GradientHeader} from '@/components/GradientHeader';
import {useTheme} from '@/theme/ThemeContext';
import {fontSizes, radii, spacing} from '@/theme/typography';
import {
  TTSService,
  Voice,
  VoicePreferences,
  LanguageCode,
} from '@/services/TTSService';

const LANGUAGES: {code: LanguageCode; label: string; native: string}[] = [
  {code: 'en', label: 'English', native: 'English'},
  {code: 'hi', label: 'Hindi', native: 'हिन्दी'},
  {code: 'sa', label: 'Sanskrit', native: 'संस्कृतम्'},
  {code: 'mr', label: 'Marathi', native: 'मराठी'},
  {code: 'ta', label: 'Tamil', native: 'தமிழ்'},
  {code: 'te', label: 'Telugu', native: 'తెలుగు'},
];

const SAMPLE_TEXT: Record<LanguageCode, string> = {
  en: 'Om. May all beings be happy.',
  hi: 'ॐ। सर्वे भवन्तु सुखिनः।',
  sa: 'ॐ सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः।',
  mr: 'ॐ। सर्वे सुखी होवोत.',
  ta: 'ஓம். அனைவரும் மகிழ்ச்சியாக இருப்பார்கள்.',
  te: 'ఓం। అందరూ సుఖంగా ఉండాలి.',
};

export const VoiceSettingsScreen: React.FC = () => {
  const nav = useNavigation();
  const {colors} = useTheme();
  const [voicesByLang, setVoicesByLang] = useState<
    Record<LanguageCode, Voice[]>
  >({} as Record<LanguageCode, Voice[]>);
  const [prefs, setPrefs] = useState<VoicePreferences>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [allPrefs] = await Promise.all([TTSService.loadPreferences()]);
    const result: Record<LanguageCode, Voice[]> = {} as Record<
      LanguageCode,
      Voice[]
    >;
    for (const lang of LANGUAGES) {
      // eslint-disable-next-line no-await-in-loop
      result[lang.code] = await TTSService.voicesForLanguage(lang.code);
    }
    setVoicesByLang(result);
    setPrefs(allPrefs);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handlePick = async (lang: LanguageCode, voice: Voice) => {
    await TTSService.setPreferredVoice(lang, voice.id);
    setPrefs(prev => ({...prev, [lang]: voice.id}));
  };

  const preview = async (lang: LanguageCode) => {
    const result = await TTSService.speak(SAMPLE_TEXT[lang], lang, 0.5, 1.0);
    if (result === 'no-voice') {
      promptInstall(lang);
    }
  };

  const promptInstall = (lang: LanguageCode) => {
    const langName = LANGUAGES.find(l => l.code === lang)?.label ?? lang;
    Alert.alert(
      `No ${langName} voice installed`,
      Platform.OS === 'android'
        ? `To hear ${langName} audio, install the voice from your phone's settings:\n\n1. Settings → System → Languages\n2. Text-to-speech output\n3. Tap the gear next to your TTS engine\n4. Install voice data → ${langName}\n5. Download\n\nThis is a one-time, ~50 MB download.`
        : `To hear ${langName} audio, install the voice from your phone's Accessibility settings:\n\n1. Settings → Accessibility\n2. Spoken Content → Voices\n3. ${langName}\n4. Tap any voice and download\n\nThis is a one-time download.`,
      [
        {text: 'Later', style: 'cancel'},
        {
          text: 'Open Settings',
          onPress: () => TTSService.openTtsSettings(),
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[styles.root, {backgroundColor: colors.background}]}>
        <GradientHeader title="Voices" onBack={() => nav.goBack()} />
        <ActivityIndicator
          color={colors.accent}
          size="large"
          style={{marginTop: spacing.xl}}
        />
      </View>
    );
  }

  return (
    <View style={[styles.root, {backgroundColor: colors.background}]}>
      <GradientHeader
        title="Voices"
        subtitle="Choose how each language sounds"
        onBack={() => nav.goBack()}
      />

      <ScrollView contentContainerStyle={{paddingBottom: spacing.xl}}>
        <View style={[styles.intro, {borderColor: colors.divider}]}>
          <Icon
            name="information-outline"
            size={18}
            color={colors.accent}
            style={{marginTop: 2}}
          />
          <Text style={[styles.introText, {color: colors.textSecondary}]}>
            Voices come from your phone's operating system, not the app. If a
            language has no voice, tap the install button below — it's a
            one-time download from your OS.
          </Text>
        </View>

        {LANGUAGES.map(lang => {
          const voices = voicesByLang[lang.code] ?? [];
          const selectedId = prefs[lang.code];

          return (
            <View
              key={lang.code}
              style={[
                styles.section,
                {backgroundColor: colors.surface, borderColor: colors.divider},
              ]}>
              <View style={styles.sectionHeader}>
                <View style={{flex: 1}}>
                  <Text
                    style={[styles.langName, {color: colors.textPrimary}]}>
                    {lang.label}
                  </Text>
                  <Text
                    style={[styles.langNative, {color: colors.textSecondary}]}>
                    {lang.native}
                  </Text>
                </View>

                {voices.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => preview(lang.code)}
                    style={[
                      styles.previewBtn,
                      {backgroundColor: colors.accent + '22'},
                    ]}>
                    <Icon name="volume-high" size={16} color={colors.accent} />
                    <Text
                      style={[
                        styles.previewBtnText,
                        {color: colors.accent},
                      ]}>
                      Preview
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {voices.length === 0 ? (
                <View style={styles.missingBlock}>
                  <Icon
                    name="alert-circle-outline"
                    size={20}
                    color="#ef4444"
                  />
                  <View style={{flex: 1}}>
                    <Text
                      style={[
                        styles.missingTitle,
                        {color: colors.textPrimary},
                      ]}>
                      No voice installed
                    </Text>
                    <Text
                      style={[
                        styles.missingSub,
                        {color: colors.textSecondary},
                      ]}>
                      Install one from your phone's settings to hear{' '}
                      {lang.label} audio.
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => promptInstall(lang.code)}
                    style={[
                      styles.installBtn,
                      {backgroundColor: colors.accent},
                    ]}>
                    <Text style={styles.installBtnText}>Install</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                voices.map(voice => {
                  const selected = voice.id === selectedId;
                  return (
                    <TouchableOpacity
                      key={voice.id}
                      onPress={() => handlePick(lang.code, voice)}
                      style={[
                        styles.voiceRow,
                        {borderTopColor: colors.divider},
                      ]}>
                      <View style={{flex: 1}}>
                        <Text
                          style={[
                            styles.voiceName,
                            {color: colors.textPrimary},
                          ]}>
                          {prettifyVoiceName(voice)}
                        </Text>
                        <Text
                          style={[
                            styles.voiceMeta,
                            {color: colors.textSecondary},
                          ]}>
                          {voice.language}
                          {voice.quality
                            ? ` · Quality ${qualityLabel(voice.quality)}`
                            : ''}
                          {voice.networkConnectionRequired
                            ? ' · Needs internet'
                            : ''}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.radio,
                          {
                            borderColor: selected
                              ? colors.accent
                              : colors.divider,
                          },
                        ]}>
                        {selected ? (
                          <View
                            style={[
                              styles.radioInner,
                              {backgroundColor: colors.accent},
                            ]}
                          />
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          );
        })}

        <TouchableOpacity
          onPress={() => TTSService.openTtsSettings()}
          style={[styles.openSettings, {borderColor: colors.divider}]}>
          <Icon name="cog" size={18} color={colors.accent} />
          <Text style={[styles.openSettingsText, {color: colors.accent}]}>
            Open phone TTS settings
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

function prettifyVoiceName(v: Voice): string {
  // Android often returns IDs like "hi-in-x-hia-local". iOS uses real names
  // like "Lekha". When the name looks like an id, try to humanize it.
  if (!v.name || v.name === v.id) {
    const parts = v.language.toLowerCase().split('-');
    return parts.length >= 2
      ? `${parts[0].toUpperCase()} (${parts[1].toUpperCase()})`
      : v.language;
  }
  return v.name;
}

function qualityLabel(q: number): string {
  if (q >= 500) return 'High';
  if (q >= 400) return 'Very Good';
  if (q >= 300) return 'Good';
  return 'Standard';
}

const styles = StyleSheet.create({
  root: {flex: 1},
  intro: {
    flexDirection: 'row',
    gap: spacing.sm,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  introText: {flex: 1, fontSize: fontSizes.small, lineHeight: 18},

  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  langName: {fontSize: fontSizes.h3, fontWeight: '700'},
  langNative: {fontSize: fontSizes.small, marginTop: 2},

  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 12,
  },
  previewBtnText: {fontSize: 12, fontWeight: '700'},

  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  voiceName: {fontSize: fontSizes.body, fontWeight: '600'},
  voiceMeta: {fontSize: 12, marginTop: 2},

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  missingBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  missingTitle: {fontSize: fontSizes.small, fontWeight: '700'},
  missingSub: {fontSize: 12, marginTop: 2},
  installBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 16,
  },
  installBtnText: {color: '#fff', fontSize: 12, fontWeight: '700'},

  openSettings: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  openSettingsText: {fontSize: fontSizes.body, fontWeight: '600'},
});
