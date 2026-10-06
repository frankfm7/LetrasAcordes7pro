import { X, FileText, FileJson, FileCode, Image, Share2 } from 'lucide-react';
import { Song } from '../types';
import { exportAsTxt, exportAsJson, exportAsHtml } from '../utils/exportUtils';
import { useNotification } from './NotificationProvider';

interface ExportModalProps {
  songs: Song[];
  onClose: () => void;
}

export default function ExportModal({ songs, onClose }: ExportModalProps) {
  const { showNotification } = useNotification();

  const handleExport = (format: string) => {
    try {
      switch (format) {
        case 'txt':
          exportAsTxt(songs);
          showNotification(`${songs.length} canción${songs.length > 1 ? 'es' : ''} exportada${songs.length > 1 ? 's' : ''} como TXT`, 'success');
          break;
        case 'json':
          exportAsJson(songs);
          showNotification(`${songs.length} canción${songs.length > 1 ? 'es' : ''} exportada${songs.length > 1 ? 's' : ''} como JSON`, 'success');
          break;
        case 'html':
          exportAsHtml(songs);
          showNotification(`${songs.length} canción${songs.length > 1 ? 'es' : ''} exportada${songs.length > 1 ? 's' : ''} como HTML (Word)`, 'success');
          break;
        case 'image':
          showNotification('Exportación como imagen próximamente', 'info');
          return;
      }
      onClose();
    } catch (error) {
      showNotification('Error al exportar: ' + (error as Error).message, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Exportar canción{songs.length > 1 ? 'es' : ''}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:opacity-70" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <X size={20} />
          </button>
        </div>

        {songs.length > 1 && (
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {songs.length} canciones seleccionadas
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={() => handleExport('txt')}
            className="w-full p-4 rounded-xl border text-left transition-all hover:scale-[1.02]"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
          >
            <div className="flex items-center gap-3">
              <FileText size={24} style={{ color: 'var(--accent)' }} />
              <div>
                <div className="font-semibold text-sm">Archivo de texto (.txt)</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Letra con acordes en texto plano</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleExport('html')}
            className="w-full p-4 rounded-xl border text-left transition-all hover:scale-[1.02]"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
          >
            <div className="flex items-center gap-3">
              <FileCode size={24} style={{ color: 'var(--accent)' }} />
              <div>
                <div className="font-semibold text-sm">Archivo de Word (.html)</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Formato compatible con Word</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleExport('json')}
            className="w-full p-4 rounded-xl border text-left transition-all hover:scale-[1.02]"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
          >
            <div className="flex items-center gap-3">
              <FileJson size={24} style={{ color: 'var(--accent)' }} />
              <div>
                <div className="font-semibold text-sm">Documento JSON</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Datos completos para reimportar</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleExport('image')}
            className="w-full p-4 rounded-xl border text-left transition-all hover:scale-[1.02] opacity-60"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
          >
            <div className="flex items-center gap-3">
              <Image size={24} style={{ color: 'var(--text-muted)' }} />
              <div>
                <div className="font-semibold text-sm">Captura de imagen</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Próximamente</div>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl text-sm font-bold"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
