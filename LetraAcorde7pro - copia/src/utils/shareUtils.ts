--- src/utils/shareUtils.ts (原始)


+++ src/utils/shareUtils.ts (修改后)
import { Song } from '../types';

/**
 * Genera el texto completo de una canción para compartir
 * Incluye: título, artista, tonalidad, notas, letra con acordes y todos los idiomas
 */
export function generateSongShareText(song: Song): string {
  let text = '';

  // Encabezado
  text += `${song.title}\n`;
  if (song.artist && song.artist !== 'Desconocido') {
    text += `${song.artist}\n`;
  }
  text += `\n`;

  // Información musical
  text += `Tonalidad: ${song.key}\n`;
  text += `Compás: ${song.timeSignature}\n`;
  text += `BPM: ${song.bpm}\n`;

  // Notas si existen
  if (song.notes && song.notes.trim()) {
    text += `\nNotas: ${song.notes}\n`;
  }

  text += `\n`;

  // Si tiene múltiples idiomas, mostrar todos
  if (song.lyricsByLanguage && Object.keys(song.lyricsByLanguage).length > 1) {
    const languages = Object.keys(song.lyricsByLanguage);
    languages.forEach((lang, index) => {
      if (index > 0) {
        text += `\n${'='.repeat(40)}\n\n`;
      }
      text += `[${lang}]\n\n`;
      text += song.lyricsByLanguage![lang];
      text += `\n`;
    });
  } else {
    // Si solo tiene un idioma o no tiene lyricsByLanguage, usar lyrics normal
    text += song.lyrics;
    text += `\n`;
  }

  return text.trim();
}

/**
 * Genera el texto de múltiples canciones para compartir
 */
export function generateMultipleSongsShareText(songs: Song[]): string {
  if (songs.length === 1) {
    return generateSongShareText(songs[0]);
  }

  let text = '';
  songs.forEach((song, index) => {
    if (index > 0) {
      text += `\n\n${'='.repeat(50)}\n\n`;
    }
    text += generateSongShareText(song);
  });

  return text;
}
