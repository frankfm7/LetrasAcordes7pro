export interface Song {
  id: string;
  title: string;
  artist: string;
  code: string;
  number?: number;
  hymnalId: string;
  key: string;
  timeSignature: string;
  bpm: number;
  language: string;
  categories: string[];
  sections: any[];
  lyrics: string;
  lyricsByLanguage?: Record<string, string>;
  notes: string;
  optionalKey1?: string;
  optionalKey2?: string;
}

export interface Hymnal {
  id: string;
  name: string;
  description: string;
  language: string;
  icon: string;
  color: string;
  isCustom: boolean;
  image?: string;
  codePrefix?: string;
}

export interface AppState {
  favorites: string[];
  customSongs: Song[];
  customHymnals: Hymnal[];
  preferences: {
    theme: 'light' | 'dark';
    fontSize: number;
    showChords: boolean;
    capo: number;
  };
}
