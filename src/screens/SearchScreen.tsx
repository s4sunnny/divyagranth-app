import React, {useEffect, useRef, useState} from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {GradientHeader} from '@/components/GradientHeader';
import {DeityCard} from '@/components/Cards';
import {DEITIES} from '@/data/deities';
import {ContentApi, SearchResult} from '@/api/ContentApi';
import {RootStackParamList} from '@/types';
import {useTheme} from '@/theme/ThemeContext';
import {StorageKeys} from '@/storage/keys';
import {fontSizes, radii, spacing} from '@/theme/typography';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const POPULAR = ['Karma', 'Dharma', 'Moksha', 'Bhakti', 'Yoga', 'Atman', 'Brahman'];

export const SearchScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const {colors} = useTheme();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent searches once
  useEffect(() => {
    AsyncStorage.getItem(StorageKeys.RECENT_SEARCHES).then(raw => {
      if (raw) setRecent(JSON.parse(raw));
    });
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounce.current = setTimeout(async () => {
      const r = await ContentApi.search(q);
      setResults(r);
      setLoading(false);
      if (q.trim().length >= 2) saveRecent(q.trim());
    }, 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [q]);

  const saveRecent = async (term: string) => {
    const next = [term, ...recent.filter(r => r !== term)].slice(0, 8);
    setRecent(next);
    await AsyncStorage.setItem(StorageKeys.RECENT_SEARCHES, JSON.stringify(next));
  };

  const clearRecent = async () => {
    setRecent([]);
    await AsyncStorage.removeItem(StorageKeys.RECENT_SEARCHES);
  };

  const showEmpty = !q.trim();

  return (
    <View style={[styles.root, {backgroundColor: colors.background}]}>
      <GradientHeader title="Search" subtitle="खोज">
        <View style={[styles.searchBox, {backgroundColor: 'rgba(255,255,255,0.95)'}]}>
          <Icon name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search verses, scriptures, deities…"
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, {color: colors.textPrimary}]}
            autoCorrect={false}
            returnKeyType="search"
          />
          {q.length > 0 ? (
            <TouchableOpacity onPress={() => setQ('')} hitSlop={hit}>
              <Icon name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </GradientHeader>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : showEmpty ? (
        <ScrollView contentContainerStyle={{padding: spacing.lg}}>
          {/* Popular deities */}
          <Text style={[styles.sectionTitle, {color: colors.accentStrong}]}>Browse by Deity</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: spacing.md, paddingRight: spacing.lg}}>
            {DEITIES.slice(0, 8).map(d => (
              <DeityCard key={d.id} deity={d} size="sm" onPress={() => nav.navigate('DeityDetail', {deityId: d.id})} />
            ))}
          </ScrollView>

          {/* Popular keywords */}
          <Text style={[styles.sectionTitle, {color: colors.accentStrong, marginTop: spacing.xl}]}>
            Popular Topics
          </Text>
          <View style={styles.chipWrap}>
            {POPULAR.map(p => (
              <TouchableOpacity
                key={p}
                onPress={() => setQ(p)}
                style={[styles.popularChip, {backgroundColor: colors.surfaceAlt, borderColor: colors.border}]}>
                <Text style={{color: colors.textPrimary, fontWeight: '600'}}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recent searches */}
          {recent.length > 0 && (
            <View style={{marginTop: spacing.xl}}>
              <View style={styles.recentHeader}>
                <Text style={[styles.sectionTitle, {color: colors.accentStrong, marginBottom: 0}]}>Recent</Text>
                <TouchableOpacity onPress={clearRecent}>
                  <Text style={{color: colors.accent, fontSize: fontSizes.small, fontWeight: '600'}}>Clear</Text>
                </TouchableOpacity>
              </View>
              {recent.map(r => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setQ(r)}
                  style={[styles.recentRow, {borderBottomColor: colors.divider}]}>
                  <Icon name="history" size={18} color={colors.textSecondary} />
                  <Text style={{color: colors.textPrimary, flex: 1}}>{r}</Text>
                  <Icon name="arrow-top-left" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(r, i) => `${r.bookId}_${r.chapterId}_${r.verseNumber}_${i}`}
          contentContainerStyle={{padding: spacing.lg}}
          renderItem={({item}) => (
            <TouchableOpacity
              onPress={() =>
                nav.navigate('BookReader', {
                  bookId: item.bookId,
                  chapterId: item.chapterId,
                  verseNumber: item.verseNumber,
                })
              }
              style={[styles.resultCard, {backgroundColor: colors.surface, shadowColor: colors.shadow}]}>
              <Text style={[styles.resultTitle, {color: colors.accentStrong}]}>{item.bookTitle}</Text>
              <Text style={[styles.resultMeta, {color: colors.textSecondary}]}>
                {item.chapterTitle} • Verse {item.verseNumber}
              </Text>
              <Text style={[styles.resultSnippet, {color: colors.textPrimary}]}>{item.snippet}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={{color: colors.textSecondary, textAlign: 'center', padding: spacing.xl}}>
              No matches for "{q}". Try a different word.
            </Text>
          }
        />
      )}
    </View>
  );
};

const hit = {top: 8, bottom: 8, left: 8, right: 8};

const styles = StyleSheet.create({
  root: {flex: 1},
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    borderRadius: radii.pill, marginTop: spacing.md,
  },
  searchInput: {flex: 1, fontSize: fontSizes.body, paddingVertical: 0},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  sectionTitle: {fontSize: fontSizes.title, fontWeight: '700', marginBottom: spacing.md},
  chipWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  popularChip: {paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radii.pill, borderWidth: 1},
  recentHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm},
  recentRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth},
  resultCard: {
    padding: spacing.md, borderRadius: radii.md, marginBottom: spacing.sm,
    elevation: 2, shadowOpacity: 1, shadowRadius: 6, shadowOffset: {width: 0, height: 2},
  },
  resultTitle: {fontSize: fontSizes.body, fontWeight: '700'},
  resultMeta: {fontSize: fontSizes.small, marginTop: 2},
  resultSnippet: {fontSize: fontSizes.small, marginTop: spacing.sm, lineHeight: 20},
});
