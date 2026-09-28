import { useState, useEffect, useCallback } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { NotificationProvider, useNotification } from './components/NotificationProvider';
import SplashScreen from './components/SplashScreen';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import SongView from './components/SongView';
import HymnalView from './components/HymnalView';
import SearchPage from './components/SearchPage';
import FavoritesPage from './components/FavoritesPage';
import SetlistsPage from './components/SetlistsPage';
import OrdersPage from './components/OrdersPage';
import ToolsPage from './components/ToolsPage';
import SongEditor from './components/SongEditor';
import AddHymnalModal from './components/AddHymnalModal';
import { Song, Hymnal } from './types';

function AppContent() {
  const { state } = useApp();
  const { showNotification } = useNotification();
  const [showSplash, setShowSplash] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedHymnal, setSelectedHymnal] = useState<Hymnal | null>(null);
  const [previousHymnal, setPreviousHymnal] = useState<Hymnal | null>(null);
  const [previousPage, setPreviousPage] = useState<string>('home');
  const [songSource, setSongSource] = useState<{ type: 'list' | 'order' | 'hymnal' | 'search' | 'home', id?: string, name?: string } | null>(null);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [showAddHymnalModal, setShowAddHymnalModal] = useState(false);

  useEffect(() => {
    document.documentElement.className = state.preferences.theme;
  }, [state.preferences.theme]);

  const handleSelectSong = useCallback((song: Song, source?: { type: 'list' | 'order' | 'hymnal' | 'search' | 'home', id?: string, name?: string }) => {
    setSelectedSong(song);
    if (source) {
      setSongSource(source);
      if (source.type === 'hymnal') {
        setPreviousHymnal(source as any);
      }
    }
  }, []);

  const handleSelectHymnal = useCallback((hymnal: Hymnal) => {
    setSelectedHymnal(hymnal);
    setPreviousHymnal(hymnal);
    setPreviousPage(currentPage);
  }, [currentPage]);

  const handleBack = useCallback(() => {
    if (selectedSong) {
      if (songSource) {
        if (songSource.type === 'hymnal' && previousHymnal) {
          setSelectedSong(null);
          setSelectedHymnal(previousHymnal);
          setSongSource(null);
        } else if (songSource.type === 'list' || songSource.type === 'order') {
          setSelectedSong(null);
          setCurrentPage(songSource.type === 'list' ? 'setlists' : 'orders');
          setSongSource(null);
        } else {
          setSelectedSong(null);
          setCurrentPage(previousPage);
          setSongSource(null);
        }
      } else {
        setSelectedSong(null);
        setCurrentPage(previousPage);
      }
    } else if (selectedHymnal) {
      setSelectedHymnal(null);
      setPreviousHymnal(null);
      setCurrentPage(previousPage);
    } else if (currentPage !== 'home') {
      setCurrentPage('home');
    }
    setEditingSong(null);
  }, [selectedSong, selectedHymnal, previousHymnal, previousPage, currentPage, songSource]);

  const handleBackFromEditor = useCallback(() => { setEditingSong(null); }, []);

  const handleNavigate = useCallback((page: string) => {
    setPreviousPage(currentPage);
    setCurrentPage(page);
    setSelectedSong(null);
    setSelectedHymnal(null);
    setPreviousHymnal(null);
    setEditingSong(null);
  }, [currentPage]);

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
      showNotification('Respaldo exportado exitosamente', 'success');
    } catch {
      showNotification('Error al exportar los datos', 'error');
    }
  }, [state, showNotification]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.txt';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.favorites && data.setlists && data.preferences) {
            localStorage.setItem('cancionero-ruah-state', JSON.stringify(data));
            showNotification('Copia de seguridad restaurada exitosamente', 'success');
            window.location.reload();
          } else {
            showNotification('El archivo no contiene un respaldo válido', 'error');
          }
        } catch {
          showNotification('Error al importar el archivo. Verifica que sea un JSON válido.', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [showNotification]);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Song Editor
  if (editingSong) {
    return (
      <Layout currentPage={currentPage} onNavigate={handleNavigate}
              onImport={handleImport} onExport={handleExport} onAddHymnal={() => setShowAddHymnalModal(true)}>
        <SongEditor song={editingSong} onBack={handleBackFromEditor} />
      </Layout>
    );
  }

  // Song View
  if (selectedSong) {
    return (
      <Layout currentPage={currentPage} onNavigate={handleNavigate}
              onImport={handleImport} onExport={handleExport} onAddHymnal={() => setShowAddHymnalModal(true)}>
        <SongView song={selectedSong} onBack={handleBack} onEdit={() => setEditingSong(selectedSong)} songSource={songSource} />
      </Layout>
    );
  }

  // Hymnal View
  if (selectedHymnal) {
    return (
      <Layout currentPage={currentPage} onNavigate={handleNavigate}
              onImport={handleImport} onExport={handleExport} onAddHymnal={() => setShowAddHymnalModal(true)}>
        <HymnalView hymnal={selectedHymnal} onSelectSong={handleSelectSong} onBack={handleBack} />
      </Layout>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onSelectSong={(song) => handleSelectSong(song, { type: 'home' })} onSelectHymnal={handleSelectHymnal}
                         onSearch={() => handleNavigate('search')} onAddHymnal={() => setShowAddHymnalModal(true)} />;
      case 'search':
        return <SearchPage onSelectSong={(song) => handleSelectSong(song, { type: 'search' })} onBack={handleBack} />;
      case 'favorites':
        return <FavoritesPage onSelectSong={(song) => handleSelectSong(song, { type: 'home' })} />;
      case 'setlists':
        return <SetlistsPage onSelectSong={(song) => handleSelectSong(song, { type: 'list' })} />;
      case 'orders':
        return <OrdersPage onSelectSong={(song) => handleSelectSong(song, { type: 'order' })} />;
      case 'tools':
        return <ToolsPage />;
      default:
        return <HomePage onSelectSong={(song) => handleSelectSong(song, { type: 'home' })} onSelectHymnal={handleSelectHymnal}
                         onSearch={() => handleNavigate('search')} onAddHymnal={() => setShowAddHymnalModal(true)} />;
    }
  };

  return (
    <>
      <Layout currentPage={currentPage} onNavigate={handleNavigate}
              onImport={handleImport} onExport={handleExport} onAddHymnal={() => setShowAddHymnalModal(true)}>
        {renderPage()}
      </Layout>
      {showAddHymnalModal && <AddHymnalModal onClose={() => setShowAddHymnalModal(false)} />}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AppProvider>
  );
}