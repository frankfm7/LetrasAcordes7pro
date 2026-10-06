import { Song } from '../types';

// Exportar como archivo de texto plano
export const exportAsTxt = (songs: Song[]): void => {
  try {
    const content = songs.map(song => {
      return `${song.title}\n${song.artist}\n\nTonalidad: ${song.key}\nCompás: ${song.timeSignature}\nBPM: ${song.bpm}\n\n${song.lyrics}\n\n${'='.repeat(50)}\n\n`;
    }).join('');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${songs.length === 1 ? songs[0].title : 'canciones'}.txt`);
  } catch (error) {
    console.error('Error al exportar TXT:', error);
    throw new Error('No se pudo exportar el archivo de texto');
  }
};

// Exportar como JSON
export const exportAsJson = (songs: Song[]): void => {
  try {
    const content = JSON.stringify(songs, null, 2);
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    downloadBlob(blob, `${songs.length === 1 ? songs[0].title : 'canciones'}.json`);
  } catch (error) {
    console.error('Error al exportar JSON:', error);
    throw new Error('No se pudo exportar el archivo JSON');
  }
};

// Exportar como HTML (para Word/PDF)
export const exportAsHtml = (songs: Song[]): void => {
  try {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${songs.length === 1 ? songs[0].title : 'Canciones'}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    .song { margin-bottom: 40px; page-break-after: always; }
    .title { font-size: 24px; font-weight: bold; color: #333; }
    .artist { font-size: 16px; color: #666; margin-bottom: 10px; }
    .info { font-size: 14px; color: #888; margin-bottom: 20px; }
    .lyrics { font-size: 16px; line-height: 1.8; white-space: pre-wrap; }
    .chord { color: #7c3aed; font-weight: bold; }
    hr { border: none; border-top: 2px solid #ddd; margin: 30px 0; }
  </style>
</head>
<body>
${songs.map(song => {
  const lyricsWithChords = song.lyrics.replace(/\/\/([^\n]+)/g, '<span class="chord">$1</span>');
  return `
  <div class="song">
    <div class="title">${song.title}</div>
    <div class="artist">${song.artist}</div>
    <div class="info">Tonalidad: ${song.key} | Compás: ${song.timeSignature} | BPM: ${song.bpm}</div>
    <div class="lyrics">${lyricsWithChords}</div>
  </div>
  <hr>
  `;
}).join('')}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    downloadBlob(blob, `${songs.length === 1 ? songs[0].title : 'canciones'}.html`);
  } catch (error) {
    console.error('Error al exportar HTML:', error);
    throw new Error('No se pudo exportar el archivo HTML');
  }
};

// Función auxiliar para descargar blob
const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
