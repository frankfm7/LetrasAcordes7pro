import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppProvider, useApp } from '../context/AppContext';
import { NotificationProvider, useNotification } from './NotificationProvider';
import { Song, Hymnal, Order, OrderItem } from '../types';
import { songs as allSongs, hymnals, generateSongCode, getNextSongNumber } from '../data/songs';
import { transposeLyrics } from '../utils/chords';
import { generateSongShareText } from '../utils/shareUtils';
import { Moon, Sun, Menu, X, Home, Search, Star, ListMusic, Music, Settings, Download, Upload, Plus, Heart, ChevronLeft, ChevronRight, ChevronDown, Copy, Share2, Edit3, Trash2, RotateCcw, Play, Pause, MoreVertical, Filter, CheckSquare, Square, ArrowRight, Image, Camera, Save } from 'lucide-react';
import SplashScreen from './SplashScreen';
import Metronome from './Metronome';
import Tuner from './Tuner';
import SongEditor from './SongEditor';
import AddHymnalModal from './AddHymnalModal';
import EditHymnalModal from './EditHymnalModal';
import ExportModal from './ExportModal';
import ToolsMenu from './ToolsMenu';
import ExportOptions from './ExportOptions';
import ImportModal from './ImportModal';
import ProfilePage from './ProfilePage';
import SongSelectorModal from './SongSelectorModal';
import MultiSongSelector from './MultiSongSelector';
import HymnalSelector from './HymnalSelector';

export default function App() {
  return (
    <NotificationProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </NotificationProvider>
  );
}

function AppContent() {
  const { state, setTheme, updateCustomHymnal, removeCustomHymnal, removeCustomSong } = useApp();
  const { showNotification } = useNotification();
  const [showSplash, setShowSplash] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedHymnal, setSelectedHymnal] = useState<Hymnal | null>(null);

  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [showEditHymnalModal, setShowEditHymnalModal] = useState(false);
  const [editingHymnal, setEditingHymnal] = useState<Hymnal | null>(null);
  const [showAddHymnalModal, setShowAddHymnalModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [addingSongToHymnal, setAddingSongToHymnal] = useState<Hymnal | null>(null);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [showSongSelector, setShowSongSelector] = useState(false);
  const [showMultiSongSelector, setShowMultiSongSelector] = useState(false);
  const [showHymnalSelector, setShowHymnalSelector] = useState(false);

  useEffect(() => {
    document.documentElement.className = state.preferences.theme;
  }, [state.preferences.theme]);

  const handleSelectSong = useCallback((song: Song) => setSelectedSong(song), []);
  const handleSelectHymnal = useCallback((hymnal: Hymnal) => setSelectedHymnal(hymnal), []);
  const handleBack = useCallback(() => {
    if (selectedSong) setSelectedSong(null);
    else if (selectedHymnal) setSelectedHymnal(null);
    else setCurrentPage('home');
  }, [selectedSong, selectedHymnal]);

  const handleNavigate = useCallback((page: string) => {
    setCurrentPage(page);
    setSelectedSong(null);
    setSelectedHymnal(null);
    setEditingSong(null);
  }, []);

  const handleExport = useCallback(() => {
    try {
      const data = JSON.stringify(state, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cancionero7pro-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification('Respaldo exportado', 'success');
    } catch {
      showNotification('Error al exportar', 'error');
    }
  }, [state, showNotification]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.favorites && data.setlists) {
            localStorage.setItem('cancionero-ruah-state', JSON.stringify(data));
            showNotification('Respaldo restaurado', 'success');
            window.location.reload();
          } else showNotification('Archivo inválido', 'error');
        } catch {
          showNotification('Error al importar', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [showNotification]);

  const handleDeleteHymnal = useCallback((id: string) => {
    // Eliminar las canciones asociadas al cancionero
    const songsToRemove = state.customSongs.filter(s => s.hymnalId === id);
    songsToRemove.forEach(song => {
      removeCustomSong(song.id);
    });
    // Eliminar el cancionero
    removeCustomHymnal(id);
  }, [removeCustomHymnal, removeCustomSong, state.customSongs]);

  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />;

  if (showToolsMenu) {
    return (
      <Layout currentPage={currentPage} onNavigate={handleNavigate} onImport={handleImport} onExport={handleExport} onToolsClick={() => setShowToolsMenu(true)}>
        <ToolsMenu 
          onClose={() => setShowToolsMenu(false)} 
          onNavigate={handleNavigate}
          onExportClick={() => {
            setShowToolsMenu(false);
            setShowExportOptions(true);
          }}
          onImportClick={() => {
            setShowToolsMenu(false);
            setShowImportModal(true);
          }}
          onProfileClick={() => {
            setShowToolsMenu(false);
            setShowProfilePage(true);
          }}
        />
      </Layout>
    );
  }

  if (showProfilePage) {
    return (
      <Layout currentPage={currentPage} onNavigate={handleNavigate} onImport={handleImport} onExport={handleExport} onToolsClick={() => setShowToolsMenu(true)}>
        <ProfilePage onBack={() => setShowProfilePage(false)} />
      </Layout>
    );
  }

  if (showExportOptions) {
    const allHymnals = [...hymnals, ...state.customHymnals];
    const allAvailableSongs = [...allSongs, ...state.customSongs];
    
    return (
      <Layout currentPage={currentPage} onNavigate={handleNavigate} onImport={handleImport} onExport={handleExport} onToolsClick={() => setShowToolsMenu(true)}>
        <ExportOptions
          onClose={() => setShowExportOptions(false)}
          songs={allAvailableSongs}
          hymnals={allHymnals}
          onExportSingle={() => {
            setShowExportOptions(false);
            setShowSongSelector(true);
          }}
          onExportMultiple={() => {
            setShowExportOptions(false);
            setShowMultiSongSelector(true);
          }}
          onExportHymnal={() => {
            setShowExportOptions(false);
            setShowHymnalSelector(true);
          }}
        />
      </Layout>
    );
  }

  if (showSongSelector) {
    const allAvailableSongs = [...allSongs, ...state.customSongs];
    return (
      <Layout currentPage={currentPage} onNavigate={handleNavigate} onImport={handleImport} onExport={handleExport} onToolsClick={() => setShowToolsMenu(true)}>
        <SongSelectorModal
          songs={allAvailableSongs}
          onClose={() => setShowSongSelector(false)}
        />
      </Layout>
    );
  }

  if (showMultiSongSelector) {
    const allAvailableSongs = [...allSongs, ...state.customSongs];
    return (
      <Layout currentPage={currentPage} onNavigate={handleNavigate} onImport={handleImport} onExport={handleExport} onToolsClick={() => setShowToolsMenu(true)}>
        <MultiSongSelector
          songs={allAvailableSongs}
          onClose={() => setShowMultiSongSelector(false)}
        />
      </Layout>
    );
  }

  if (showHymnalSelector) {
    const allHymnals = [...hymnals, ...state.customHymnals];
    const allAvailableSongs = [...allSongs, ...state.customSongs];
    return (
      <Layout currentPage={currentPage} onNavigate={handleNavigate} onImport={handleImport} onExport={handleExport} onToolsClick={() => setShowToolsMenu(true)}>
        <HymnalSelector
          hymnals={allHymnals}
          songs={allAvailableSongs}
          onClose={() => setShowHymnalSelector(false)}
        />
      </Layout>
    );
  }

  if (showImportModal) {
    const allHymnals = [...hymnals, ...state.customHymnals];
    
    return (
      <Layout currentPage={currentPage} onNavigate={handleNavigate} onImport={handleImport} onExport={handleExport} onToolsClick={() => setShowToolsMenu(true)}>
        <ImportModal
          onClose={() => setShowImportModal(false)}
          hymnals={allHymnals}
        />
      </Layout>
    );
  }

  if (editingSong) {
    return (
      <Layout currentPage={currentPage} onNavigate={handleNavigate} onImport={handleImport} onExport={handleExport} onToolsClick={() => setShowToolsMenu(true)}>
        <SongEditor song={editingSong} onBack={() => setEditingSong(null)} />
      </Layout>
    );
  }

  if (selectedSong) {
    return (
      <Layout currentPage={currentPage} onNavigate={handleNavigate} onImport={handleImport} onExport={handleExport} onToolsClick={() => setShowToolsMenu(true)}>
        <SongView song={selectedSong} onBack={handleBack} onEdit={() => setEditingSong(selectedSong)} showNotification={showNotification} />
      </Layout>
    );
  }

  if (addingSongToHymnal) {
    const nextNumber = getNextSongNumber(addingSongToHymnal.id, [...allSongs, ...state.customSongs]);
    const code = generateSongCode(addingSongToHymnal, nextNumber);
    const newSong: Song = {
      id: `new-${Date.now()}`,
      title: '',
      artist: '',
      code,
      number: nextNumber,
      hymnalId: addingSongToHymnal.id,
      key: 'C',
      timeSignature: '4/4',
      bpm: 120,
      language: addingSongToHymnal.language.split('/')[0],
      categories: [],
      sections: [],
      lyrics: '',
      notes: '',
    };
    return (
      <Layout currentPage={currentPage} onNavigate={handleNavigate} onImport={handleImport} onExport={handleExport} onToolsClick={() => setShowToolsMenu(true)}>
        <SongEditor song={newSong} onBack={() => setAddingSongToHymnal(null)} />
      </Layout>
    );
  }

  if (selectedHymnal) {
    return (
      <Layout currentPage={currentPage} onNavigate={handleNavigate} onImport={handleImport} onExport={handleExport} onToolsClick={() => setShowToolsMenu(true)}>
        <HymnalView hymnal={selectedHymnal} onSelectSong={handleSelectSong} onBack={handleBack} onEditHymnal={(h: Hymnal) => { setEditingHymnal(h); setShowEditHymnalModal(true); }} onAddSong={(h: Hymnal) => setAddingSongToHymnal(h)} onDeleteHymnal={handleDeleteHymnal} showNotification={showNotification} />
        {showEditHymnalModal && editingHymnal && (
          <EditHymnalModal hymnal={editingHymnal} onClose={() => { setShowEditHymnalModal(false); setEditingHymnal(null); }} onSave={(h) => { updateCustomHymnal(h); setSelectedHymnal(h); setShowEditHymnalModal(false); setEditingHymnal(null); showNotification('Cancionero actualizado', 'success'); }} />
        )}
      </Layout>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage onSelectSong={handleSelectSong} onSelectHymnal={handleSelectHymnal} onSearch={() => handleNavigate('search')} onAddHymnal={() => setShowAddHymnalModal(true)} />;
      case 'search': return <SearchPage onSelectSong={handleSelectSong} />;
      case 'favorites': return <FavoritesPage onSelectSong={handleSelectSong} />;
      case 'setlists': return <SetlistsPage onSelectSong={handleSelectSong} showNotification={showNotification} />;
      case 'orders': return <OrdersPage onSelectSong={handleSelectSong} showNotification={showNotification} />;
      case 'tools': return <ToolsPage />;
      default: return <HomePage onSelectSong={handleSelectSong} onSelectHymnal={handleSelectHymnal} onSearch={() => handleNavigate('search')} onAddHymnal={() => setShowAddHymnalModal(true)} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate} onImport={handleImport} onExport={handleExport} onToolsClick={() => setShowToolsMenu(true)}>
      {renderPage()}
      {showEditHymnalModal && editingHymnal && (
        <EditHymnalModal hymnal={editingHymnal} onClose={() => { setShowEditHymnalModal(false); setEditingHymnal(null); }} onSave={(h) => { updateCustomHymnal(h); setShowEditHymnalModal(false); setEditingHymnal(null); showNotification('Cancionero actualizado', 'success'); }} />
      )}
      {showAddHymnalModal && (
        <AddHymnalModal onClose={() => setShowAddHymnalModal(false)} />
      )}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowExportModal(false)}>
          <div className="w-full max-w-sm rounded-2xl p-5 space-y-4" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg">Exportar Respaldo</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Se exportarán todas tus canciones, favoritos y listas.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowExportModal(false)} className="flex-1 py-2.5 rounded-xl text-xs font-bold" style={{ backgroundColor: 'var(--bg-tertiary)' }}>Cancelar</button>
              <button onClick={() => { handleExport(); setShowExportModal(false); }} className="flex-1 py-2.5 rounded-xl text-xs font-bold" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>Exportar</button>
            </div>
          </div>
        </div>
      )}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowImportModal(false)}>
          <div className="w-full max-w-sm rounded-2xl p-5 space-y-4" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg">Importar Respaldo</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>⚠️ Esto reemplazará todos tus datos actuales.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowImportModal(false)} className="flex-1 py-2.5 rounded-xl text-xs font-bold" style={{ backgroundColor: 'var(--bg-tertiary)' }}>Cancelar</button>
              <button onClick={() => { handleImport(); setShowImportModal(false); }} className="flex-1 py-2.5 rounded-xl text-xs font-bold" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>Importar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function Layout({ children, currentPage, onNavigate, onImport, onExport, onToolsClick }: any) {
  const { state, setTheme } = useApp();
  const menuItems = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'search', label: 'Buscar', icon: Search },
    { id: 'favorites', label: 'Favoritos', icon: Star },
    { id: 'setlists', label: 'Listas', icon: ListMusic },
    { id: 'orders', label: 'Órdenes', icon: Music },
    { id: 'tools', label: 'Tools', icon: Settings },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <header className="sticky top-0 z-30 backdrop-blur-xl border-b" style={{ backgroundColor: 'color-mix(in srgb, var(--bg-primary) 85%, transparent)', borderColor: 'var(--border-color)' }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>C7</div>
            <div><h1 className="text-sm sm:text-lg font-bold leading-tight" style={{ color: 'var(--accent)' }}>Cancionero<span className="font-black">7Pro</span></h1></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onNavigate('search')} className="p-2.5 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}><Search size={18} /></button>
            <button onClick={() => setTheme(state.preferences.theme === 'dark' ? 'light' : 'dark')} className="p-2.5 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>{state.preferences.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6 h-[calc(100vh-4rem-4rem)] overflow-y-auto">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t backdrop-blur-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--bg-primary) 90%, transparent)', borderColor: 'var(--border-color)' }}>
        <div className="max-w-6xl mx-auto flex">
          {[{ id: 'home', label: 'Inicio', icon: Home }, { id: 'search', label: 'Buscar', icon: Search }, { id: 'favorites', label: 'Favoritos', icon: Heart }, { id: 'setlists', label: 'Listas', icon: ListMusic }, { id: 'orders', label: 'Órdenes', icon: Music }, { id: 'tools', label: 'Tools', icon: Settings }].map(item => {
            const isActive = currentPage === item.id;
            return (<button key={item.id} onClick={() => item.id === 'tools' ? onToolsClick() : onNavigate(item.id)} className={`flex-1 flex flex-col items-center py-3 px-1 transition-all ${isActive ? 'scale-105' : 'opacity-60'}`} style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}><item.icon size={18} strokeWidth={isActive ? 2.5 : 1.5} /><span className="text-[9px] font-semibold mt-1">{item.label}</span>{isActive && <div className="absolute top-0 w-8 h-0.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />}</button>);
          })}
        </div>
      </nav>
    </div>
  );
}

function HomePage({ onSelectSong, onSelectHymnal, onSearch, onAddHymnal }: any) {
  const { state } = useApp();
  const allAvailableSongs = useMemo(() => [...allSongs, ...state.customSongs], [state.customSongs]);
  
  // Combinar cancioneros predeterminados con custom, evitando duplicados
  // Si un cancionero predeterminado fue editado, usar la versión custom
  const allHymnals = useMemo(() => {
    const customIds = new Set(state.customHymnals.map(h => h.id));
    const defaultNotEdited = hymnals.filter(h => !customIds.has(h.id));
    return [...defaultNotEdited, ...state.customHymnals];
  }, [state.customHymnals]);

  // Función para calcular el código dinámicamente basado en el prefijo del cancionero
  const getDisplayCode = (song: any) => {
    const hymnal = allHymnals.find(h => h.id === song.hymnalId);
    if (!hymnal) return song.code;
    const prefix = hymnal.codePrefix || hymnal.id.charAt(0).toUpperCase();
    const number = song.number || song.code.match(/(\d+)$/)?.[1] || '1';
    return `${prefix}${number}`;
  };

  return (
    <div className="space-y-6 pb-4">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><span>📚</span> Cancioneros</h2>
          <button onClick={onAddHymnal} className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 card-shadow-md hover:card-shadow-lg transition-all" style={{ backgroundColor: 'var(--accent)', color: 'white' }}><Plus size={14} /> Nuevo</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {allHymnals.map((hymnal) => {
            const hymnalSongs = allAvailableSongs.filter(s => s.hymnalId === hymnal.id);
            const backgroundStyle = hymnal.image
              ? { backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${hymnal.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: `linear-gradient(135deg, ${hymnal.color}, ${hymnal.color}cc)` };
            return (
              <div key={hymnal.id} className="relative group">
                <div className="rounded-2xl relative overflow-hidden p-3 sm:p-5 flex flex-col justify-between text-left transition-all hover-lift active:scale-[0.97] w-full cursor-pointer" style={{ aspectRatio: '3/4', ...backgroundStyle, boxShadow: `0 8px 24px ${hymnal.color}44, 0 2px 8px rgba(0,0,0,0.1)` }} onClick={() => onSelectHymnal(hymnal)}>
                  <div><div className="text-3xl sm:text-4xl mb-2 sm:mb-3 drop-shadow-lg">{hymnal.icon}</div><div className="text-white font-bold text-sm sm:text-xl leading-tight mb-1 sm:mb-2" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}>{hymnal.name}</div></div>
                  <div><div className="text-white/95 text-xs sm:text-base font-semibold" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.9)' }}>{hymnalSongs.length} canciones</div><div className="text-white/80 text-[10px] sm:text-xs" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}>{hymnal.language}</div></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function SongView({ song: initialSong, onBack, onEdit, showNotification }: any) {
  const { state, toggleFavorite, isFavorite, setFontSize, setShowChords, setCapo } = useApp();
  const [transposition, setTransposition] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(10);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [buttonOpacity, setButtonOpacity] = useState(40); // 0-100% de opacidad
  const [currentLanguage, setCurrentLanguage] = useState<string>(initialSong.language.split('/')[0]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<number | null>(null);
  const scrollPauseRef = useRef<boolean>(false);
  
  // Estados para las notas personales
  const [personalNotes, setPersonalNotes] = useState<{ note2: string; note3: string }>(() => {
    const saved = localStorage.getItem(`song-notes-${initialSong.id}`);
    if (!saved) return { note2: '', note3: '' };
    
    try {
      const parsed = JSON.parse(saved);
      // Validar que sean tonos musicales válidos
      const validNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
                          'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'];
      
      // Limpiar datos corruptos o traducidos
      const note2 = validNotes.includes(parsed.note2) ? parsed.note2 : '';
      const note3 = validNotes.includes(parsed.note3) ? parsed.note3 : '';
      
      // Si hay datos inválidos, limpiar el localStorage
      if (parsed.note2 !== note2 || parsed.note3 !== note3) {
        localStorage.setItem(`song-notes-${initialSong.id}`, JSON.stringify({ note2, note3 }));
      }
      
      return { note2, note3 };
    } catch {
      localStorage.removeItem(`song-notes-${initialSong.id}`);
      return { note2: '', note3: '' };
    }
  });
  const [editingNote, setEditingNote] = useState<'note2' | 'note3' | null>(null);
  const [showOriginalNote, setShowOriginalNote] = useState(false);

  // Cerrar menú de velocidad al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => setShowSpeedMenu(false);
    if (showSpeedMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showSpeedMenu]);

  const song = useMemo(() => {
    const customSong = state.customSongs.find(s => s.id === initialSong.id);
    return customSong || initialSong;
  }, [initialSong, state.customSongs]);
  const { preferences } = state;

  const transposedLyrics = useMemo(() => {
    let lyrics = song.lyricsByLanguage?.[currentLanguage] || song.lyrics;
    // Aplicar transposición primero, luego capo
    if (transposition !== 0) lyrics = transposeLyrics(lyrics, transposition);
    if (preferences.capo > 0) lyrics = transposeLyrics(lyrics, -preferences.capo);
    return lyrics;
  }, [song.lyrics, song.lyricsByLanguage, currentLanguage, transposition, preferences.capo]);

  const sections = useMemo(() => {
    const lines = transposedLyrics.split('\n');
    const sectionList: { id: string; label: string; type: string }[] = [];
    lines.forEach((line: string) => {
      const trimmed = line.trim();
      const sectionMatch = trimmed.match(/^(VERSO|CORO|PUENTE|INTRO|FINAL|PRE-CORO|PRE CORO|OUTRO|BRIDGE)\s*(\d*)/i);
      if (sectionMatch && !trimmed.includes('//')) {
        const type = sectionMatch[1].toUpperCase();
        const num = sectionMatch[2] || '';
        const id = `${type}${num}`.toLowerCase();
        const label = num ? `${type.charAt(0)}${num}` : type.charAt(0);
        sectionList.push({ id, label: label.toUpperCase(), type });
      }
    });
    return sectionList;
  }, [transposedLyrics]);

  // Función de conversión de velocidad a milisegundos
  const getSpeedMs = (velocidad: number): number => {
    if (velocidad <= 10) {
      // Del 1 al 10 valores fijos (ya funciona bien)
      const valores: Record<number, number> = {
        1: 120, 2: 100, 3: 85, 4: 70, 5: 60,
        6: 52, 7: 45, 8: 38, 9: 32, 10: 25
      };
      return valores[velocidad] || 25;
    }
    // Del 10 al 70 usar fórmula exponencial
    return Math.max(3, Math.round(25 * Math.pow(0.93, velocidad - 10)));
  };

  useEffect(() => {
    if (isAutoScrolling && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const ms = getSpeedMs(scrollSpeed);
      
      scrollIntervalRef.current = window.setInterval(() => { 
        if (!scrollPauseRef.current) {
          container.scrollTop += 1;
        }
      }, ms);
    } else { 
      if (scrollIntervalRef.current) { 
        clearInterval(scrollIntervalRef.current); 
        scrollIntervalRef.current = null; 
      } 
    }
    return () => { 
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [isAutoScrolling, scrollSpeed]);

  const scrollToSection = (sectionId: string) => {
    if (scrollContainerRef.current) {
      const element = scrollContainerRef.current.querySelector(`[data-section="${sectionId}"]`);
      if (element) {
        const container = scrollContainerRef.current;
        const containerRect = container.getBoundingClientRect();
        const elementRect = (element as HTMLElement).getBoundingClientRect();
        const relativeTop = elementRect.top - containerRect.top + container.scrollTop;
        
        // Pausar auto-scroll si está activo
        if (isAutoScrolling) {
          scrollPauseRef.current = true;
          container.scrollTo({ top: relativeTop - 80, behavior: 'smooth' });
          
          // Esperar 2 segundos y continuar
          setTimeout(() => {
            scrollPauseRef.current = false;
          }, 2000);
        } else {
          container.scrollTo({ top: relativeTop - 80, behavior: 'smooth' });
        }
      }
    }
  };

  // Función para guardar notas personales
  const savePersonalNote = (noteKey: 'note2' | 'note3', value: string) => {
    const updated = { ...personalNotes, [noteKey]: value };
    setPersonalNotes(updated);
    localStorage.setItem(`song-notes-${initialSong.id}`, JSON.stringify(updated));
    setEditingNote(null);
    showNotification('Nota guardada', 'success');
  };

  // Funciones de transposición
  const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  const getCurrentKey = () => {
    const baseKey = song.key.replace('m', ''); // Remover 'm' si es menor
    const baseIndex = NOTES.indexOf(baseKey);
    if (baseIndex === -1) return song.key;
    
    const newIndex = ((baseIndex + transposition) % 12 + 12) % 12;
    const newNote = NOTES[newIndex];
    return song.key.includes('m') ? newNote + 'm' : newNote;
  };

  const handleKeyChange = (targetKey: string) => {
    // Validar que el tono sea válido antes de guardar
    const validNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
                        'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'];
    if (!validNotes.includes(targetKey)) return;
    
    // Guardar el tono seleccionado en la nota personal correspondiente
    if (editingNote === 'note2') {
      const updated = { ...personalNotes, note2: targetKey };
      setPersonalNotes(updated);
      localStorage.setItem(`song-notes-${initialSong.id}`, JSON.stringify(updated));
    } else if (editingNote === 'note3') {
      const updated = { ...personalNotes, note3: targetKey };
      setPersonalNotes(updated);
      localStorage.setItem(`song-notes-${initialSong.id}`, JSON.stringify(updated));
    }
    
    // Calcular la transposición desde el tono original
    const baseKey = song.key.replace('m', '');
    const targetBase = targetKey.replace('m', '');
    const baseIndex = NOTES.indexOf(baseKey);
    const targetIndex = NOTES.indexOf(targetBase);
    
    if (baseIndex !== -1 && targetIndex !== -1) {
      const semitones = targetIndex - baseIndex;
      setTransposition(semitones);
    }
  };

  // Función helper para validar y formatear tonos
  const formatNote = (note: string): string => {
    const validNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
                        'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'];
    return validNotes.includes(note) ? note : '';
  };

  const renderLyrics = () => {
    const lines = transposedLyrics.split('\n');
    const elements: JSX.Element[] = [];
    let lineIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]; const trimmed = line.trim();
      if (trimmed === '') { elements.push(<div key={lineIndex++} className="h-4" />); continue; }
      const sectionMatch = trimmed.match(/^(VERSO|CORO|PUENTE|INTRO|FINAL|PRE-CORO|PRE CORO|OUTRO|BRIDGE)\s*(\d*)/i);
      if (sectionMatch && !trimmed.includes('//')) {
        const type = sectionMatch[1].toUpperCase(); const num = sectionMatch[2] || '';
        const sectionId = `${type}${num}`.toLowerCase();
        const sectionColors: Record<string, string> = { 'VERSO': '#7c3aed', 'CORO': '#f59e0b', 'PUENTE': '#059669', 'INTRO': '#6366f1', 'FINAL': '#ef4444', 'PRE-CORO': '#ec4899', 'PRE CORO': '#ec4899', 'OUTRO': '#0891b2', 'BRIDGE': '#059669' };
        const color = sectionColors[type] || 'var(--accent)';
        elements.push(<div key={lineIndex++} data-section={sectionId} className="mt-8 mb-3"><span className="text-sm font-black uppercase tracking-widest px-3 py-1.5 rounded-lg inline-block" style={{ color, backgroundColor: color + '20' }} translate="no">{trimmed}</span></div>);
        continue;
      }
      if (trimmed.startsWith('//')) {
        const chordLine = trimmed.substring(2).trim();
        if (i + 1 < lines.length && lines[i + 1].trim() !== '' && !lines[i + 1].trim().startsWith('//')) {
          const lyricLine = lines[i + 1]; i++;
          elements.push(<div key={lineIndex++} className="mb-3">{preferences.showChords && <div className="font-mono mb-0.5 whitespace-pre" style={{ color: 'var(--accent)', fontWeight: 800, letterSpacing: '0.05em', fontSize: `${preferences.fontSize * 0.75}px` }} translate="no">{chordLine}</div>}<div className="font-lyrics leading-relaxed whitespace-pre-wrap" style={{ fontSize: `${preferences.fontSize}px` }}>{lyricLine}</div></div>);
        } else { elements.push(<div key={lineIndex++} className="mb-2">{preferences.showChords && <div className="font-mono whitespace-pre" style={{ color: 'var(--accent)', fontWeight: 800, fontSize: `${preferences.fontSize * 0.75}px` }} translate="no">{chordLine}</div>}</div>); }
        continue;
      }
      elements.push(<div key={lineIndex++} className="mb-4"><div className="font-lyrics leading-relaxed whitespace-pre-wrap" style={{ fontSize: `${preferences.fontSize}px` }}>{line}</div></div>);
    }
    return elements;
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Fila 1: Botón volver + Título + Badge de idioma */}
      <div className="flex-shrink-0 flex items-center gap-2 mb-1">
        <button onClick={onBack} className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}><ChevronLeft size={16} /></button>
        <h1 className="flex-1 text-sm sm:text-base font-bold truncate">{song.title}</h1>
        {song.lyricsByLanguage && Object.keys(song.lyricsByLanguage).length > 1 && (
          <button onClick={() => { const languages = Object.keys(song.lyricsByLanguage!); const idx = languages.indexOf(currentLanguage); setCurrentLanguage(languages[(idx + 1) % languages.length]); }} className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>{currentLanguage}</button>
        )}
      </div>

      {/* Fila 2: Información secundaria + Transposición + Acciones */}
      <div className="flex-shrink-0 flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs flex-wrap flex-1 min-w-0" style={{ color: 'var(--text-muted)' }}>
          <span className="truncate">{song.artist}</span>
          <span>•</span>
          <span className="font-bold" style={{ color: 'var(--accent)' }} translate="no">{song.key}</span>
          <span translate="no">{song.timeSignature}</span>
          <span translate="no">{song.bpm} BPM</span>
          {/* Botones de transposición */}
          <button
            onClick={() => setTransposition(0)}
            className="px-1.5 py-0.5 rounded text-xs font-medium transition-all hover:scale-105"
            style={{ 
              backgroundColor: transposition === 0 ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: transposition === 0 ? 'white' : 'var(--text-primary)',
              border: '1px solid var(--border-color)'
            }}
            title="Volver al tono original"
            translate="no"
          >
            {song.key}
          </button>
          <button
            onClick={() => {
              const note2Formatted = formatNote(personalNotes.note2);
              if (note2Formatted) {
                handleKeyChange(note2Formatted);
              }
            }}
            onDoubleClick={() => setEditingNote('note2')}
            className="px-1.5 py-0.5 rounded text-xs font-medium transition-all hover:scale-105"
            style={{ 
              backgroundColor: formatNote(personalNotes.note2) && getCurrentKey() === formatNote(personalNotes.note2) ? 'var(--accent)' : formatNote(personalNotes.note2) ? 'var(--accent-light)' : 'var(--bg-tertiary)',
              color: formatNote(personalNotes.note2) && getCurrentKey() === formatNote(personalNotes.note2) ? 'white' : formatNote(personalNotes.note2) ? 'var(--accent)' : 'var(--text-muted)',
              border: '1px solid var(--border-color)'
            }}
            title="Clic para aplicar, doble clic para cambiar"
            translate="no"
          >
            {formatNote(personalNotes.note2) || '—'}
          </button>
          <button
            onClick={() => {
              const note3Formatted = formatNote(personalNotes.note3);
              if (note3Formatted) {
                handleKeyChange(note3Formatted);
              }
            }}
            onDoubleClick={() => setEditingNote('note3')}
            className="px-1.5 py-0.5 rounded text-xs font-medium transition-all hover:scale-105"
            style={{ 
              backgroundColor: formatNote(personalNotes.note3) && getCurrentKey() === formatNote(personalNotes.note3) ? 'var(--accent)' : formatNote(personalNotes.note3) ? 'var(--accent-light)' : 'var(--bg-tertiary)',
              color: formatNote(personalNotes.note3) && getCurrentKey() === formatNote(personalNotes.note3) ? 'white' : formatNote(personalNotes.note3) ? 'var(--accent)' : 'var(--text-muted)',
              border: '1px solid var(--border-color)'
            }}
            title="Clic para aplicar, doble clic para cambiar"
            translate="no"
          >
            {formatNote(personalNotes.note3) || '—'}
          </button>
        </div>
        {/* Iconos de acción */}
        <div className="flex items-center gap-1">
          <button onClick={() => toggleFavorite(song.id)} className="p-1.5 rounded-lg" style={{ color: isFavorite(song.id) ? 'var(--gold)' : 'var(--text-muted)' }}><Star size={16} fill={isFavorite(song.id) ? 'currentColor' : 'none'} /></button>
          <button onClick={() => setShowConfig(!showConfig)} className="p-1.5 rounded-lg" style={{ backgroundColor: showConfig ? 'var(--accent-light)' : 'var(--bg-tertiary)', color: showConfig ? 'var(--accent)' : 'var(--text-primary)' }}><Settings size={16} /></button>
        </div>
      </div>

      {showConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowConfig(false)}>
          <div className="w-full max-w-md rounded-2xl border p-6 space-y-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }} onClick={e => e.stopPropagation()} translate="no">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold">Configuración</h3>
              <button onClick={() => setShowConfig(false)} className="p-1.5 rounded-lg hover:opacity-70" style={{ backgroundColor: 'var(--bg-tertiary)' }}><X size={18} /></button>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2"><span className="text-sm font-semibold">Transposición</span>{transposition !== 0 && <button onClick={() => setTransposition(0)} className="text-xs flex items-center gap-1" style={{ color: 'var(--accent)' }}><RotateCcw size={12} /> Original</button>}</div>
              <div className="flex items-center gap-2">
                <button onClick={() => setTransposition(t => t - 1)} className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>−</button>
                <div className="flex-1 text-center"><span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{transposition > 0 ? `+${transposition}` : transposition}</span><span className="text-xs block" style={{ color: 'var(--text-muted)' }}>semitonos</span></div>
                <button onClick={() => setTransposition(t => t + 1)} className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>+</button>
              </div>
            </div>
            <div><span className="text-sm font-semibold mb-2 block">Tamaño de Letra</span><div className="flex items-center gap-3"><span className="text-xs">A</span><input type="range" min="14" max="40" value={preferences.fontSize} onChange={e => setFontSize(Number(e.target.value))} className="flex-1 accent-purple-600" /><span className="text-xl font-bold">A</span><span className="text-xs w-10 text-right">{preferences.fontSize}px</span></div></div>
            <div className="flex items-center justify-between"><span className="text-sm font-semibold">Mostrar Acordes</span><button onClick={() => setShowChords(!preferences.showChords)} className="w-12 h-7 rounded-full transition-all relative" style={{ backgroundColor: preferences.showChords ? 'var(--accent)' : 'var(--bg-tertiary)' }}><div className="w-5 h-5 rounded-full bg-white absolute top-1 transition-all" style={{ left: preferences.showChords ? '26px' : '4px' }} /></button></div>
            <div><span className="text-sm font-semibold mb-2 block">Capo de Guitarra</span><div className="flex items-center gap-2"><button onClick={() => setCapo(Math.max(0, preferences.capo - 1))} className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>−</button><div className="flex-1 text-center"><span className="text-2xl font-bold">{preferences.capo > 0 ? `${preferences.capo}°` : '—'}</span><span className="text-xs block" style={{ color: 'var(--text-muted)' }}>traste</span></div><button onClick={() => setCapo(Math.min(12, preferences.capo + 1))} className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>+</button></div></div>
          </div>
        </div>
      )}

      {/* Popup selector de tonos para notas personales */}
      {(editingNote === 'note2' || editingNote === 'note3') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setEditingNote(null)}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()} translate="no">
            <h3 className="font-bold text-lg mb-1">Seleccionar Tono</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Tono actual: <strong style={{ color: 'var(--accent)' }}>{getCurrentKey()}</strong></p>
            
            <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>Mayores:</p>
            <div className="grid grid-cols-6 gap-2 mb-4">
              {NOTES.map(note => (
                <button
                  key={note}
                  onClick={() => { handleKeyChange(note); setEditingNote(null); }}
                  className="py-2 rounded-lg text-sm font-bold transition-all hover:scale-105"
                  style={{ 
                    backgroundColor: getCurrentKey() === note ? '#8b5cf6' : 'var(--bg-secondary)',
                    color: getCurrentKey() === note ? 'white' : 'var(--text-primary)',
                    border: `1px solid ${getCurrentKey() === note ? '#8b5cf6' : 'var(--border-color)'}`
                  }}
                  translate="no"
                >
                  {note}
                </button>
              ))}
            </div>

            <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>Menores:</p>
            <div className="grid grid-cols-6 gap-2 mb-4">
              {NOTES.map(note => {
                const minorKey = note + 'm';
                return (
                  <button
                    key={minorKey}
                    onClick={() => { handleKeyChange(minorKey); setEditingNote(null); }}
                    className="py-2 rounded-lg text-sm font-bold transition-all hover:scale-105"
                    style={{ 
                      backgroundColor: getCurrentKey() === minorKey ? '#8b5cf6' : 'var(--bg-secondary)',
                      color: getCurrentKey() === minorKey ? 'white' : 'var(--text-primary)',
                      border: `1px solid ${getCurrentKey() === minorKey ? '#8b5cf6' : 'var(--border-color)'}`
                    }}
                    translate="no"
                  >
                    {minorKey}
                  </button>
                );
              })}
            </div>

            <button onClick={() => setEditingNote(null)} className="w-full py-2.5 rounded-xl text-sm font-bold mt-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto rounded-2xl border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
        {sections.length > 0 && (
          <div className="sticky top-0 z-20 py-2 px-3 border-b shadow-sm" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <div className="flex gap-1.5 overflow-x-auto">
              {sections.map((section, idx) => {
                const sectionColors: Record<string, string> = { 'VERSO': '#7c3aed', 'CORO': '#f59e0b', 'PUENTE': '#059669', 'INTRO': '#6366f1', 'FINAL': '#ef4444', 'PRE-CORO': '#ec4899', 'PRE CORO': '#ec4899', 'OUTRO': '#0891b2', 'BRIDGE': '#059669' };
                const color = sectionColors[section.type] || 'var(--accent)';
                return (<button key={idx} onClick={() => scrollToSection(section.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 flex-shrink-0" style={{ backgroundColor: color + '20', color }} translate="no">{section.label}</button>);
              })}
            </div>
          </div>
        )}
        <div id="song-lyrics-container" className="p-5 md:p-8" translate="no">{renderLyrics()}</div>
      </div>

      <div className="fixed bottom-24 right-4 z-30 flex flex-col items-center gap-2">
        {/* Número de velocidad - ARRIBA del play, solo el número visible */}
        <button 
          onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); }}
          className="text-lg font-bold transition-all hover:scale-110 active:scale-95"
          style={{ 
            color: 'white',
            textShadow: '0 0 10px rgba(0,0,0,0.8)'
          }}
        >
          {scrollSpeed}
        </button>
        
        {/* Ventana de control de velocidad */}
        {showSpeedMenu && (
          <div className="rounded-2xl p-4 mb-2 w-56" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}>
            <div className="text-xs text-white/90 mb-3 text-center font-bold">CONTROL DE VELOCIDAD</div>
            
            {/* Velocidad actual */}
            <div className="text-center mb-3">
              <div className="text-3xl font-bold text-white">{scrollSpeed}</div>
              <div className="text-[10px] text-white/60">velocidad actual</div>
            </div>
            
            {/* Slider para velocidad personalizada */}
            <div className="mb-3">
              <input 
                type="range" 
                min="1" 
                max="70" 
                step="1"
                value={scrollSpeed} 
                onChange={e => setScrollSpeed(Number(e.target.value))} 
                className="w-full accent-purple-400"
                style={{ opacity: 0.9 }}
              />
              <div className="flex justify-between text-[9px] text-white/50 mt-1">
                <span>Muy lento</span>
                <span>Muy rápido</span>
              </div>
            </div>
            
            {/* Control de opacidad del botón */}
            <div className="border-t border-white/20 pt-3">
              <div className="text-[10px] text-white/60 mb-2">Opacidad del botón</div>
              <input 
                type="range" 
                min="10" 
                max="100" 
                step="5"
                value={buttonOpacity} 
                onChange={e => setButtonOpacity(Number(e.target.value))} 
                className="w-full accent-purple-400"
                style={{ opacity: 0.9 }}
              />
              <div className="flex justify-between text-[9px] text-white/50 mt-1">
                <span>Transparente</span>
                <span>Opaco</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Botón de play/pause - con opacidad ajustable */}
        <button 
          onClick={() => setIsAutoScrolling(!isAutoScrolling)}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95" 
          style={{ 
            backgroundColor: isAutoScrolling 
              ? `rgba(239,68,68,${buttonOpacity / 100})`
              : `rgba(124,58,237,${buttonOpacity / 100})`,
            color: 'white', 
            backdropFilter: 'blur(10px)'
          }}
        >
          {isAutoScrolling ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
        </button>
      </div>
    </div>
  );
}

function HymnalView({ hymnal, onSelectSong, onBack, onEditHymnal, onAddSong, onDeleteHymnal, showNotification }: any) {
  const { state, toggleFavorite, isFavorite, addMultipleToFavorites, removeMultipleCustomSongs } = useApp();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [showHymnalMenu, setShowHymnalMenu] = useState(false);
  const [showHymnalExportModal, setShowHymnalExportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const hymnalSongs = useMemo(() => {
    return [...allSongs, ...state.customSongs].filter(s => s.hymnalId === hymnal.id);
  }, [hymnal.id, state.customSongs]);

  // Función para calcular el código dinámicamente basado en el prefijo del cancionero
  const getDisplayCode = (song: any) => {
    const prefix = hymnal.codePrefix || hymnal.id.charAt(0).toUpperCase();
    const number = song.number || song.code.match(/(\d+)$/)?.[1] || '1';
    return `${prefix}${number}`;
  };

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    if (!showSelectionMenu && !showHymnalMenu) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-selection-menu]') && !target.closest('[data-hymnal-menu]')) {
        setShowSelectionMenu(false);
        setShowHymnalMenu(false);
      }
    };
    
    // Usar setTimeout para evitar que el click actual cierre el menú
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showSelectionMenu, showHymnalMenu]);

  // Toggle modo de selección
  const toggleSelectionMode = () => {
    if (selectionMode) {
      // Al desactivar, limpiar selecciones
      setSelectedSongs([]);
    }
    setSelectionMode(!selectionMode);
  };

  // Toggle selección de una canción
  const toggleSongSelection = (songId: string) => {
    if (selectedSongs.includes(songId)) {
      setSelectedSongs(selectedSongs.filter(id => id !== songId));
    } else {
      setSelectedSongs([...selectedSongs, songId]);
    }
  };

  // Seleccionar/deseleccionar todo
  const toggleSelectAll = () => {
    if (selectedSongs.length === hymnalSongs.length) {
      setSelectedSongs([]);
    } else {
      setSelectedSongs(hymnalSongs.map(s => s.id));
    }
  };

  // Acciones de selección múltiple
  const handleSelectionAction = (action: string) => {
    setShowSelectionMenu(false);
    const selectedSongsData = hymnalSongs.filter(s => selectedSongs.includes(s.id));

    switch (action) {
      case 'favorite':
        addMultipleToFavorites(selectedSongs.map(id => id));
        showNotification(`${selectedSongs.length} canciones marcadas como favoritas`, 'success');
        setSelectedSongs([]);
        break;
      case 'copy':
        const textToCopy = selectedSongsData.map(s => `${getDisplayCode(s)} - ${s.title}\n${s.artist}\n${s.lyrics}\n`).join('\n---\n\n');
        navigator.clipboard.writeText(textToCopy);
        showNotification(`${selectedSongs.length} canciones copiadas al portapapeles`, 'success');
        break;
      case 'send':
        showNotification('Función de enviar canciones (próximamente)', 'info');
        break;
      case 'delete':
        if (confirm(`¿Eliminar ${selectedSongs.length} canciones seleccionadas? Esta acción no se puede deshacer.`)) {
          removeMultipleCustomSongs(selectedSongs);
          showNotification(`${selectedSongs.length} canciones eliminadas`, 'success');
          setSelectedSongs([]);
        }
        break;
      case 'export':
        setShowHymnalExportModal(true);
        break;
    }
  };





  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg card-shadow-sm hover:card-shadow-md transition-shadow" style={{ backgroundColor: 'var(--bg-tertiary)' }}><ChevronLeft size={20} /></button>
        {hymnal.image ? (
          <div className="w-14 h-14 rounded-2xl overflow-hidden card-shadow-lg">
            <img src={hymnal.image} alt={hymnal.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl card-shadow-lg" style={{ backgroundColor: hymnal.color + '20' }}>{hymnal.icon}</div>
        )}
        <div className="flex-1"><h2 className="text-lg font-bold">{hymnal.name}</h2><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{hymnalSongs.length} canciones • {hymnal.language}</p></div>
        <button onClick={() => onAddSong(hymnal)} className="p-2.5 rounded-xl card-shadow-md hover:card-shadow-lg transition-all" style={{ backgroundColor: 'var(--accent)', color: 'white' }}><Plus size={18} /></button>
        
        {/* Botón de modo selección */}
        {hymnalSongs.length > 0 && (
          <button 
            onClick={toggleSelectionMode}
            className="p-2.5 rounded-xl card-shadow-sm hover:card-shadow-md transition-all" 
            style={{ backgroundColor: selectionMode ? 'var(--accent)' : 'var(--bg-tertiary)', color: selectionMode ? 'white' : 'var(--text-primary)' }}
            title={selectionMode ? 'Salir de selección' : 'Modo selección'}
          >
            {selectionMode ? <X size={18} /> : <CheckSquare size={18} />}
          </button>
        )}
        
        {/* Botón de seleccionar todo - visible en modo selección */}
        {selectionMode && (
          <button 
            onClick={toggleSelectAll}
            className="px-3 py-2 rounded-xl card-shadow-sm hover:card-shadow-md transition-all text-xs font-semibold" 
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
            title={selectedSongs.length === hymnalSongs.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
          >
            {selectedSongs.length === hymnalSongs.length ? 'Deseleccionar' : 'Seleccionar todo'}
          </button>
        )}
        
        {/* Menú de acciones del cancionero - siempre visible */}
        <div className="relative" data-hymnal-menu>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowHymnalMenu(!showHymnalMenu); }} 
            className="p-2.5 rounded-xl card-shadow-sm hover:card-shadow-md transition-all" 
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <MoreVertical size={18} />
          </button>
          {showHymnalMenu && (
            <div onClick={(e) => e.stopPropagation()} className="absolute top-full right-0 mt-1 w-48 rounded-xl card-shadow-lg overflow-hidden z-50" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
              <button onClick={() => onEditHymnal(hymnal)} className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:opacity-80" style={{ color: 'var(--text-primary)' }}>
                <Edit3 size={14} /> Editar
              </button>
              <button onClick={() => {
                if (confirm(`¿Eliminar el cancionero "${hymnal.name}"? Esta acción no se puede deshacer.`)) {
                  onDeleteHymnal(hymnal.id);
                  showNotification('Cancionero eliminado', 'success');
                  onBack();
                }
              }} className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:opacity-80 text-red-500">
                <Trash2 size={14} /> Eliminar
              </button>
              <button onClick={() => showNotification('Importar canciones (próximamente)', 'info')} className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:opacity-80" style={{ color: 'var(--text-primary)' }}>
                <Upload size={14} /> Importar
              </button>
              <button onClick={() => {
                if (hymnalSongs.length === 0) {
                  showNotification('No hay canciones para exportar', 'error');
                  return;
                }
                const data = JSON.stringify(hymnalSongs, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${hymnal.name.replace(/\s+/g, '_')}_backup.json`;
                a.click();
                URL.revokeObjectURL(url);
                showNotification('Cancionero exportado', 'success');
              }} className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:opacity-80" style={{ color: 'var(--text-primary)' }}>
                <Download size={14} /> Exportar
              </button>
              <button onClick={() => {
                const shareText = `Cancionero: ${hymnal.name}\n${hymnalSongs.length} canciones\n\n${hymnalSongs.map(s => `- ${s.title}`).join('\n')}`;
                if (navigator.share) {
                  navigator.share({ title: hymnal.name, text: shareText });
                } else {
                  navigator.clipboard.writeText(shareText);
                  showNotification('Información copiada', 'success');
                }
              }} className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:opacity-80" style={{ color: 'var(--text-primary)' }}>
                <Share2 size={14} /> Compartir
              </button>
            </div>
          )}
        </div>
        
        {/* Menú de acciones de selección múltiple - visible en modo selección */}
        {selectionMode && (
          <div className="relative" data-selection-menu>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowSelectionMenu(!showSelectionMenu); }} 
              className="px-3 py-2 rounded-xl card-shadow-md hover:card-shadow-lg transition-all flex items-center gap-1.5" 
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >
              <span className="text-xs font-semibold">Más opciones</span>
              <ChevronDown size={14} />
            </button>
            {showSelectionMenu && (
              <div className="absolute top-full right-0 mt-1 w-48 rounded-xl card-shadow-lg overflow-hidden z-50" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <button onClick={() => toggleSelectAll()} className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:opacity-80" style={{ color: 'var(--text-primary)' }}>
                  <CheckSquare size={14} /> {selectedSongs.length === hymnalSongs.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                </button>
                <div className="border-t" style={{ borderColor: 'var(--border-color)' }}></div>
                <button onClick={() => handleSelectionAction('favorite')} className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:opacity-80" style={{ color: 'var(--text-primary)' }}>
                  <Star size={14} /> Marcar favorito
                </button>
                <button onClick={() => handleSelectionAction('copy')} className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:opacity-80" style={{ color: 'var(--text-primary)' }}>
                  <Copy size={14} /> Copiar
                </button>
                <button onClick={() => handleSelectionAction('send')} className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:opacity-80" style={{ color: 'var(--text-primary)' }}>
                  <Share2 size={14} /> Enviar
                </button>
                <button onClick={() => handleSelectionAction('delete')} className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:opacity-80 text-red-500">
                  <Trash2 size={14} /> Eliminar
                </button>
                <button onClick={() => handleSelectionAction('export')} className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:opacity-80" style={{ color: 'var(--text-primary)' }}>
                  <Download size={14} /> Exportar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Indicador de selección - solo visible en modo selección */}
      {selectionMode && (
        <div className="px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)', border: '2px solid var(--accent)' }}>
          <span>✓ {selectedSongs.length} canción{selectedSongs.length !== 1 ? 'es' : ''} seleccionada{selectedSongs.length !== 1 ? 's' : ''}</span>
          <span className="text-xs font-normal">Modo selección activo</span>
        </div>
      )}
      
      <div className="space-y-2">
        {hymnalSongs.map(song => {
          const isSelected = selectedSongs.includes(song.id);
          return (
              <div 
                key={song.id} 
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isSelected ? 'card-shadow-md' : 'card-shadow-sm hover:card-shadow-md hover-lift'}`} 
                style={{ 
                  backgroundColor: isSelected ? 'var(--accent-light)' : 'var(--card-bg)', 
                  borderColor: isSelected ? 'var(--accent)' : 'var(--border-color)',
                  borderWidth: isSelected ? '2px' : '1px'
                }}
              >
                {selectionMode && (
                  <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                      toggleSongSelection(song.id);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                    }}
                    className="w-5 h-5 rounded cursor-pointer accent-purple-600 flex-shrink-0"
                  />
                )}
                <div className="flex-1 text-left cursor-pointer" onClick={() => selectionMode ? toggleSongSelection(song.id) : onSelectSong(song)}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent)' }}>{getDisplayCode(song)}</span>
                    <span className="font-medium text-sm">{song.title}</span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{song.artist} • {song.key} • {song.timeSignature} • {song.bpm} BPM</div>
                </div>
                {!selectionMode && (
                  <button onClick={(e) => { e.stopPropagation(); toggleFavorite(song.id); }} className="p-2 rounded-lg flex-shrink-0" style={{ color: isFavorite(song.id) ? 'var(--gold)' : 'var(--text-muted)' }}><Star size={18} fill={isFavorite(song.id) ? 'currentColor' : 'none'} /></button>
                )}
              </div>
          );
        })}
        {hymnalSongs.length === 0 && <div className="text-center py-12"><Music size={40} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-3" /><p className="text-sm" style={{ color: 'var(--text-muted)' }}>No hay canciones</p></div>}
      </div>
      
      {/* Modal de exportación */}
      {showHymnalExportModal && (
        <ExportModal 
          songs={hymnalSongs.filter(s => selectedSongs.includes(s.id))} 
          onClose={() => setShowHymnalExportModal(false)} 
        />
      )}
    </div>
  );
}

function SearchPage({ onSelectSong }: any) {
  const { state, toggleFavorite, isFavorite } = useApp();
  const [query, setQuery] = useState('');
  const allAvailableSongs = useMemo(() => [...allSongs, ...state.customSongs], [state.customSongs]);
  const allHymnals = useMemo(() => [...hymnals, ...state.customHymnals], [state.customHymnals]);
  
  const filteredSongs = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return allAvailableSongs.filter(song => song.title.toLowerCase().includes(q) || song.artist.toLowerCase().includes(q) || song.code.toLowerCase().includes(q) || song.lyrics.toLowerCase().includes(q));
  }, [query, allAvailableSongs]);

  // Función para calcular el código dinámicamente basado en el prefijo del cancionero
  const getDisplayCode = (song: any) => {
    const hymnal = allHymnals.find(h => h.id === song.hymnalId);
    if (!hymnal) return song.code;
    const prefix = hymnal.codePrefix || hymnal.id.charAt(0).toUpperCase();
    const number = song.number || song.code.match(/(\d+)$/)?.[1] || '1';
    return `${prefix}${number}`;
  };

  return (
    <div className="space-y-4 pb-4">
      <div><h2 className="text-2xl font-bold mb-1">Buscar</h2><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Busca por título, artista, código o letra</p></div>
      <div className="relative">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar canciones..." className="w-full pl-12 pr-12 py-4 rounded-2xl border text-base font-medium" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', boxShadow: 'var(--card-shadow)' }} autoFocus />
        {query && <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}><X size={16} /></button>}
      </div>
      <div>
        <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>{filteredSongs.length} resultado{filteredSongs.length !== 1 ? 's' : ''}</div>
        <div className="space-y-2">
          {filteredSongs.map((song) => (
            <div key={song.id} className="flex items-center gap-3 p-4 rounded-2xl border transition-all hover:scale-[1.01]" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
              <button onClick={() => onSelectSong(song)} className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-1"><span className="text-xs font-mono px-2 py-0.5 rounded-lg font-bold" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>{getDisplayCode(song)}</span><span className="font-bold text-base">{song.title}</span></div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{song.artist} • {song.key} • {song.timeSignature} • {song.bpm} BPM</div>
              </button>
              <button onClick={() => toggleFavorite(song.id)} className="p-2.5 rounded-xl" style={{ color: isFavorite(song.id) ? 'var(--gold)' : 'var(--text-muted)' }}><Star size={20} fill={isFavorite(song.id) ? 'currentColor' : 'none'} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FavoritesPage({ onSelectSong }: any) {
  const { state, toggleFavorite } = useApp();
  const favoriteSongs = useMemo(() => [...allSongs, ...state.customSongs].filter(s => state.favorites.includes(s.id)), [state.favorites, state.customSongs]);
  const allHymnals = useMemo(() => [...hymnals, ...state.customHymnals], [state.customHymnals]);

  // Función para calcular el código dinámicamente basado en el prefijo del cancionero
  const getDisplayCode = (song: any) => {
    const hymnal = allHymnals.find(h => h.id === song.hymnalId);
    if (!hymnal) return song.code;
    const prefix = hymnal.codePrefix || hymnal.id.charAt(0).toUpperCase();
    const number = song.number || song.code.match(/(\d+)$/)?.[1] || '1';
    return `${prefix}${number}`;
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-2"><span className="text-2xl">⭐</span><div><h2 className="text-lg font-bold">Mis Favoritos</h2><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{favoriteSongs.length} canciones</p></div></div>
      {favoriteSongs.length > 0 ? (
        <div className="space-y-2">
          {favoriteSongs.map(song => (
            <div key={song.id} className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.01]" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
              <button onClick={() => onSelectSong(song)} className="flex-1 text-left">
                <div className="flex items-center gap-2"><span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent)' }}>{getDisplayCode(song)}</span><span className="font-medium text-sm">{song.title}</span></div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{song.artist} • {song.key} • {song.language}</div>
              </button>
              <button onClick={() => toggleFavorite(song.id)} className="p-2 rounded-lg" style={{ color: 'var(--gold)' }}><Star size={18} fill="currentColor" /></button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12"><Music size={40} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-3" /><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aún no tienes favoritos</p></div>
      )}
    </div>
  );
}

function SetlistsPage({ onSelectSong, showNotification }: any) {
  const { state, addSetlist, removeSetlist, removeSongFromSetlist } = useApp();
  const [selectedSetlist, setSelectedSetlist] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSetlistName, setNewSetlistName] = useState('');
  const allAvailableSongs = useMemo(() => [...allSongs, ...state.customSongs], [state.customSongs]);
  const currentSetlist = state.setlists.find(s => s.id === selectedSetlist);

  const createSetlist = () => {
    if (newSetlistName.trim()) { addSetlist(newSetlistName.trim()); setNewSetlistName(''); setShowCreateModal(false); showNotification('Lista creada', 'success'); }
  };

  if (selectedSetlist && currentSetlist) {
    return (
      <div className="space-y-4 pb-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedSetlist(null)} className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}><ChevronLeft size={20} /></button>
          <div className="flex-1"><h2 className="text-xl font-bold">{currentSetlist.name}</h2><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{currentSetlist.songs.length} canciones</p></div>
        </div>
        {currentSetlist.songs.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed" style={{ borderColor: 'var(--border-color)' }}><Music size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} /><p className="text-sm" style={{ color: 'var(--text-muted)' }}>No hay canciones</p></div>
        ) : (
          <div className="space-y-2">
            {currentSetlist.songs.map((item, index) => {
              const song = allAvailableSongs.find(s => s.id === item.songId);
              return (
                <div key={item.songId} className="rounded-2xl border p-3 flex items-center gap-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                  <span className="text-xs font-bold w-5" style={{ color: 'var(--accent)' }}>{index + 1}.</span>
                  <button onClick={() => song && onSelectSong(song)} className="flex-1 text-left"><div className="font-semibold text-sm">{song?.title || 'No encontrada'}</div>{song && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{song.artist} • {song.key}</div>}</button>
                  <button onClick={() => removeSongFromSetlist(selectedSetlist, item.songId)} className="p-2 rounded-xl text-red-500"><Trash2 size={16} /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">Listas</h1><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Organiza tus canciones</p></div><button onClick={() => setShowCreateModal(true)} className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md" style={{ backgroundColor: 'var(--accent)', color: 'white' }}><Plus size={16} /> Nueva</button></div>
      {state.setlists.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border border-dashed" style={{ borderColor: 'var(--border-color)' }}><Music size={48} className="mx-auto mb-3 opacity-40" /><h3 className="font-bold text-base mb-1">No tienes listas</h3></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.setlists.map(list => (
            <div key={list.id} onClick={() => setSelectedSetlist(list.id)} className="rounded-2xl border p-5 cursor-pointer transition-all hover:scale-[1.01]" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
              <div className="flex items-start justify-between gap-2 mb-2"><h3 className="font-bold text-base truncate">{list.name}</h3><button onClick={(e) => { e.stopPropagation(); if (confirm(`¿Eliminar "${list.name}"?`)) removeSetlist(list.id); }} className="p-1.5 rounded-lg text-red-500"><Trash2 size={16} /></button></div>
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--accent)' }}>{list.songs.length} canciones</p>
              <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs font-bold" style={{ borderColor: 'var(--border-color)', color: 'var(--accent)' }}><span>Ver lista</span><ArrowRight size={14} /></div>
            </div>
          ))}
        </div>
      )}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-sm rounded-2xl p-5 space-y-4" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg">Nueva Lista</h3>
            <input type="text" placeholder="Nombre" value={newSetlistName} onChange={e => setNewSetlistName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createSetlist()} autoFocus className="w-full p-3 text-sm rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            <div className="flex gap-2"><button onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-xl text-xs font-bold" style={{ backgroundColor: 'var(--bg-tertiary)' }}>Cancelar</button><button onClick={createSetlist} disabled={!newSetlistName.trim()} className="flex-1 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>Crear</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrdersPage({ onSelectSong, showNotification }: any) {
  const { state, addOrder, removeOrder, updateOrder } = useApp();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrderName, setNewOrderName] = useState('');
  const [newOrderType, setNewOrderType] = useState('Culto');
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const allAvailableSongs = useMemo(() => [...allSongs, ...state.customSongs], [state.customSongs]);

  const createOrder = () => {
    if (!newOrderName.trim()) return;
    const newOrder: Order = {
      id: crypto.randomUUID(),
      name: newOrderName.trim(),
      type: newOrderType,
      date: new Date().toISOString().split('T')[0],
      items: [],
    };
    addOrder(newOrder);
    setSelectedOrder(newOrder);
    setShowCreateModal(false);
    setNewOrderName('');
    showNotification('Orden creada', 'success');
  };

  const addItemToOrder = (song: Song) => {
    if (!selectedOrder) return;
    const updatedOrder = {
      ...selectedOrder,
      items: [...selectedOrder.items, { id: crypto.randomUUID(), title: song.title, songId: song.id, key: song.key }],
    };
    updateOrder(updatedOrder);
    setSelectedOrder(updatedOrder);
    setShowAddSongModal(false);
    setSongSearchQuery('');
    showNotification('Canción agregada', 'success');
  };

  const removeItemFromOrder = (itemId: string) => {
    if (!selectedOrder) return;
    const updatedOrder = { ...selectedOrder, items: selectedOrder.items.filter(item => item.id !== itemId) };
    updateOrder(updatedOrder);
    setSelectedOrder(updatedOrder);
    showNotification('Elemento eliminado', 'success');
  };

  const filteredSongs = useMemo(() => {
    if (!songSearchQuery.trim()) return allAvailableSongs.slice(0, 10);
    const q = songSearchQuery.toLowerCase();
    return allAvailableSongs.filter(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
  }, [allAvailableSongs, songSearchQuery]);

  if (selectedOrder) {
    return (
      <div className="space-y-4 pb-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}><ChevronLeft size={20} /></button>
          <div className="flex-1 min-w-0"><h2 className="text-xl font-bold truncate">{selectedOrder.name}</h2><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedOrder.type} • {selectedOrder.date} • {selectedOrder.items.length} elementos</p></div>
          <button onClick={() => setShowAddSongModal(true)} className="p-2 rounded-xl text-white" style={{ backgroundColor: 'var(--accent)' }}><Plus size={20} /></button>
        </div>
        {selectedOrder.items.length === 0 ? (
          <div className="text-center py-16 rounded-3xl border border-dashed" style={{ borderColor: 'var(--border-color)' }}><Music size={48} className="mx-auto mb-3 opacity-40" /><p className="text-sm" style={{ color: 'var(--text-muted)' }}>No hay elementos</p></div>
        ) : (
          <div className="space-y-2">
            {selectedOrder.items.map((item, index) => {
              const matchedSong = item.songId ? allAvailableSongs.find(s => s.id === item.songId) : null;
              return (
                <div key={item.id} className="rounded-2xl border p-3 flex items-center gap-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                  <span className="text-xs font-bold w-5" style={{ color: 'var(--accent)' }}>{index + 1}.</span>
                  <button onClick={() => matchedSong && onSelectSong(matchedSong)} className="flex-1 text-left min-w-0">
                    <div className="font-semibold text-sm truncate">{item.title}</div>
                    <div className="text-xs flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>{item.key && <span>Tono: {item.key}</span>}{matchedSong && <span className="font-medium" style={{ color: 'var(--accent)' }}>• Ver</span>}</div>
                  </button>
                  <button onClick={() => removeItemFromOrder(item.id)} className="p-2 rounded-xl text-red-500"><Trash2 size={16} /></button>
                </div>
              );
            })}
          </div>
        )}
        {showAddSongModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowAddSongModal(false)}>
            <div className="w-full max-w-md rounded-2xl p-5 space-y-4 max-h-[80vh] flex flex-col" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-lg">Agregar canción</h3>
              <input type="text" placeholder="Buscar..." value={songSearchQuery} onChange={e => setSongSearchQuery(e.target.value)} className="w-full p-3 text-sm rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} autoFocus />
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredSongs.map(song => (
                  <button key={song.id} onClick={() => addItemToOrder(song)} className="w-full text-left p-3 rounded-xl border flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                    <div><div className="font-medium text-sm">{song.title}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>{song.artist} • {song.key}</div></div>
                    <Plus size={16} style={{ color: 'var(--accent)' }} />
                  </button>
                ))}
              </div>
              <button onClick={() => setShowAddSongModal(false)} className="w-full py-2.5 rounded-xl text-xs font-bold" style={{ backgroundColor: 'var(--bg-tertiary)' }}>Cerrar</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">Órdenes de Culto</h1><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Programa de reuniones</p></div><button onClick={() => setShowCreateModal(true)} className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md" style={{ backgroundColor: 'var(--accent)', color: 'white' }}><Plus size={16} /> Nueva</button></div>
      {state.orders.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border border-dashed" style={{ borderColor: 'var(--border-color)' }}><Music size={48} className="mx-auto mb-3 opacity-40" /><h3 className="font-bold text-base mb-1">No hay órdenes</h3></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.orders.map(order => (
            <div key={order.id} onClick={() => setSelectedOrder(order)} className="rounded-2xl border p-5 cursor-pointer transition-all hover:scale-[1.01]" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
              <div className="flex items-start justify-between gap-2 mb-2"><div><h3 className="font-bold text-base truncate">{order.name}</h3><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{order.type} • {order.date}</p></div><button onClick={(e) => { e.stopPropagation(); if (confirm(`¿Eliminar "${order.name}"?`)) removeOrder(order.id); }} className="p-1.5 rounded-lg text-red-500"><Trash2 size={16} /></button></div>
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--accent)' }}>{order.items.length} elementos</p>
              <div className="space-y-1">{order.items.slice(0, 3).map((item, i) => (<div key={i} className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>• {item.title}</div>))}</div>
              <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs font-bold" style={{ borderColor: 'var(--border-color)', color: 'var(--accent)' }}><span>Ver orden</span><ArrowRight size={14} /></div>
            </div>
          ))}
        </div>
      )}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-sm rounded-2xl p-5 space-y-4" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg">Nueva Orden</h3>
            <div><label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Título</label><input type="text" placeholder="Ej: Culto Dominical" value={newOrderName} onChange={e => setNewOrderName(e.target.value)} className="w-full p-3 text-sm rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} autoFocus /></div>
            <div><label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>Tipo</label><select value={newOrderType} onChange={e => setNewOrderType(e.target.value)} className="w-full p-3 text-sm rounded-xl border bg-transparent" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}><option value="Culto">Culto</option><option value="Reunión de Jóvenes">Reunión de Jóvenes</option><option value="Ensayo">Ensayo</option><option value="Especial">Especial</option></select></div>
            <div className="flex gap-2"><button onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-xl text-xs font-bold" style={{ backgroundColor: 'var(--bg-tertiary)' }}>Cancelar</button><button onClick={createOrder} disabled={!newOrderName.trim()} className="flex-1 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 text-white" style={{ backgroundColor: 'var(--accent)' }}>Crear</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolsPage() {
  const [activeTab, setActiveTab] = useState<'metronome' | 'tuner' | 'circle'>('metronome');

  return (
    <div className="space-y-4 pb-20">
      <div><h1 className="text-2xl font-bold">Herramientas</h1><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Metrónomo, afinador y teoría musical</p></div>
      <div className="flex gap-2 p-1 rounded-2xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        <button onClick={() => setActiveTab('metronome')} className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all" style={{ backgroundColor: activeTab === 'metronome' ? 'var(--card-bg)' : 'transparent', color: activeTab === 'metronome' ? 'var(--accent)' : 'var(--text-muted)', boxShadow: activeTab === 'metronome' ? 'var(--card-shadow)' : 'none' }}>Metrónomo</button>
        <button onClick={() => setActiveTab('tuner')} className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all" style={{ backgroundColor: activeTab === 'tuner' ? 'var(--card-bg)' : 'transparent', color: activeTab === 'tuner' ? 'var(--accent)' : 'var(--text-muted)', boxShadow: activeTab === 'tuner' ? 'var(--card-shadow)' : 'none' }}>Afinador</button>
        <button onClick={() => setActiveTab('circle')} className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all" style={{ backgroundColor: activeTab === 'circle' ? 'var(--card-bg)' : 'transparent', color: activeTab === 'circle' ? 'var(--accent)' : 'var(--text-muted)', boxShadow: activeTab === 'circle' ? 'var(--card-shadow)' : 'none' }}>Círculo</button>
      </div>
      <div className="rounded-3xl border p-4 sm:p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
        {activeTab === 'metronome' && <Metronome />}
        {activeTab === 'tuner' && <Tuner />}
        {activeTab === 'circle' && <CircleOfFifths />}
      </div>
    </div>
  );
}

function CircleOfFifths() {
  const majorKeys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];

  return (
    <div className="space-y-4">
      <div className="text-center"><h3 className="text-lg font-bold mb-1">Círculo de Quintas</h3><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Explora las tonalidades y sus relaciones</p></div>
      <div className="relative w-full max-w-sm mx-auto aspect-square">
        <div className="absolute inset-0 flex items-center justify-center"><div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent)', color: 'white' }}><span className="text-lg font-bold">C</span></div></div>
        {majorKeys.map((key, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const radius = 42;
          const x = 50 + radius * Math.cos(angle);
          const y = 50 + radius * Math.sin(angle);
          return (<button key={key} className="absolute w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:scale-110" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '2px solid var(--border-color)' }}>{key}</button>);
        })}
      </div>
      <div className="grid grid-cols-4 gap-2">{majorKeys.slice(0, 8).map(key => (<button key={key} className="py-2 rounded-lg text-xs font-bold" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>{key}</button>))}</div>
    </div>
  );
}
