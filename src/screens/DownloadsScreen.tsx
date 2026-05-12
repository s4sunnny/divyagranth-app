import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useTheme} from '@/theme/ThemeContext';
import {radii, spacing, fontSizes} from '@/theme/typography';
import {DownloadService} from '@/services/DownloadService';
import {ContentApi} from '@/api/ContentApi';
import {Book, DownloadProgress, DownloadRecord, RootStackParamList} from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface BookGroup {
  book: Book;
  hasText: boolean;
  audioCount: number;
  videoCount: number;
  totalAudio: number;
  totalVideo: number;
  bytes: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const DownloadsScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();

  const [books, setBooks] = useState<Book[]>([]);
  const [records, setRecords] = useState<DownloadRecord[]>([]);
  const [progress, setProgress] = useState<Record<string, DownloadProgress>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [allBooks, recs] = await Promise.all([
      ContentApi.listBooks(),
      DownloadService.list(),
    ]);
    setBooks(allBooks);
    setRecords(recs);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const groups: BookGroup[] = useMemo(() => {
    return books.map(book => {
      const bookRecs = records.filter(r => r.bookId === book.id);
      const audioRecs = bookRecs.filter(r => r.kind === 'audio');
      const videoRecs = bookRecs.filter(r => r.kind === 'video');
      return {
        book,
        hasText: bookRecs.some(r => r.kind === 'book') || book.isLocal,
        audioCount: audioRecs.length,
        videoCount: videoRecs.length,
        totalAudio: book.audio?.length ?? 0,
        totalVideo: book.video?.length ?? 0,
        bytes: bookRecs.reduce((s, r) => s + (r.sizeBytes || 0), 0),
      };
    });
  }, [books, records]);

  const onProgress = (key: string) => (p: DownloadProgress) => {
    setProgress(prev => ({...prev, [key]: p}));
    if (p.status === 'done' || p.status === 'error') {
      setTimeout(() => {
        setProgress(prev => {
          const n = {...prev};
          delete n[key];
          return n;
        });
        refresh();
      }, 600);
    }
  };

  const downloadText = async (bookId: string) => {
    try {
      await DownloadService.downloadBookText(bookId, onProgress(`${bookId}:book`));
    } catch (err: any) {
      Alert.alert('Download failed', err?.message ?? 'Unknown error');
    }
  };

  const downloadAudio = async (book: Book) => {
    if (!book.audio || book.audio.length === 0) {
      Alert.alert(
        'No audio available',
        "This book has no verified public-domain recording yet. You can still listen using your device's text-to-speech voice from the player.",
      );
      return;
    }
    try {
      for (const track of book.audio) {
        // eslint-disable-next-line no-await-in-loop
        await DownloadService.downloadAudio(
          book.id,
          track.chapterId,
          track.url,
          onProgress(`${book.id}:audio:${track.chapterId}`),
        );
      }
    } catch (err: any) {
      Alert.alert('Audio download failed', err?.message ?? 'Unknown error');
    }
  };

  const removeAll = (book: Book) => {
    Alert.alert(
      'Remove from device',
      `Delete all downloaded data for "${book.title}"? This frees up storage but you can re-download anytime.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await DownloadService.removeBook(book.id);
            refresh();
          },
        },
      ],
    );
  };

  const totalBytes = records.reduce((s, r) => s + (r.sizeBytes || 0), 0);
  const downloadedGroups = groups.filter(g => g.hasText || g.audioCount > 0);
  const availableGroups = groups.filter(g => !g.hasText && g.audioCount === 0);

  return (
    <View style={[styles.root, {backgroundColor: colors.background}]}>
      <LinearGradient
        colors={colors.headerGradient}
        style={[styles.header, {paddingTop: insets.top + spacing.md}]}>
        <Text style={styles.headerTitle}>Downloads</Text>
        <Text style={styles.headerSub}>
          Save books, audio, and video for offline use
        </Text>
        {totalBytes > 0 ? (
          <Text style={styles.storageLabel}>{formatBytes(totalBytes)} used</Text>
        ) : null}
      </LinearGradient>

      {loading ? (
        <ActivityIndicator
          color={colors.accent}
          size="large"
          style={{marginTop: spacing.xl}}
        />
      ) : (
        <FlatList
          contentContainerStyle={{paddingBottom: spacing.xl}}
          ListHeaderComponent={
            <>
              {downloadedGroups.length > 0 ? (
                <Text style={[styles.sectionTitle, {color: colors.accent}]}>
                  ON THIS DEVICE
                </Text>
              ) : (
                <Text style={[styles.empty, {color: colors.textSecondary}]}>
                  Nothing downloaded yet. Tap any book below to save it for offline use.
                </Text>
              )}
            </>
          }
          data={downloadedGroups}
          keyExtractor={g => g.book.id}
          renderItem={({item}) => (
            <BookRow
              group={item}
              progress={progress}
              onDownloadText={downloadText}
              onDownloadAudio={downloadAudio}
              onRemove={removeAll}
              onOpen={id => nav.navigate('BookReader', {bookId: id})}
              onListen={id => nav.navigate('AudioPlayer', {bookId: id})}
              colors={colors}
            />
          )}
          ListFooterComponent={
            <>
              {availableGroups.length > 0 ? (
                <>
                  <Text style={[styles.sectionTitle, {color: colors.accent}]}>
                    AVAILABLE TO DOWNLOAD
                  </Text>
                  {availableGroups.map(g => (
                    <BookRow
                      key={g.book.id}
                      group={g}
                      progress={progress}
                      onDownloadText={downloadText}
                      onDownloadAudio={downloadAudio}
                      onRemove={removeAll}
                      onOpen={id => nav.navigate('BookReader', {bookId: id})}
                      onListen={id => nav.navigate('AudioPlayer', {bookId: id})}
                      colors={colors}
                    />
                  ))}
                </>
              ) : null}

              <View
                style={[
                  styles.note,
                  {backgroundColor: colors.surface, borderColor: colors.divider},
                ]}>
                <Icon name="information-outline" size={16} color={colors.accent} />
                <Text style={[styles.noteText, {color: colors.textSecondary}]}>
                  Some books are bundled in the app and always work offline. Audio is
                  available only where a verified public-domain recording exists; for
                  others, the player uses your device's text-to-speech voice.
                </Text>
              </View>
            </>
          }
        />
      )}
    </View>
  );
};

// =============================================================================
// Row
// =============================================================================

interface RowProps {
  group: BookGroup;
  progress: Record<string, DownloadProgress>;
  onDownloadText: (id: string) => void;
  onDownloadAudio: (book: Book) => void;
  onRemove: (book: Book) => void;
  onOpen: (id: string) => void;
  onListen: (id: string) => void;
  colors: any;
}

const BookRow: React.FC<RowProps> = ({
  group,
  progress,
  onDownloadText,
  onDownloadAudio,
  onRemove,
  onOpen,
  onListen,
  colors,
}) => {
  const {book, hasText, audioCount, totalAudio, bytes} = group;
  const textProgress = progress[`${book.id}:book`];
  const audioInProgress = Object.entries(progress).some(
    ([k, v]) => k.startsWith(`${book.id}:audio:`) && v.status === 'downloading',
  );

  return (
    <View
      style={[
        styles.row,
        {backgroundColor: colors.surface, borderColor: colors.divider},
      ]}>
      <View
        style={[styles.cover, {backgroundColor: book.coverColor ?? colors.accent}]}>
        <Icon name="book-open-page-variant" size={22} color="#ffffff" />
      </View>

      <View style={{flex: 1}}>
        <Text
          style={[styles.title, {color: colors.textPrimary}]}
          numberOfLines={1}>
          {book.title}
        </Text>
        <Text style={[styles.meta, {color: colors.textSecondary}]}>
          {book.category.toUpperCase()} · {book.chapterCount} ch
          {bytes > 0 ? `  ·  ${formatBytes(bytes)}` : ''}
        </Text>

        <View style={styles.statusRow}>
          <StatusChip
            ok={hasText}
            label={hasText ? 'Text saved' : 'Text not saved'}
            colors={colors}
          />
          {totalAudio > 0 ? (
            <StatusChip
              ok={audioCount === totalAudio}
              label={`Audio ${audioCount}/${totalAudio}`}
              colors={colors}
            />
          ) : null}
        </View>

        {textProgress?.status === 'downloading' ||
        audioInProgress ? (
          <View style={styles.progressRow}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={[styles.progressText, {color: colors.textSecondary}]}>
              {audioInProgress ? 'Downloading audio…' : 'Downloading text…'}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        {hasText ? (
          <TouchableOpacity
            style={[styles.actionBtn, {backgroundColor: colors.accent}]}
            onPress={() => onOpen(book.id)}>
            <Icon name="book-open" size={16} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, {backgroundColor: colors.accent}]}
            onPress={() => onDownloadText(book.id)}>
            <Icon name="download" size={16} color="#ffffff" />
          </TouchableOpacity>
        )}

        {totalAudio > 0 && audioCount < totalAudio ? (
          <TouchableOpacity
            style={[styles.actionBtn, {backgroundColor: colors.surfaceAlt}]}
            onPress={() => onDownloadAudio(book)}>
            <Icon name="music-note-plus" size={16} color={colors.accent} />
          </TouchableOpacity>
        ) : null}

        {hasText || audioCount > 0 ? (
          <>
            <TouchableOpacity
              style={[styles.actionBtn, {backgroundColor: colors.surfaceAlt}]}
              onPress={() => onListen(book.id)}>
              <Icon name="play" size={16} color={colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, {backgroundColor: '#ef444411'}]}
              onPress={() => onRemove(book)}>
              <Icon name="trash-can-outline" size={16} color="#ef4444" />
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </View>
  );
};

const StatusChip: React.FC<{ok: boolean; label: string; colors: any}> = ({
  ok,
  label,
  colors,
}) => (
  <View
    style={[
      styles.chip,
      {
        backgroundColor: ok ? '#10b98122' : colors.surfaceAlt,
        borderColor: ok ? '#10b98166' : colors.divider,
      },
    ]}>
    <Icon
      name={ok ? 'check-circle' : 'circle-outline'}
      size={12}
      color={ok ? '#10b981' : colors.textSecondary}
    />
    <Text
      style={[
        styles.chipLabel,
        {color: ok ? '#10b981' : colors.textSecondary},
      ]}>
      {label}
    </Text>
  </View>
);

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  root: {flex: 1},
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerTitle: {fontSize: 26, fontWeight: '800', color: '#ffffff'},
  headerSub: {
    fontSize: fontSizes.body,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  storageLabel: {
    fontSize: fontSizes.small,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  empty: {
    fontSize: fontSizes.body,
    fontStyle: 'italic',
    margin: spacing.lg,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  cover: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {fontSize: fontSizes.body, fontWeight: '700', marginBottom: 2},
  meta: {fontSize: fontSizes.small},
  statusRow: {flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap'},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipLabel: {fontSize: 11, fontWeight: '600'},
  progressRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6},
  progressText: {fontSize: 11},
  actions: {gap: 6},
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  noteText: {flex: 1, fontSize: 12, lineHeight: 18},
});
