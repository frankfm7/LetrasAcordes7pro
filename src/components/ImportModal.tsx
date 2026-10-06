import { useState } from 'react';
import { X, Upload, FileText, File, Image, FileJson } from 'lucide-react';
import { Hymnal, Song } from '../types';
import { importFromTxt, importFromWord, importFromPdf, importFromImage, importFromJson } from '../utils/importUtils';
import { useApp } from '../context/AppContext';
import { useNotification } from './NotificationProvider';

interface ImportModalProps {
  onClose: () => void;
  hymnals: Hymnal[];
}

export default function ImportModal({ onClose, hymnals }: ImportModalProps) {
  const { addCustomSong } = useApp();
  const { showNotification } = useNotification();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Partial<Song> | null>(null);
  const [selectedHymnalId, setSelectedHymnalId] = useState<string>(hymnals[0]?.id || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessing(true);
    setError(null);
    setPreview(null);

    try {
      let songData: Partial<Song>;
      const fileType = file.name.toLowerCase();

      if (fileType.endsWith('.txt')) {
        songData = await importFromTxt(file, selectedHymnalId);
      } else if (fileType.endsWith('.docx')) {
        songData = await importFromWord(file, selectedHymnalId);
      } else if (fileType.endsWith('.pdf')) {
        songData = await importFromPdf(file, selectedHymnalId);
      } else if (fileType.endsWith('.json')) {
        songData = await importFromJson(file);
      } else if (fileType.match(/\.(jpg|jpeg|png)$/)) {
        songData = await importFromImage(file, selectedHymnalId);
      } else {
        throw new Error('Formato de archivo no soportado');
      }

      setPreview(songData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (!preview || !selectedFile) return;

    try {
      const newSong: Song = {
        id: `custom-${Date.now()}`,
        title: preview.title || 'Sin título',
        artist: preview.artist || 'Desconocido',
        code: `IMP${Date.now()}`,
        hymnalId: selectedHymnalId,
        key: preview.key || 'C',
        timeSignature: preview.timeSignature || '4/4',
        bpm: preview.bpm || 120,
        language: preview.language || 'Castellano',
        categories: preview.categories || [],
        sections: preview.sections || [],
        lyrics: preview.lyrics || '',
        notes: preview.notes || '',
      };

      addCustomSong(newSong);
      showNotification('Canción importada exitosamente', 'success');
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
          <h3 className="text-xl font-bold">Importar canción</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:opacity-70" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Selector de himnario */}
          <div>
            <label className="text-xs font-bold mb-2 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Importar a cancionero
            </label>
            <select
              value={selectedHymnalId}
              onChange={(e) => setSelectedHymnalId(e.target.value)}
              className="w-full p-3 rounded-xl border text-sm"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              {hymnals.map(hymnal => (
                <option key={hymnal.id} value={hymnal.id}>
                  {hymnal.icon} {hymnal.name}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de archivo */}
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

          {/* Estado de procesamiento */}
          {isProcessing && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent)' }}></div>
              <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Procesando archivo...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {/* Preview */}
          {preview && !isProcessing && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <h4 className="font-bold text-lg mb-1">{preview.title}</h4>
                <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>{preview.artist}</p>
                <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                  Tono: {preview.key} | Compás: {preview.timeSignature} | BPM: {preview.bpm}
                </div>
                <div className="text-xs p-2 rounded-lg max-h-32 overflow-y-auto" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <pre className="whitespace-pre-wrap font-mono text-[10px]">
                    {preview.lyrics?.substring(0, 200)}...
                  </pre>
                </div>
              </div>

              <button
                onClick={handleImport}
                className="w-full py-3 rounded-xl text-sm font-bold"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                Importar canción
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
    </div>
  );
}
