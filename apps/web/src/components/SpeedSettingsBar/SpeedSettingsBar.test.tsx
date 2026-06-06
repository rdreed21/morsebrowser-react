import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useEffect, useRef } from 'react';
import { SpeedSettingsBar } from './SpeedSettingsBar';
import { MorseAppProvider, useMorseApp } from '../../context/MorseAppContext';

function renderBar() {
  return render(
    <MorseAppProvider>
      <SpeedSettingsBar />
    </MorseAppProvider>,
  );
}

describe('SpeedSettingsBar', () => {
  it('renders WPM and FWPM inputs with morse-settings-num class', () => {
    renderBar();
    expect(screen.getByLabelText(/Character Speed/i)).toHaveClass('morse-settings-num');
    expect(screen.getByLabelText(/Effective Speed/i)).toHaveClass('morse-settings-num');
  });

  it('updates WPM value', () => {
    renderBar();
    const wpm = screen.getByLabelText(/Character Speed/i);
    fireEvent.change(wpm, { target: { value: '18' } });
    expect(wpm).toHaveValue(18);
  });

  it('disables FWPM when sync is on', () => {
    renderBar();
    expect(screen.getByLabelText(/Effective Speed/i)).toBeDisabled();
  });

  it('shows readonly interval speeds while playing with speed intervals', () => {
    function IntervalHarness() {
      const app = useMorseApp();
      const seeded = useRef(false);

      useEffect(() => {
        if (seeded.current) return;
        seeded.current = true;
        app.setSpeedInterval(true);
        app.setIntervalTimingsText('30,60');
        app.setIntervalWpmText('12,18');
        app.setIntervalFwpmText('8,12');
        app.setIsPlaying(true);
        app.setRunningPlayMs(0);
      }, [app]);

      return <SpeedSettingsBar />;
    }

    render(
      <MorseAppProvider>
        <IntervalHarness />
      </MorseAppProvider>,
    );

    expect(screen.getByLabelText(/Current interval character speed/i)).toHaveValue(12);
    expect(screen.getByLabelText(/Current interval effective speed/i)).toHaveValue(8);
    expect(document.getElementById('wpm')).toBeNull();
    expect(document.getElementById('trueWpm')).toBeNull();
  });
});
