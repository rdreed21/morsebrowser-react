import {
  getWordListCatalog, getUserTargets, getClasses, getLetterGroups,
  getDisplays, findWordListOption, isRandomWordListConfig,
} from '../lessons/lessonLoader';

describe('lessonLoader catalog', () => {
  it('loads word list catalog from KO wordlists.json', () => {
    const catalog = getWordListCatalog();
    expect(catalog.length).toBeGreaterThan(100);
  });

  it('has STUDENT and INSTRUCTOR targets', () => {
    const targets = getUserTargets();
    expect(targets).toContain('STUDENT');
    expect(targets).toContain('INSTRUCTOR');
  });

  it('filters classes by user target', () => {
    const classes = getClasses('STUDENT');
    expect(classes).toContain('BC1');
    expect(classes).toContain('BC2');
  });

  it('filters letter groups', () => {
    const groups = getLetterGroups('STUDENT', 'BC1');
    expect(groups).toContain('REA');
    expect(groups).not.toContain('KMY');
  });

  it('filters displays for a letter group', () => {
    const displays = getDisplays('STUDENT', 'BC1', 'REA');
    expect(displays.some(d => d.fileName === 'SB1REA1.json')).toBe(true);
    expect(displays.some(d => d.fileName === 'BC1_FAM_REA.txt')).toBe(true);
  });

  it('finds option by filename', () => {
    const opt = findWordListOption('SB1REA1.json');
    expect(opt?.display).toBe('REA');
    expect(opt?.newlineChunking).toBe(false);
  });
});

describe('isRandomWordListConfig', () => {
  it('validates KO JSON lesson shape', () => {
    expect(isRandomWordListConfig({
      letters: 'rea', minWordSize: 3, maxWordSize: 3, practiceSeconds: 120,
    })).toBe(true);
    expect(isRandomWordListConfig({ letters: 'rea' })).toBe(false);
  });
});
