import { Hymnal, Song } from '../types';

export function generateSongCode(hymnal: Hymnal, number: number): string {
  const prefix = hymnal.codePrefix || hymnal.id.charAt(0).toUpperCase();
  return `${prefix}${number}`;
}

export function extractNumberFromCode(code: string): number {
  const match = code.match(/\d+$/);
  return match ? parseInt(match[0], 10) : 0;
}

export function getNextSongNumber(hymnalId: string, songs: Song[]): number {
  const hymnalSongs = songs.filter(s => s.hymnalId === hymnalId);
  if (hymnalSongs.length === 0) return 1;

  const numbers = hymnalSongs
    .map(s => s.number || extractNumberFromCode(s.code))
    .filter(n => !isNaN(n));

  if (numbers.length === 0) return 1;
  return Math.max(...numbers) + 1;
}
