/**
 * Port of KO CardBufferManager — plays one card at a time, with optional repeats.
 */

class CardWordSubPart {
  word: string;
  constructor(wrd: string) {
    this.word = wrd;
  }
}

class CardWord {
  original: string;
  subparts: CardWordSubPart[] = [];
  constructor(contents: string) {
    this.original = contents;
    contents.split(' ').forEach(piece => {
      this.subparts.push(new CardWordSubPart(piece));
    });
  }
}

function appendArrayNTimes<T>(originalArray: T[], n: number): T[] {
  if (!Number.isInteger(n) || n <= 0) return originalArray;
  return Array.from({ length: n }, () => [...originalArray]).flat();
}

export class CardBufferManager {
  private buffer: CardWord[] = [];

  constructor(
    private getCurrentIndex: () => number,
    private getDisplayWords: () => string[],
  ) {}

  populateBuffer(repeats = 0, additionalWordSpaces = 0): void {
    this.buffer = [];
    const words = this.getDisplayWords();
    const idx = this.getCurrentIndex();
    if (idx < 0 || idx >= words.length) return;

    this.buffer.push(new CardWord(words[idx]));
    if (repeats > 0) {
      for (let i = 0; i < additionalWordSpaces; i++) {
        this.buffer[0].subparts.push(new CardWordSubPart(''));
      }
      this.buffer[0].subparts = appendArrayNTimes(this.buffer[0].subparts, repeats);
    }
  }

  hasMoreMorse(): boolean {
    return this.buffer.length !== 0 && this.buffer[0].subparts.length !== 0;
  }

  getNextMorse(repeats = 0, additionalWordSpaces = 0): string {
    if (!this.hasMoreMorse()) {
      this.populateBuffer(repeats, additionalWordSpaces);
    }
    if (!this.hasMoreMorse()) return '';
    return this.buffer[0].subparts.shift()!.word;
  }

  clear(): void {
    this.buffer = [];
  }
}
