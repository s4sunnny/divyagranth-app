import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, FlatList} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {GradientHeader} from '@/components/GradientHeader';
import {BookCard} from '@/components/Cards';
import {findDeity} from '@/data/deities';
import {ContentApi} from '@/api/ContentApi';
import {Book, RootStackParamList} from '@/types';
import {useTheme} from '@/theme/ThemeContext';
import {fontSizes, radii, spacing} from '@/theme/typography';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const DeityScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'DeityDetail'>>();
  const {colors} = useTheme();
  const deity = findDeity(route.params.deityId);
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    let alive = true;
    if (deity) {
      ContentApi.listByDeity(deity.id).then(bs => alive && setBooks(bs));
    }
    return () => { alive = false; };
  }, [deity]);

  if (!deity) {
    return (
      <View style={[styles.root, {backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center'}]}>
        <Text style={{color: colors.textPrimary}}>Deity not found.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, {backgroundColor: colors.background}]}>
      <GradientHeader
        title={deity.name}
        subtitle={deity.sanskritName}
        onBack={() => nav.goBack()}
        rightIcon="heart-outline"
      />

      {/* Hero card */}
      <LinearGradient
        colors={deity.gradient}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.hero}>
        <Text style={styles.heroSanskrit}>{deity.sanskritName}</Text>
        <Text style={styles.heroName}>{deity.name}</Text>
        <Text style={styles.heroDesc}>{deity.description}</Text>
        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaItem}>
            <Icon name="book-multiple" size={18} color="#fff" />
            <Text style={styles.heroMetaText}>{books.length} scriptures</Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={books}
        keyExtractor={b => b.id}
        contentContainerStyle={{padding: spacing.lg, paddingBottom: spacing.xxl}}
        ListHeaderComponent={
          <Text style={[styles.sectionTitle, {color: colors.accentStrong}]}>Sacred Texts</Text>
        }
        renderItem={({item}) => (
          <BookCard book={item} onPress={() => nav.navigate('BookReader', {bookId: item.id})} />
        )}
        ListEmptyComponent={
          <View style={[styles.empty, {backgroundColor: colors.surface}]}>
            <Icon name="book-plus-multiple-outline" size={36} color={colors.textSecondary} />
            <Text style={{color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md}}>
              No texts for {deity.name} yet. Add an entry to
              src/data/catalog.ts to populate this section.
            </Text>
          </View>
        }
        ListFooterComponent={
          books.length > 0 ? (
            <Text style={[styles.attribution, {color: colors.textSecondary}]}>
              All texts shown are public-domain unless otherwise noted in their source line.
            </Text>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  hero: {
    margin: spacing.lg,
    marginTop: -32,
    padding: spacing.lg,
    borderRadius: radii.lg,
    gap: spacing.sm,
    elevation: 4,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
  },
  heroSanskrit: {color: '#fff', fontSize: fontSizes.heading, fontWeight: '700'},
  heroName: {color: '#fff', fontSize: fontSizes.title, fontWeight: '600'},
  heroDesc: {color: 'rgba(255,255,255,0.9)', fontSize: fontSizes.small, lineHeight: 20},
  heroMetaRow: {flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm},
  heroMetaItem: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs},
  heroMetaText: {color: '#fff', fontSize: fontSizes.small, fontWeight: '600'},
  sectionTitle: {fontSize: fontSizes.title, fontWeight: '700', marginBottom: spacing.md},
  empty: {
    padding: spacing.xl,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  attribution: {
    fontSize: fontSizes.caption,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
});
