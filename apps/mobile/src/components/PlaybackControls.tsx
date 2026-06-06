import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useMorseApp } from '../context/MorseAppContext';
import { useMorsePlayback } from '../hooks/useMorsePlayback';
import { useTheme } from '../utils/theme';

export function PlaybackControls() {
  const app = useMorseApp();
  const t = useTheme();
  const {
    handlePlay, handlePause, handleStop,
    incrementIndex, decrementIndex, fullRewind,
    toggleLoop, speakVoiceBuffer,
  } = useMorsePlayback();

  const showVoiceRecap = app.manualVoice && app.voiceEnabled;
  const loopLabel = !app.loop ? 'Loop Off' : !app.loopNoShuffle ? 'Loop ↺' : 'Loop On';

  return (
    <View style={[s.container, { backgroundColor: t.bg, borderTopColor: t.border }]}>
      <View style={s.row}>
        <TouchableOpacity
          style={[s.btn, s.btnSuccess, { backgroundColor: t.success }]}
          onPress={app.isPlaying ? handlePause : handlePlay}
          accessibilityLabel={app.isPlaying ? 'Pause' : 'Play'}
        >
          {app.isPlaying ? (
            <View style={s.playingRow}>
              <ActivityIndicator size="small" color="#fff" style={s.spinner} />
              <Text style={s.btnText}>
                {app.playingTime.minutes}:{app.playingTime.normedSeconds}
              </Text>
            </View>
          ) : (
            <Text style={s.btnText}>▶ Play</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.btn, { backgroundColor: t.info }]}
          onPress={handlePause}
          accessibilityLabel={app.isPaused ? 'Resume' : 'Pause'}
        >
          {app.isPaused ? (
            <View style={s.playingRow}>
              <ActivityIndicator size="small" color="#fff" style={s.spinner} />
              <Text style={s.btnText}>Paused</Text>
            </View>
          ) : (
            <Text style={s.btnText}>⏸</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.btn, { backgroundColor: t.danger }]}
          onPress={handleStop}
          accessibilityLabel="Stop"
        >
          <Text style={s.btnText}>⏹</Text>
        </TouchableOpacity>
      </View>

      <View style={s.row}>
        <TouchableOpacity
          style={[s.btn, s.btnSm, { backgroundColor: t.secondary }]}
          onPress={fullRewind}
          accessibilityLabel="Full rewind"
        >
          <Text style={s.btnTextSm}>⏮</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.btn, s.btnSm, { backgroundColor: t.secondary }]}
          onPress={decrementIndex}
          accessibilityLabel="Back 1"
        >
          <Text style={s.btnTextSm}>◀</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.btn, s.btnSm, { backgroundColor: t.secondary }]}
          onPress={incrementIndex}
          accessibilityLabel="Forward 1"
        >
          <Text style={s.btnTextSm}>▶</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.btn, s.btnSm, { backgroundColor: app.loop ? t.accent : t.secondary }]}
          onPress={toggleLoop}
          accessibilityLabel="Toggle loop"
        >
          <Text style={s.btnTextSm}>{loopLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.btn, s.btnSm, { backgroundColor: app.isShuffled ? t.accent : t.secondary }]}
          onPress={() => app.shuffleWords(false)}
          accessibilityLabel={app.isShuffled ? 'Unshuffle' : 'Shuffle'}
        >
          <Text style={s.btnTextSm}>{app.isShuffled ? 'UnShuffle' : 'Shuffle'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            s.btn, s.btnSm,
            !app.hideList
              ? { backgroundColor: t.accent }
              : { backgroundColor: 'transparent', borderWidth: 1, borderColor: t.accent },
          ]}
          onPress={() => app.setHideList(!app.hideList)}
          accessibilityLabel={app.hideList ? 'Reveal card text' : 'Hide card text'}
        >
          <Text style={[s.btnTextSm, app.hideList && { color: t.accent }]}>
            {app.hideList ? '🙈 Hidden' : '👁 Reveal'}
          </Text>
        </TouchableOpacity>

        {showVoiceRecap && (
          <TouchableOpacity
            style={[s.btn, s.btnSm, { backgroundColor: t.info }]}
            onPress={speakVoiceBuffer}
            accessibilityLabel="Voice recap"
          >
            <Text style={s.btnTextSm}>Voice Recap</Text>
          </TouchableOpacity>
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
    flexDirection: 'row',
    gap:           6,
    flexWrap:      'wrap',
  },
  btn: {
    borderRadius:      6,
    paddingVertical:   10,
    paddingHorizontal: 16,
    alignItems:        'center',
    justifyContent:    'center',
    minWidth:          48,
  },
  btnSm: {
    paddingVertical:   6,
    paddingHorizontal: 10,
    minWidth:          36,
  },
  btnSuccess: { flex: 2 },
  btnText: {
    color:      '#fff',
    fontWeight: '600',
    fontSize:   15,
  },
  btnTextSm: {
    color:      '#fff',
    fontWeight: '600',
    fontSize:   13,
  },
  playingRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  spinner: { marginRight: 2 },
});
