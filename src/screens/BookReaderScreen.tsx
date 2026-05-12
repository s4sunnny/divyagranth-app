import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {GradientHeader} from '@/components/GradientHeader';
import {ContentApi} from '@/api/ContentApi';
import {TTSService} from '@/services/TTSService';
import {
  BookmarkStorage,
  HighlightStorage,
  NoteStorage,
} from '@/storage/UserContentStorage';
import {ProgressStorage} from '@/storage/ProgressStorage';
import {useTheme} from '@/theme/ThemeContext';
import {readerFontSize, readerLineHeight, radii} from '@/theme/typography';
import {
  Bookmark,
  BookWithChapters,
  Chapter,
  Highlight,
  HighlightColor,
  Note,
  RootStackParamList,
} from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const HIGHLIGHT_COLORS: HighlightColor[] = [
  'yellow',
  'orange',
  'pink',
  'green',
  'blue',
];
const HL_HEX: Record<HighlightColor, string> = {
  yellow: '#FEF08A',
  orange: '#FED7AA',
  pink: '#FBCFE8',
  green: '#BBF7D0',
  blue: '#BAE6FD',
};

export const BookReaderScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'BookReader'>>();
  const {bookId, chapterId: initialChapter} = route.params;
  const {colors, settings} = useTheme();

  const [book, setBook] = useState<BookWithChapters | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chapterIdx, setChapterIdx] = useState(0);

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  const [activeVerse, setActiveVerse] = useState<number | null>(null);
  const [showChapterList, setShowChapterList] = useState(false);
  const [noteModal, setNoteModal] = useState<{
    verseNumber: number;
    existing?: Note;
  } | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  // Audio (inline TTS only — full playback is via AudioPlayerScreen)
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [ttsVerseIdx, setTtsVerseIdx] = useState(0);

  const scrollRef = useRef<ScrollView | null>(null);

  // ── Load ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    ContentApi.getBook(bookId)
      .then(b => {
        if (!alive) return;
        setBook(b);
        if (initialChapter) {
          const idx = b.chapters.findIndex(c => c.id === initialChapter);
          if (idx >= 0) setChapterIdx(idx);
        }
      })
      .catch(e => alive && setError(e.message ?? 'Failed to load book'))
      .finally(() => alive && setLoading(false));
    refreshUserContent();
    return () => {
      alive = false;
    };
  }, [bookId, initialChapter]);

  const refreshUserContent = useCallback(async () => {
    const [bm, hl, nt] = await Promise.all([
      BookmarkStorage.forBook(bookId),
      HighlightStorage.forBook(bookId),
      NoteStorage.forBook(bookId),
    ]);
    setBookmarks(bm);
    setHighlights(hl);
    setNotes(nt);
  }, [bookId]);

  // Progress
  const chapter: Chapter | undefined = book?.chapters[chapterIdx];
  useEffect(() => {
    if (!book || !chapter) return;
    const total = book.chapters.reduce((s, c) => s + c.verses.length, 0);
    const before = book.chapters
      .slice(0, chapterIdx)
      .reduce((s, c) => s + c.verses.length, 0);
    const cur = activeVerse ?? chapter.verses[0]?.number ?? 1;
    ProgressStorage.set({
      bookId,
      lastChapterId: chapter.id,
      lastVerseNumber: cur,
      lastReadAt: Date.now(),
      percentComplete: total ? Math.round(((before + cur) / total) * 100) : 0,
    });
  }, [book, bookId, chapterIdx, activeVerse, chapter]);

  // TTS cleanup on chapter change
  useEffect(() => {
    return () => TTSService.stop();
  }, [chapterIdx]);

  // ── TTS ─────────────────────────────────────────────────────────────────
  const startTTS = useCallback(
    async (startIdx = 0) => {
      if (!chapter) return;
      setTtsPlaying(true);

      const speak = async (idx: number) => {
        if (idx >= chapter.verses.length) {
          setTtsPlaying(false);
          return;
        }
        const verse = chapter.verses[idx];
        setTtsVerseIdx(idx);
        const parts: string[] = [];
        if (settings.showSanskrit && verse.sanskrit) parts.push(verse.sanskrit);
        if (
          settings.showTranslation &&
          verse.translations[settings.primaryLanguage]
        )
          parts.push(verse.translations[settings.primaryLanguage]);
        const result = await TTSService.speak(
          parts.join('. ') || verse.sanskrit || '',
          settings.primaryLanguage,
          0.5,
          1.0,
        );
        if (result === 'no-voice') {
          setTtsPlaying(false);
          Alert.alert(
            'No voice installed',
            'Your phone has no text-to-speech voice for the chosen reading language. Open Voice Settings to install one or pick a voice.',
            [
              {text: 'Cancel', style: 'cancel'},
              {
                text: 'Voice Settings',
                onPress: () => nav.navigate('VoiceSettings'),
              },
            ],
          );
          return;
        }
        const unsub = TTSService.onFinish(() => {
          unsub();
          speak(idx + 1);
        });
      };
      speak(startIdx);
    },
    [chapter, settings, nav],
  );

  const stopTTS = useCallback(() => {
    TTSService.stop();
    setTtsPlaying(false);
  }, []);

  // ── Derived ─────────────────────────────────────────────────────────────
  const isBookmarked = (v: number) =>
    bookmarks.some(b => b.chapterId === chapter?.id && b.verseNumber === v);
  const highlightFor = (v: number) =>
    highlights.find(h => h.chapterId === chapter?.id && h.verseNumber === v);
  const noteFor = (v: number) =>
    notes.find(n => n.chapterId === chapter?.id && n.verseNumber === v);

  const toggleBookmark = async (vn: number) => {
    if (!chapter) return;
    await BookmarkStorage.toggle({
      bookId,
      chapterId: chapter.id,
      verseNumber: vn,
    });
    refreshUserContent();
  };

  const applyHighlight = async (vn: number, color: HighlightColor) => {
    if (!chapter) return;
    const existing = highlightFor(vn);
    if (existing?.color === color) await HighlightStorage.remove(existing.id);
    else {
      const verse = chapter.verses.find(v => v.number === vn);
      const text =
        verse?.translations[settings.primaryLanguage] ?? verse?.sanskrit ?? '';
      await HighlightStorage.add({
        bookId,
        chapterId: chapter.id,
        verseNumber: vn,
        color,
        text,
      });
    }
    refreshUserContent();
  };

  const saveNote = async () => {
    if (!noteModal || !chapter) return;
    const body = noteDraft.trim();
    if (!body) {
      setNoteModal(null);
      return;
    }
    noteModal.existing
      ? await NoteStorage.update(noteModal.existing.id, body)
      : await NoteStorage.add({
          bookId,
          chapterId: chapter.id,
          verseNumber: noteModal.verseNumber,
          body,
        });
    setNoteModal(null);
    setNoteDraft('');
    refreshUserContent();
  };

  // ── Styles ───────────────────────────────────────────────────────────────
  const fs = readerFontSize[settings.fontScale] ?? 16;
  const lh = readerLineHeight[settings.fontScale] ?? 28;
  const lsMul =
    settings.lineSpacing === 'tight'
      ? 0.9
      : settings.lineSpacing === 'relaxed'
        ? 1.2
        : 1;
  const s = makeStyles(colors, fs, lh, lsMul);

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading)
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={s.hint}>Loading…</Text>
      </View>
    );

  if (error || !book || !chapter)
    return (
      <View style={s.center}>
        <Icon name="wifi-off" size={48} color={colors.textSecondary} />
        <Text style={[s.hint, {marginTop: 12, textAlign: 'center'}]}>
          {error ?? 'Book not found'}
        </Text>
        <TouchableOpacity
          style={[s.btn, {backgroundColor: colors.accent, marginTop: 20}]}
          onPress={() => {
            setError(null);
            setLoading(true);
          }}>
          <Text style={{color: '#fff', fontWeight: '700'}}>Retry</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <View style={s.root}>
      <GradientHeader
        title={book.title}
        onBack={() => nav.goBack()}
        rightIcon="format-list-bulleted"
        onRightPress={() => setShowChapterList(true)}
      />

      {/* Audio bar — inline TTS for quick read-aloud, Open Player for full audio */}
      <View style={s.audioBar}>
        <TouchableOpacity
          style={[s.modeChip, {backgroundColor: colors.accent + '22'}]}
          onPress={ttsPlaying ? stopTTS : () => startTTS(0)}>
          <Icon
            name={ttsPlaying ? 'stop' : 'text-to-speech'}
            size={14}
            color={colors.accent}
          />
          <Text style={[s.modeTxt, {color: colors.accent}]}>
            {ttsPlaying ? 'Stop reading' : 'Read aloud'}
          </Text>
        </TouchableOpacity>
        <View style={{flex: 1}} />
        <TouchableOpacity
          style={[s.playBtn, {backgroundColor: colors.accent}]}
          onPress={() =>
            nav.navigate('AudioPlayer', {bookId, chapterId: chapter.id})
          }>
          <Icon name="play" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Chapter heading */}
      <View style={s.chapHead}>
        <Text style={[s.chapNum, {color: colors.accent}]}>
          Chapter {chapter.number}
        </Text>
        <Text style={[s.chapTitle, {color: colors.textPrimary}]}>
          {chapter.title}
        </Text>
        {chapter.sanskritTitle && (
          <Text style={[s.chapSan, {color: colors.textSecondary}]}>
            {chapter.sanskritTitle}
          </Text>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        style={{flex: 1}}
        contentContainerStyle={{padding: 16, paddingBottom: 40}}>
        {chapter.verses.map((verse, vi) => {
          const hl = highlightFor(verse.number);
          const isTts = ttsPlaying && ttsVerseIdx === vi;
          const isActive = activeVerse === verse.number;
          return (
            <TouchableOpacity
              key={verse.number}
              activeOpacity={0.85}
              style={[
                s.card,
                hl && {backgroundColor: HL_HEX[hl.color]},
                isActive && {borderColor: colors.accent, borderWidth: 1.5},
                isTts && {
                  borderColor: colors.accent,
                  borderWidth: 2,
                  elevation: 4,
                },
              ]}
              onPress={() => setActiveVerse(isActive ? null : verse.number)}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8,
                }}>
                <Text style={[s.vNum, {color: colors.accent}]}>
                  {verse.number}
                </Text>
                {isTts && (
                  <View style={[s.ttsBadge, {backgroundColor: colors.accent}]}>
                    <Icon name="volume-high" size={10} color="#fff" />
                    <Text
                      style={{
                        fontSize: 10,
                        color: '#fff',
                        fontWeight: '600',
                        marginLeft: 3,
                      }}>
                      Listening
                    </Text>
                  </View>
                )}
              </View>

              {settings.showSanskrit && verse.sanskrit && (
                <Text
                  style={[
                    s.sanskrit,
                    {
                      fontSize: fs + 2,
                      lineHeight: (lh + 4) * lsMul,
                      color: colors.textPrimary,
                    },
                  ]}>
                  {verse.sanskrit}
                </Text>
              )}
              {settings.showTransliteration && verse.transliteration && (
                <Text
                  style={[
                    s.translit,
                    {
                      fontSize: fs - 1,
                      lineHeight: (lh - 2) * lsMul,
                      color: colors.textSecondary,
                    },
                  ]}>
                  {verse.transliteration}
                </Text>
              )}
              {settings.showTranslation &&
                verse.translations[settings.primaryLanguage] && (
                  <Text
                    style={{
                      fontSize: fs,
                      lineHeight: lh * lsMul,
                      color: colors.textPrimary,
                    }}>
                    {verse.translations[settings.primaryLanguage]}
                  </Text>
                )}
              {verse.commentary && (
                <Text
                  style={[
                    s.commentary,
                    {
                      fontSize: fs - 2,
                      lineHeight: (lh - 4) * lsMul,
                      color: colors.textSecondary,
                    },
                  ]}>
                  {verse.commentary}
                </Text>
              )}

              {isActive && (
                <View style={[s.toolbar, {borderTopColor: colors.divider}]}>
                  <TouchableOpacity
                    style={s.toolBtn}
                    onPress={() => toggleBookmark(verse.number)}>
                    <Icon
                      name={
                        isBookmarked(verse.number)
                          ? 'bookmark'
                          : 'bookmark-outline'
                      }
                      size={20}
                      color={
                        isBookmarked(verse.number)
                          ? colors.accent
                          : colors.textSecondary
                      }
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.toolBtn}
                    onPress={() => {
                      const ex = noteFor(verse.number);
                      setNoteModal({verseNumber: verse.number, existing: ex});
                      setNoteDraft(ex?.body ?? '');
                    }}>
                    <Icon
                      name={
                        noteFor(verse.number) ? 'note-text' : 'note-outline'
                      }
                      size={20}
                      color={
                        noteFor(verse.number)
                          ? colors.accent
                          : colors.textSecondary
                      }
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.toolBtn}
                    onPress={() => startTTS(vi)}>
                    <Icon
                      name="play-circle-outline"
                      size={20}
                      color={colors.accent}
                    />
                  </TouchableOpacity>
                  {HIGHLIGHT_COLORS.map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        s.hlDot,
                        {backgroundColor: HL_HEX[c]},
                        hl?.color === c && {
                          borderWidth: 2,
                          borderColor: colors.accent,
                        },
                      ]}
                      onPress={() => applyHighlight(verse.number, c)}
                    />
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Chapter nav */}
        <View style={s.chapNav}>
          <TouchableOpacity
            disabled={chapterIdx === 0}
            style={[
              s.navBtn,
              {borderColor: colors.divider},
              chapterIdx === 0 && {opacity: 0.35},
            ]}
            onPress={() => {
              setChapterIdx(i => i - 1);
              setActiveVerse(null);
            }}>
            <Icon name="chevron-left" size={18} color={colors.accent} />
            <Text style={{color: colors.accent, fontWeight: '600'}}>Prev</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={chapterIdx === book.chapters.length - 1}
            style={[
              s.navBtn,
              {borderColor: colors.divider},
              chapterIdx === book.chapters.length - 1 && {opacity: 0.35},
            ]}
            onPress={() => {
              setChapterIdx(i => i + 1);
              setActiveVerse(null);
            }}>
            <Text style={{color: colors.accent, fontWeight: '600'}}>Next</Text>
            <Icon name="chevron-right" size={18} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Chapter list modal */}
      <Modal visible={showChapterList} transparent animationType="slide">
        <TouchableOpacity
          style={{flex: 1}}
          onPress={() => setShowChapterList(false)}
        />
        <View style={[s.sheet, {backgroundColor: colors.surface}]}>
          <Text style={[s.sheetTitle, {color: colors.textPrimary}]}>
            Chapters
          </Text>
          <FlatList
            data={book.chapters}
            keyExtractor={c => c.id}
            renderItem={({item, index}) => (
              <TouchableOpacity
                style={[
                  s.chapItem,
                  index === chapterIdx && {
                    backgroundColor: colors.accent + '18',
                  },
                ]}
                onPress={() => {
                  setChapterIdx(index);
                  setShowChapterList(false);
                  setActiveVerse(null);
                }}>
                <Text
                  style={[
                    {fontWeight: '700', width: 28, color: colors.accent},
                  ]}>
                  {item.number}
                </Text>
                <View>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '600',
                      color: colors.textPrimary,
                    }}>
                    {item.title}
                  </Text>
                  {item.sanskritTitle && (
                    <Text style={{fontSize: 13, color: colors.textSecondary}}>
                      {item.sanskritTitle}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Note modal */}
      <Modal visible={!!noteModal} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{flex: 1, justifyContent: 'flex-end'}}>
          <TouchableOpacity
            style={{flex: 1}}
            onPress={() => {
              setNoteModal(null);
              setNoteDraft('');
            }}
          />
          <View
            style={[s.sheet, {backgroundColor: colors.surface, padding: 20}]}>
            <Text style={[s.sheetTitle, {color: colors.textPrimary}]}>
              {noteModal?.existing ? 'Edit Note' : 'Add Note'} · Verse{' '}
              {noteModal?.verseNumber}
            </Text>
            <TextInput
              style={[
                s.noteInput,
                {color: colors.textPrimary, borderColor: colors.divider},
              ]}
              value={noteDraft}
              onChangeText={setNoteDraft}
              placeholder="Write your note…"
              placeholderTextColor={colors.textSecondary}
              multiline
              autoFocus
            />
            <View style={{flexDirection: 'row', gap: 12}}>
              <TouchableOpacity
                style={[s.btn, {backgroundColor: colors.accent, flex: 1}]}
                onPress={saveNote}>
                <Text style={{color: '#fff', fontWeight: '700'}}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btn, {backgroundColor: colors.divider, flex: 1}]}
                onPress={() => {
                  setNoteModal(null);
                  setNoteDraft('');
                }}>
                <Text style={{color: colors.textPrimary, fontWeight: '700'}}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

function makeStyles(colors: any, fs: number, lh: number, lsMul: number) {
  return StyleSheet.create({
    root: {flex: 1, backgroundColor: colors.background},
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 32,
    },
    hint: {color: colors.textSecondary, fontSize: 15, marginTop: 8},
    btn: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center',
    },
    audioBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    modeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
    },
    modeTxt: {fontSize: 12, fontWeight: '600'},
    playBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chapHead: {
      padding: 16,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    chapNum: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    chapTitle: {fontSize: 18, fontWeight: '700', marginTop: 2},
    chapSan: {fontSize: 15, marginTop: 2},
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    vNum: {fontSize: 11, fontWeight: '700', letterSpacing: 1},
    ttsBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 10,
    },
    sanskrit: {marginBottom: 8},
    translit: {fontStyle: 'italic', marginBottom: 8},
    commentary: {fontStyle: 'italic', marginTop: 8},
    toolbar: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
    },
    toolBtn: {padding: 6},
    hlDot: {width: 20, height: 20, borderRadius: 10},
    chapNav: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 24,
    },
    navBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
    },
    sheet: {
      maxHeight: '70%',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
    },
    sheetTitle: {fontSize: 17, fontWeight: '700', marginBottom: 16},
    chapItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 8,
    },
    noteInput: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      minHeight: 100,
      textAlignVertical: 'top',
      fontSize: 15,
      marginBottom: 16,
    },
  });
}
