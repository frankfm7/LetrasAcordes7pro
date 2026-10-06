import { useState, useRef, useEffect } from 'react';
import { X, Crop, Check } from 'lucide-react';

interface ImageCropperProps {
  imageFile: File;
  onCropComplete: (croppedImage: File) => void;
  onCancel: () => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function ImageCropper({ imageFile, onCropComplete, onCancel }: ImageCropperProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string);
    };
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  // Obtener posición del mouse
  const getMousePos = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  // Obtener posición del touch
  const getTouchPos = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || !e.touches[0]) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  };

  // Eventos de mouse
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getMousePos(e);
    setIsDrawing(true);
    setStartPos(pos);
    setCropArea({ x: pos.x, y: pos.y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getMousePos(e);
    setCropArea({
      x: Math.min(startPos.x, pos.x),
      y: Math.min(startPos.y, pos.y),
      width: Math.abs(pos.x - startPos.x),
      height: Math.abs(pos.y - startPos.y)
    });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  // Eventos táctiles
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getTouchPos(e);
    setIsDrawing(true);
    setStartPos(pos);
    setCropArea({ x: pos.x, y: pos.y, width: 0, height: 0 });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getTouchPos(e);
    setCropArea({
      x: Math.min(startPos.x, pos.x),
      y: Math.min(startPos.y, pos.y),
      width: Math.abs(pos.x - startPos.x),
      height: Math.abs(pos.y - startPos.y)
    });
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const handleCrop = async () => {
    if (!cropArea || !imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    
    // Calcular escala entre imagen original y mostrada
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    // Configurar canvas con tamaño del área recortada
    canvas.width = cropArea.width * scaleX;
    canvas.height = cropArea.height * scaleY;

    // Dibujar el área recortada
    ctx.drawImage(
      img,
      cropArea.x * scaleX,
      cropArea.y * scaleY,
      cropArea.width * scaleX,
      cropArea.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Convertir canvas a File
    canvas.toBlob((blob) => {
      if (!blob) return;
      const croppedFile = new File([blob], `cropped_${imageFile.name}`, { type: 'image/png' });
      onCropComplete(croppedFile);
    }, 'image/png');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-4xl rounded-2xl p-6 space-y-4" style={{ backgroundColor: 'var(--card-bg)' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Crop size={24} style={{ color: 'var(--accent)' }} />
            Seleccionar área de escaneo
          </h3>
          <button onClick={onCancel} className="p-2 rounded-lg hover:opacity-70" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Dibuja un rectángulo sobre el área que contiene la letra de la canción
        </div>

        <div
          ref={containerRef}
          className="relative border-2 rounded-lg overflow-hidden cursor-crosshair select-none"
          style={{ borderColor: 'var(--border-color)', maxHeight: '500px', touchAction: 'none' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          {imageSrc && (
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Imagen a procesar"
              className="w-full h-auto pointer-events-none"
              style={{ maxHeight: '500px', objectFit: 'contain', userSelect: 'none' }}
              draggable={false}
            />
          )}

          {cropArea && cropArea.width > 0 && cropArea.height > 0 && (
            <div
              className="absolute border-2 bg-purple-500/20 pointer-events-none"
              style={{
                left: cropArea.x,
                top: cropArea.y,
                width: cropArea.width,
                height: cropArea.height,
                borderColor: 'var(--accent)'
              }}
            >
              <div className="absolute top-0 left-0 w-2 h-2 bg-purple-600" style={{ backgroundColor: 'var(--accent)' }}></div>
              <div className="absolute top-0 right-0 w-2 h-2 bg-purple-600" style={{ backgroundColor: 'var(--accent)' }}></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 bg-purple-600" style={{ backgroundColor: 'var(--accent)' }}></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-purple-600" style={{ backgroundColor: 'var(--accent)' }}></div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-bold"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleCrop}
            disabled={!cropArea || cropArea.width < 10 || cropArea.height < 10}
            className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--accent)', color: 'white' }}
          >
            <Check size={18} />
            Procesar y extraer letra
          </button>
        </div>
      </div>
    </div>
  );
}
