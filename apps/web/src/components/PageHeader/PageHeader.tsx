import { useMorseApp } from '../../context/MorseAppContext';
import { getMorseImageSrc } from '../../utils/morseImages';

export function PageHeader() {
  const { darkMode, toggleDarkMode, logoClick } = useMorseApp();

  return (
    <header className="col page-header">
      <div className="row align-items-center g-3 flex-column flex-md-row justify-content-center">
        <div className="col-12 col-md-auto text-center">
          <img
            id="logoImage"
            className="site-logo"
            src={getMorseImageSrc('logoImage')}
            alt="Long Island CW Club Logo depicting a hand on a straight key and the club call sign W2LCW"
            onClick={logoClick}
          />
        </div>
        <div className="col d-flex flex-column gap-2">
          <h1 className="page-title text-center text-md-start mb-0">Morse Practice Page</h1>
          <div className="d-flex flex-wrap gap-2 justify-content-center justify-content-md-start align-items-center">
            <a href="#page-help-footer" className="btn btn-outline-primary btn-sm">
              Click here for help
            </a>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm theme-toggle-btn"
              aria-pressed={darkMode}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggleDarkMode}
            >
              <img
                className="theme-icon"
                height={18}
                width={18}
                alt=""
                src={getMorseImageSrc(darkMode ? 'sunImage' : 'moonImage')}
              />
              <span>{darkMode ? 'Light mode' : 'Dark mode'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
