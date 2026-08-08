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

/**
 * Where an audible play sits within the current card's repeat schedule.
 * `index` / `total` are 0-based repeat number and repeat count (club parity).
 */
export interface RepeatState {
  index: number;
  total: number;
  isFirstOfRepeat: boolean;
  isLastOfRepeat: boolean;
}

export class CardBufferManager {
  private buffer: CardWord[] = [];

  // Club repeat bookkeeping — audible (non-empty) plays only, pads excluded.
  private subpartsPerRepeat = 1;
  private totalWordPlays = 1;
  private audiblePlayCount = 0;
  private lastAudiblePlayIndex = -1;

  constructor(
    private getCurrentIndex: () => number,
    private getDisplayWords: () => string[],
  ) {}

  populateBuffer(repeats = 0, additionalWordSpaces = 0): void {
    this.buffer = [];
    this.audiblePlayCount = 0;
    this.lastAudiblePlayIndex = -1;
    const words = this.getDisplayWords();
    const idx = this.getCurrentIndex();
    if (idx < 0 || idx >= words.length) return;

    const cardWord = new CardWord(words[idx]);
    this.buffer.push(cardWord);
    this.subpartsPerRepeat = Math.max(1, cardWord.subparts.length);
    this.totalWordPlays = 1;

    if (repeats > 0) {
      const audibleSubparts = cardWord.subparts.map(sp => sp.word);
      this.subpartsPerRepeat = Math.max(1, audibleSubparts.length);
      this.totalWordPlays = repeats;
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
    const next = this.buffer[0].subparts.shift()!.word;
    // Empty pads (between-repeat wordspaces) do not advance the audible index.
    if (next.length > 0) {
      this.lastAudiblePlayIndex = this.audiblePlayCount;
      this.audiblePlayCount += 1;
    }
    return next;
  }

  /** Repeat position of the most recently returned audible play (club parity). */
  getRepeatState(): RepeatState {
    const per = Math.max(1, this.subpartsPerRepeat);
    const playIndex = Math.max(0, this.lastAudiblePlayIndex);
    const index = Math.floor(playIndex / per);
    const positionInRepeat = playIndex % per;
    return {
      index,
      total: this.totalWordPlays,
      isFirstOfRepeat: positionInRepeat === 0,
      isLastOfRepeat: positionInRepeat === per - 1,
    };
  }

  clear(): void {
    this.buffer = [];
    this.subpartsPerRepeat = 1;
    this.totalWordPlays = 1;
    this.audiblePlayCount = 0;
    this.lastAudiblePlayIndex = -1;
  }
}
