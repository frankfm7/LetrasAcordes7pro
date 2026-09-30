import { useState, useMemo } from 'react';
import { X, Download, Upload, FileText, File, Search, CheckSquare, Square, Camera, Save } from 'lucide-react';
import { Song } from '../types';
import { songs as allSongs, hymnals } from '../data/songs';
import { useApp } from '../context/AppContext';
import { generateSongShareText } from '../utils/shareUtils';

interface ExportImportModalProps {
  onClose: () => void;
  mode: 'export' | 'import';
  showNotification: (msg: string, type?: string) => void;
}

export default function ExportImportModal({ onClose, mode, showNotification }: ExportImportModalProps) {
  const { state, addCustomSong } = useApp();
  const [step, setStep] = useState<'choice' | 'single' | 'batch' | 'format'>('choice');
  const [exportType, setExportType] = useState<'single' | 'batch'>('single');
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [exportFormat, setExportFormat] = useState<'text' | 'pdf' | 'word'>('text');
  
  // Estados para importación
  const [importedText, setImportedText] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [importTitle, setImportTitle] = useState('');
  const [importArtist, setImportArtist] = useState('');
  const [importKey, setImportKey] = useState('C');
  const [importHymnal, setImportHymnal] = useState('alabanzas');

  const allAvailableSongs = useMemo(() => {
    const customSongsMap = new Map(state.customSongs.map(s => [s.id, s]));
    const combinedSongs = allSongs.map(song => customSongsMap.get(song.id) || song);
    const defaultSongIds = new Set(allSongs.map(s => s.id));
    const newCustomSongs = state.customSongs.filter(s => !defaultSongIds.has(s.id));
    return [...combinedSongs, ...newCustomSongs];
  }, [state.customSongs]);

  const filteredSongs = useMemo(() => {
    if (!searchQuery) return allAvailableSongs;
    const q = searchQuery.toLowerCase();
    return allAvailableSongs.filter(song =>
      song.title.toLowerCase().includes(q) ||
      song.artist.toLowerCase().includes(q) ||
      song.code.toLowerCase().includes(q) ||
      song.lyrics.toLowerCase().includes(q)
    );
  }, [searchQuery, allAvailableSongs]);

  const toggleSongSelection = (songId: string) => {
    const newSelected = new Set(selectedSongs);
    if (newSelected.has(songId)) newSelected.delete(songId);
    else newSelected.add(songId);
    setSelectedSongs(newSelected);
  };

  const selectAll = () => {
    if (selectedSongs.size === filteredSongs.length) {
      setSelectedSongs(new Set());
    } else {
      setSelectedSongs(new Set(filteredSongs.map(s => s.id)));
    }
  };

  const exportAsText = (songs: Song[]) => {
    const content = songs.map((song, index) => {
      const lyrics = song.lyrics.replace(/\/\/[^\n]*\n/g, '').trim();
      return `=== CANCIÓN ${index + 1} ===
Título: ${song.title}
Artista: ${song.artist}
Tonalidad: ${song.key}
Compás: ${song.timeSignature}
BPM: ${song.bpm}
Idioma: ${song.language}
Categorías: ${song.categories.join(', ')}
---
${lyrics}
=== FIN CANCIÓN ${index + 1} ===`;
    }).join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${songs.length === 1 ? songs[0].title : 'canciones'}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Exportado como texto', 'success');
  };

  const exportAsPDF = async (songs: Song[]) => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      songs.forEach((song, index) => {
        if (index > 0) doc.addPage();
        
        // Delimitador visual
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`=== CANCIÓN ${index + 1} ===`, 20, 10);
        
        // Título
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0);
        doc.text(song.title, 20, 20);
        
        // Artista
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(song.artist, 20, 30);
        
        // Info
        doc.setFontSize(10);
        doc.text(`Tonalidad: ${song.key} | Compás: ${song.timeSignature} | BPM: ${song.bpm}`, 20, 40);
        doc.text(`Idioma: ${song.language} | Categorías: ${song.categories.join(', ')}`, 20, 47);
        
        // Línea separadora
        doc.setDrawColor(200);
        doc.line(20, 50, 190, 50);
        
        // Letra
        doc.setFontSize(11);
        const lyrics = song.lyrics.replace(/\/\/[^\n]*\n/g, '').trim();
        const lines = doc.splitTextToSize(lyrics, 170);
        doc.text(lines, 20, 60);
        
        // Delimitador final
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`=== FIN CANCIÓN ${index + 1} ===`, 20, pageHeight - 10);
      });
      
      doc.save(`${songs.length === 1 ? songs[0].title : 'canciones'}_${new Date().toISOString().split('T')[0]}.pdf`);
      showNotification('Exportado como PDF', 'success');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showNotification('Error al exportar PDF', 'error');
    }
  };

  const exportAsWord = async (songs: Song[]) => {
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } = await import('docx');
      const { saveAs } = await import('file-saver');
      
      const sections = songs.map((song, index) => {
        const lyrics = song.lyrics.replace(/\/\/[^\n]*\n/g, '').trim();
        const paragraphs = [
          // Delimitador inicial
          new Paragraph({
            children: [
              new TextRun({ text: `=== CANCIÓN ${index + 1} ===`, size: 16, color: '999999', italics: true }),
            ],
            spacing: { after: 200 },
          }),
          // Título
          new Paragraph({
            text: song.title,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          }),
          // Artista
          new Paragraph({
            children: [
              new TextRun({ text: song.artist, bold: true, size: 24 }),
            ],
            spacing: { after: 200 },
          }),
          // Info
          new Paragraph({
            children: [
              new TextRun({ text: `Tonalidad: ${song.key} | Compás: ${song.timeSignature} | BPM: ${song.bpm}`, size: 20, italics: true }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Idioma: ${song.language} | Categorías: ${song.categories.join(', ')}`, size: 20, italics: true }),
            ],
            spacing: { after: 300 },
          }),
          // Línea separadora
          new Paragraph({
            border: {
              bottom: {
                color: 'CCCCCC',
                size: 6,
                style: BorderStyle.SINGLE,
              },
            },
            spacing: { after: 300 },
          }),
          // Letra
          ...lyrics.split('\n').map(line => 
            new Paragraph({
              children: [new TextRun({ text: line, size: 22 })],
              spacing: { after: 100 },
            })
          ),
          // Delimitador final
          new Paragraph({
            children: [
              new TextRun({ text: `=== FIN CANCIÓN ${index + 1} ===`, size: 16, color: '999999', italics: true }),
            ],
            spacing: { after: 400 },
          }),
          // Espacio entre canciones
          new Paragraph({ text: '', spacing: { after: 400 } }),
        ];
        return paragraphs;
      }).flat();
      
      const doc = new Document({
        sections: [{ children: sections }],
      });
      
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${songs.length === 1 ? songs[0].title : 'canciones'}_${new Date().toISOString().split('T')[0]}.docx`);
      showNotification('Exportado como Word', 'success');
    } catch (error) {
      console.error('Error exporting Word:', error);
      showNotification('Error al exportar Word', 'error');
    }
  };

  const handleExport = () => {
    const songsToExport = exportType === 'single' 
      ? [allAvailableSongs.find(s => s.id === Array.from(selectedSongs)[0])!]
      : Array.from(selectedSongs).map(id => allAvailableSongs.find(s => s.id === id)!).filter(Boolean);
    
    if (songsToExport.length === 0) {
      showNotification('Selecciona al menos una canción', 'error');
      return;
    }
    
    switch (exportFormat) {
      case 'text':
        exportAsText(songsToExport);
        break;
      case 'pdf':
        exportAsPDF(songsToExport);
        break;
      case 'word':
        exportAsWord(songsToExport);
        break;
    }
    
    onClose();
  };

  const parseMultipleSongs = (text: string): Song[] => {
    const songs: Song[] = [];
    
    // Buscar patrones de canciones delimitadas
    const songPattern = /=== CANCIÓN \d+ ===\n([\s\S]*?)=== FIN CANCIÓN \d+ ===/g;
    let match;
    
    while ((match = songPattern.exec(text)) !== null) {
      const songBlock = match[1];
      
      // Extraer metadata
      const titleMatch = songBlock.match(/Título: (.+)/);
      const artistMatch = songBlock.match(/Artista: (.+)/);
      const keyMatch = songBlock.match(/Tonalidad: (.+)/);
      const timeSigMatch = songBlock.match(/Compás: (.+)/);
      const bpmMatch = songBlock.match(/BPM: (.+)/);
      const langMatch = songBlock.match(/Idioma: (.+)/);
      const catMatch = songBlock.match(/Categorías: (.+)/);
      
      // Extraer letra (después de ---)
      const lyricsStart = songBlock.indexOf('---');
      const lyrics = lyricsStart !== -1 ? songBlock.substring(lyricsStart + 3).trim() : '';
      
      if (titleMatch) {
        songs.push({
          id: `custom-${Date.now()}-${songs.length}`,
          title: titleMatch[1].trim(),
          artist: artistMatch ? artistMatch[1].trim() : 'Desconocido',
          code: `IMP${Date.now().toString().slice(-4)}${songs.length}`,
          hymnalId: 'alabanzas', // Default, se puede cambiar después
          key: keyMatch ? keyMatch[1].trim() : 'C',
          timeSignature: timeSigMatch ? timeSigMatch[1].trim() : '4/4',
          bpm: bpmMatch ? parseInt(bpmMatch[1].trim()) : 100,
          language: langMatch ? langMatch[1].trim() : 'Castellano',
          categories: catMatch ? catMatch[1].split(',').map(c => c.trim()) : ['General'],
          sections: [],
          lyrics: lyrics,
          notes: 'Importado desde archivo',
        });
      }
    }
    
    return songs;
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (extension === 'txt') {
        const text = await file.text();
        
        // Intentar parsear múltiples canciones
        const parsedSongs = parseMultipleSongs(text);
        
        if (parsedSongs.length > 1) {
          // Múltiples canciones detectadas
          const confirmed = window.confirm(
            `Se detectaron ${parsedSongs.length} canciones en el archivo.\n\n` +
            `¿Deseas importar todas las canciones?\n\n` +
            `Las canciones se guardarán en el himnario "Alabanzas" por defecto.\n` +
            `Podrás editarlas después.`
          );
          
          if (confirmed) {
            parsedSongs.forEach(song => addCustomSong(song));
            showNotification(`${parsedSongs.length} canciones importadas exitosamente`, 'success');
            onClose();
          }
        } else {
          // Una sola canción o formato antiguo
          setImportedText(text);
          setShowEditor(true);
        }
      } else if (extension === 'pdf') {
        showNotification('Importación de PDF - Funcionalidad en desarrollo', 'info');
      } else if (extension === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const { extractRawText } = await import('mammoth');
        const result = await extractRawText({ arrayBuffer });
        
        // Intentar parsear múltiples canciones
        const parsedSongs = parseMultipleSongs(result.value);
        
        if (parsedSongs.length > 1) {
          const confirmed = window.confirm(
            `Se detectaron ${parsedSongs.length} canciones en el archivo.\n\n` +
            `¿Deseas importar todas las canciones?`
          );
          
          if (confirmed) {
            parsedSongs.forEach(song => addCustomSong(song));
            showNotification(`${parsedSongs.length} canciones importadas exitosamente`, 'success');
            onClose();
          }
        } else {
          setImportedText(result.value);
          setShowEditor(true);
        }
      } else {
        showNotification('Formato no soportado', 'error');
      }
    } catch (error) {
      console.error('Error importing:', error);
      showNotification('Error al importar', 'error');
    }
  };

  const handleSaveImported = () => {
    if (!importTitle.trim()) {
      showNotification('El título es obligatorio', 'error');
      return;
    }
    
    const newSong: Song = {
      id: `custom-${Date.now()}`,
      title: importTitle.trim(),
      artist: importArtist.trim() || 'Desconocido',
      code: `IMP${Date.now().toString().slice(-4)}`,
      hymnalId: importHymnal,
      key: importKey,
      timeSignature: '4/4',
      bpm: 100,
      language: 'Castellano',
      categories: ['General'],
      sections: [],
      lyrics: importedText,
      notes: 'Importado desde archivo',
    };
    
    addCustomSong(newSong);
    showNotification(`Canción guardada en ${hymnals.find((h: any) => h.id === importHymnal)?.name}`, 'success');
    onClose();
  };

  if (mode === 'import') {
    if (showEditor) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
          <div className="w-full max-w-3xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowEditor(false)}
                className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                style={{ color: 'white' }}
                title="Volver"
              >
                ‹
              </button>
              <h3 className="text-xl font-bold flex-1 text-center">Editar Canción Importada</h3>
              <div style={{ width: '48px' }}></div>
            </div>
            
            <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: 'var(--accent-light)', border: '2px solid var(--accent)' }}>
              <p className="text-sm font-semibold mb-2">📍 ¿Dónde se guardará?</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                La canción se guardará en el himnario que selecciones abajo. Podrás encontrarla en la página principal dentro de ese himnario.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs font-bold mb-1.5 block">Título *</label>
                <input
                  type="text"
                  value={importTitle}
                  onChange={e => setImportTitle(e.target.value)}
                  placeholder="Título de la canción"
                  className="w-full p-3 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-xs font-bold mb-1.5 block">Artista</label>
                <input
                  type="text"
                  value={importArtist}
                  onChange={e => setImportArtist(e.target.value)}
                  placeholder="Artista o autor"
                  className="w-full p-3 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs font-bold mb-1.5 block">Tonalidad</label>
                <select
                  value={importKey}
                  onChange={e => setImportKey(e.target.value)}
                  className="w-full p-3 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold mb-1.5 block">📚 Himnario destino</label>
                <select
                  value={importHymnal}
                  onChange={e => setImportHymnal(e.target.value)}
                  className="w-full p-3 rounded-xl border text-sm font-semibold"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  {hymnals.map(h => (
                    <option key={h.id} value={h.id}>{h.icon} {h.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="text-xs font-bold mb-1.5 block">Letra y Acordes (edita si es necesario)</label>
              <textarea
                value={importedText}
                onChange={e => setImportedText(e.target.value)}
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
                onClick={() => setShowEditor(false)}
                className="flex-1 py-3 rounded-xl font-bold"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                ‹ Cancelar
              </button>
              <button
                onClick={handleSaveImported}
                disabled={!importTitle.trim()}
                className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                <Save size={18} /> Guardar en {hymnals.find(h => h.id === importHymnal)?.name}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
        <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onClose}
              className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
              style={{ color: 'white' }}
              title="Volver"
            >
              ‹
            </button>
            <h3 className="text-xl font-bold flex-1 text-center">Importar Canciones</h3>
            <div style={{ width: '48px' }}></div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.txt';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const text = ev.target?.result as string;
                      setImportedText(text);
                      setShowEditor(true);
                    };
                    reader.readAsText(file);
                  }
                };
                input.click();
              }}
              className="w-full p-4 rounded-xl border text-left hover:scale-[1.02] transition-all"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center gap-3">
                <FileText size={32} style={{ color: 'var(--accent)' }} />
                <div>
                  <div className="font-bold">Texto (.txt)</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Importar desde archivo de texto</div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.pdf';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    showNotification('Importación de PDF - Procesando...', 'info');
                    // Aquí iría la lógica de extracción de PDF
                  }
                };
                input.click();
              }}
              className="w-full p-4 rounded-xl border text-left hover:scale-[1.02] transition-all"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center gap-3">
                <File size={32} style={{ color: '#ef4444' }} />
                <div>
                  <div className="font-bold">PDF (.pdf)</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Importar desde documento PDF</div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.docx';
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    try {
                      const arrayBuffer = await file.arrayBuffer();
                      const { extractRawText } = await import('mammoth');
                      const result = await extractRawText({ arrayBuffer });
                      setImportedText(result.value);
                      setShowEditor(true);
                    } catch (error) {
                      showNotification('Error al importar Word', 'error');
                    }
                  }
                };
                input.click();
              }}
              className="w-full p-4 rounded-xl border text-left hover:scale-[1.02] transition-all"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center gap-3">
                <File size={32} style={{ color: '#3b82f6' }} />
                <div>
                  <div className="font-bold">Word (.docx)</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Importar desde documento Word</div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => {
                onClose();
                // Abrir modal de imagen
                setTimeout(() => {
                  const event = new CustomEvent('openImageImport');
                  window.dispatchEvent(event);
                }, 100);
              }}
              className="w-full p-4 rounded-xl border text-left hover:scale-[1.02] transition-all"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center gap-3">
                <Camera size={32} style={{ color: '#10b981' }} />
                <div>
                  <div className="font-bold">Imagen (OCR)</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Importar desde foto o captura</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Modo exportación
  if (step === 'choice') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
        <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Exportar Canciones</h3>
            <button onClick={onClose} className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600">
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => { setExportType('single'); setStep('single'); }}
              className="w-full p-4 rounded-xl border text-left hover:scale-[1.02] transition-all"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center gap-3">
                <FileText size={32} style={{ color: 'var(--accent)' }} />
                <div>
                  <div className="font-bold">Archivo Único</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Exportar una sola canción</div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => { setExportType('batch'); setStep('batch'); }}
              className="w-full p-4 rounded-xl border text-left hover:scale-[1.02] transition-all"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center gap-3">
                <File size={32} style={{ color: 'var(--accent)' }} />
                <div>
                  <div className="font-bold">Exportación en Lote</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Exportar múltiples canciones</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'single' || step === 'batch') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
        <div className="w-full max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold">
                {step === 'single' ? 'Seleccionar Canción' : 'Seleccionar Canciones'}
              </h3>
              {step === 'batch' && (
                <p className="text-sm" style={{ color: 'var(--accent)' }}>
                  {selectedSongs.size} canción(es) seleccionada(s)
                </p>
              )}
            </div>
            <button onClick={onClose} className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600">
              <X size={20} />
            </button>
          </div>
          
          {/* Buscador */}
          <div className="relative mb-4">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar canciones..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
          
          {step === 'batch' && (
            <button
              onClick={selectAll}
              className="mb-3 px-4 py-2 rounded-lg text-sm font-bold"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >
              {selectedSongs.size === filteredSongs.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
            </button>
          )}
          
          {/* Lista de canciones */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredSongs.map(song => (
              <div
                key={song.id}
                onClick={() => {
                  if (step === 'single') {
                    setSelectedSongs(new Set([song.id]));
                    setStep('format');
                  } else {
                    toggleSongSelection(song.id);
                  }
                }}
                className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:scale-[1.01] transition-all"
                style={{
                  borderColor: selectedSongs.has(song.id) ? 'var(--accent)' : 'var(--border-color)',
                  backgroundColor: selectedSongs.has(song.id) ? 'var(--accent-light)' : 'var(--bg-secondary)',
                }}
              >
                {step === 'batch' && (
                  <div style={{ color: selectedSongs.has(song.id) ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {selectedSongs.has(song.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-semibold text-sm">{song.title}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {song.code} • {song.artist} • {song.key}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {step === 'batch' && selectedSongs.size > 0 && (
            <button
              onClick={() => setStep('format')}
              className="w-full mt-4 py-3 rounded-xl font-bold"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >
              Continuar →
            </button>
          )}
        </div>
      </div>
    );
  }

  if (step === 'format') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
        <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Seleccionar Formato</h3>
            <button onClick={onClose} className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600">
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => { setExportFormat('text'); handleExport(); }}
              className="w-full p-4 rounded-xl border text-left hover:scale-[1.02] transition-all"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center gap-3">
                <FileText size={32} style={{ color: 'var(--accent)' }} />
                <div>
                  <div className="font-bold">Texto (.txt)</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Archivo de texto plano</div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => { setExportFormat('pdf'); handleExport(); }}
              className="w-full p-4 rounded-xl border text-left hover:scale-[1.02] transition-all"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center gap-3">
                <File size={32} style={{ color: '#ef4444' }} />
                <div>
                  <div className="font-bold">PDF (.pdf)</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Documento PDF</div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => { setExportFormat('word'); handleExport(); }}
              className="w-full p-4 rounded-xl border text-left hover:scale-[1.02] transition-all"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center gap-3">
                <File size={32} style={{ color: '#3b82f6' }} />
                <div>
                  <div className="font-bold">Word (.docx)</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Documento de Word</div>
                </div>
              </div>
            </button>
          </div>
          
          <button
            onClick={() => setStep(exportType)}
            className="w-full mt-4 py-2 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  return null;
}
