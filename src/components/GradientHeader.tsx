import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ViewStyle} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@/theme/ThemeContext';
import {fontSizes, spacing} from '@/theme/typography';

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightIcon?: string;
  onRightPress?: () => void;
  style?: ViewStyle;
  height?: number;
  children?: React.ReactNode;
}

export const GradientHeader: React.FC<Props> = ({
  title,
  subtitle,
  onBack,
  rightIcon,
  onRightPress,
  style,
  height,
  children,
}) => {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={colors.headerGradient}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={[
        styles.wrap,
        {paddingTop: insets.top + spacing.sm, minHeight: (height ?? 110) + insets.top},
        style,
      ]}>
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} hitSlop={hitSlop}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={{width: 24}} />
        )}
        <View style={styles.titles}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {rightIcon ? (
          <TouchableOpacity onPress={onRightPress} hitSlop={hitSlop}>
            <Icon name={rightIcon} size={22} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={{width: 24}} />
        )}
      </View>
      {children}
    </LinearGradient>
  );
};

const hitSlop = {top: 8, bottom: 8, left: 8, right: 8};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  row: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  titles: {flex: 1, alignItems: 'center'},
  title: {
    color: '#fff',
    fontSize: fontSizes.title,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: fontSizes.small,
    marginTop: 2,
  },
});
