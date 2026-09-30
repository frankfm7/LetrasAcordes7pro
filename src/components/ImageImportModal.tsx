import { useState, useRef, useEffect } from 'react';
import { X, Camera, Crop, Loader, Save } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { Song } from '../types';
import { useApp } from '../context/AppContext';
import { hymnals } from '../data/songs';

interface ImageImportModalProps {
  onClose: () => void;
  showNotification: (msg: string, type?: string) => void;
}

export default function ImageImportModal({ onClose, showNotification }: ImageImportModalProps) {
  const { addCustomSong } = useApp();
  const [step, setStep] = useState<'upload' | 'crop' | 'process' | 'edit'>('upload');
  const [image, setImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [progress, setProgress] = useState(0);
  
  // Estados para el crop
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  
  // Estados para editar la canción
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState('C');
  const [lyrics, setLyrics] = useState('');
  const [selectedHymnal, setSelectedHymnal] = useState(hymnals[0].id);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setStep('crop');
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (step === 'crop' && image && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const img = new Image();
      img.onload = () => {
        // Ajustar tamaño del canvas
        const maxWidth = 800;
        const maxHeight = 600;
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        setImageSize({ width, height });
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = image;
    }
  }, [step, image]);

  const drawRectangle = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Redibujar la imagen
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Dibujar el rectángulo de selección
      if (cropBox.width > 0 && cropBox.height > 0) {
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
        
        // Oscurecer el área fuera de la selección
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, cropBox.y);
        ctx.fillRect(0, cropBox.y + cropBox.height, canvas.width, canvas.height - cropBox.y - cropBox.height);
        ctx.fillRect(0, cropBox.y, cropBox.x, cropBox.height);
        ctx.fillRect(cropBox.x + cropBox.width, cropBox.y, canvas.width - cropBox.x - cropBox.width, cropBox.height);
      }
    };
    img.src = image;
  };

  useEffect(() => {
    if (step === 'crop' && image) {
      drawRectangle();
    }
  }, [cropBox, step, image]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    setIsDrawing(true);
    setStartPos(pos);
    setCropBox({ x: pos.x, y: pos.y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const pos = getMousePos(e);
    setCropBox({
      x: Math.min(startPos.x, pos.x),
      y: Math.min(startPos.y, pos.y),
      width: Math.abs(pos.x - startPos.x),
      height: Math.abs(pos.y - startPos.y),
    });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleCrop = () => {
    if (cropBox.width < 20 || cropBox.height < 20) {
      showNotification('Selecciona un área más grande', 'error');
      return;
    }
    
    setStep('process');
    processImage();
  };

  const processImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Crear canvas temporal para el crop
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    tempCanvas.width = cropBox.width;
    tempCanvas.height = cropBox.height;
    
    // Dibujar solo el área seleccionada
    tempCtx.drawImage(
      canvas,
      cropBox.x,
      cropBox.y,
      cropBox.width,
      cropBox.height,
      0,
      0,
      cropBox.width,
      cropBox.height
    );
    
    const croppedImageData = tempCanvas.toDataURL();
    setProgress(0);
    
    try {
      const result = await Tesseract.recognize(croppedImageData, 'spa', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });
      
      setExtractedText(result.data.text);
      setLyrics(result.data.text);
      setStep('edit');
    } catch (error) {
      console.error('Error en OCR:', error);
      showNotification('Error al procesar la imagen', 'error');
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      showNotification('El título es obligatorio', 'error');
      return;
    }
    
    const newSong: Song = {
      id: `custom-${Date.now()}`,
      title: title.trim(),
      artist: artist.trim() || 'Desconocido',
      code: `IMP${Date.now().toString().slice(-4)}`,
      hymnalId: selectedHymnal,
      key,
      timeSignature: '4/4',
      bpm: 100,
      language: 'Castellano',
      categories: ['General'],
      sections: [],
      lyrics,
      notes: 'Importado desde imagen',
    };
    
    addCustomSong(newSong);
    showNotification('Canción importada exitosamente', 'success');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4" 
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto" 
        style={{ backgroundColor: 'var(--card-bg)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onClose}
            className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
            style={{ color: 'white' }}
            title="Volver"
          >
            ‹
          </button>
          <h3 className="text-xl font-bold flex-1 text-center">
            {step === 'upload' && 'Importar desde Imagen'}
            {step === 'crop' && 'Seleccionar Área de la Letra'}
            {step === 'process' && 'Procesando Imagen...'}
            {step === 'edit' && 'Editar Canción Importada'}
          </h3>
          <div style={{ width: '48px' }}></div>
        </div>
        
        {step === 'upload' && (
          <div className="space-y-4">
            <div className="p-8 rounded-xl border-2 border-dashed text-center" style={{ borderColor: 'var(--border-color)' }}>
              <Camera size={64} className="mx-auto mb-4" style={{ color: 'var(--accent)' }} />
              <p className="font-semibold mb-2">Sube una imagen de la canción</p>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                Puede ser una foto, captura de pantalla o imagen escaneada
              </p>
              <label className="inline-block px-6 py-3 rounded-xl font-bold cursor-pointer" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                Seleccionar Imagen
              </label>
            </div>
            
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                💡 <strong>Consejo:</strong> Usa imágenes claras y con buena iluminación para mejores resultados
              </p>
            </div>
          </div>
        )}
        
        {step === 'crop' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <p className="text-sm font-semibold mb-2">Instrucciones:</p>
              <ol className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
                <li>1. Haz clic y arrastra para seleccionar el área donde está la letra</li>
                <li>2. Intenta incluir solo la letra y los acordes</li>
                <li>3. Evita incluir títulos, números de página u otros textos</li>
              </ol>
            </div>
            
            <div 
              ref={containerRef}
              className="relative border-2 rounded-xl overflow-hidden" 
              style={{ borderColor: 'var(--border-color)' }}
            >
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="w-full cursor-crosshair"
                style={{ display: 'block' }}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setStep('upload');
                  setImage(null);
                  setCropBox({ x: 0, y: 0, width: 0, height: 0 });
                }}
                className="flex-1 py-3 rounded-xl font-bold"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                ‹ Volver
              </button>
              <button
                onClick={handleCrop}
                className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                <Crop size={18} /> Recortar y Analizar
              </button>
            </div>
          </div>
        )}
        
        {step === 'process' && (
          <div className="text-center py-12">
            <Loader size={64} className="mx-auto mb-4 animate-spin" style={{ color: 'var(--accent)' }} />
            <p className="font-semibold mb-2">Procesando imagen...</p>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden max-w-md mx-auto">
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${progress}%`, backgroundColor: 'var(--accent)' }}
              />
            </div>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>{progress}% completado</p>
          </div>
        )}
        
        {step === 'edit' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <p className="text-sm font-semibold mb-2">Texto extraído:</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Revisa y corrige el texto extraído. Puedes editar todo antes de guardar.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold mb-1.5 block">Título *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Título de la canción"
                  className="w-full p-3 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-xs font-bold mb-1.5 block">Artista</label>
                <input
                  type="text"
                  value={artist}
                  onChange={e => setArtist(e.target.value)}
                  placeholder="Artista o autor"
                  className="w-full p-3 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold mb-1.5 block">Tonalidad</label>
                <select
                  value={key}
                  onChange={e => setKey(e.target.value)}
                  className="w-full p-3 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold mb-1.5 block">Himnario</label>
                <select
                  value={selectedHymnal}
                  onChange={e => setSelectedHymnal(e.target.value)}
                  className="w-full p-3 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  {hymnals.map(h => (
                    <option key={h.id} value={h.id}>{h.icon} {h.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="text-xs font-bold mb-1.5 block">Letra y Acordes</label>
              <textarea
                value={lyrics}
                onChange={e => setLyrics(e.target.value)}
                rows={15}
                className="w-full p-3 rounded-xl border text-sm font-mono"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                placeholder="Edita la letra y agrega los acordes con // al inicio de cada línea"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                💡 Usa // antes de los acordes. Ejemplo: //Am F Em Am
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setStep('crop')}
                className="flex-1 py-3 rounded-xl font-bold"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                ‹ Volver
              </button>
              <button
                onClick={handleSave}
                disabled={!title.trim()}
                className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                <Save size={18} /> Guardar Canción
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
