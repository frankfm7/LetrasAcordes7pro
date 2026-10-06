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
  sections: SongSection[];
  lyrics: string;
  notes: string;
  lyricsByLanguage?: Record<string, string>;
  optionalKey1?: string;
  optionalKey2?: string;
}

export interface SongSection {
  type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'pre-chorus';
  label: string;
  lines: string[];
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

export interface Setlist {
  id: string;
  name: string;
  songs: SetlistSong[];
  createdAt: string;
  updatedAt: string;
  notes: string;
}

export interface OrderItem {
  id: string;
  title: string;
  songId?: string;
  key?: string;
  duration?: string;
}

export interface Order {
  id: string;
  name: string;
  type: string;
  date: string;
  items: OrderItem[];
}

export interface SetlistSong {
  songId: string;
  transposition: number;
  notes: string;
  order: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  fontSize: number;
  showChords: boolean;
  capo: number;
}

export interface AppState {
  favorites: string[];
  setlists: Setlist[];
  orders: Order[];
  preferences: UserPreferences;
  personalNotes: Record<string, string>;
  customHymnals: Hymnal[];
  customSongs: Song[];
}
