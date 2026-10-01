export function transposeLyrics(lyrics: string, semitones: number): string {
  if (semitones === 0) return lyrics;
  const lines = lyrics.split('\n');
  return lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//')) {
      const chordPart = trimmed.substring(2);
      const transposed = transposeChordLine(chordPart, semitones);
      return '//' + transposed;
    }
    return line;
  }).join('\n');
}

function transposeChordLine(chordLine: string, semitones: number): string {
  return chordLine.replace(/([A-G][#b]?\w*)/g, (chord) => {
    return transposeChord(chord, semitones);
  });
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_MAP: Record<string, string> = {
  'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#',
  'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B'
};

function normalizeNote(note: string): string {
  return FLAT_MAP[note] || note;
}

function getNoteIndex(note: string): number {
  const normalized = normalizeNote(note);
  return NOTES.indexOf(normalized);
}

function transposeNote(note: string, semitones: number): string {
  const index = getNoteIndex(note);
  if (index === -1) return note;
  const newIndex = ((index + semitones) % 12 + 12) % 12;
  return NOTES[newIndex];
}

export function transposeChord(chord: string, semitones: number): string {
  if (semitones === 0) return chord;
  const chordRegex = /^([A-G][#b]?)(.*)$/;
  const match = chord.match(chordRegex);
  if (!match) return chord;
  const [, root, rest] = match;
  return transposeNote(root, semitones) + rest;
}
