import { Song } from '../types';

export function generateSongShareText(song: Song): string {
  let text = '';
  text += `${song.title}\n`;
  if (song.artist && song.artist !== 'Desconocido') {
    text += `${song.artist}\n`;
  }
  text += `\n`;
  text += `Tonalidad: ${song.key}\n`;
  text += `Compás: ${song.timeSignature}\n`;
  text += `BPM: ${song.bpm}\n`;
  if (song.notes && song.notes.trim()) {
    text += `\nNotas: ${song.notes}\n`;
  }
  text += `\n`;
  if (song.lyricsByLanguage && Object.keys(song.lyricsByLanguage).length > 1) {
    const languages = Object.keys(song.lyricsByLanguage);
    languages.forEach((lang, index) => {
      if (index > 0) text += `\n${'='.repeat(40)}\n\n`;
      text += `[${lang}]\n\n`;
      text += song.lyricsByLanguage![lang];
      text += `\n`;
    });
  } else {
    text += song.lyrics;
    text += `\n`;
  }
  return text.trim();
}

export function generateMultipleSongsShareText(songs: Song[]): string {
  if (songs.length === 1) return generateSongShareText(songs[0]);
  let text = '';
  songs.forEach((song, index) => {
    if (index > 0) text += `\n\n${'='.repeat(50)}\n\n`;
    text += generateSongShareText(song);
  });
  return text;
}
