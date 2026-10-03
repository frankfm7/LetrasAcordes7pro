export function transposeLyrics(lyrics: string, semitones: number): string {
  if (semitones === 0) return lyrics;
  
  const lines = lyrics.split('\n');
  return lines.map(line => {
    if (line.trim().startsWith('//')) {
      return line.replace(/([A-G][#b]?)(\w*)/g, (match, note, suffix) => {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const index = notes.indexOf(note);
        if (index === -1) return match;
        const newIndex = (index + semitones + 12) % 12;
        return notes[newIndex] + suffix;
      });
    }
    return line;
  }).join('\n');
}

export function transposeChord(chord: string, semitones: number): string {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;
  
  const [, root, suffix] = match;
  const index = notes.indexOf(root);
  if (index === -1) return chord;
  
  const newIndex = (index + semitones + 12) % 12;
  return notes[newIndex] + suffix;
}
