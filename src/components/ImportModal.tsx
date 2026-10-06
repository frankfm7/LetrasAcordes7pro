import { useState } from 'react';
import { X, Upload, Plus } from 'lucide-react';
import { Hymnal, Song } from '../types';
import { importFromTxt, importFromWord, importFromPdf, importFromImage, importFromJson, parseMultipleSongsFromText } from '../utils/importUtils';
import { useApp } from '../context/AppContext';
import { useNotification } from './NotificationProvider';
import AddHymnalModal from './AddHymnalModal';
import { hymnals as defaultHymnals } from '../data/songs';

interface ImportModalProps {
  onClose: () => void;
  hymnals: Hymnal[];
}

export default function ImportModal({ onClose, hymnals }: ImportModalProps) {
  const { addCustomSong, addMultipleCustomSongs, state } = useApp();
  const { showNotification } = useNotification();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previews, setPreviews] = useState<Partial<Song>[]>([]);
  const [selectedHymnalId, setSelectedHymnalId] = useState<string>(hymnals[0]?.id || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddHymnalModal, setShowAddHymnalModal] = useState(false);

  const allHymnals = [...hymnals];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessing(true);
    setError(null);
    setPreviews([]);

    try {
      const fileType = file.name.toLowerCase();
      let text = '';

      if (fileType.endsWith('.txt')) {
        text = await file.text();
      } else if (fileType.endsWith('.docx')) {
        text = await importFromWord(file, selectedHymnalId).then(s => s.lyrics || '');
      } else if (fileType.endsWith('.pdf')) {
        text = await importFromPdf(file, selectedHymnalId).then(s => s.lyrics || '');
      } else if (fileType.endsWith('.json')) {
        const songData = await importFromJson(file);
        setPreviews([songData]);
        setIsProcessing(false);
        return;
      } else if (fileType.match(/\.(jpg|jpeg|png)$/)) {
        text = await importFromImage(file, selectedHymnalId).then(s => s.lyrics || '');
      } else {
        throw new Error('Formato de archivo no soportado');
      }

      const songsData = parseMultipleSongsFromText(text, selectedHymnalId);
      setPreviews(songsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (previews.length === 0 || !selectedFile) return;

    try {
      const newSongs: Song[] = previews.map((preview, index) => ({
        id: `custom-${Date.now()}-${index}`,
        title: preview.title || 'Sin título',
        artist: preview.artist || 'Desconocido',
        code: `IMP${Date.now()}-${index}`,
        hymnalId: selectedHymnalId,
        key: preview.key || 'C',
        timeSignature: preview.timeSignature || '4/4',
        bpm: preview.bpm || 120,
        language: preview.language || 'Castellano',
        categories: preview.categories || [],
        sections: preview.sections || [],
        lyrics: preview.lyrics || '',
        notes: preview.notes || '',
      }));

      if (newSongs.length === 1) {
        addCustomSong(newSongs[0]);
      } else {
        addMultipleCustomSongs(newSongs);
      }

      showNotification(`${newSongs.length} canción${newSongs.length > 1 ? 'es' : ''} importada${newSongs.length > 1 ? 's' : ''} exitosamente`, 'success');
      onClose();
    } catch (err) {
      showNotification('Error al importar la canción', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div 
        className="w-full max-w-lg rounded-t-3xl p-6 pb-8 animate-slide-up max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--card-bg)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Importar canciones</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:opacity-70" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold mb-2 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Importar a cancionero
            </label>
            <div className="flex gap-2">
              <select
                value={selectedHymnalId}
                onChange={(e) => setSelectedHymnalId(e.target.value)}
                className="flex-1 p-3 rounded-xl border text-sm"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                {allHymnals.map(hymnal => (
                  <option key={hymnal.id} value={hymnal.id}>
                    {hymnal.icon} {hymnal.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowAddHymnalModal(true)}
                className="px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Nuevo</span>
              </button>
            </div>
          </div>

          <div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".txt,.docx,.pdf,.json,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="rounded-xl border-2 border-dashed p-6 text-center transition-all hover:border-opacity-70" style={{ borderColor: 'var(--border-color)' }}>
                <Upload size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm font-medium">Haz clic para seleccionar un archivo</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Formatos: TXT, Word, PDF, JSON, Imagen (JPG/PNG)
                </p>
              </div>
            </label>
          </div>

          {isProcessing && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent)' }}></div>
              <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Procesando archivo...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {previews.length > 0 && !isProcessing && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                  {previews.length} canción{previews.length > 1 ? 'es' : ''} detectada{previews.length > 1 ? 's' : ''}
                </p>
              </div>

              {previews.map((preview, index) => (
                <div key={index} className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                      #{index + 1}
                    </span>
                    <h4 className="font-bold text-lg">{preview.title}</h4>
                  </div>
                  <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>{preview.artist}</p>
                  <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                    Tono: {preview.key} | Compás: {preview.timeSignature} | BPM: {preview.bpm}
                  </div>
                  <div className="text-xs p-2 rounded-lg max-h-24 overflow-y-auto" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <pre className="whitespace-pre-wrap font-mono text-[10px]">
                      {preview.lyrics?.substring(0, 150)}...
                    </pre>
                  </div>
                </div>
              ))}

              <button
                onClick={handleImport}
                className="w-full py-3 rounded-xl text-sm font-bold"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                Importar {previews.length} canción{previews.length > 1 ? 'es' : ''}
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 mt-4 rounded-xl text-sm font-bold"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          Cancelar
        </button>
      </div>

      {showAddHymnalModal && (
        <AddHymnalModal onClose={() => setShowAddHymnalModal(false)} />
      )}
    </div>
  );
}
