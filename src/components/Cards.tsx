import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Deity, Book} from '@/types';
import {useTheme} from '@/theme/ThemeContext';
import {fontSizes, radii, spacing} from '@/theme/typography';

// =====================================================================
// DeityCard — a colored gradient tile with the deity name and an icon.
// =====================================================================
interface DeityCardProps {
  deity: Deity;
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const DeityCard: React.FC<DeityCardProps> = ({deity, onPress, size = 'md'}) => {
  const dim = size === 'sm' ? 90 : size === 'lg' ? 140 : 110;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <LinearGradient
        colors={deity.gradient}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[styles.deityCard, {width: dim, height: dim}]}>
        <Icon name={mapDeityIcon(deity.iconName)} size={dim * 0.32} color="#fff" />
        <Text style={styles.deitySanskrit}>{deity.sanskritName}</Text>
      </LinearGradient>
      <Text style={[styles.deityName, {width: dim}]} numberOfLines={1}>
        {deity.name}
      </Text>
    </TouchableOpacity>
  );
};

// react-native-vector-icons doesn't have every icon; map design names
// to the closest MaterialCommunityIcons equivalent.
function mapDeityIcon(name: string): string {
  switch (name) {
    case 'om': return 'om';
    case 'feather': return 'feather';
    case 'flower': return 'flower-tulip';
    case 'fire': return 'fire';
    case 'music': return 'music';
    case 'crown': return 'crown';
    case 'star': return 'star-four-points';
    case 'gem': return 'diamond-stone';
    case 'book-open': return 'book-open-page-variant';
    case 'shield-alt': return 'shield-sword';
    default: return 'star';
  }
}

// =====================================================================
// BookCard — full-width card showing book metadata.
// =====================================================================
interface BookCardProps {
  book: Book;
  onPress: () => void;
  rightAccessory?: React.ReactNode;
  progressPercent?: number;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onPress,
  rightAccessory,
  progressPercent,
}) => {
  const {colors} = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.bookCard,
        {backgroundColor: colors.surface, shadowColor: colors.shadow},
      ]}>
      <View
        style={[
          styles.bookCover,
          {backgroundColor: book.coverColor ?? colors.accentMuted},
        ]}>
        <Icon name="book-open-variant" size={28} color="#fff" />
      </View>
      <View style={styles.bookMeta}>
        <Text style={[styles.bookTitle, {color: colors.accentStrong}]} numberOfLines={1}>
          {book.title}
        </Text>
        {book.sanskritTitle ? (
          <Text style={[styles.bookSanskrit, {color: colors.textSecondary}]} numberOfLines={1}>
            {book.sanskritTitle}
          </Text>
        ) : null}
        <Text style={[styles.bookDesc, {color: colors.textSecondary}]} numberOfLines={2}>
          {book.description}
        </Text>
        <View style={styles.bookTags}>
          <Tag label={book.category} />
          {book.isLocal ? <Tag label="offline" tone="success" /> : null}
        </View>
        {progressPercent !== undefined ? (
          <View style={[styles.progressTrack, {backgroundColor: colors.divider}]}>
            <View
              style={[
                styles.progressFill,
                {width: `${Math.min(100, Math.max(0, progressPercent))}%`, backgroundColor: colors.accent},
              ]}
            />
          </View>
        ) : null}
      </View>
      {rightAccessory}
    </TouchableOpacity>
  );
};

const Tag: React.FC<{label: string; tone?: 'default' | 'success'}> = ({label, tone = 'default'}) => {
  const {colors} = useTheme();
  const bg = tone === 'success' ? '#16a34a22' : colors.accentMuted;
  const fg = tone === 'success' ? '#16a34a' : colors.accentStrong;
  return (
    <View style={[styles.tag, {backgroundColor: bg}]}>
      <Text style={[styles.tagText, {color: fg}]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  deityCard: {
    borderRadius: radii.lg,
    padding: spacing.md,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deitySanskrit: {
    color: '#fff',
    fontSize: fontSizes.title,
    fontWeight: '700',
  },
  deityName: {
    marginTop: spacing.xs,
    textAlign: 'center',
    fontSize: fontSizes.small,
    fontWeight: '700',
  },

  bookCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    elevation: 2,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
    gap: spacing.md,
  },
  bookCover: {
    width: 56,
    height: 72,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookMeta: {flex: 1, gap: 2},
  bookTitle: {fontSize: fontSizes.body, fontWeight: '700'},
  bookSanskrit: {fontSize: fontSizes.small},
  bookDesc: {fontSize: fontSizes.small, marginTop: 4},
  bookTags: {flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs},
  tag: {paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.pill},
  tagText: {fontSize: 10, fontWeight: '700', textTransform: 'capitalize'},
  progressTrack: {height: 4, borderRadius: 2, marginTop: spacing.sm, overflow: 'hidden'},
  progressFill: {height: '100%', borderRadius: 2},
});
