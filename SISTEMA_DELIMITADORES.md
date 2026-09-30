# Sistema de Delimitadores para Importación/Exportación de Canciones

## 📋 ¿Qué es el Sistema de Delimitadores?

El sistema de delimitadores permite **exportar e importar múltiples canciones** en un solo archivo, manteniendo toda la información de cada canción separada y organizada.

## 🎯 ¿Cómo Funciona?

### Al EXPORTAR múltiples canciones:

Cuando exportas varias canciones (en lote), el sistema crea un archivo con **marcadores especiales** que identifican dónde empieza y termina cada canción:

```
=== CANCIÓN 1 ===
Título: Grande es el Señor
Artista: Marcos Witt
Tonalidad: G
Compás: 4/4
BPM: 72
Idioma: Castellano
Categorías: Adoración, Alabanza
---
//G   Em   C   D
Grande es el Señor y digno de loar
más grande que todo lo que Él ha creado
Él es mi roca y mi salvación
Él es mi escudo y mi libertad

//C          D         Em         G
Grande es el Señor y digno de loar
=== FIN CANCIÓN 1 ===

=== CANCIÓN 2 ===
Título: Renuévame
Artista: Marcos Witt
Tonalidad: D
Compás: 4/4
BPM: 68
Idioma: Castellano
Categorías: Adoración, Consagración
---
//D                A
Renuévame, Señor Jesús
Ya no quiero ser igual
=== FIN CANCIÓN 2 ===
```

### Al IMPORTAR:

El sistema **detecta automáticamente** los delimitadores `=== CANCIÓN X ===` y `=== FIN CANCIÓN X ===` y:

1. **Cuenta cuántas canciones** hay en el archivo
2. **Extrae la metadata** de cada canción (título, artista, tonalidad, etc.)
3. **Extrae la letra** de cada canción
4. **Te pregunta** si quieres importar todas las canciones
5. **Crea automáticamente** todas las canciones en tu cancionero

## 📁 Formatos Soportados

### ✅ TXT (Texto Plano)
- **Exportación**: Formato con delimitadores
- **Importación**: Detección automática de múltiples canciones
- **Compatibilidad**: 100%

### ✅ Word (.docx)
- **Exportación**: Formato con delimitadores + formato visual
- **Importación**: Detección automática de múltiples canciones
- **Compatibilidad**: 100%

### ✅ PDF
- **Exportación**: Formato con delimitadores visuales
- **Importación**: En desarrollo (actualmente no soporta detección automática)
- **Compatibilidad**: 70% (solo exportación completa)

### ✅ Imagen (OCR)
- **Importación**: Una canción a la vez
- **Nota**: Para múltiples canciones desde imagen, importa una por una

## 🔄 Flujo de Trabajo Completo

### Escenario 1: Compartir canciones con un amigo

**Tú exportas:**
1. Seleccionas 10 canciones de tu cancionero
2. Exportas como TXT
3. Envías el archivo por WhatsApp/Email

**Tu amigo importa:**
1. Abre la app
2. Clic en "Importar Canciones"
3. Selecciona el archivo TXT
4. El sistema detecta: "Se encontraron 10 canciones"
5. Confirma la importación
6. ¡Las 10 canciones aparecen en su cancionero!

### Escenario 2: Respaldo de canciones

**Exportas:**
1. Seleccionas todas tus canciones personalizadas
2. Exportas como Word
3. Guardas el archivo en tu computadora/nube

**Importas (en otro dispositivo):**
1. Abre la app
2. Importas el archivo Word
3. Todas tus canciones se restauran automáticamente

## 🎨 Características de los Delimitadores

### En TXT:
```
=== CANCIÓN 1 ===
[metadata]
---
[letra]
=== FIN CANCIÓN 1 ===
```

### En Word:
- Delimitadores en gris claro
- Línea separadora visual
- Formato profesional
- Metadata completa

### En PDF:
- Delimitadores en gris
- Línea separadora
- Formato imprimible
- Metadata completa

## 🔍 ¿Qué información se guarda?

Cada canción incluye:

- ✅ **Título**
- ✅ **Artista**
- ✅ **Tonalidad**
- ✅ **Compás** (4/4, 3/4, 6/8, etc.)
- ✅ **BPM** (tempo)
- ✅ **Idioma**
- ✅ **Categorías**
- ✅ **Letra completa** (sin acordes en el formato exportado)

## ⚠️ Consideraciones Importantes

### Al Exportar:
- Los **acordes se eliminan** del archivo exportado (solo se guarda la letra)
- Si necesitas los acordes, exporta cada canción individualmente
- El archivo es **legible por humanos** (puedes editarlo manualmente)

### Al Importar:
- Las canciones se guardan en el himnario **"Alabanzas"** por defecto
- Puedes **editarlas después** para moverlas a otro himnario
- Si hay **conflicto de nombres**, se agregan automáticamente

### Edición Manual:
Puedes editar el archivo TXT/Word manualmente y:
- Agregar más canciones (siguiendo el formato)
- Modificar metadata
- Cambiar letras
- El sistema seguirá detectándolas correctamente

## 💡 Consejos

1. **Usa TXT** para máxima compatibilidad
2. **Usa Word** si necesitas formato visual
3. **Revisa el archivo** antes de compartirlo
4. **Haz respaldos** periódicos de tus canciones
5. **Edita manualmente** si necesitas ajustar algo

## 🐛 Solución de Problemas

### "No se detectaron canciones"
- Verifica que el archivo tenga el formato correcto
- Asegúrate de que los delimitadores estén completos
- Revisa que haya `=== CANCIÓN X ===` y `=== FIN CANCIÓN X ===`

### "Solo se importó una canción"
- El archivo puede tener solo una canción
- O los delimitadores no están en el formato correcto
- Verifica que cada canción tenga su bloque completo

### "Falta información de la canción"
- Edita la canción después de importar
- Agrega la información faltante manualmente

## 📊 Ejemplo Práctico

**Archivo de ejemplo con 3 canciones:**

```
=== CANCIÓN 1 ===
Título: Amazing Grace
Artista: John Newton
Tonalidad: G
Compás: 3/4
BPM: 80
Idioma: Inglés
Categorías: Himno, Gracia
---
Amazing grace how sweet the sound
that saved a wretch like me
I once was lost but now am found
was blind but now I see
=== FIN CANCIÓN 1 ===

=== CANCIÓN 2 ===
Título: Sublime Gracia
Artista: John Newton
Tonalidad: G
Compás: 3/4
BPM: 80
Idioma: Castellano
Categorías: Himno, Gracia
---
Sublime gracia del Señor
que a un infeliz salvó
fui ciego mas me hizo ver
estaba muerto y viví
=== FIN CANCIÓN 2 ===

=== CANCIÓN 3 ===
Título: How Great Thou Art
Artista: Carl Boberg
Tonalidad: A
Compás: 3/4
BPM: 76
Idioma: Inglés
Categorías: Himno, Adoración
---
O Lord my God when I in awesome wonder
consider all the worlds thy hands have made
I see the stars I hear the rolling thunder
thy power throughout the universe displayed
=== FIN CANCIÓN 3 ===
```

**Resultado al importar:**
- ✅ 3 canciones detectadas
- ✅ Metadata completa extraída
- ✅ Letras preservadas
- ✅ Categorías mantenidas
- ✅ Listas para usar

## 🎉 Conclusión

El sistema de delimitadores hace que **compartir y respaldar canciones** sea fácil y eficiente. Puedes exportar múltiples canciones en un solo archivo y importarlas automáticamente en cualquier dispositivo con la app.

**¡Prueba exportar e importar tus canciones hoy!**
