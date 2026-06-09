import { LessonsPicker } from '../LessonsPicker/LessonsPicker';
import { LessonOptionsPanel } from '../LessonOptionsPanel/LessonOptionsPanel';
import { VoiceOptionsPanel } from '../VoiceOptionsPanel/VoiceOptionsPanel';
import { InputOptionsPanel } from '../InputOptionsPanel/InputOptionsPanel';
import { ToneOptionsPanel } from '../ToneOptionsPanel/ToneOptionsPanel';
import { OutputOptionsPanel } from '../OutputOptionsPanel/OutputOptionsPanel';
import { RssAccordion } from '../RssAccordion/RssAccordion';

export function SettingsAccordion() {
  return (
    <section title="Settings" aria-label="Settings" className="col">
      <div className="accordion" id="accordionArea">
        <LessonsPicker />
        <LessonOptionsPanel />
        <VoiceOptionsPanel />
        <ToneOptionsPanel />
        <RssAccordion />
        <InputOptionsPanel />
        <OutputOptionsPanel />
      </div>
    </section>
  );
}
