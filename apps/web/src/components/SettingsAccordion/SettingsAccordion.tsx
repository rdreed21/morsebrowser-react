import { LessonsPicker } from '../LessonsPicker/LessonsPicker';
import { LessonOptionsPanel } from '../LessonOptionsPanel/LessonOptionsPanel';
import { VoiceOptionsPanel } from '../VoiceOptionsPanel/VoiceOptionsPanel';
import { InputOptionsPanel } from '../InputOptionsPanel/InputOptionsPanel';
import { ToneOptionsPanel } from '../ToneOptionsPanel/ToneOptionsPanel';
import { OutputOptionsPanel } from '../OutputOptionsPanel/OutputOptionsPanel';
import { RssAccordion } from '../RssAccordion/RssAccordion';
import { useMorseApp } from '../../context/MorseAppContext';

export function SettingsAccordion() {
  const { rssEnabled } = useMorseApp();

  return (
    <section title="Settings" aria-label="Settings" className="col">
      <div className="accordion" id="accordionArea">
        <LessonsPicker />
        <LessonOptionsPanel />
        <VoiceOptionsPanel />
        <ToneOptionsPanel />
        <InputOptionsPanel />
        <OutputOptionsPanel />
        {rssEnabled && <RssAccordion />}
      </div>
    </section>
  );
}
