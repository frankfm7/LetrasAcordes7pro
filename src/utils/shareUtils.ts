import { Song } from '../types';

export function generateSongShareText(song: Song): string {
  let text = `# ${song.title}\n\n`;
  text += `**Artista:** ${song.artist}\n`;
  text += `**Tonalidad:** ${song.key}\n`;
  text += `**Compás:** ${song.timeSignature}\n`;
  text += `**BPM:** ${song.bpm}\n\n`;
  
  if (song.lyricsByLanguage && Object.keys(song.lyricsByLanguage).length > 0) {
    text += `## Letra en ${Object.keys(song.lyricsByLanguage)[0]}\n\n`;
    text += song.lyricsByLanguage[Object.keys(song.lyricsByLanguage)[0]];
  } else {
    text += song.lyrics;
  }
  
  if (song.notes) {
    text += `\n\n**Notas:** ${song.notes}`;
  }
  
  return text;
}
