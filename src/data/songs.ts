import { Hymnal, Song } from '../types';

export const hymnals: Hymnal[] = [
  {
    id: 'mis-canciones',
    name: 'Mis Canciones',
    description: 'Creaciones personales',
    language: 'Castellano',
    icon: '📖🔥',
    color: '#f97316',
    isCustom: true,
    codePrefix: 'M',
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&q=80',
  },
];

export const songs: Song[] = [
  {
    id: 'm1',
    title: 'Renuévame',
    artist: 'Marcos Witt',
    code: 'M1',
    number: 1,
    hymnalId: 'mis-canciones',
    key: 'D',
    timeSignature: '4/4',
    bpm: 68,
    language: 'Castellano',
    categories: ['Adoración', 'Consagración'],
    sections: [],
    lyrics: `VERSO 1
//D                A
Renuévame, Señor Jesús
//Bm             F#m
Ya no quiero ser igual
//G              A
Renuévame, Señor Jesús
//D              A
Pon en mí tu corazón

CORO
//G              D
Porque todo lo que hay dentro de mí
//A              Bm
necesita ser cambiado, Señor
//G              D
Porque todo lo que hay dentro de mí
//A              D
necesita más de Ti`,
    notes: 'Canción de adoración y consagración',
  },
  {
    id: 'm2',
    title: 'Jach\'a Apu Dios / Gran Dios Padre',
    artist: 'Himnario Cala',
    code: 'M2',
    number: 2,
    hymnalId: 'mis-canciones',
    key: 'Am',
    timeSignature: '4/4',
    bpm: 80,
    language: 'Aymara/Castellano',
    categories: ['Himno', 'Adoración'],
    sections: [],
    lyrics: `VERSO 1
//Am             Em
Jach'a Apu Dios, jiwasan Tatana
//Am             Em
Jach'a Apu Dios, jiwasan Mamana

CORO
//F              Am
Jilïri Apunakana
//F              Am
Wali ch'ama Apunakana`,
    lyricsByLanguage: {
      'Aymara': `VERSO 1
//Am             Em
Jach'a Apu Dios, jiwasan Tatana
//Am             Em
Jach'a Apu Dios, jiwasan Mamana

CORO
//F              Am
Jilïri Apunakana
//F              Am
Wali ch'ama Apunakana`,
      'Castellano': `VERSO 1
//Am             Em
Gran Dios Padre, nuestro Creador
//Am             Em
Gran Dios Padre, nuestra Madre

CORO
//F              Am
Príncipe de los dioses
//F              Am
Muy poderoso dios`,
    },
    notes: 'Canción bilingüe Aymara/Castellano',
  },
];

export function generateSongCode(hymnal: Hymnal, number: number): string {
  const prefix = hymnal.codePrefix || hymnal.id.charAt(0).toUpperCase();
  return `${prefix}${number}`;
}

export function extractNumberFromCode(code: string): number {
  const match = code.match(/\d+$/);
  return match ? parseInt(match[0], 10) : 0;
}

export function getNextSongNumber(hymnalId: string, songsList: Song[]): number {
  const hymnalSongs = songsList.filter(s => s.hymnalId === hymnalId);
  if (hymnalSongs.length === 0) return 1;
  const numbers = hymnalSongs
    .map(s => s.number || extractNumberFromCode(s.code))
    .filter(n => !isNaN(n));
  if (numbers.length === 0) return 1;
  return Math.max(...numbers) + 1;
}
