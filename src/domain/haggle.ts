/**
 * How an offer sits against the listed price. Shared by the shopper
 * panel and the admin offers board.
 */

export type HaggleTone = 'lowball' | 'cheeky' | 'serious' | 'close' | 'asking';

export interface HaggleRead {
  ratio: number;
  percentOfAsk: number;
  tone: HaggleTone;
  label: string;
}

export function readHaggle(offerCents: number, askingCents: number): HaggleRead {
  const ask = Math.max(askingCents, 1);
  const ratio = offerCents / ask;
  const percentOfAsk = Math.round(ratio * 100);

  if (ratio >= 0.97) {
    return { ratio, percentOfAsk, tone: 'asking', label: 'Listed price' };
  }
  if (ratio >= 0.85) {
    return { ratio, percentOfAsk, tone: 'close', label: 'Close' };
  }
  if (ratio >= 0.7) {
    return { ratio, percentOfAsk, tone: 'serious', label: 'Fair' };
  }
  if (ratio >= 0.5) {
    return { ratio, percentOfAsk, tone: 'cheeky', label: 'Low' };
  }
  return { ratio, percentOfAsk, tone: 'lowball', label: 'Very low' };
}

/** Floor for the offer slider: 30% of ask, at least £1. */
export function haggleFloorCents(askingCents: number): number {
  return Math.max(100, Math.round(askingCents * 0.3));
}

/** Starting bid in the “fair” band. */
export function haggleDefaultCents(askingCents: number): number {
  return Math.round(askingCents * 0.72);
}
