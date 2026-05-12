import React, {useEffect, useMemo, useState} from 'react';
import {View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {GradientHeader} from '@/components/GradientHeader';
import {BookCard} from '@/components/Cards';
import {DEITIES} from '@/data/deities';
import {ContentApi} from '@/api/ContentApi';
import {Book, BookCategory, DeityId, RootStackParamList} from '@/types';
import {useTheme} from '@/theme/ThemeContext';
import {fontSizes, radii, spacing} from '@/theme/typography';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES: {id: BookCategory | 'all'; label: string}[] = [
  {id: 'all', label: 'All'},
  {id: 'gita', label: 'Gita'},
  {id: 'purana', label: 'Puranas'},
  {id: 'upanishad', label: 'Upanishads'},
  {id: 'veda', label: 'Vedas'},
  {id: 'stotra', label: 'Stotras'},
  {id: 'itihasa', label: 'Itihasa'},
  {id: 'chalisa', label: 'Chalisa'},
  {id: 'mantra', label: 'Mantras'},
];

export const LibraryScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const {colors} = useTheme();
  const [books, setBooks] = useState<Book[]>([]);
  const [deityFilter, setDeityFilter] = useState<DeityId | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<BookCategory | 'all'>('all');

  useEffect(() => {
    let alive = true;
    ContentApi.listBooks().then(bs => alive && setBooks(bs));
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    return books.filter(b => {
      if (deityFilter !== 'all' && b.deityId !== deityFilter) return false;
      if (categoryFilter !== 'all' && b.category !== categoryFilter) return false;
      return true;
    });
  }, [books, deityFilter, categoryFilter]);

  return (
    <View style={[styles.root, {backgroundColor: colors.background}]}>
      <GradientHeader title="Library" subtitle="पुस्तकालय" rightIcon="filter-variant" />

      {/* Deity filter row */}
      <View style={[styles.filterBar, {backgroundColor: colors.surface}]}>
        <Text style={[styles.filterLabel, {color: colors.textSecondary}]}>Deity</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip
            label="All"
            active={deityFilter === 'all'}
            onPress={() => setDeityFilter('all')}
          />
          {DEITIES.map(d => (
            <Chip
              key={d.id}
              label={d.name.replace(/^(Lord |Goddess )/, '')}
              active={deityFilter === d.id}
              onPress={() => setDeityFilter(d.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Category filter row */}
      <View style={[styles.filterBar, {backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider}]}>
        <Text style={[styles.filterLabel, {color: colors.textSecondary}]}>Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map(c => (
            <Chip
              key={c.id}
              label={c.label}
              active={categoryFilter === c.id}
              onPress={() => setCategoryFilter(c.id)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={b => b.id}
        contentContainerStyle={{padding: spacing.lg, paddingBottom: spacing.xxl * 2}}
        renderItem={({item}) => (
          <BookCard book={item} onPress={() => nav.navigate('BookReader', {bookId: item.id})} />
        )}
        ListEmptyComponent={
          <Text style={{color: colors.textSecondary, padding: spacing.xl, textAlign: 'center'}}>
            No books match these filters yet. The catalog grows as more public-domain texts are added.
          </Text>
        }
      />
    </View>
  );
};

const Chip: React.FC<{label: string; active: boolean; onPress: () => void}> = ({
  label, active, onPress,
}) => {
  const {colors} = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.accent : colors.surfaceAlt,
          borderColor: active ? colors.accent : colors.border,
        },
      ]}>
      <Text style={{color: active ? '#fff' : colors.textPrimary, fontWeight: '600', fontSize: fontSizes.small}}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  filterBar: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  filterLabel: {fontSize: 11, fontWeight: '700', textTransform: 'uppercase', width: 50},
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
});
