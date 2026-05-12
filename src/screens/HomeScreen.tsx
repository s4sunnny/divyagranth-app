import React, {useCallback, useEffect, useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, FlatList,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {GradientHeader} from '@/components/GradientHeader';
import {DeityCard, BookCard} from '@/components/Cards';
import {DEITIES} from '@/data/deities';
import {ContentApi} from '@/api/ContentApi';
import {ProgressStorage} from '@/storage/ProgressStorage';
import {useTheme} from '@/theme/ThemeContext';
import {fontSizes, radii, spacing} from '@/theme/typography';
import {Book, ReadingProgress, RootStackParamList} from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const {colors} = useTheme();
  const [books, setBooks] = useState<Book[]>([]);
  const [progress, setProgress] = useState<ReadingProgress[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [bs, ps] = await Promise.all([
      ContentApi.listBooks(),
      ProgressStorage.recent(3),
    ]);
    setBooks(bs);
    setProgress(ps);
    // Best-effort background refresh of the catalog manifest
    ContentApi.refreshManifest().catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const findBook = (id: string) => books.find(b => b.id === id);

  return (
    <View style={[styles.root, {backgroundColor: colors.background}]}>
      <GradientHeader title="Divya Granth" subtitle="दिव्य ग्रंथ" rightIcon="bell-outline" />
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

        {/* Welcome card */}
        <View style={[styles.welcome, {backgroundColor: colors.surface, shadowColor: colors.shadow}]}>
          <Text style={[styles.welcomeTitle, {color: colors.accentStrong}]}>Welcome Back</Text>
          <Text style={[styles.welcomeSub, {color: colors.textSecondary}]}>
            May your path be illuminated by ancient wisdom 🪔
          </Text>
        </View>

        {/* Continue reading */}
        {progress.length > 0 && (
          <Section title="Continue Reading">
            {progress.map(p => {
              const book = findBook(p.bookId);
              if (!book) return null;
              return (
                <BookCard
                  key={p.bookId}
                  book={book}
                  progressPercent={p.percentComplete}
                  onPress={() =>
                    nav.navigate('BookReader', {
                      bookId: p.bookId,
                      chapterId: p.lastChapterId,
                      verseNumber: p.lastVerseNumber,
                    })
                  }
                  rightAccessory={
                    <Icon name="play-circle" size={28} color={colors.accent} />
                  }
                />
              );
            })}
          </Section>
        )}

        {/* Deity grid */}
        <Section title="Browse by Deity">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: spacing.md, paddingRight: spacing.lg}}>
            {DEITIES.map(d => (
              <DeityCard key={d.id} deity={d} onPress={() => nav.navigate('DeityDetail', {deityId: d.id})} />
            ))}
          </ScrollView>
        </Section>

        {/* Quick actions: bookmarks/notes/highlights/downloads */}
        <Section title="Your Library">
          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map(a => (
              <TouchableOpacity
                key={a.label}
                onPress={() => nav.getParent()?.navigate('Library' as never)}
                style={[styles.quickItem, {backgroundColor: colors.surface, shadowColor: colors.shadow}]}
                activeOpacity={0.8}>
                <Icon name={a.icon} size={28} color={colors.accent} />
                <Text style={[styles.quickLabel, {color: colors.textPrimary}]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* Featured books */}
        <Section title="Featured Scriptures">
          <FlatList
            scrollEnabled={false}
            data={books.slice(0, 5)}
            keyExtractor={b => b.id}
            renderItem={({item}) => (
              <BookCard book={item} onPress={() => nav.navigate('BookReader', {bookId: item.id})} />
            )}
            ListEmptyComponent={
              <Text style={{color: colors.textSecondary, padding: spacing.lg}}>
                Loading scriptures…
              </Text>
            }
          />
        </Section>

        <View style={{height: spacing.xxl}} />
      </ScrollView>
    </View>
  );
};

const QUICK_ACTIONS = [
  {label: 'Bookmarks', icon: 'bookmark-multiple'},
  {label: 'My Notes', icon: 'notebook-edit'},
  {label: 'Highlights', icon: 'marker'},
  {label: 'Downloads', icon: 'download-circle'},
] as const;

const Section: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => {
  const {colors} = useTheme();
  return (
    <View style={{marginTop: spacing.xl}}>
      <Text style={[styles.sectionTitle, {color: colors.accentStrong}]}>{title}</Text>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  body: {padding: spacing.lg, paddingBottom: 0},
  welcome: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    marginTop: -32,
    elevation: 3,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
  },
  welcomeTitle: {fontSize: fontSizes.heading, fontWeight: '700'},
  welcomeSub: {fontSize: fontSizes.small, marginTop: spacing.xs},
  sectionTitle: {fontSize: fontSizes.title, fontWeight: '700', marginBottom: spacing.md},
  quickGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'space-between'},
  quickItem: {
    width: '47%',
    padding: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    gap: spacing.sm,
    elevation: 2,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
  },
  quickLabel: {fontWeight: '700', fontSize: fontSizes.small},
});
