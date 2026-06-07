import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMorseApp } from '../context/MorseAppContext';
import { useMorsePlaybackControls } from '../context/MorsePlaybackContext';
import { useTheme } from '../utils/theme';
import type { Theme } from '../utils/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function TransportButton({
  icon, label, color, onPress, busy, busyLabel,
}: {
  icon: IoniconName;
  label: string;
  color: string;
  onPress: () => void;
  busy?: boolean;
  busyLabel?: string;
}) {
  return (
    <TouchableOpacity
      style={[s.btn, s.btnLg, { backgroundColor: color }]}
      onPress={onPress}
      accessibilityLabel={busy && busyLabel ? busyLabel : label}
    >
      {busy ? (
        <View style={s.busyRow}>
          <ActivityIndicator size="small" color="#fff" />
          {busyLabel ? <Text style={s.btnText}>{busyLabel}</Text> : null}
        </View>
      ) : (
        <Ionicons name={icon} size={22} color="#fff" />
      )}
    </TouchableOpacity>
  );
}

function IconToggle({
  icon, label, active, t, onPress,
}: {
  icon: IoniconName;
  label: string;
  active: boolean;
  t: Theme;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        s.btn, s.btnSm,
        active
          ? { backgroundColor: t.accent }
          : { backgroundColor: 'transparent', borderWidth: 1, borderColor: t.chipBorder },
      ]}
      onPress={onPress}
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={18} color={active ? '#fff' : t.chipText} />
    </TouchableOpacity>
  );
}

export function PlaybackControls() {
  const app = useMorseApp();
  const t = useTheme();
  const {
    handlePlay, handlePause, handleStop,
    incrementIndex, decrementIndex, fullRewind,
    toggleLoop, speakVoiceBuffer,
  } = useMorsePlaybackControls();

  const showVoiceRecap = app.manualVoice && app.voiceEnabled;

  return (
    <View style={[s.container, { backgroundColor: t.bg, borderTopColor: t.border }]}>
      <View style={s.row}>
        <TouchableOpacity
          style={[s.btn, s.btnLg, s.btnSuccess, { backgroundColor: t.success }]}
          onPress={app.isPlaying ? handlePause : handlePlay}
          accessibilityLabel={app.isPlaying ? 'Pause' : 'Play'}
        >
          {app.isPlaying ? (
            <View style={s.busyRow}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={s.btnText}>
                {app.playingTime.minutes}:{app.playingTime.normedSeconds}
              </Text>
            </View>
          ) : (
            <View style={s.busyRow}>
              <Ionicons name="play" size={22} color="#fff" />
              <Text style={s.btnText}>Play</Text>
            </View>
          )}
        </TouchableOpacity>

        <TransportButton
          icon="pause"
          label="Pause"
          busyLabel={app.isPaused ? 'Paused' : undefined}
          busy={app.isPaused}
          color={t.info}
          onPress={handlePause}
        />

        <TransportButton
          icon="stop"
          label="Stop"
          color={t.danger}
          onPress={handleStop}
        />
      </View>

      <View style={s.row}>
        <IconToggle icon="play-skip-back" label="Full rewind" active={false} t={t} onPress={fullRewind} />
        <IconToggle icon="play-back" label="Back 1" active={false} t={t} onPress={decrementIndex} />
        <IconToggle icon="play-forward" label="Forward 1" active={false} t={t} onPress={incrementIndex} />
        <IconToggle
          icon="repeat"
          label={app.loop ? (app.loopNoShuffle ? 'Loop on (no shuffle)' : 'Loop on') : 'Loop off'}
          active={app.loop}
          t={t}
          onPress={toggleLoop}
        />
        <IconToggle
          icon="shuffle"
          label={app.isShuffled ? 'Unshuffle' : 'Shuffle'}
          active={app.isShuffled}
          t={t}
          onPress={() => app.shuffleWords(false)}
        />
        <IconToggle
          icon={app.hideList ? 'eye-off' : 'eye'}
          label={app.hideList ? 'Reveal card text' : 'Hide card text'}
          active={app.hideList}
          t={t}
          onPress={() => app.setHideList(!app.hideList)}
        />
        {showVoiceRecap && (
          <IconToggle
            icon="megaphone"
            label="Voice recap"
            active={false}
            t={t}
            onPress={speakVoiceBuffer}
          />
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical:   8,
    borderTopWidth:    1,
    gap:               8,
  },
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            6,
  },
  btn: {
    borderRadius:      8,
    alignItems:        'center',
    justifyContent:    'center',
  },
  btnLg: {
    paddingVertical: 12,
    minWidth:        48,
    minHeight:       44,
  },
  btnSm: {
    width:  40,
    height: 40,
  },
  btnSuccess: { flex: 2 },
  btnText: {
    color:      '#fff',
    fontWeight: '600',
    fontSize:   15,
  },
  busyRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
});
