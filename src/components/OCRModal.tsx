import { useState } from 'react';
import { X, Upload, Camera, Loader } from 'lucide-react';
import Tesseract from 'tesseract.js';

interface OCRModalProps {
  onClose: () => void;
  onExtract: (text: string) => void;
  mode: 'song' | 'order';
}

export default function OCRModal({ onClose, onExtract, mode }: OCRModalProps) {
  const [image, setImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImage(result);
      processImage(result);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (imageData: string) => {
    setIsProcessing(true);
    setProgress(0);

    try {
      const result = await Tesseract.recognize(imageData, 'spa', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      setExtractedText(result.data.text);
    } catch (error) {
      console.error('Error en OCR:', error);
      setExtractedText('Error al procesar la imagen. Intenta con otra imagen.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtract = () => {
    if (extractedText.trim()) {
      onExtract(extractedText);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl p-5 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">
            {mode === 'song' ? '📸 Extraer Canción desde Foto' : '📸 Extraer Orden desde Foto'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}><X size={18} /></button>
        </div>

        <div className="space-y-4">
          {!image ? (
            <div className="border-2 border-dashed rounded-2xl p-12 text-center" style={{ borderColor: 'var(--border-color)' }}>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-light)' }}>
                    <Camera size={40} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-lg mb-1">Toma una foto o sube una imagen</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {mode === 'song' ? 'Toma una foto de la letra de una canción' : 'Toma una foto del orden del culto'}
                    </p>
                  </div>
                  <button className="px-6 py-3 rounded-xl font-bold flex items-center gap-2" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                    <Upload size={20} /> Seleccionar Imagen
                  </button>
                </div>
              </label>
            </div>
          ) : (
            <>
              <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
                <img src={image} alt="Preview" className="w-full max-h-64 object-contain" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
              </div>

              {isProcessing && (
                <div className="rounded-2xl border p-6 text-center" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                  <Loader size={40} className="mx-auto mb-3 animate-spin" style={{ color: 'var(--accent)' }} />
                  <p className="font-semibold mb-2">Procesando imagen...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: 'var(--accent)' }} />
                  </div>
                  <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>{progress}% completado</p>
                </div>
              )}

              {!isProcessing && extractedText && (
                <>
                  <div>
                    <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Texto Extraído
                    </label>
                    <textarea
                      value={extractedText}
                      onChange={(e) => setExtractedText(e.target.value)}
                      rows={10}
                      className="w-full p-3 rounded-xl border text-sm font-mono"
                      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      💡 Puedes editar el texto antes de guardarlo
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => { setImage(null); setExtractedText(''); }} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      Otra Foto
                    </button>
                    <button onClick={handleExtract} disabled={!extractedText.trim()} className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                      <Upload size={16} /> Usar Texto
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
