import { MorseAppProvider } from './context/MorseAppContext';
import { MorseAudioProvider } from './context/MorseAudioContext';
import { MorsePlaybackProvider } from './context/MorsePlaybackContext';
import { PageHeader } from './components/PageHeader/PageHeader';
import { SpeedSettingsBar } from './components/SpeedSettingsBar/SpeedSettingsBar';
import { SettingsAccordion } from './components/SettingsAccordion/SettingsAccordion';
import { WorkingTextStats } from './components/WorkingTextStats/WorkingTextStats';
import { PlaybackControls } from './components/PlaybackControls/PlaybackControls';
import { WordCards } from './components/WordCards/WordCards';
import { HelpFooter } from './components/HelpFooter/HelpFooter';
import { StartupHooks } from './components/StartupHooks';

export default function App() {
  return (
    <MorseAppProvider>
      <StartupHooks />
      <MorseAudioProvider>
      <MorsePlaybackProvider>
        <div className="container-fluid page-container">
          <div className="row gy-3 row-cols-1">
            <PageHeader />
            <SpeedSettingsBar />
            <SettingsAccordion />
            <WorkingTextStats />
            <PlaybackControls />
            <WordCards />
            <HelpFooter />
          </div>
        </div>
      </MorsePlaybackProvider>
      </MorseAudioProvider>
    </MorseAppProvider>
  );
}
