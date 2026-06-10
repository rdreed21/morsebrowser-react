import * as fs from 'fs';
import * as path from 'path';
import { getWordListCatalog } from '../lessons/lessonLoader';

/**
 * Guards against the two catalog corruption classes found in review:
 *  - entries referencing files that don't exist (Fam_LN.txt)
 *  - mojibake filenames (UTF-8 en-dash "Fam_Words â€“ 4.txt")
 */
describe('wordlists.json catalog integrity', () => {
  const wordfilesDir = path.resolve(
    __dirname,
    '../../../../apps/mobile/assets/wordfiles',
  );
  const files = new Set(fs.readdirSync(wordfilesDir));

  it('every catalog fileName resolves to a real word file', () => {
    const missing = getWordListCatalog()
      .filter(e => !files.has(e.fileName))
      .map(e => `${e.class}/${e.letterGroup}/${e.display} -> ${e.fileName}`);
    expect(missing).toEqual([]);
  });

  it('all catalog filenames are pure ASCII', () => {
    const nonAscii = getWordListCatalog()
      .map(e => e.fileName)
      // eslint-disable-next-line no-control-regex
      .filter(f => /[^\x20-\x7E]/.test(f));
    expect(nonAscii).toEqual([]);
  });

  it('catalog entries have a complete, well-typed shape', () => {
    getWordListCatalog().forEach(e => {
      expect(typeof e.sort).toBe('number');
      expect(typeof e.userTarget).toBe('string');
      expect(typeof e.class).toBe('string');
      expect(typeof e.letterGroup).toBe('string');
      expect(typeof e.newlineChunking).toBe('boolean');
      expect(typeof e.display).toBe('string');
      expect(e.fileName).toMatch(/\.(txt|json)$/);
    });
  });
});
