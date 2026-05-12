import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useProgress, State} from 'react-native-track-player';

import {GradientHeader} from '@/components/GradientHeader';
import {useTheme} from '@/theme/ThemeContext';
import {fontSizes, spacing, radii} from '@/theme/typography';
import {AudioPlayerService} from '@/services/AudioPlayerService';
import {TTSService} from '@/services/TTSService';
import {ContentApi} from '@/api/ContentApi';
import {BookWithChapters, RootStackParamList} from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AudioPlayer'>;

function fmt(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const AudioPlayerScreen: React.FC<Props> = ({route, navigation}) => {
  const {bookId, chapterId} = route.params;
  const {colors, settings} = useTheme();
  const {position, duration} = useProgress(500);

  const [book, setBook] = useState<BookWithChapters | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [usingTts, setUsingTts] = useState(false);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);

  // Load book + start playback or fall back to TTS
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const b = await ContentApi.getBook(bookId);
        if (cancelled) return;
        setBook(b);
        const startIdx = chapterId
          ? Math.max(0, (b.audio ?? []).findIndex(t => t.chapterId === chapterId))
          : 0;
        setCurrentChapterIndex(startIdx);

        if ((b.audio ?? []).length > 0) {
          await AudioPlayerService.loadBook(b, startIdx);
          setPlaying(true);
          setUsingTts(false);
        } else {
          // No verified audio recordings — speak the text instead.
          setUsingTts(true);
          await speakChapter(b, chapterId ?? b.chapters[0]?.id);
        }
      } catch (err: any) {
        if (!cancelled) setError(String(err?.message ?? err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (usingTts) TTSService.stop();
      else AudioPlayerService.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, chapterId]);

  async function speakChapter(b: BookWithChapters, targetChapterId: string) {
    const chapter = b.chapters.find(c => c.id === targetChapterId) ?? b.chapters[0];
    if (!chapter) return;
    const language = settings.primaryLanguage;
    const text = chapter.verses
      .map(v => {
        const tr = v.translations[language] ?? v.translations.en ?? '';
        return language === 'sa' ? v.sanskrit ?? tr : tr;
      })
      .filter(Boolean)
      .join('. ');
    const result = await TTSService.speak(text, language, settings.fontScale === 'sm' ? 0.45 : 0.5, 1.0);
    if (result === 'no-voice') {
      setPlaying(false);
      Alert.alert(
        'No voice installed',
        `Your phone has no text-to-speech voice for the chosen language. Go to Settings → Audio → Voices to install one, or change your reading language.`,
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Open Voice Settings', onPress: () => navigation.navigate('VoiceSettings')},
        ],
      );
      return;
    }
    setPlaying(true);
  }

  const togglePlay = useCallback(async () => {
    if (usingTts) {
      if (playing) {
        TTSService.stop();
        setPlaying(false);
      } else if (book) {
        const target = book.audio?.[currentChapterIndex]?.chapterId ?? book.chapters[0]?.id;
        if (target) await speakChapter(book, target);
      }
    } else {
      const next = await AudioPlayerService.togglePlay();
      setPlaying(next === State.Playing);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usingTts, playing, book, currentChapterIndex]);

  const skipNext = useCallback(async () => {
    if (!book) return;
    if (usingTts) {
      const total = book.chapters.length;
      const nextIdx = Math.min(total - 1, currentChapterIndex + 1);
      setCurrentChapterIndex(nextIdx);
      TTSService.stop();
      await speakChapter(book, book.chapters[nextIdx].id);
    } else {
      await AudioPlayerService.skipNext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, usingTts, currentChapterIndex]);

  const skipPrev = useCallback(async () => {
    if (!book) return;
    if (usingTts) {
      const prevIdx = Math.max(0, currentChapterIndex - 1);
      setCurrentChapterIndex(prevIdx);
      TTSService.stop();
      await speakChapter(book, book.chapters[prevIdx].id);
    } else {
      await AudioPlayerService.skipPrevious();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, usingTts, currentChapterIndex]);

  const onSeek = useCallback(async (val: number) => {
    if (!usingTts) await AudioPlayerService.seekTo(val);
  }, [usingTts]);

  if (loading) {
    return (
      <View style={[styles.center, {backgroundColor: colors.background}]}>
        <GradientHeader title="Loading…" onBack={() => navigation.goBack()} />
        <ActivityIndicator size="large" color={colors.accent} style={{marginTop: spacing.lg}} />
      </View>
    );
  }

  if (error || !book) {
    return (
      <View style={[styles.center, {backgroundColor: colors.background}]}>
        <GradientHeader title="Audio" onBack={() => navigation.goBack()} />
        <View style={styles.padded}>
          <Text style={{color: colors.textPrimary, fontSize: fontSizes.body}}>
            {error ?? 'Book not found.'}
          </Text>
        </View>
      </View>
    );
  }

  const trackTitle = usingTts
    ? book.chapters[currentChapterIndex]?.title ?? book.title
    : book.audio?.[currentChapterIndex]?.title ?? book.title;

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <GradientHeader
        title="Now Playing"
        subtitle={book.title}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.body}>
        <View style={[styles.cover, {backgroundColor: book.coverColor ?? colors.accent}]}>
          <Icon name="music-circle" size={72} color="#ffffff" style={{opacity: 0.9}} />
          {book.sanskritTitle ? (
            <Text style={styles.coverSanskrit}>{book.sanskritTitle}</Text>
          ) : null}
        </View>

        <Text style={[styles.trackTitle, {color: colors.textPrimary}]} numberOfLines={2}>
          {trackTitle}
        </Text>
        <Text style={[styles.bookTitle, {color: colors.textSecondary}]}>{book.title}</Text>

        {usingTts ? (
          <View style={[styles.ttsNotice, {backgroundColor: colors.surfaceAlt, borderColor: colors.divider}]}>
            <Icon name="text-to-speech" size={18} color={colors.accent} />
            <Text style={[styles.ttsText, {color: colors.textSecondary}]}>
              Reading aloud using your device's text-to-speech voice. No verified public-domain recording is available for this book yet.
            </Text>
          </View>
        ) : (
          <>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={duration > 0 ? duration : 1}
              value={position}
              minimumTrackTintColor={colors.accent}
              maximumTrackTintColor={colors.divider}
              thumbTintColor={colors.accent}
              onSlidingComplete={onSeek}
            />
            <View style={styles.timeRow}>
              <Text style={{color: colors.textSecondary, fontSize: fontSizes.small}}>
                {fmt(position)}
              </Text>
              <Text style={{color: colors.textSecondary, fontSize: fontSizes.small}}>
                {fmt(duration)}
              </Text>
            </View>
          </>
        )}

        <View style={styles.controls}>
          <TouchableOpacity onPress={skipPrev} style={styles.skipBtn}>
            <Icon name="skip-previous" size={36} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={togglePlay}
            style={[styles.playBtn, {backgroundColor: colors.accent}]}>
            <Icon name={playing ? 'pause' : 'play'} size={42} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={skipNext} style={styles.skipBtn}>
            <Icon name="skip-next" size={36} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() =>
            navigation.replace('BookReader', {
              bookId: book.id,
              chapterId: book.chapters[currentChapterIndex]?.id,
            })
          }
          style={[styles.readBtn, {borderColor: colors.divider}]}>
          <Icon name="book-open-variant" size={18} color={colors.accent} />
          <Text style={[styles.readBtnText, {color: colors.accent}]}>Read instead</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  center: {flex: 1, alignItems: 'center'},
  padded: {padding: spacing.lg},
  body: {padding: spacing.lg, alignItems: 'center'},
  cover: {
    width: 240,
    height: 240,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.lg,
    padding: spacing.md,
  },
  coverSanskrit: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  trackTitle: {
    fontSize: fontSizes.h3,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.md,
  },
  bookTitle: {
    fontSize: fontSizes.body,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  ttsNotice: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginVertical: spacing.md,
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  ttsText: {
    flex: 1,
    fontSize: fontSizes.small,
    lineHeight: fontSizes.small * 1.5,
  },
  slider: {alignSelf: 'stretch', height: 40, marginTop: spacing.sm},
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginBottom: spacing.lg,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.md,
  },
  skipBtn: {padding: spacing.sm},
  playBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.xl,
  },
  readBtnText: {fontSize: fontSizes.body, fontWeight: '600'},
});
