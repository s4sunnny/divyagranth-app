import React from 'react';
import {View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {GradientHeader} from '@/components/GradientHeader';
import {useTheme} from '@/theme/ThemeContext';
import {fontSizes, radii, spacing} from '@/theme/typography';
import {AppSettings, FontScale, LanguageCode, ThemeMode} from '@/types';
import {ContentApi} from '@/api/ContentApi';

export const SettingsScreen: React.FC = () => {
  const {colors, settings, updateSetting, resetSettings} = useTheme();

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This removes downloaded scriptures from your device. Bookmarks, notes and highlights are preserved.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await ContentApi.clearBookCache();
            Alert.alert('Done', 'Cache cleared.');
          },
        },
      ],
    );
  };

  const handleReset = () => {
    Alert.alert('Reset Settings', 'Restore all settings to defaults?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Reset', style: 'destructive', onPress: resetSettings},
    ]);
  };

  return (
    <View style={[styles.root, {backgroundColor: colors.background}]}>
      <GradientHeader title="Settings" subtitle="सेटिंग्स" />
      <ScrollView contentContainerStyle={{padding: spacing.lg, paddingBottom: spacing.xxl * 2}}>

        {/* APPEARANCE */}
        <Section title="Appearance">
          <SegmentedRow
            label="Theme"
            value={settings.themeMode}
            options={[
              {value: 'light', label: 'Light'},
              {value: 'dark', label: 'Dark'},
              {value: 'system', label: 'System'},
            ]}
            onChange={(v: ThemeMode) => updateSetting('themeMode', v)}
          />
          <SegmentedRow
            label="Accent"
            value={settings.accentColor}
            options={[
              {value: 'saffron', label: 'Saffron'},
              {value: 'maroon', label: 'Maroon'},
              {value: 'gold', label: 'Gold'},
            ]}
            onChange={(v: AppSettings['accentColor']) => updateSetting('accentColor', v)}
          />
        </Section>

        {/* READING */}
        <Section title="Reading">
          <SegmentedRow
            label="Font Size"
            value={settings.fontScale}
            options={[
              {value: 'sm', label: 'A-'},
              {value: 'md', label: 'A'},
              {value: 'lg', label: 'A+'},
              {value: 'xl', label: 'A++'},
            ]}
            onChange={(v: FontScale) => updateSetting('fontScale', v)}
          />
          <SegmentedRow
            label="Spacing"
            value={settings.lineSpacing}
            options={[
              {value: 'tight', label: 'Tight'},
              {value: 'normal', label: 'Normal'},
              {value: 'relaxed', label: 'Relaxed'},
            ]}
            onChange={(v: AppSettings['lineSpacing']) => updateSetting('lineSpacing', v)}
          />
          <ToggleRow
            label="Show Sanskrit (Devanagari)"
            value={settings.showSanskrit}
            onChange={v => updateSetting('showSanskrit', v)}
          />
          <ToggleRow
            label="Show Transliteration"
            value={settings.showTransliteration}
            onChange={v => updateSetting('showTransliteration', v)}
          />
          <ToggleRow
            label="Show Translation"
            value={settings.showTranslation}
            onChange={v => updateSetting('showTranslation', v)}
          />
        </Section>

        {/* LANGUAGE */}
        <Section title="Language">
          <SegmentedRow<LanguageCode>
            label="Primary"
            value={settings.primaryLanguage}
            options={[
              {value: 'en', label: 'English'},
              {value: 'hi', label: 'हिन्दी'},
              {value: 'sa', label: 'संस्कृत'},
              {value: 'mr', label: 'मराठी'},
              {value: 'ta', label: 'தமிழ்'},
              {value: 'te', label: 'తెలుగు'},
            ]}
            onChange={(v: LanguageCode) => updateSetting('primaryLanguage', v)}
            scroll
          />
        </Section>

        {/* NOTIFICATIONS */}
        <Section title="Notifications">
          <ToggleRow
            label="Daily Shloka"
            sublabel="Receive a verse each morning"
            value={settings.dailyShlokaNotification}
            onChange={v => updateSetting('dailyShlokaNotification', v)}
          />
          <ToggleRow
            label="Reading Reminders"
            value={settings.readingReminders}
            onChange={v => updateSetting('readingReminders', v)}
          />
        </Section>

        {/* DATA & PRIVACY */}
        <Section title="Data & Privacy">
          <ToggleRow
            label="Wi-Fi only downloads"
            sublabel="Don't use mobile data for downloads"
            value={settings.wifiOnlyDownloads}
            onChange={v => updateSetting('wifiOnlyDownloads', v)}
          />
          <ToggleRow
            label="Auto-play next chapter"
            sublabel="Continue automatically when audio ends"
            value={settings.autoPlayNextChapter}
            onChange={v => updateSetting('autoPlayNextChapter', v)}
          />
          <ActionRow icon="delete-sweep-outline" label="Clear Cache" onPress={handleClearCache} />
          <ActionRow icon="refresh" label="Reset to Defaults" onPress={handleReset} />
        </Section>

        {/* ABOUT */}
        <Section title="About">
          <Text style={[styles.aboutBlurb, {color: colors.textSecondary}]}>
            Divya Granth is a free, ad-free reader for Hindu scriptures. All
            primary texts are public domain. Your bookmarks, notes and reading
            progress live only on this device — there is no account, no tracking.
          </Text>
          <Text style={[styles.aboutVersion, {color: colors.textSecondary}]}>Version 1.0.0</Text>
        </Section>
      </ScrollView>
    </View>
  );
};

// =====================================================================
// Subcomponents
// =====================================================================

const Section: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => {
  const {colors} = useTheme();
  return (
    <View style={{marginTop: spacing.lg}}>
      <Text style={[styles.sectionTitle, {color: colors.accentStrong}]}>{title}</Text>
      <View style={[styles.card, {backgroundColor: colors.surface, shadowColor: colors.shadow}]}>
        {children}
      </View>
    </View>
  );
};

interface ToggleRowProps {
  label: string;
  sublabel?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}
const ToggleRow: React.FC<ToggleRowProps> = ({label, sublabel, value, onChange}) => {
  const {colors} = useTheme();
  return (
    <View style={[styles.row, {borderBottomColor: colors.divider}]}>
      <View style={{flex: 1}}>
        <Text style={[styles.rowLabel, {color: colors.textPrimary}]}>{label}</Text>
        {sublabel ? (
          <Text style={[styles.rowSub, {color: colors.textSecondary}]}>{sublabel}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{false: colors.divider, true: colors.accent}}
        thumbColor="#fff"
      />
    </View>
  );
};

interface SegmentedRowProps<T extends string> {
  label: string;
  value: T;
  options: {value: T; label: string}[];
  onChange: (v: T) => void;
  scroll?: boolean;
}
function SegmentedRow<T extends string>({label, value, options, onChange, scroll}: SegmentedRowProps<T>) {
  const {colors} = useTheme();
  const Wrap: React.ComponentType<any> = scroll ? ScrollView : View;
  const wrapProps = scroll ? {horizontal: true, showsHorizontalScrollIndicator: false} : {};
  return (
    <View style={[styles.row, {flexDirection: 'column', alignItems: 'flex-start', borderBottomColor: colors.divider, gap: spacing.sm}]}>
      <Text style={[styles.rowLabel, {color: colors.textPrimary}]}>{label}</Text>
      <Wrap {...wrapProps} style={{alignSelf: 'stretch'}} contentContainerStyle={scroll ? {gap: spacing.xs} : undefined}>
        <View style={{flexDirection: 'row', flexWrap: scroll ? 'nowrap' : 'wrap', gap: spacing.xs}}>
          {options.map(opt => {
            const active = opt.value === value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => onChange(opt.value)}
                style={[
                  styles.segOpt,
                  {
                    backgroundColor: active ? colors.accent : colors.surfaceAlt,
                    borderColor: active ? colors.accent : colors.border,
                  },
                ]}>
                <Text style={{color: active ? '#fff' : colors.textPrimary, fontWeight: '600', fontSize: fontSizes.small}}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Wrap>
    </View>
  );
}

const ActionRow: React.FC<{icon: string; label: string; onPress: () => void}> = ({
  icon, label, onPress,
}) => {
  const {colors} = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.row, {borderBottomColor: colors.divider}]}>
      <Icon name={icon} size={22} color={colors.accent} />
      <Text style={[styles.rowLabel, {color: colors.textPrimary, flex: 1, marginLeft: spacing.md}]}>{label}</Text>
      <Icon name="chevron-right" size={22} color={colors.textSecondary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  sectionTitle: {fontSize: fontSizes.body, fontWeight: '700', marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5},
  card: {
    borderRadius: radii.md, paddingHorizontal: spacing.md,
    elevation: 2, shadowOpacity: 1, shadowRadius: 6, shadowOffset: {width: 0, height: 2},
  },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, gap: spacing.sm,
  },
  rowLabel: {fontSize: fontSizes.body, fontWeight: '600'},
  rowSub: {fontSize: fontSizes.small, marginTop: 2},
  segOpt: {paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radii.pill, borderWidth: 1},
  aboutBlurb: {fontSize: fontSizes.small, lineHeight: 20, padding: spacing.md},
  aboutVersion: {fontSize: fontSizes.caption, padding: spacing.md, paddingTop: 0},
});
