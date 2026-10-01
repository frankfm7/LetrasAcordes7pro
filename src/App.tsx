import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Song, Hymnal } from './types';
import { songs as allSongs, hymnals } from './data/songs';
import ExportImportModal from './components/ExportImportModal';

function AppContent() {
  const { state } = useApp();
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedHymnal, setSelectedHymnal] = useState<Hymnal | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);

  const showNotification = (message: string, type: string = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const allAvailableSongs = [...allSongs, ...state.customSongs];
  const allHymnals = [...hymnals, ...state.customHymnals];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <header className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Cancionero7Pro</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 rounded-lg font-bold"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >
              Importar
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 rounded-lg font-bold"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              Exportar
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-6xl mx-auto">
        {!selectedHymnal && !selectedSong && (
          <div>
            <h2 className="text-xl font-bold mb-4">Cancioneros</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allHymnals.map(hymnal => {
                const hymnalSongs = allAvailableSongs.filter(s => s.hymnalId === hymnal.id);
                return (
                  <button
                    key={hymnal.id}
                    onClick={() => setSelectedHymnal(hymnal)}
                    className="p-6 rounded-xl border hover:scale-105 transition-transform"
                    style={{ backgroundColor: hymnal.color + '20', borderColor: hymnal.color }}
                  >
                    <div className="text-4xl mb-2">{hymnal.icon}</div>
                    <div className="font-bold text-lg">{hymnal.name}</div>
                    <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {hymnalSongs.length} canciones
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selectedHymnal && !selectedSong && (
          <div>
            <button
              onClick={() => setSelectedHymnal(null)}
              className="mb-4 px-4 py-2 rounded-lg"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              ‹ Volver
            </button>
            <h2 className="text-xl font-bold mb-4">{selectedHymnal.name}</h2>
            <div className="space-y-2">
              {allAvailableSongs
                .filter(s => s.hymnalId === selectedHymnal.id)
                .map(song => (
                  <button
                    key={song.id}
                    onClick={() => setSelectedSong(song)}
                    className="w-full text-left p-4 rounded-xl border hover:scale-[1.02] transition-transform"
                    style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-mono px-2 py-1 rounded" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
                        {song.code}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{song.title}</div>
                        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          {song.artist} • {song.key}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {selectedSong && (
          <div>
            <button
              onClick={() => setSelectedSong(null)}
              className="mb-4 px-4 py-2 rounded-lg"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              ‹ Volver
            </button>
            <h2 className="text-2xl font-bold mb-2">{selectedSong.title}</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              {selectedSong.artist} • {selectedSong.key} • {selectedSong.timeSignature}
            </p>
            <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--card-bg)' }}>
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {selectedSong.lyrics}
              </pre>
            </div>
          </div>
        )}
      </main>

      {showImportModal && (
        <ExportImportModal
          onClose={() => setShowImportModal(false)}
          mode="import"
          showNotification={showNotification}
        />
      )}

      {showExportModal && (
        <ExportImportModal
          onClose={() => setShowExportModal(false)}
          mode="export"
          showNotification={showNotification}
        />
      )}

      {notification && (
        <div
          className="fixed bottom-4 right-4 p-4 rounded-xl shadow-lg"
          style={{
            backgroundColor: notification.type === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
          }}
        >
          {notification.message}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
