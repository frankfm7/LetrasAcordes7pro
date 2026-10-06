import { Song } from '../types';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Configurar worker de PDF
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Extraer texto de imagen usando OCR
export async function extractTextFromImage(imageFile: File): Promise<string> {
  try {
    const result = await Tesseract.recognize(imageFile, 'spa+eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR progreso: ${Math.round(m.progress * 100)}%`);
        }
      },
    });
    
    // Limpiar el texto extraído
    let text = result.data.text;
    
    // Eliminar caracteres extraños comunes en OCR
    text = text.replace(/[|lI]{3,}/g, ''); // Eliminar líneas verticales repetidas
    text = text.replace(/\s+/g, ' '); // Normalizar espacios
    text = text.replace(/\n{3,}/g, '\n\n'); // Normalizar saltos de línea
    
    return text.trim();
  } catch (error) {
    console.error('Error en OCR:', error);
    throw new Error('No se pudo procesar la imagen. Asegúrate de que la imagen sea clara y legible.');
  }
}

// Extraer texto de archivo Word
export async function extractTextFromWord(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

// Extraer texto de archivo PDF
export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
}

// Leer archivo de texto
export async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// Procesar texto extraído y convertirlo en canción
export function parseSongFromText(text: string, hymnalId: string): Partial<Song> {
  // Limpiar el texto
  const cleanedText = text
    .replace(/\r\n/g, '\n') // Normalizar saltos de línea
    .replace(/\t/g, ' ') // Reemplazar tabs con espacios
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  if (cleanedText.length === 0) {
    throw new Error('El archivo está vacío o no se pudo extraer texto');
  }
  
  // Primera línea = título
  const title = cleanedText[0];
  
  // Segunda línea = artista (si parece un nombre) o "Desconocido"
  let artist = 'Desconocido';
  let lyricsStartIndex = 1;
  
  if (cleanedText.length > 1) {
    const secondLine = cleanedText[1];
    
    // Detectar si la segunda línea es un artista
    // No debe ser un acorde, sección, o línea muy corta
    const isChord = secondLine.match(/^(\/\/)?[A-G][#b]?(m|7|M|maj|dim|aug|sus|min)?/);
    const isSection = secondLine.match(/^(VERSO|CORO|PUENTE|INTRO|FINAL|PRE-CORO)/i);
    const isTooShort = secondLine.length < 3;
    const isTooLong = secondLine.length > 50; // Probablemente es parte de la letra
    
    if (!isChord && !isSection && !isTooShort && !isTooLong) {
      artist = secondLine;
      lyricsStartIndex = 2;
    }
  }
  
  // Procesar el resto como letra con acordes
  const lyricsLines: string[] = [];
  
  for (let i = lyricsStartIndex; i < cleanedText.length; i++) {
    const line = cleanedText[i];
    
    // Detectar secciones (VERSO, CORO, etc.)
    const sectionMatch = line.match(/^(VERSO|CORO|PUENTE|INTRO|FINAL|PRE-CORO)\s*(\d*)/i);
    if (sectionMatch) {
      lyricsLines.push(''); // Línea en blanco antes de la sección
      lyricsLines.push(line.toUpperCase());
      continue;
    }
    
    // Detectar acordes (líneas que empiezan con // o solo contienen acordes)
    const isChordLine = line.match(/^\/\/[A-G]/) || 
                        line.match(/^[A-G][#b]?\s+([A-G][#b]?\s+)+$/);
    
    if (isChordLine) {
      // Asegurar que el formato de acordes sea correcto
      if (!line.startsWith('//')) {
        lyricsLines.push('//' + line);
      } else {
        lyricsLines.push(line);
      }
    } else {
      // Línea de letra normal
      lyricsLines.push(line);
    }
  }
  
  const lyrics = lyricsLines.join('\n');
  
  // Detectar tono (buscar el primer acorde)
  const chordMatch = lyrics.match(/\/\/([A-G][#b]?)/);
  const key = chordMatch ? chordMatch[1] : 'C';
  
  // Validar que haya contenido mínimo
  if (lyrics.trim().length < 10) {
    throw new Error('No se pudo extraer suficiente texto de la imagen. Asegúrate de que la imagen sea clara y contenga una canción completa.');
  }
  
  return {
    title,
    artist,
    key,
    timeSignature: '4/4',
    bpm: 120,
    language: 'Castellano',
    categories: [],
    sections: [],
    lyrics,
    notes: 'Importado desde imagen',
    hymnalId,
  };
}

// Importar canción desde archivo de texto
export async function importFromTxt(file: File, hymnalId: string): Promise<Partial<Song>> {
  const text = await readTextFile(file);
  return parseSongFromText(text, hymnalId);
}

// Importar canción desde archivo Word
export async function importFromWord(file: File, hymnalId: string): Promise<Partial<Song>> {
  const text = await extractTextFromWord(file);
  return parseSongFromText(text, hymnalId);
}

// Importar canción desde archivo PDF
export async function importFromPdf(file: File, hymnalId: string): Promise<Partial<Song>> {
  const text = await extractTextFromPdf(file);
  return parseSongFromText(text, hymnalId);
}

// Importar canción desde imagen (OCR)
export async function importFromImage(file: File, hymnalId: string): Promise<Partial<Song>> {
  const text = await extractTextFromImage(file);
  return parseSongFromText(text, hymnalId);
}

// Importar canción desde JSON
export async function importFromJson(file: File): Promise<Partial<Song>> {
  const text = await readTextFile(file);
  const data = JSON.parse(text);
  
  // Validar que tenga los campos necesarios
  if (!data.title || !data.lyrics) {
    throw new Error('El archivo JSON no tiene el formato correcto');
  }
  
  return data;
}
