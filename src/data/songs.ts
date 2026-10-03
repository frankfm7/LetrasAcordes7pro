import { Hymnal, Song } from '../types';

export const hymnals: Hymnal[] = [
  {
    id: 'mis-canciones',
    name: 'Mis Canciones',
    description: 'Creaciones personales',
    language: 'Castellano',
    icon: '✍️',
    color: '#f97316',
    isCustom: true,
    codePrefix: 'M',
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
  {
    id: 'm3',
    title: 'Grande es el Señor',
    artist: 'Marcos Witt',
    code: 'M3',
    number: 3,
    hymnalId: 'mis-canciones',
    key: 'G',
    timeSignature: '4/4',
    bpm: 72,
    language: 'Castellano',
    categories: ['Adoración'],
    sections: [],
    lyrics: `VERSO 1
//G            Em          C          D
Grande es el Señor y digno de loar
//G            Em          C          D
más grande que todo lo que Él ha creado

CORO
//C          D         Em         G
Grande es el Señor y digno de loar
//C          D         Em         C
más grande que todo lo que Él ha creado`,
    notes: '',
  },
  {
    id: 'm4',
    title: 'Al que está sentado en el trono',
    artist: 'Marcos Witt',
    code: 'M4',
    number: 4,
    hymnalId: 'mis-canciones',
    key: 'A',
    timeSignature: '4/4',
    bpm: 120,
    language: 'Castellano',
    categories: ['Alabanza', 'Adoración'],
    sections: [],
    lyrics: `VERSO 1
//A                    E
Al que está sentado en el trono
//F#m              E
y al Cordero, sea la alabanza

CORO
//A        E        F#m
Santo,   santo,   santo
//D              E            A
es el Señor Dios todo poderoso`,
    notes: '',
  },
  {
    id: 'm5',
    title: 'Te exaltamos',
    artist: 'Marcos Witt',
    code: 'M5',
    number: 5,
    hymnalId: 'mis-canciones',
    key: 'E',
    timeSignature: '4/4',
    bpm: 130,
    language: 'Castellano',
    categories: ['Alabanza'],
    sections: [],
    lyrics: `VERSO 1
//E              B
Te exaltamos, te exaltamos
//C#m            A
Te exaltamos, Señor

CORO
//E              B
Porque tú eres grande
//C#m            A
Y porque tú eres santo`,
    notes: '',
  },
  {
    id: 'm6',
    title: 'En los lugares secretos',
    artist: 'Marcos Witt',
    code: 'M6',
    number: 6,
    hymnalId: 'mis-canciones',
    key: 'D',
    timeSignature: '4/4',
    bpm: 66,
    language: 'Castellano',
    categories: ['Adoración', 'Intimidad'],
    sections: [],
    lyrics: `VERSO 1
//D              A
En los lugares secretos
//Bm             G
Yo me encuentro contigo

CORO
//G              D
Y yo te busco, Señor
//A              Bm
Y yo te busco, Señor`,
    notes: '',
  },
  {
    id: 'm7',
    title: 'Castillo Fuerte es Nuestro Dios',
    artist: 'Martín Lutero',
    code: 'M7',
    number: 7,
    hymnalId: 'mis-canciones',
    key: 'C',
    timeSignature: '4/4',
    bpm: 100,
    language: 'Castellano',
    categories: ['Himno', 'Batalla espiritual'],
    sections: [],
    lyrics: `VERSO 1
//C          G          C          F
Castillo fuerte es nuestro Dios
//C          G          C
baluarte y espada

CORO
//F              C          G
Y nuestro príncipe eterno
//F              C
que es Cristo el Señor`,
    notes: '',
  },
  {
    id: 'm8',
    title: 'Sublime Gracia',
    artist: 'John Newton',
    code: 'M8',
    number: 8,
    hymnalId: 'mis-canciones',
    key: 'G',
    timeSignature: '3/4',
    bpm: 80,
    language: 'Castellano',
    categories: ['Himno', 'Gracia'],
    sections: [],
    lyrics: `VERSO 1
//G          G7         C
Sublime gracia del Señor
//G          Em         B7
que a un infeliz salvó

VERSO 2
//G          G7         C
Su gracia me enseñó a temer
//G          Em         B7
mis ojos la pudieron ver`,
    notes: '',
  },
  {
    id: 'm9',
    title: 'Cuán Grande es Él',
    artist: 'Carl Boberg',
    code: 'M9',
    number: 9,
    hymnalId: 'mis-canciones',
    key: 'D',
    timeSignature: '3/4',
    bpm: 76,
    language: 'Castellano',
    categories: ['Himno', 'Adoración'],
    sections: [],
    lyrics: `VERSO 1
//D              G          D          A
Señor mi Dios, al contemplar los cielos
//D              G          D
el firmamento y las estrellas mil

CORO
//G              D          A          D
Cantando entonces yo me gloriaré
//G              D          A          D
Cuán grande es Él, cuán grande es Él`,
    notes: '',
  },
  {
    id: 'm10',
    title: 'Mi Esperanza es el Señor',
    artist: 'Himnario Bautista',
    code: 'M10',
    number: 10,
    hymnalId: 'mis-canciones',
    key: 'F',
    timeSignature: '3/4',
    bpm: 72,
    language: 'Castellano',
    categories: ['Himno', 'Esperanza'],
    sections: [],
    lyrics: `VERSO 1
//F              C
Mi esperanza es el Señor
//F              C
mi roca y mi salvación

CORO
//Bb             F
Mi esperanza es Él
//C              F
mi esperanza es Él`,
    notes: '',
  },
  {
    id: 'm11',
    title: 'Diosaruxa Aruskipañani / Hablemos de Dios',
    artist: 'Himnario Cala',
    code: 'M11',
    number: 11,
    hymnalId: 'mis-canciones',
    key: 'G',
    timeSignature: '4/4',
    bpm: 90,
    language: 'Aymara',
    categories: ['Himno', 'Testimonio'],
    sections: [],
    lyrics: `VERSO 1
//G
Diosaruxa aruskipañani
//Em
Diosaruxa aruskipañani

CORO
//G              Em
Diosan munapaja
//C              D
Diosan munapaja`,
    notes: '',
  },
  {
    id: 'm12',
    title: 'Taytanchis Dios / Nuestro Padre Dios',
    artist: 'Himnario Quechua',
    code: 'M12',
    number: 12,
    hymnalId: 'mis-canciones',
    key: 'D',
    timeSignature: '4/4',
    bpm: 84,
    language: 'Quechua',
    categories: ['Himno', 'Adoración'],
    sections: [],
    lyrics: `VERSO 1
//D              A          Bm         F#m
Taytanchis Dios, ñuqanchis Tayta
//G              D          A          D
Taytanchis Dios, ñuqanchis Mama

CORO
//G              D
Hatun Diosninchis
//A              Bm
Hatun Diosninchis`,
    notes: '',
  },
  {
    id: 'm13',
    title: 'Yayayku Dios / Padre Dios',
    artist: 'Himnario Quechua',
    code: 'M13',
    number: 13,
    hymnalId: 'mis-canciones',
    key: 'G',
    timeSignature: '3/4',
    bpm: 76,
    language: 'Quechua',
    categories: ['Himno', 'Adoración'],
    sections: [],
    lyrics: `VERSO 1
//G              D          Em         C
Yayayku Dios, sumaq Diosnillay
//G              D          Em         C
Yayayku Dios, sumaq Diosnillay

CORO
//C              G
Alabayku Dios
//D              Em
Graciayku Dios`,
    notes: '',
  },
  {
    id: 'm14',
    title: 'Tu Fidelidad',
    artist: 'Personal',
    code: 'M14',
    number: 14,
    hymnalId: 'mis-canciones',
    key: 'C',
    timeSignature: '4/4',
    bpm: 70,
    language: 'Castellano',
    categories: ['Adoración', 'Fidelidad'],
    sections: [],
    lyrics: `VERSO 1
//C              Am
Tu fidelidad, Señor
//F              C
es grande y eterna

CORO
//C              Am
Grande es tu fidelidad
//F              C
Grande es tu fidelidad`,
    notes: '',
  },
];
