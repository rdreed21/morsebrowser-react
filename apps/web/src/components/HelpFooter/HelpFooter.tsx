import { useMorseApp } from '../../context/MorseAppContext';
import { getMorseImageSrc } from '../../utils/morseImages';

const SHORTCUTS = [
  { key: 'p', title: 'Play / Toggle pause' },
  { key: 's', title: 'Stop & rewind' },
  { key: ',', title: 'Back 1' },
  { key: '<', title: 'Full rewind' },
  { key: '.', title: 'Forward 1' },
  { key: 'f', title: 'Flag current card' },
  { key: 'c', title: 'Toggle card visibility' },
  { key: '/', title: 'Toggle shuffle' },
  { key: 'l', title: 'Toggle looping' },
  { key: 'z', title: 'Reduce Farnsworth WPM' },
  { key: 'x', title: 'Increase Farnsworth WPM' },
];

export function HelpFooter() {
  const { isDev } = useMorseApp();

  return (
    <footer id="page-help-footer" className="col page-help-footer" aria-label="Help, credits, and keyboard shortcuts">
      <h2 className="h5 mb-3">Help &amp; information</h2>

      <details id="keyboard-shortcuts" className="page-help-shortcuts mb-4">
        <summary className="h6">Keyboard shortcuts</summary>
        <p className="page-help-shortcuts-intro">
          Use these keys while practicing (focus is not in a text field).
        </p>
        <table className="table table-sm table-striped page-help-shortcuts-table">
          <thead>
            <tr>
              <th scope="col">Key</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {SHORTCUTS.map(s => (
              <tr key={s.key}>
                <td className="key"><span>{s.key}</span></td>
                <td className="function">{s.title}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      <section id="credits-and-info" className="page-help-links" title="Credits and help links" aria-label="Credits and help links">
        <h3 className="h6">Credits &amp; help</h3>
        <p id="contributor-info" className="page-help-contributors">
          Morse Practice Page by KN4YRM, with assistance from AB5TN, KN6WKV, KQ4NKF, N1CC, VE3QBZ, VK5PL, WO6W, W4EMB, and W6JY.
        </p>
        <ul className="page-help-link-list">
          <li>
            Audio engine adapted from <a href="https://morsecode.world/">SC Phillips</a>{' '}
            <a href="https://github.com/scp93ch/morse-pro">morse-pro</a>.
          </li>
          <li>
            Source code:{' '}
            <a href="https://github.com/LongIslandCW/morsebrowser/">
              Long Island CW Club GitHub
              <img id="githubImage" aria-hidden="true" src={getMorseImageSrc('githubImage')} alt="" />
            </a>.
          </li>
          <li>Questions, bugs, or feature requests: <a href="mailto:AB5TN48@gmail.com">email the team</a>.</li>
          <li>
            Video walkthroughs:{' '}
            <a href="https://www.youtube.com/playlist?list=PLt-EzlLx2AKFY8NVxxPVBbPzR6s-Kz7tJ">YouTube playlist</a>.
          </li>
          <li>
            User guide:{' '}
            <a href="https://longislandcwclub.org/academic-downloads/">LICW academic downloads</a>
            {' '}or <a href="https://longislandcwclub.org/">longislandcwclub.org</a>.
          </li>
        </ul>
        {isDev && (
          <p className="warning mb-2">
            You are using the <strong>BETA</strong> build.
          </p>
        )}
        <p id="version-info" className="page-help-version mb-0">Version 2.0</p>
      </section>

      <section className="page-legal-notice" aria-label="Legal notice">
        <p className="mb-2">LICW™ is a trademark of the Long Island CW Club Inc.</p>
        <p className="mb-2">&copy; 2022-2026 Long Island CW Club Inc. All rights reserved.</p>
        <p className="mb-0">
          This work is the sole property of the Long Island CW Club Inc. (LICW). It may be downloaded
          and printed for the use of Long Island CW Club Inc. instructors and students. It may not be
          reproduced on paper or digitally for other purposes without the express consent of the
          Long Island CW Club Inc.
        </p>
      </section>
    </footer>
  );
}
