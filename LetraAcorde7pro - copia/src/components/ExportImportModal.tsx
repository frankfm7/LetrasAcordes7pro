import { useState, useMemo, useRef } from 'react';
import { X, Download, Upload, FileText, File, Search, CheckSquare, Square, Camera, Save, Edit3, Plus } from 'lucide-react';
import { Song, Hymnal } from '../types';
import { songs as allSongs, hymnals } from '../data/songs';
import { useApp } from '../context/AppContext';
import EditHymnalModal from './EditHymnalModal';

interface ExportImportModalProps {
  onClose: () => void;
  mode: 'export' | 'import';
  showNotification: (msg: string, type?: string) => void;
}

interface ParsedSong {
  title: string;
  artist: string;
  key: string;
  timeSignature: string;
  bpm: number;
  language: string;
  categories: string[];
  lyrics: string;
}

export default function ExportImportModal({ onClose, mode, showNotification }: ExportImportModalProps) {
  const { state, addCustomSong, addMultipleCustomSongs, addCustomHymnal } = useApp();

  // Estados de exportación
  const [exportStep, setExportStep] = useState<'choice' | 'select' | 'format'>('choice');
  const [exportType, setExportType] = useState<'single' | 'batch'>('single');
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Estados de importación
  const [importStep, setImportStep] = useState<'choice' | 'analyze' | 'select-hymnal' | 'edit' | 'select-hymnal-for-save'>('choice');
  const [parsedSongs, setParsedSongs] = useState<ParsedSong[]>([]);
  const [selectedHymnalId, setSelectedHymnalId] = useState<string>('alabanzas');
  const [showCreateHymnal, setShowCreateHymnal] = useState(false);
  const [newHymnalName, setNewHymnalName] = useState('');
  const [editingSongIndex, setEditingSongIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editLyrics, setEditLyrics] = useState('');
  const [showEditHymnalModal, setShowEditHymnalModal] = useState(false);
  const [editingHymnal, setEditingHymnal] = useState<Hymnal | null>(null);
  const [tempHymnalIdForSave, setTempHymnalIdForSave] = useState<string>('alabanzas');

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

  // ========== FUNCIONES DE ANÁLISIS ==========

  const extractTitle = (text: string): string => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length === 0) return 'Sin título';

    // Buscar si la primera línea parece ser notas/acordes
    const firstLine = lines[0].trim();
    const isChords = /^\/\/[A-G]/.test(firstLine) || /^[A-G][#b]?\s+[A-G]/.test(firstLine);

    // Si la primera línea son acordes, el título está en la segunda línea
    if (isChords && lines.length > 1) {
      return lines[1].trim();
    }

    // Buscar línea que empiece con "Título:" o similar
    for (const line of lines.slice(0, 5)) {
      const titleMatch = line.match(/(?:Título|Title|Nombre):\s*(.+)/i);
      if (titleMatch) return titleMatch[1].trim();
    }

    // Si no, usar la primera línea de texto (no acordes)
    return firstLine;
  };

  const parseMultipleSongs = (text: string): ParsedSong[] => {
    const songs: ParsedSong[] = [];

    // Dividir por líneas de separación (3 o más signos =)
    const songBlocks = text.split(/\n\s*={3,}\s*\n/);

    console.log(`Se encontraron ${songBlocks.length} bloques`);

    songBlocks.forEach((block) => {
      if (!block.trim()) return;

      // Extraer metadata
      const artistMatch = block.match(/Artista:\s*(.+)/i);
      const keyMatch = block.match(/Tonalidad:\s*(.+)/i);
      const timeSigMatch = block.match(/Compás:\s*(.+)/i);
      const bpmMatch = block.match(/BPM:\s*(.+)/i);
      const langMatch = block.match(/Idioma:\s*(.+)/i);
      const catMatch = block.match(/Categorías:\s*(.+)/i);

      // Extraer título inteligente
      const title = extractTitle(block);

      // Extraer letra (después de ---)
      const lyricsStart = block.indexOf('---');
      const lyrics = lyricsStart !== -1 ? block.substring(lyricsStart + 3).trim() : block.trim();

      if (title && title !== 'Sin título') {
        songs.push({
          title,
          artist: artistMatch ? artistMatch[1].trim() : 'Desconocido',
          key: keyMatch ? keyMatch[1].trim() : 'C',
          timeSignature: timeSigMatch ? timeSigMatch[1].trim() : '4/4',
          bpm: bpmMatch ? parseInt(bpmMatch[1].trim()) : 100,
          language: langMatch ? langMatch[1].trim() : 'Castellano',
          categories: catMatch ? catMatch[1].split(',').map(c => c.trim()) : ['General'],
          lyrics,
        });
      }
    });

    return songs;
  };

  // ========== FUNCIONES DE EXPORTACIÓN ==========

  const exportAsText = (songs: Song[]) => {
    const content = songs.map((song) => {
      // Incluir acordes en la exportación
      const lyricsWithChords = song.lyrics.trim();

      // Si la canción tiene múltiples idiomas, agregarlos con separador especial
      let multilangContent = '';
      if (song.lyricsByLanguage && Object.keys(song.lyricsByLanguage).length > 1) {
        multilangContent = '\n\n🌐 OTROS IDIOMAS:\n';
        Object.entries(song.lyricsByLanguage).forEach(([lang, text]) => {
          if (lang !== song.language) {
            multilangContent += `\n--- ${lang} ---\n${text.trim()}\n`;
          }
        });
      }

      return `Título: ${song.title}
Artista: ${song.artist}
Tonalidad: ${song.key}
Compás: ${song.timeSignature}
BPM: ${song.bpm}
Idioma: ${song.language}
Categorías: ${song.categories.join(', ')}
---
${lyricsWithChords}${multilangContent}`;
    }).join('\n\n===\n\n');

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

        // Título
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
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

        // Letra CON ACORDES (no remover las líneas que empiezan con //)
        doc.setFontSize(11);
        const lyricsWithChords = song.lyrics.trim();
        const lines = doc.splitTextToSize(lyricsWithChords, 170);
        doc.text(lines, 20, 60);

        // Si tiene múltiples idiomas, agregarlos
        if (song.lyricsByLanguage && Object.keys(song.lyricsByLanguage).length > 1) {
          let yPos = 60 + (lines.length * 5);

          Object.entries(song.lyricsByLanguage).forEach(([lang, text]) => {
            if (lang !== song.language && yPos < 270) {
              if (yPos > 250) {
                doc.addPage();
                yPos = 20;
              }

              doc.setFontSize(9);
              doc.setFont('helvetica', 'italic');
              doc.text(`🌐 ${lang}:`, 20, yPos);
              yPos += 5;

              doc.setFontSize(10);
              doc.setFont('helvetica', 'normal');
              const langLines = doc.splitTextToSize(text.trim(), 170);
              doc.text(langLines, 20, yPos);
              yPos += langLines.length * 5 + 5;
            }
          });
        }
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
        // Incluir acordes en la exportación
        const lyricsWithChords = song.lyrics.trim();

        const paragraphs = [
          new Paragraph({
            text: song.title,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: song.artist, bold: true, size: 24 })],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Tonalidad: ${song.key} | Compás: ${song.timeSignature} | BPM: ${song.bpm}`, size: 20, italics: true })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Idioma: ${song.language} | Categorías: ${song.categories.join(', ')}`, size: 20, italics: true })],
            spacing: { after: 300 },
          }),
          new Paragraph({
            border: { bottom: { color: 'CCCCCC', size: 6, style: BorderStyle.SINGLE } },
            spacing: { after: 300 },
          }),
          ...lyricsWithChords.split('\n').map(line =>
            new Paragraph({
              children: [new TextRun({ text: line, size: 22 })],
              spacing: { after: 100 },
            })
          ),
        ];

        // Si tiene múltiples idiomas, agregarlos
        if (song.lyricsByLanguage && Object.keys(song.lyricsByLanguage).length > 1) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: '\n🌐 OTROS IDIOMAS:', size: 20, bold: true, italics: true })],
              spacing: { before: 300, after: 200 },
            })
          );

          Object.entries(song.lyricsByLanguage).forEach(([lang, text]) => {
            if (lang !== song.language) {
              paragraphs.push(
                new Paragraph({
                  children: [new TextRun({ text: `\n--- ${lang} ---`, size: 18, bold: true })],
                  spacing: { before: 200, after: 100 },
                })
              );

              text.trim().split('\n').forEach(line => {
                paragraphs.push(
                  new Paragraph({
                    children: [new TextRun({ text: line, size: 22 })],
                    spacing: { after: 100 },
                  })
                );
              });
            }
          });
        }

        // Separador entre canciones
        if (index < songs.length - 1) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: '===', size: 20, color: '999999' })],
              spacing: { before: 400, after: 400 },
              alignment: 'center',
            })
          );
        }

        return paragraphs;
      }).flat();

      const doc = new Document({ sections: [{ children: sections }] });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${songs.length === 1 ? songs[0].title : 'canciones'}_${new Date().toISOString().split('T')[0]}.docx`);
      showNotification('Exportado como Word', 'success');
    } catch (error) {
      console.error('Error exporting Word:', error);
      showNotification('Error al exportar Word', 'error');
    }
  };

  const handleExport = (format: 'text' | 'pdf' | 'word') => {
    const songsToExport = exportType === 'single'
      ? [allAvailableSongs.find(s => s.id === Array.from(selectedSongs)[0])!]
      : Array.from(selectedSongs).map(id => allAvailableSongs.find(s => s.id === id)!).filter(Boolean);

    if (songsToExport.length === 0) {
      showNotification('Selecciona al menos una canción', 'error');
      return;
    }

    switch (format) {
      case 'text': exportAsText(songsToExport); break;
      case 'pdf': exportAsPDF(songsToExport); break;
      case 'word': exportAsWord(songsToExport); break;
    }

    onClose();
  };

  // ========== FUNCIONES DE IMPORTACIÓN ==========

  const handleFileImport = async (file: File) => {
    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let text = '';

      if (extension === 'txt') {
        text = await file.text();
      } else if (extension === 'pdf') {
        showNotification('Extrayendo texto del PDF...', 'info');
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          text += pageText + '\n\n';
        }
      } else if (extension === 'docx') {
        showNotification('Extrayendo texto del Word...', 'info');
        const arrayBuffer = await file.arrayBuffer();
        const { extractRawText } = await import('mammoth');
        const result = await extractRawText({ arrayBuffer });
        text = result.value;
      } else {
        showNotification('Formato no soportado', 'error');
        return;
      }

      // Analizar el texto
      const songs = parseMultipleSongs(text);

      if (songs.length === 0) {
        showNotification('No se encontraron canciones en el archivo', 'error');
        return;
      }

      setParsedSongs(songs);

      if (songs.length === 1) {
        // Una sola canción: abrir editor directamente
        setEditingSongIndex(0);
        setEditTitle(songs[0].title);
        setEditLyrics(songs[0].lyrics);
        setImportStep('edit');
      } else {
        // Múltiples canciones: mostrar lista
        setImportStep('select-hymnal');
      }
    } catch (error) {
      console.error('Error importing:', error);
      showNotification('Error al importar', 'error');
    }
  };

  const saveParsedSongs = () => {
    const timestamp = Date.now();
    const newSongs: Song[] = parsedSongs.map((song, index) => ({
      id: `custom-${timestamp}-${index}`,
      title: song.title,
      artist: song.artist,
      code: `IMP${timestamp.toString().slice(-4)}${index}`,
      hymnalId: selectedHymnalId,
      key: song.key,
      timeSignature: song.timeSignature,
      bpm: song.bpm,
      language: song.language,
      categories: song.categories,
      sections: [],
      lyrics: song.lyrics,
      notes: 'Importado desde archivo',
    }));

    addMultipleCustomSongs(newSongs);
    showNotification(`${parsedSongs.length} canciones importadas`, 'success');
    onClose();
  };

  const openHymnalSelectionForSave = () => {
    // Abrir el modal de selección de cancionero
    setTempHymnalIdForSave(selectedHymnalId); // Usar el cancionero actual como valor por defecto
    setImportStep('select-hymnal-for-save');
  };

  const saveEditedSongWithHymnal = () => {
    if (editingSongIndex === null) return;

    const song = parsedSongs[editingSongIndex];
    const newSong: Song = {
      id: `custom-${Date.now()}`,
      title: editTitle,
      artist: song.artist,
      code: `IMP${Date.now().toString().slice(-4)}`,
      hymnalId: tempHymnalIdForSave, // Usar el cancionero seleccionado temporalmente
      key: song.key,
      timeSignature: song.timeSignature,
      bpm: song.bpm,
      language: song.language,
      categories: song.categories,
      sections: [],
      lyrics: editLyrics,
      notes: 'Importado desde archivo',
    };

    addCustomSong(newSong);

    // Eliminar la canción de la lista de canciones detectadas
    const updatedSongs = parsedSongs.filter((_, index) => index !== editingSongIndex);
    setParsedSongs(updatedSongs);

    showNotification('Canción guardada en cancionero', 'success');

    // Volver a la lista de canciones detectadas (no cerrar todo)
    if (updatedSongs.length > 0) {
      setImportStep('select-hymnal');
    } else {
      // Si no quedan canciones, cerrar el modal
      showNotification('Todas las canciones han sido guardadas', 'success');
      onClose();
    }
  };

  const saveChangesOnly = () => {
    if (editingSongIndex === null) return;

    // Actualizar solo en la lista de canciones detectadas
    const updatedSongs = [...parsedSongs];
    updatedSongs[editingSongIndex] = {
      ...updatedSongs[editingSongIndex],
      title: editTitle,
      lyrics: editLyrics,
    };
    setParsedSongs(updatedSongs);

    showNotification('Cambios guardados en la lista', 'success');

    // Volver a la lista de canciones
    if (parsedSongs.length > 1) {
      setImportStep('select-hymnal');
    } else {
      setImportStep('choice');
    }
  };



  const handleSaveNewHymnal = (hymnal: Hymnal) => {
    // Crear el nuevo cancionero
    const newHymnal: Hymnal = {
      ...hymnal,
      id: `custom-${Date.now()}`,
      isCustom: true,
    };

    addCustomHymnal(newHymnal);

    // Actualizar el ID seleccionado después de un pequeño delay para asegurar que el estado se actualice
    setTimeout(() => {
      setSelectedHymnalId(newHymnal.id);
      // Si estamos en el modal de selección de cancionero para guardar, también actualizar ese
      if (importStep === 'select-hymnal-for-save') {
        setTempHymnalIdForSave(newHymnal.id);
      }
    }, 100);

    setShowEditHymnalModal(false);
    setEditingHymnal(null);
    showNotification('Cancionero creado y seleccionado', 'success');
  };

  // ========== RENDERIZADO ==========

  // MODO IMPORTACIÓN
  if (mode === 'import') {
    // Paso 1: Elegir archivo
    if (importStep === 'choice') {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <button onClick={onClose} className="p-3 rounded-full bg-gray-700 hover:bg-gray-600" style={{ color: 'white' }}>‹</button>
              <h3 className="text-xl font-bold flex-1 text-center">Importar Canciones</h3>
              <div style={{ width: '48px' }}></div>
            </div>

            <div className="space-y-3">
              <label className="w-full p-4 rounded-xl border text-left hover:scale-[1.02] transition-all cursor-pointer block" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <input type="file" accept=".txt" onChange={(e) => e.target.files?.[0] && handleFileImport(e.target.files[0])} className="hidden" />
                <div className="flex items-center gap-3">
                  <FileText size={32} style={{ color: 'var(--accent)' }} />
                  <div>
                    <div className="font-bold">Texto (.txt)</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Importar desde archivo de texto</div>
                  </div>
                </div>
              </label>

              <label className="w-full p-4 rounded-xl border text-left hover:scale-[1.02] transition-all cursor-pointer block" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <input type="file" accept=".pdf" onChange={(e) => e.target.files?.[0] && handleFileImport(e.target.files[0])} className="hidden" />
                <div className="flex items-center gap-3">
                  <File size={32} style={{ color: '#ef4444' }} />
                  <div>
                    <div className="font-bold">PDF (.pdf)</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Importar desde documento PDF</div>
                  </div>
                </div>
              </label>

              <label className="w-full p-4 rounded-xl border text-left hover:scale-[1.02] transition-all cursor-pointer block" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <input type="file" accept=".docx" onChange={(e) => e.target.files?.[0] && handleFileImport(e.target.files[0])} className="hidden" />
                <div className="flex items-center gap-3">
                  <File size={32} style={{ color: '#3b82f6' }} />
                  <div>
                    <div className="font-bold">Word (.docx)</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Importar desde documento Word</div>
                  </div>
                </div>
              </label>

              <button
                onClick={() => {
                  onClose();
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

    // Paso 2: Seleccionar cancionero destino
    if (importStep === 'select-hymnal') {
      return (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
            <div className="w-full max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <button onClick={onClose} className="p-3 rounded-full bg-gray-700 hover:bg-gray-600" style={{ color: 'white' }}>‹</button>
                <h3 className="text-xl font-bold flex-1 text-center">Canciones Detectadas ({parsedSongs.length})</h3>
                <div style={{ width: '48px' }}></div>
              </div>

              <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: 'var(--accent-light)', border: '2px solid var(--accent)' }}>
                <p className="text-sm font-semibold mb-2">📍 ¿Dónde guardar las canciones?</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Se detectaron {parsedSongs.length} canciones. Elige un cancionero existente o crea uno nuevo.
                </p>
              </div>

              <div className="space-y-2 mb-4">
                <label className="text-xs font-bold mb-1.5 block">Seleccionar Cancionero</label>
                <div className="flex gap-2">
                  <select
                    value={selectedHymnalId}
                    onChange={e => setSelectedHymnalId(e.target.value)}
                    className="flex-1 p-3 rounded-xl border text-sm"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    {[...hymnals, ...state.customHymnals].map(h => (
                      <option key={h.id} value={h.id}>{h.icon} {h.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      setEditingHymnal({
                        id: `new-${Date.now()}`,
                        name: '',
                        description: '',
                        language: 'Castellano',
                        icon: '🎵',
                        color: '#a855f7',
                        isCustom: true,
                        codePrefix: '',
                      });
                      setShowEditHymnalModal(true);
                    }}
                    className="px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2"
                    style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                  >
                    <Plus size={16} /> Crear Nuevo Cancionero
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                {parsedSongs.map((song, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-xl border"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{song.title}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {song.artist} • {song.key} • {song.language}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setEditingSongIndex(index);
                          setEditTitle(song.title);
                          setEditLyrics(song.lyrics);
                          setImportStep('edit');
                        }}
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: 'var(--bg-tertiary)' }}
                        title="Editar esta canción"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setImportStep('choice')}
                  className="flex-1 py-3 rounded-xl font-bold"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  ‹ Cancelar
                </button>
                <button
                  onClick={saveParsedSongs}
                  className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                >
                  <Save size={18} /> Guardar {parsedSongs.length} Canciones
                </button>
              </div>
            </div>
          </div>

          {/* Modal de crear nuevo cancionero */}
          {showEditHymnalModal && editingHymnal && (
            <EditHymnalModal
              hymnal={editingHymnal}
              onClose={() => {
                setShowEditHymnalModal(false);
                setEditingHymnal(null);
              }}
              onSave={handleSaveNewHymnal}
            />
          )}
        </>
      );
    }

    // Paso 3: Editar canción individual
    if (importStep === 'edit' && editingSongIndex !== null) {
      const song = parsedSongs[editingSongIndex];

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
          <div className="w-full max-w-3xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  if (parsedSongs.length > 1) {
                    setImportStep('select-hymnal');
                  } else {
                    setImportStep('choice');
                  }
                }}
                className="p-3 rounded-full bg-gray-700 hover:bg-gray-600"
                style={{ color: 'white' }}
              >
                ‹
              </button>
              <h3 className="text-xl font-bold flex-1 text-center">Editar Canción</h3>
              <div style={{ width: '48px' }}></div>
            </div>

            <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                💡 Los cambios se guardarán en la lista de canciones detectadas. Podrás exportarlas o guardarlas en un cancionero después.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold mb-1.5 block">Título *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="Título de la canción"
                  className="w-full p-3 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="text-xs font-bold mb-1.5 block">Letra y Acordes</label>
                <textarea
                  value={editLyrics}
                  onChange={e => setEditLyrics(e.target.value)}
                  rows={15}
                  className="w-full p-3 rounded-xl border text-sm font-mono"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="Edita la letra y agrega los acordes con // al inicio de cada línea"
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  💡 Usa // antes de los acordes. Ejemplo: //Am F Em Am
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    if (parsedSongs.length > 1) {
                      setImportStep('select-hymnal');
                    } else {
                      setImportStep('choice');
                    }
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-sm"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  ‹ Cancelar
                </button>
                <button
                  onClick={saveChangesOnly}
                  disabled={!editTitle.trim()}
                  className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                >
                  💾 Guardar cambios
                </button>
                <button
                  onClick={openHymnalSelectionForSave}
                  disabled={!editTitle.trim()}
                  className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                >
                  💾 Guardar esta canción en cancionero
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Paso 4: Seleccionar cancionero para guardar canción individual
    if (importStep === 'select-hymnal-for-save' && editingSongIndex !== null) {
      return (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
            <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setImportStep('edit')}
                  className="p-3 rounded-full bg-gray-700 hover:bg-gray-600"
                  style={{ color: 'white' }}
                >
                  ‹
                </button>
                <h3 className="text-xl font-bold flex-1 text-center">¿Dónde guardar esta canción?</h3>
                <div style={{ width: '48px' }}></div>
              </div>

            <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: 'var(--accent-light)', border: '2px solid var(--accent)' }}>
              <p className="text-sm font-semibold mb-2">📍 Selecciona el cancionero destino</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                La canción "{editTitle}" se guardará en el cancionero que selecciones.
              </p>
            </div>

            <div className="space-y-3 mb-4">
              <label className="text-xs font-bold mb-1.5 block">Cancionero</label>
              <div className="flex gap-2">
                <select
                  value={tempHymnalIdForSave}
                  onChange={e => setTempHymnalIdForSave(e.target.value)}
                  className="flex-1 p-3 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  {[...hymnals, ...state.customHymnals].map(h => (
                    <option key={h.id} value={h.id}>{h.icon} {h.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setEditingHymnal({
                      id: `new-${Date.now()}`,
                      name: '',
                      description: '',
                      language: 'Castellano',
                      icon: '🎵',
                      color: '#a855f7',
                      isCustom: true,
                      codePrefix: '',
                    });
                    setShowEditHymnalModal(true);
                  }}
                  className="px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2"
                  style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                >
                  <Plus size={16} /> Crear Nuevo Cancionero
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setImportStep('edit')}
                className="flex-1 py-3 rounded-xl font-bold"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                ‹ Cancelar
              </button>
              <button
                onClick={saveEditedSongWithHymnal}
                className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                <Save size={18} /> Guardar en Cancionero
              </button>
            </div>
          </div>
        </div>

        {/* Modal de crear nuevo cancionero */}
        {showEditHymnalModal && editingHymnal && (
          <EditHymnalModal
            hymnal={editingHymnal}
            onClose={() => {
              setShowEditHymnalModal(false);
              setEditingHymnal(null);
            }}
            onSave={handleSaveNewHymnal}
          />
        )}
      </>
      );
    }
  }

  // MODO EXPORTACIÓN
  if (exportStep === 'choice') {
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
              onClick={() => { setExportType('single'); setExportStep('select'); }}
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
              onClick={() => { setExportType('batch'); setExportStep('select'); }}
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

  if (exportStep === 'select') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
        <div className="w-full max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold">
                {exportType === 'single' ? 'Seleccionar Canción' : 'Seleccionar Canciones'}
              </h3>
              {exportType === 'batch' && (
                <p className="text-sm" style={{ color: 'var(--accent)' }}>
                  {selectedSongs.size} canción(es) seleccionada(s)
                </p>
              )}
            </div>
            <button onClick={onClose} className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600">
              <X size={20} />
            </button>
          </div>

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

          {exportType === 'batch' && (
            <button
              onClick={() => {
                if (selectedSongs.size === filteredSongs.length) {
                  setSelectedSongs(new Set());
                } else {
                  setSelectedSongs(new Set(filteredSongs.map(s => s.id)));
                }
              }}
              className="mb-3 px-4 py-2 rounded-lg text-sm font-bold"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >
              {selectedSongs.size === filteredSongs.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
            </button>
          )}

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredSongs.map(song => (
              <div
                key={song.id}
                onClick={() => {
                  if (exportType === 'single') {
                    setSelectedSongs(new Set([song.id]));
                    setExportStep('format');
                  } else {
                    const newSelected = new Set(selectedSongs);
                    if (newSelected.has(song.id)) {
                      newSelected.delete(song.id);
                    } else {
                      newSelected.add(song.id);
                    }
                    setSelectedSongs(newSelected);
                  }
                }}
                className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:scale-[1.01] transition-all"
                style={{
                  borderColor: selectedSongs.has(song.id) ? 'var(--accent)' : 'var(--border-color)',
                  backgroundColor: selectedSongs.has(song.id) ? 'var(--accent-light)' : 'var(--bg-secondary)',
                }}
              >
                {exportType === 'batch' && (
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

          {exportType === 'batch' && selectedSongs.size > 0 && (
            <button
              onClick={() => setExportStep('format')}
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

  if (exportStep === 'format') {
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
              onClick={() => handleExport('text')}
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
              onClick={() => handleExport('pdf')}
              className="w-full p-4 rounded-xl border text-left hover:scale-[1.02] transition-all"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center gap-3">
                <File size={32} style={{ color: '#ef4444' }} />
                <div>
                  <div className="font-bold">PDF (.pdf)</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Documento PDF con formato</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleExport('word')}
              className="w-full p-4 rounded-xl border text-left hover:scale-[1.02] transition-all"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center gap-3">
                <File size={32} style={{ color: '#3b82f6' }} />
                <div>
                  <div className="font-bold">Word (.docx)</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Documento de Word con formato</div>
                </div>
              </div>
            </button>
          </div>

          <button
            onClick={() => setExportStep('select')}
            className="w-full mt-4 py-2 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  // Modal de crear nuevo cancionero
  if (showEditHymnalModal && editingHymnal) {
    return (
      <>
        <EditHymnalModal
          hymnal={editingHymnal}
          onClose={() => {
            setShowEditHymnalModal(false);
            setEditingHymnal(null);
          }}
          onSave={handleSaveNewHymnal}
        />
      </>
    );
  }

  return null;
}


+++ src/components/ExportImportModal.tsx (修改后)
import { useState, useMemo, useRef } from 'react';
import { X, Download, Upload, FileText, File, Search, CheckSquare, Square, Camera, Save, Edit3, Plus } from 'lucide-react';
import { Song, Hymnal } from '../types';
import { songs as allSongs, hymnals } from '../data/songs';
import { useApp } from '../context/AppContext';
import EditHymnalModal from './EditHymnalModal';

interface ExportImportModalProps {
  onClose: () => void;
  mode: 'export' | 'import';
  showNotification: (msg: string, type?: string) => void;
}

interface ParsedSong {
  title: string;
  artist: string;
  key: string;
  timeSignature: string;
  bpm: number;
  language: string;
  categories: string[];
  lyrics: string;
}

export default function ExportImportModal({ onClose, mode, showNotification }: ExportImportModalProps) {
  const { state, addCustomSong, addMultipleCustomSongs, addCustomHymnal } = useApp();

  // Estados de exportación
  const [exportStep, setExportStep] = useState<'choice' | 'select' | 'format'>('choice');
  const [exportType, setExportType] = useState<'single' | 'batch'>('single');
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Estados de importación
  const [importStep, setImportStep] = useState<'choice' | 'analyze' | 'select-hymnal' | 'edit' | 'select-hymnal-for-save'>('choice');
  const [parsedSongs, setParsedSongs] = useState<ParsedSong[]>([]);
  const [selectedHymnalId, setSelectedHymnalId] = useState<string>('alabanzas');
  const [showCreateHymnal, setShowCreateHymnal] = useState(false);
  const [newHymnalName, setNewHymnalName] = useState('');
  const [editingSongIndex, setEditingSongIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editLyrics, setEditLyrics] = useState('');
  const [showEditHymnalModal, setShowEditHymnalModal] = useState(false);
  const [editingHymnal, setEditingHymnal] = useState<Hymnal | null>(null);
  const [tempHymnalIdForSave, setTempHymnalIdForSave] = useState<string>('alabanzas');

  const allAvailableSongs = useMemo(() => {
    const obsoleteHymnalIds = ['alabanzas', 'bautista', 'cala', 'quechua'];
    const validPredefinedSongs = allSongs.filter(song => !obsoleteHymnalIds.includes(song.hymnalId));
    const validCustomSongs = state.customSongs.filter(song => !obsoleteHymnalIds.includes(song.hymnalId));
    const customSongsMap = new Map(validCustomSongs.map(s => [s.id, s]));
    const combinedSongs = validPredefinedSongs.map(song => customSongsMap.get(song.id) || song);
    const defaultSongIds = new Set(validPredefinedSongs.map(s => s.id));
    const newCustomSongs = validCustomSongs.filter(s => !defaultSongIds.has(s.id));
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

  // ========== FUNCIONES DE ANÁLISIS ==========

  const extractTitle = (text: string): string => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length === 0) return 'Sin título';

    // Buscar si la primera línea parece ser notas/acordes
    const firstLine = lines[0].trim();
    const isChords = /^\/\/[A-G]/.test(firstLine) || /^[A-G][#b]?\s+[A-G]/.test(firstLine);

    // Si la primera línea son acordes, el título está en la segunda línea
    if (isChords && lines.length > 1) {
      return lines[1].trim();
    }

    // Buscar línea que empiece con "Título:" o similar
    for (const line of lines.slice(0, 5)) {
      const titleMatch = line.match(/(?:Título|Title|Nombre):\s*(.+)/i);
      if (titleMatch) return titleMatch[1].trim();
    }

    // Si no, usar la primera línea de texto (no acordes)
    return firstLine;
  };

  const parseMultipleSongs = (text: string): ParsedSong[] => {
    const songs: ParsedSong[] = [];

    // Dividir por líneas de separación (3 o más signos =)
    const songBlocks = text.split(/\n\s*={3,}\s*\n/);

    console.log(`Se encontraron ${songBlocks.length} bloques`);

    songBlocks.forEach((block) => {
      if (!block.trim()) return;

      // Extraer metadata
      const artistMatch = block.match(/Artista:\s*(.+)/i);
      const keyMatch = block.match(/Tonalidad:\s*(.+)/i);
      const timeSigMatch = block.match(/Compás:\s*(.+)/i);
      const bpmMatch = block.match(/BPM:\s*(.+)/i);
      const langMatch = block.match(/Idioma:\s*(.+)/i);
      const catMatch = block.match(/Categorías:\s*(.+)/i);

      // Extraer título inteligente
      const title = extractTitle(block);

      // Extraer letra (después de ---)
      const lyricsStart = block.indexOf('---');
      const lyrics = lyricsStart !== -1 ? block.substring(lyricsStart + 3).trim() : block.trim();

      if (title && title !== 'Sin título') {
        songs.push({
          title,
          artist: artistMatch ? artistMatch[1].trim() : 'Desconocido',
          key: keyMatch ? keyMatch[1].trim() : 'C',
          timeSignature: timeSigMatch ? timeSigMatch[1].trim() : '4/4',
          bpm: bpmMatch ? parseInt(bpmMatch[1].trim()) : 100,
          language: langMatch ? langMatch[1].trim() : 'Castellano',
          categories: catMatch ? catMatch[1].split(',').map(c => c.trim()) : ['General'],
          lyrics,
        });
      }
    });

    return songs;
  };

  // ========== FUNCIONES DE EXPORTACIÓN ==========

  const exportAsText = (songs: Song[]) => {
    const content = songs.map((song) => {
      // Incluir acordes en la exportación
      const lyricsWithChords = song.lyrics.trim();

      // Si la canción tiene múltiples idiomas, agregarlos con separador especial
      let multilangContent = '';
      if (song.lyricsByLanguage && Object.keys(song.lyricsByLanguage).length > 1) {
        multilangContent = '\n\n🌐 OTROS IDIOMAS:\n';
        Object.entries(song.lyricsByLanguage).forEach(([lang, text]) => {
          if (lang !== song.language) {
            multilangContent += `\n--- ${lang} ---\n${text.trim()}\n`;
          }
        });
      }

      return `Título: ${song.title}
Artista: ${song.artist}
Tonalidad: ${song.key}
Compás: ${song.timeSignature}
BPM: ${song.bpm}
Idioma: ${song.language}
Categorías: ${song.categories.join(', ')}
---
${lyricsWithChords}${multilangContent}`;
    }).join('\n\n===\n\n');

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

        // Título
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
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

        // Letra CON ACORDES (no remover las líneas que empiezan con //)
        doc.setFontSize(11);
        const lyricsWithChords = song.lyrics.trim();
        const lines = doc.splitTextToSize(lyricsWithChords, 170);
        doc.text(lines, 20, 60);

        // Si tiene múltiples idiomas, agregarlos
        if (song.lyricsByLanguage && Object.keys(song.lyricsByLanguage).length > 1) {
          let yPos = 60 + (lines.length * 5);

          Object.entries(song.lyricsByLanguage).forEach(([lang, text]) => {
            if (lang !== song.language && yPos < 270) {
              if (yPos > 250) {
                doc.addPage();
                yPos = 20;
              }

              doc.setFontSize(9);
              doc.setFont('helvetica', 'italic');
              doc.text(`🌐 ${lang}:`, 20, yPos);
              yPos += 5;

              doc.setFontSize(10);
              doc.setFont('helvetica', 'normal');
              const langLines = doc.splitTextToSize(text.trim(), 170);
              doc.text(langLines, 20, yPos);
              yPos += langLines.length * 5 + 5;
            }
          });
        }
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
        // Incluir acordes en la exportación
        const lyricsWithChords = song.lyrics.trim();

        const paragraphs = [
          new Paragraph({
            text: song.title,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: song.artist, bold: true, size: 24 })],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Tonalidad: ${song.key} | Compás: ${song.timeSignature} | BPM: ${song.bpm}`, size: 20, italics: true })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Idioma: ${song.language} | Categorías: ${song.categories.join(', ')}`, size: 20, italics: true })],
            spacing: { after: 300 },
          }),
          new Paragraph({
            border: { bottom: { color: 'CCCCCC', size: 6, style: BorderStyle.SINGLE } },
            spacing: { after: 300 },
          }),
          ...lyricsWithChords.split('\n').map(line =>
            new Paragraph({
              children: [new TextRun({ text: line, size: 22 })],
              spacing: { after: 100 },
            })
          ),
        ];

        // Si tiene múltiples idiomas, agregarlos
        if (song.lyricsByLanguage && Object.keys(song.lyricsByLanguage).length > 1) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: '\n🌐 OTROS IDIOMAS:', size: 20, bold: true, italics: true })],
              spacing: { before: 300, after: 200 },
            })
          );

          Object.entries(song.lyricsByLanguage).forEach(([lang, text]) => {
            if (lang !== song.language) {
              paragraphs.push(
                new Paragraph({
                  children: [new TextRun({ text: `\n--- ${lang} ---`, size: 18, bold: true })],
                  spacing: { before: 200, after: 100 },
                })
              );

              text.trim().split('\n').forEach(line => {
                paragraphs.push(
                  new Paragraph({
                    children: [new TextRun({ text: line, size: 22 })],
                    spacing: { after: 100 },
                  })
                );
              });
            }
          });
        }

        // Separador entre canciones
        if (index < songs.length - 1) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: '===', size: 20, color: '999999' })],
              spacing: { before: 400, after: 400 },
              alignment: 'center',
            })
          );
        }

        return paragraphs;
      }).flat();

      const doc = new Document({ sections: [{ children: sections }] });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${songs.length === 1 ? songs[0].title : 'canciones'}_${new Date().toISOString().split('T')[0]}.docx`);
      showNotification('Exportado como Word', 'success');
    } catch (error) {
      console.error('Error exporting Word:', error);
      showNotification('Error al exportar Word', 'error');
    }
  };

  const handleExport = (format: 'text' | 'pdf' | 'word') => {
    const songsToExport = exportType === 'single'
      ? [allAvailableSongs.find(s => s.id === Array.from(selectedSongs)[0])!]
      : Array.from(selectedSongs).map(id => allAvailableSongs.find(s => s.id === id)!).filter(Boolean);

    if (songsToExport.length === 0) {
      showNotification('Selecciona al menos una canción', 'error');
      return;
    }

    switch (format) {
      case 'text': exportAsText(songsToExport); break;
      case 'pdf': exportAsPDF(songsToExport); break;
      case 'word': exportAsWord(songsToExport); break;
    }

    onClose();
  };

  // ========== FUNCIONES DE IMPORTACIÓN ==========

  const handleFileImport = async (file: File) => {
    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let text = '';

      if (extension === 'txt') {
        text = await file.text();
      } else if (extension === 'pdf') {
        showNotification('Extrayendo texto del PDF...', 'info');
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          text += pageText + '\n\n';
        }
      } else if (extension === 'docx') {
        showNotification('Extrayendo texto del Word...', 'info');
        const arrayBuffer = await file.arrayBuffer();
        const { extractRawText } = await import('mammoth');
        const result = await extractRawText({ arrayBuffer });
        text = result.value;
      } else {
        showNotification('Formato no soportado', 'error');
        return;
      }

      // Analizar el texto
      const songs = parseMultipleSongs(text);

      if (songs.length === 0) {
        showNotification('No se encontraron canciones en el archivo', 'error');
        return;
      }

      setParsedSongs(songs);

      if (songs.length === 1) {
        // Una sola canción: abrir editor directamente
        setEditingSongIndex(0);
        setEditTitle(songs[0].title);
        setEditLyrics(songs[0].lyrics);
        setImportStep('edit');
      } else {
        // Múltiples canciones: mostrar lista
        setImportStep('select-hymnal');
      }
    } catch (error) {
      console.error('Error importing:', error);
      showNotification('Error al importar', 'error');
    }
  };

  const saveParsedSongs = () => {
    const timestamp = Date.now();
    const newSongs: Song[] = parsedSongs.map((song, index) => ({
      id: `custom-${timestamp}-${index}`,
      title: song.title,
      artist: song.artist,
      code: `IMP${timestamp.toString().slice(-4)}${index}`,
      hymnalId: selectedHymnalId,
      key: song.key,
      timeSignature: song.timeSignature,
      bpm: song.bpm,
      language: song.language,
      categories: song.categories,
      sections: [],
      lyrics: song.lyrics,
      notes: 'Importado desde archivo',
    }));

    addMultipleCustomSongs(newSongs);
    showNotification(`${parsedSongs.length} canciones importadas`, 'success');
    onClose();
  };

  const openHymnalSelectionForSave = () => {
    // Abrir el modal de selección de cancionero
    setTempHymnalIdForSave(selectedHymnalId); // Usar el cancionero actual como valor por defecto
    setImportStep('select-hymnal-for-save');
  };

  const saveEditedSongWithHymnal = () => {
    if (editingSongIndex === null) return;

    const song = parsedSongs[editingSongIndex];
    const newSong: Song = {
      id: `custom-${Date.now()}`,
      title: editTitle,
      artist: song.artist,
      code: `IMP${Date.now().toString().slice(-4)}`,
      hymnalId: tempHymnalIdForSave, // Usar el cancionero seleccionado temporalmente
      key: song.key,
      timeSignature: song.timeSignature,
      bpm: song.bpm,
      language: song.language,
      categories: song.categories,
      sections: [],
      lyrics: editLyrics,
      notes: 'Importado desde archivo',
    };

    addCustomSong(newSong);

    // Eliminar la canción de la lista de canciones detectadas
    const updatedSongs = parsedSongs.filter((_, index) => index !== editingSongIndex);
    setParsedSongs(updatedSongs);

    showNotification('Canción guardada en cancionero', 'success');

    // Volver a la lista de canciones detectadas (no cerrar todo)
    if (updatedSongs.length > 0) {
      setImportStep('select-hymnal');
    } else {
      // Si no quedan canciones, cerrar el modal
      showNotification('Todas las canciones han sido guardadas', 'success');
      onClose();
    }
  };

  const saveChangesOnly = () => {
    if (editingSongIndex === null) return;

    // Actualizar solo en la lista de canciones detectadas
    const updatedSongs = [...parsedSongs];
    updatedSongs[editingSongIndex] = {
      ...updatedSongs[editingSongIndex],
      title: editTitle,
      lyrics: editLyrics,
    };
    setParsedSongs(updatedSongs);

    showNotification('Cambios guardados en la lista', 'success');

    // Volver a la lista de canciones
    if (parsedSongs.length > 1) {
      setImportStep('select-hymnal');
    } else {
      setImportStep('choice');
    }
  };



  const handleSaveNewHymnal = (hymnal: Hymnal) => {
    // Crear el nuevo cancionero
    const newHymnal: Hymnal = {
      ...hymnal,
      id: `custom-${Date.now()}`,
      isCustom: true,
    };

    addCustomHymnal(newHymnal);

    // Actualizar el ID seleccionado después de un pequeño delay para asegurar que el estado se actualice
    setTimeout(() => {
      setSelectedHymnalId(newHymnal.id);
      // Si estamos en el modal de selección de cancionero para guardar, también actualizar ese
      if (importStep === 'select-hymnal-for-save') {
        setTempHymnalIdForSave(newHymnal.id);
      }
    }, 100);

    setShowEditHymnalModal(false);
    setEditingHymnal(null);
    showNotification('Cancionero creado y seleccionado', 'success');
  };

  // ========== RENDERIZADO ==========

  // MODO IMPORTACIÓN
  if (mode === 'import') {
    // Paso 1: Elegir archivo
    if (importStep === 'choice') {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <button onClick={onClose} className="p-3 rounded-full bg-gray-700 hover:bg-gray-600" style={{ color: 'white' }}>‹</button>
              <h3 className="text-xl font-bold flex-1 text-center">Importar Canciones</h3>
              <div style={{ width: '48px' }}></div>
            </div>

            <div className="space-y-3">
              <label className="w-full p-4 rounded-xl border text-left hover:scale-[1.02] transition-all cursor-pointer block" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <input type="file" accept=".txt" onChange={(e) => e.target.files?.[0] && handleFileImport(e.target.files[0])} className="hidden" />
                <div className="flex items-center gap-3">
                  <FileText size={32} style={{ color: 'var(--accent)' }} />
                  <div>
                    <div className="font-bold">Texto (.txt)</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Importar desde archivo de texto</div>
                  </div>
                </div>
              </label>

              <label className="w-full p-4 rounded-xl border text-left hover:scale-[1.02] transition-all cursor-pointer block" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <input type="file" accept=".pdf" onChange={(e) => e.target.files?.[0] && handleFileImport(e.target.files[0])} className="hidden" />
                <div className="flex items-center gap-3">
                  <File size={32} style={{ color: '#ef4444' }} />
                  <div>
                    <div className="font-bold">PDF (.pdf)</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Importar desde documento PDF</div>
                  </div>
                </div>
              </label>

              <label className="w-full p-4 rounded-xl border text-left hover:scale-[1.02] transition-all cursor-pointer block" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <input type="file" accept=".docx" onChange={(e) => e.target.files?.[0] && handleFileImport(e.target.files[0])} className="hidden" />
                <div className="flex items-center gap-3">
                  <File size={32} style={{ color: '#3b82f6' }} />
                  <div>
                    <div className="font-bold">Word (.docx)</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Importar desde documento Word</div>
                  </div>
                </div>
              </label>

              <button
                onClick={() => {
                  onClose();
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

    // Paso 2: Seleccionar cancionero destino
    if (importStep === 'select-hymnal') {
      return (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
            <div className="w-full max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <button onClick={onClose} className="p-3 rounded-full bg-gray-700 hover:bg-gray-600" style={{ color: 'white' }}>‹</button>
                <h3 className="text-xl font-bold flex-1 text-center">Canciones Detectadas ({parsedSongs.length})</h3>
                <div style={{ width: '48px' }}></div>
              </div>

              <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: 'var(--accent-light)', border: '2px solid var(--accent)' }}>
                <p className="text-sm font-semibold mb-2">📍 ¿Dónde guardar las canciones?</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Se detectaron {parsedSongs.length} canciones. Elige un cancionero existente o crea uno nuevo.
                </p>
              </div>

              <div className="space-y-2 mb-4">
                <label className="text-xs font-bold mb-1.5 block">Seleccionar Cancionero</label>
                <div className="flex gap-2">
                  <select
                    value={selectedHymnalId}
                    onChange={e => setSelectedHymnalId(e.target.value)}
                    className="flex-1 p-3 rounded-xl border text-sm"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    {[...hymnals, ...state.customHymnals].map(h => (
                      <option key={h.id} value={h.id}>{h.icon} {h.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      setEditingHymnal({
                        id: `new-${Date.now()}`,
                        name: '',
                        description: '',
                        language: 'Castellano',
                        icon: '🎵',
                        color: '#a855f7',
                        isCustom: true,
                        codePrefix: '',
                      });
                      setShowEditHymnalModal(true);
                    }}
                    className="px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2"
                    style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                  >
                    <Plus size={16} /> Crear Nuevo Cancionero
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                {parsedSongs.map((song, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-xl border"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{song.title}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {song.artist} • {song.key} • {song.language}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setEditingSongIndex(index);
                          setEditTitle(song.title);
                          setEditLyrics(song.lyrics);
                          setImportStep('edit');
                        }}
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: 'var(--bg-tertiary)' }}
                        title="Editar esta canción"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setImportStep('choice')}
                  className="flex-1 py-3 rounded-xl font-bold"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  ‹ Cancelar
                </button>
                <button
                  onClick={saveParsedSongs}
                  className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                >
                  <Save size={18} /> Guardar {parsedSongs.length} Canciones
                </button>
              </div>
            </div>
          </div>

          {/* Modal de crear nuevo cancionero */}
          {showEditHymnalModal && editingHymnal && (
            <EditHymnalModal
              hymnal={editingHymnal}
              onClose={() => {
                setShowEditHymnalModal(false);
                setEditingHymnal(null);
              }}
              onSave={handleSaveNewHymnal}
            />
          )}
        </>
      );
    }

    // Paso 3: Editar canción individual
    if (importStep === 'edit' && editingSongIndex !== null) {
      const song = parsedSongs[editingSongIndex];

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
          <div className="w-full max-w-3xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  if (parsedSongs.length > 1) {
                    setImportStep('select-hymnal');
                  } else {
                    setImportStep('choice');
                  }
                }}
                className="p-3 rounded-full bg-gray-700 hover:bg-gray-600"
                style={{ color: 'white' }}
              >
                ‹
              </button>
              <h3 className="text-xl font-bold flex-1 text-center">Editar Canción</h3>
              <div style={{ width: '48px' }}></div>
            </div>

            <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                💡 Los cambios se guardarán en la lista de canciones detectadas. Podrás exportarlas o guardarlas en un cancionero después.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold mb-1.5 block">Título *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="Título de la canción"
                  className="w-full p-3 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="text-xs font-bold mb-1.5 block">Letra y Acordes</label>
                <textarea
                  value={editLyrics}
                  onChange={e => setEditLyrics(e.target.value)}
                  rows={15}
                  className="w-full p-3 rounded-xl border text-sm font-mono"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="Edita la letra y agrega los acordes con // al inicio de cada línea"
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  💡 Usa // antes de los acordes. Ejemplo: //Am F Em Am
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    if (parsedSongs.length > 1) {
                      setImportStep('select-hymnal');
                    } else {
                      setImportStep('choice');
                    }
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-sm"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  ‹ Cancelar
                </button>
                <button
                  onClick={saveChangesOnly}
                  disabled={!editTitle.trim()}
                  className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                >
                  💾 Guardar cambios
                </button>
                <button
                  onClick={openHymnalSelectionForSave}
                  disabled={!editTitle.trim()}
                  className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                >
                  💾 Guardar esta canción en cancionero
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Paso 4: Seleccionar cancionero para guardar canción individual
    if (importStep === 'select-hymnal-for-save' && editingSongIndex !== null) {
      return (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
            <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setImportStep('edit')}
                  className="p-3 rounded-full bg-gray-700 hover:bg-gray-600"
                  style={{ color: 'white' }}
                >
                  ‹
                </button>
                <h3 className="text-xl font-bold flex-1 text-center">¿Dónde guardar esta canción?</h3>
                <div style={{ width: '48px' }}></div>
              </div>

            <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: 'var(--accent-light)', border: '2px solid var(--accent)' }}>
              <p className="text-sm font-semibold mb-2">📍 Selecciona el cancionero destino</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                La canción "{editTitle}" se guardará en el cancionero que selecciones.
              </p>
            </div>

            <div className="space-y-3 mb-4">
              <label className="text-xs font-bold mb-1.5 block">Cancionero</label>
              <div className="flex gap-2">
                <select
                  value={tempHymnalIdForSave}
                  onChange={e => setTempHymnalIdForSave(e.target.value)}
                  className="flex-1 p-3 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  {[...hymnals, ...state.customHymnals].map(h => (
                    <option key={h.id} value={h.id}>{h.icon} {h.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setEditingHymnal({
                      id: `new-${Date.now()}`,
                      name: '',
                      description: '',
                      language: 'Castellano',
                      icon: '🎵',
                      color: '#a855f7',
                      isCustom: true,
                      codePrefix: '',
                    });
                    setShowEditHymnalModal(true);
                  }}
                  className="px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2"
                  style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                >
                  <Plus size={16} /> Crear Nuevo Cancionero
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setImportStep('edit')}
                className="flex-1 py-3 rounded-xl font-bold"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                ‹ Cancelar
              </button>
              <button
                onClick={saveEditedSongWithHymnal}
                className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                <Save size={18} /> Guardar en Cancionero
              </button>
            </div>
          </div>
        </div>

        {/* Modal de crear nuevo cancionero */}
        {showEditHymnalModal && editingHymnal && (
          <EditHymnalModal
            hymnal={editingHymnal}
            onClose={() => {
              setShowEditHymnalModal(false);
              setEditingHymnal(null);
            }}
            onSave={handleSaveNewHymnal}
          />
        )}
      </>
      );
    }
  }

  // MODO EXPORTACIÓN
  if (exportStep === 'choice') {
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
              onClick={() => { setExportType('single'); setExportStep('select'); }}
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
              onClick={() => { setExportType('batch'); setExportStep('select'); }}
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

  if (exportStep === 'select') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
        <div className="w-full max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold">
                {exportType === 'single' ? 'Seleccionar Canción' : 'Seleccionar Canciones'}
              </h3>
              {exportType === 'batch' && (
                <p className="text-sm" style={{ color: 'var(--accent)' }}>
                  {selectedSongs.size} canción(es) seleccionada(s)
                </p>
              )}
            </div>
            <button onClick={onClose} className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600">
              <X size={20} />
            </button>
          </div>

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

          {exportType === 'batch' && (
            <button
              onClick={() => {
                if (selectedSongs.size === filteredSongs.length) {
                  setSelectedSongs(new Set());
                } else {
                  setSelectedSongs(new Set(filteredSongs.map(s => s.id)));
                }
              }}
              className="mb-3 px-4 py-2 rounded-lg text-sm font-bold"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >
              {selectedSongs.size === filteredSongs.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
            </button>
          )}

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredSongs.map(song => (
              <div
                key={song.id}
                onClick={() => {
                  if (exportType === 'single') {
                    setSelectedSongs(new Set([song.id]));
                    setExportStep('format');
                  } else {
                    const newSelected = new Set(selectedSongs);
                    if (newSelected.has(song.id)) {
                      newSelected.delete(song.id);
                    } else {
                      newSelected.add(song.id);
                    }
                    setSelectedSongs(newSelected);
                  }
                }}
                className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:scale-[1.01] transition-all"
                style={{
                  borderColor: selectedSongs.has(song.id) ? 'var(--accent)' : 'var(--border-color)',
                  backgroundColor: selectedSongs.has(song.id) ? 'var(--accent-light)' : 'var(--bg-secondary)',
                }}
              >
                {exportType === 'batch' && (
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

          {exportType === 'batch' && selectedSongs.size > 0 && (
            <button
              onClick={() => setExportStep('format')}
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

  if (exportStep === 'format') {
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
              onClick={() => handleExport('text')}
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
              onClick={() => handleExport('pdf')}
              className="w-full p-4 rounded-xl border text-left hover:scale-[1.02] transition-all"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center gap-3">
                <File size={32} style={{ color: '#ef4444' }} />
                <div>
                  <div className="font-bold">PDF (.pdf)</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Documento PDF con formato</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleExport('word')}
              className="w-full p-4 rounded-xl border text-left hover:scale-[1.02] transition-all"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center gap-3">
                <File size={32} style={{ color: '#3b82f6' }} />
                <div>
                  <div className="font-bold">Word (.docx)</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Documento de Word con formato</div>
                </div>
              </div>
            </button>
          </div>

          <button
            onClick={() => setExportStep('select')}
            className="w-full mt-4 py-2 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  // Modal de crear nuevo cancionero
  if (showEditHymnalModal && editingHymnal) {
    return (
      <>
        <EditHymnalModal
          hymnal={editingHymnal}
          onClose={() => {
            setShowEditHymnalModal(false);
            setEditingHymnal(null);
          }}
          onSave={handleSaveNewHymnal}
        />
      </>
    );
  }

  return null;
}
