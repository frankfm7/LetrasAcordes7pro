export function transposeLyrics(lyrics: string, semitones: number): string {
  if (semitones === 0) return lyrics;
  const lines = lyrics.split('\n');
  return lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//')) {
      const chordPart = trimmed.substring(2);
      const transposed = chordPart.replace(/([A-G][#b]?\w*)/g, (chord) => transposeChord(chord, semitones));
      return '//' + transposed;
    }
    return line;
  }).join('\n');
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_MAP: Record<string, string> = {
  'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#',
  'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B'
};

function normalizeNote(note: string): string {
  return FLAT_MAP[note] || note;
}

function transposeNote(note: string, semitones: number): string {
  const normalized = normalizeNote(note);
  const index = NOTES.indexOf(normalized);
  if (index === -1) return note;
  const newIndex = ((index + semitones) % 12 + 12) % 12;
  return NOTES[newIndex];
}

export function transposeChord(chord: string, semitones: number): string {
  if (semitones === 0) return chord;
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;
  return transposeNote(match[1], semitones) + match[2];
}
