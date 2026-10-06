import { Song } from '../types';
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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

// Función auxiliar para obtener todas las letras (todos los idiomas)
const getAllLyrics = (song: Song): string => {
  let allLyrics = '';
  
  // Si tiene letras por idioma, exportar todas
  if (song.lyricsByLanguage && Object.keys(song.lyricsByLanguage).length > 0) {
    Object.entries(song.lyricsByLanguage).forEach(([lang, lyrics]) => {
      allLyrics += `\n=== ${lang.toUpperCase()} ===\n\n${lyrics}\n`;
    });
  } else {
    // Si no tiene idiomas separados, usar la letra principal
    allLyrics = song.lyrics;
  }
  
  return allLyrics;
};

// Exportar como archivo de texto plano
export const exportAsTxt = (songs: Song[]): void => {
  try {
    const content = songs.map(song => {
      const allLyrics = getAllLyrics(song);
      return `${song.title}\n${song.artist}\n\nTonalidad: ${song.key}\nCompás: ${song.timeSignature}\nBPM: ${song.bpm}\n${allLyrics}\n\n${'='.repeat(50)}\n\n`;
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

// Exportar como Word (.docx)
export const exportAsWord = async (songs: Song[]): Promise<void> => {
  try {
    const children: Paragraph[] = [];

    songs.forEach((song, index) => {
      // Título
      children.push(
        new Paragraph({
          text: song.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
        })
      );

      // Artista
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: song.artist,
              italics: true,
              size: 24,
            }),
          ],
          spacing: { after: 200 },
        })
      );

      // Información
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Tonalidad: ${song.key} | Compás: ${song.timeSignature} | BPM: ${song.bpm}`,
              size: 20,
              color: '666666',
            }),
          ],
          spacing: { after: 300 },
        })
      );

      // Letras (todos los idiomas)
      if (song.lyricsByLanguage && Object.keys(song.lyricsByLanguage).length > 0) {
        Object.entries(song.lyricsByLanguage).forEach(([lang, lyrics]) => {
          // Encabezado de idioma
          children.push(
            new Paragraph({
              text: `=== ${lang.toUpperCase()} ===`,
              alignment: AlignmentType.CENTER,
              spacing: { before: 300, after: 200 },
              children: [
                new TextRun({
                  text: `=== ${lang.toUpperCase()} ===`,
                  bold: true,
                  size: 24,
                  color: '7c3aed',
                }),
              ],
            })
          );

          // Letra del idioma
          const lines = lyrics.split('\n');
          lines.forEach(line => {
            const trimmed = line.trim();
            
            if (trimmed.startsWith('//')) {
              // Acorde
              const chord = trimmed.substring(2).trim();
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: chord,
                      bold: true,
                      color: '7c3aed',
                      size: 22,
                    }),
                  ],
                  spacing: { after: 0 },
                })
              );
            } else if (trimmed.match(/^(VERSO|CORO|PUENTE|INTRO|FINAL)/i)) {
              // Sección
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: trimmed,
                      bold: true,
                      size: 24,
                      color: 'f59e0b',
                    }),
                  ],
                  spacing: { before: 200, after: 100 },
                })
              );
            } else if (trimmed) {
              // Letra normal
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: line,
                      size: 22,
                    }),
                  ],
                  spacing: { after: 50 },
                })
              );
            } else {
              // Línea vacía
              children.push(new Paragraph({ text: '', spacing: { after: 100 } }));
            }
          });
        });
      } else {
        // Letra principal
        const lines = song.lyrics.split('\n');
        lines.forEach(line => {
          const trimmed = line.trim();
          
          if (trimmed.startsWith('//')) {
            const chord = trimmed.substring(2).trim();
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: chord,
                    bold: true,
                    color: '7c3aed',
                    size: 22,
                  }),
                ],
                spacing: { after: 0 },
              })
            );
          } else if (trimmed.match(/^(VERSO|CORO|PUENTE|INTRO|FINAL)/i)) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: trimmed,
                    bold: true,
                    size: 24,
                    color: 'f59e0b',
                  }),
                ],
                spacing: { before: 200, after: 100 },
              })
            );
          } else if (trimmed) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: line,
                    size: 22,
                  }),
                ],
                spacing: { after: 50 },
              })
            );
          } else {
            children.push(new Paragraph({ text: '', spacing: { after: 100 } }));
          }
        });
      }

      // Separador entre canciones (excepto la última)
      if (index < songs.length - 1) {
        children.push(
          new Paragraph({
            text: '\n' + '='.repeat(50) + '\n',
            spacing: { before: 400, after: 400 },
          })
        );
      }
    });

    const doc = new Document({
      sections: [{
        children: children,
      }],
    });

    const blob = await new Promise<Blob>((resolve, reject) => {
      const Packer = require('docx').Packer;
      Packer.toBlob(doc).then(resolve).catch(reject);
    });

    saveAs(blob, `${songs.length === 1 ? songs[0].title : 'canciones'}.docx`);
  } catch (error) {
    console.error('Error al exportar Word:', error);
    throw new Error('No se pudo exportar el archivo Word');
  }
};

// Exportar como PDF
export const exportAsPdf = (songs: Song[]): void => {
  try {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    songs.forEach((song, songIndex) => {
      // Verificar si necesitamos nueva página
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = margin;
      }

      // Título
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(song.title, margin, yPosition);
      yPosition += 8;

      // Artista
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'italic');
      pdf.text(song.artist, margin, yPosition);
      yPosition += 6;

      // Información
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100);
      pdf.text(`Tonalidad: ${song.key} | Compás: ${song.timeSignature} | BPM: ${song.bpm}`, margin, yPosition);
      yPosition += 8;
      pdf.setTextColor(0);

      // Letras (todos los idiomas)
      if (song.lyricsByLanguage && Object.keys(song.lyricsByLanguage).length > 0) {
        Object.entries(song.lyricsByLanguage).forEach(([lang, lyrics]) => {
          // Verificar espacio
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = margin;
          }

          // Encabezado de idioma
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(124, 58, 237); // Morado
          pdf.text(`=== ${lang.toUpperCase()} ===`, pageWidth / 2, yPosition, { align: 'center' });
          yPosition += 8;
          pdf.setTextColor(0);

          // Letra del idioma
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'normal');
          
          const lines = lyrics.split('\n');
          lines.forEach(line => {
            const trimmed = line.trim();
            
            if (trimmed.startsWith('//')) {
              // Acorde
              const chord = trimmed.substring(2).trim();
              pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(124, 58, 237);
              pdf.text(chord, margin, yPosition);
              pdf.setTextColor(0);
              pdf.setFont('helvetica', 'normal');
              yPosition += 4;
            } else if (trimmed.match(/^(VERSO|CORO|PUENTE|INTRO|FINAL)/i)) {
              // Sección
              if (yPosition > pageHeight - 30) {
                pdf.addPage();
                yPosition = margin;
              }
              pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(245, 158, 11); // Naranja
              pdf.text(trimmed, margin, yPosition);
              pdf.setTextColor(0);
              pdf.setFont('helvetica', 'normal');
              yPosition += 6;
            } else if (trimmed) {
              // Letra normal
              const splitLines = pdf.splitTextToSize(line, pageWidth - (margin * 2));
              splitLines.forEach((splitLine: string) => {
                if (yPosition > pageHeight - margin) {
                  pdf.addPage();
                  yPosition = margin;
                }
                pdf.text(splitLine, margin, yPosition);
                yPosition += 5;
              });
            } else {
              yPosition += 3;
            }
          });
          
          yPosition += 5;
        });
      } else {
        // Letra principal
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        
        const lines = song.lyrics.split('\n');
        lines.forEach(line => {
          const trimmed = line.trim();
          
          if (trimmed.startsWith('//')) {
            const chord = trimmed.substring(2).trim();
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(124, 58, 237);
            pdf.text(chord, margin, yPosition);
            pdf.setTextColor(0);
            pdf.setFont('helvetica', 'normal');
            yPosition += 4;
          } else if (trimmed.match(/^(VERSO|CORO|PUENTE|INTRO|FINAL)/i)) {
            if (yPosition > pageHeight - 30) {
              pdf.addPage();
              yPosition = margin;
            }
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(245, 158, 11);
            pdf.text(trimmed, margin, yPosition);
            pdf.setTextColor(0);
            pdf.setFont('helvetica', 'normal');
            yPosition += 6;
          } else if (trimmed) {
            const splitLines = pdf.splitTextToSize(line, pageWidth - (margin * 2));
            splitLines.forEach((splitLine: string) => {
              if (yPosition > pageHeight - margin) {
                pdf.addPage();
                yPosition = margin;
              }
              pdf.text(splitLine, margin, yPosition);
              yPosition += 5;
            });
          } else {
            yPosition += 3;
          }
        });
      }

      // Separador entre canciones
      if (songIndex < songs.length - 1) {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.setDrawColor(200);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 15;
      }
    });

    pdf.save(`${songs.length === 1 ? songs[0].title : 'canciones'}.pdf`);
  } catch (error) {
    console.error('Error al exportar PDF:', error);
    throw new Error('No se pudo exportar el archivo PDF');
  }
};

// Exportar como imagen (captura de pantalla)
export const exportAsImage = async (elementId: string, filename: string): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Elemento no encontrado para capturar');
    }

    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2, // Mejor calidad
    });

    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, `${filename}.png`);
      }
    }, 'image/png');
  } catch (error) {
    console.error('Error al exportar imagen:', error);
    throw new Error('No se pudo capturar la imagen');
  }
};
