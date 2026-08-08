/**
 * Port of KO CardBufferManager — plays one card at a time, with optional repeats.
 * Empty pieces from Sending column pads (`[   ]` → spaces) are filtered out so
 * Speak First does not hang on silent plays. Wordspace pads go between repeats
 * only (never after the last audible play).
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
    const pieces = this.original.split(' ').filter(piece => piece.length > 0);
    pieces.forEach(piece => {
      this.subparts.push(new CardWordSubPart(piece));
    });
  }
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

    const cardWord = new CardWord(words[idx]);
    this.buffer.push(cardWord);

    if (repeats > 0) {
      const audibleSubparts = cardWord.subparts.map(sp => sp.word);
      cardWord.subparts = [];
      for (let r = 0; r < repeats; r++) {
        audibleSubparts.forEach(word => {
          cardWord.subparts.push(new CardWordSubPart(word));
        });
        // Pads between repeats only — never after the last audible play.
        if (r < repeats - 1) {
          for (let i = 0; i < additionalWordSpaces; i++) {
            cardWord.subparts.push(new CardWordSubPart(''));
          }
        }
      }
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
