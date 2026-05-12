import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import Video, {VideoRef} from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {ReelsApi} from '@/api/ReelsApi';
import {DEITIES} from '@/data/deities';
import {useTheme} from '@/theme/ThemeContext';
import {fontSizes, radii, spacing} from '@/theme/typography';
import {DeityId, Reel} from '@/types';

const {height: SCREEN_H, width: SCREEN_W} = Dimensions.get('window');

type DeityFilter = DeityId | 'all';

export const ReelsScreen: React.FC = () => {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [deityFilter, setDeityFilter] = useState<DeityFilter>('all');
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [paused, setPaused] = useState(false);

  const load = useCallback(async (filter: DeityFilter) => {
    setLoading(true);
    setError(null);
    try {
      // Refresh manifest in background; feed() reads from cache first
      ReelsApi.refreshManifest().catch(() => {});
      const list = await ReelsApi.feed(filter);
      setReels(list);
      // Hydrate saved state for visible items
      const savedEntries = await Promise.all(
        list.slice(0, 20).map(async r => [r.id, await ReelsApi.isSaved(r.id)] as const),
      );
      setSavedMap(Object.fromEntries(savedEntries));
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(deityFilter);
  }, [load, deityFilter]);

  // Pause video when leaving the tab; resume on return
  useFocusEffect(
    useCallback(() => {
      setPaused(false);
      return () => setPaused(true);
    }, []),
  );

  const onViewableItemsChanged = useRef(
    ({viewableItems}: {viewableItems: ViewToken[]}) => {
      const first = viewableItems[0];
      if (first?.index != null) {
        setActiveIndex(first.index);
        const reel = first.item as Reel;
        if (reel) ReelsApi.markSeen(reel.id).catch(() => {});
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  const handleSave = useCallback(async (reelId: string) => {
    const next = await ReelsApi.toggleSaved(reelId);
    setSavedMap(prev => ({...prev, [reelId]: next}));
  }, []);

  if (loading && reels.length === 0) {
    return (
      <View style={[styles.center, {backgroundColor: '#000'}]}>
        <ActivityIndicator color="#fff" size="large" />
        <Text style={[styles.muted, {marginTop: spacing.md}]}>Loading reels…</Text>
      </View>
    );
  }

  if (reels.length === 0) {
    return (
      <View style={[styles.root, {backgroundColor: colors.background}]}>
        <FilterBar
          value={deityFilter}
          onChange={setDeityFilter}
          colors={colors}
          insetsTop={insets.top}
        />
        <View style={[styles.center, {flex: 1, padding: spacing.xl}]}>
          <Icon
            name="movie-open-off-outline"
            size={64}
            color={colors.textSecondary}
          />
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: fontSizes.h3,
              fontWeight: '700',
              marginTop: spacing.lg,
              textAlign: 'center',
            }}>
            No reels yet
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: fontSizes.body,
              marginTop: spacing.sm,
              textAlign: 'center',
            }}>
            {error
              ? 'Could not reach the server. Check your connection.'
              : 'New devotional clips appear here daily. Try a different deity filter or check back soon.'}
          </Text>
          <TouchableOpacity
            onPress={() => load(deityFilter)}
            style={[
              styles.retryBtn,
              {backgroundColor: colors.accent, marginTop: spacing.lg},
            ]}>
            <Icon name="refresh" size={18} color="#fff" />
            <Text style={{color: '#fff', fontWeight: '600'}}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: '#000'}}>
      <FlatList
        data={reels}
        keyExtractor={r => r.id}
        renderItem={({item, index}) => (
          <ReelItem
            reel={item}
            isActive={index === activeIndex && !paused}
            saved={!!savedMap[item.id]}
            onSave={() => handleSave(item.id)}
            screenHeight={SCREEN_H}
          />
        )}
        pagingEnabled
        snapToInterval={SCREEN_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        windowSize={3}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        getItemLayout={(_, index) => ({
          length: SCREEN_H,
          offset: SCREEN_H * index,
          index,
        })}
      />
      <FilterBar
        value={deityFilter}
        onChange={setDeityFilter}
        colors={colors}
        insetsTop={insets.top}
        floating
      />
    </View>
  );
};

// =============================================================================
// One reel
// =============================================================================

interface ReelItemProps {
  reel: Reel;
  isActive: boolean;
  saved: boolean;
  onSave: () => void;
  screenHeight: number;
}

const ReelItem: React.FC<ReelItemProps> = ({
  reel,
  isActive,
  saved,
  onSave,
  screenHeight,
}) => {
  const videoRef = useRef<VideoRef | null>(null);
  const [tapPaused, setTapPaused] = useState(false);
  const [buffering, setBuffering] = useState(true);

  // Whenever the reel becomes inactive, reset to start so the next play
  // begins from frame 1 instead of where it left off.
  useEffect(() => {
    if (!isActive && videoRef.current) {
      videoRef.current.seek(0);
      setTapPaused(false);
    }
  }, [isActive]);

  const playing = isActive && !tapPaused;

  return (
    <View style={[styles.reel, {height: screenHeight}]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setTapPaused(p => !p)}
        style={StyleSheet.absoluteFill}>
        <Video
          ref={r => {
            videoRef.current = r;
          }}
          source={{uri: reel.url}}
          style={StyleSheet.absoluteFill}
          paused={!playing}
          repeat
          resizeMode="cover"
          poster={reel.thumbnailUrl}
          posterResizeMode="cover"
          onBuffer={({isBuffering}) => setBuffering(isBuffering)}
          onError={() => setBuffering(false)}
          ignoreSilentSwitch="ignore"
          playInBackground={false}
        />

        {buffering && playing ? (
          <View style={[StyleSheet.absoluteFill, styles.center]}>
            <ActivityIndicator color="#fff" size="large" />
          </View>
        ) : null}

        {tapPaused && isActive ? (
          <View style={[StyleSheet.absoluteFill, styles.center]}>
            <View style={styles.pauseGlyph}>
              <Icon name="play" size={48} color="#fff" />
            </View>
          </View>
        ) : null}
      </TouchableOpacity>

      {/* Bottom gradient + caption */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={styles.captionGradient}
        pointerEvents="none"
      />

      <View style={styles.captionRow} pointerEvents="box-none">
        <View style={styles.captionText}>
          <Text style={styles.title} numberOfLines={2}>
            {reel.title}
          </Text>
          {reel.creator ? (
            <Text style={styles.creator} numberOfLines={1}>
              {reel.creator}
            </Text>
          ) : null}
          {reel.tags?.length > 0 ? (
            <View style={styles.tagRow}>
              {reel.tags.slice(0, 3).map(t => (
                <Text key={t} style={styles.tag}>
                  #{t}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.actions} pointerEvents="box-none">
          <ActionButton
            icon={saved ? 'bookmark' : 'bookmark-outline'}
            label={saved ? 'Saved' : 'Save'}
            onPress={onSave}
            highlighted={saved}
          />
          <View style={styles.deityBadge}>
            <Text style={styles.deityBadgeText}>
              {reel.deityId.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const ActionButton: React.FC<{
  icon: string;
  label: string;
  onPress: () => void;
  highlighted?: boolean;
}> = ({icon, label, onPress, highlighted}) => (
  <TouchableOpacity onPress={onPress} style={styles.actionBtn}>
    <Icon name={icon} size={32} color={highlighted ? '#fbbf24' : '#fff'} />
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

// =============================================================================
// Deity filter chip bar
// =============================================================================

interface FilterBarProps {
  value: DeityFilter;
  onChange: (v: DeityFilter) => void;
  colors: any;
  insetsTop: number;
  floating?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({
  value,
  onChange,
  colors,
  insetsTop,
  floating,
}) => {
  const containerStyle = floating
    ? [
        styles.filterBar,
        styles.filterBarFloating,
        {paddingTop: insetsTop + spacing.sm},
      ]
    : [
        styles.filterBar,
        {paddingTop: insetsTop + spacing.sm, backgroundColor: colors.surface},
      ];

  const items: {id: DeityFilter; label: string}[] = [
    {id: 'all', label: 'All'},
    ...DEITIES.map(d => ({id: d.id as DeityFilter, label: d.name})),
  ];

  return (
    <View style={containerStyle} pointerEvents="box-none">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}>
        {items.map(item => {
          const active = item.id === value;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onChange(item.id)}
              style={[
                styles.chip,
                active
                  ? {backgroundColor: '#ffffff'}
                  : {backgroundColor: 'rgba(255,255,255,0.18)'},
              ]}>
              <Text
                style={[
                  styles.chipLabel,
                  {color: active ? '#000' : '#fff'},
                ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  root: {flex: 1},
  center: {alignItems: 'center', justifyContent: 'center'},
  muted: {color: '#ffffff99', fontSize: fontSizes.body},

  reel: {width: SCREEN_W, backgroundColor: '#000', position: 'relative'},
  pauseGlyph: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  captionGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 240,
  },
  captionRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 80,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  captionText: {flex: 1, paddingRight: spacing.md},
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  creator: {
    color: '#ffffffcc',
    fontSize: fontSizes.small,
    marginTop: 4,
  },
  tagRow: {flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap'},
  tag: {color: '#ffffffaa', fontSize: 12},

  actions: {alignItems: 'center', gap: spacing.lg},
  actionBtn: {alignItems: 'center', gap: 2},
  actionLabel: {color: '#fff', fontSize: 11, fontWeight: '600'},

  deityBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: spacing.sm,
  },
  deityBadgeText: {color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1},

  filterBar: {
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  filterBarFloating: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  filterScroll: {gap: 8, paddingHorizontal: 4},
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipLabel: {fontSize: 13, fontWeight: '600'},

  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
});
