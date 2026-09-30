# Sistema Simplificado de Delimitadores para Canciones

## 📋 ¿Qué es?

Un sistema simple que usa líneas de `===` para separar canciones en archivos exportados, facilitando la importación/exportación múltiple.

## 🎯 Nuevo Formato Simplificado

### Antes (Complejo):
```
=== CANCIÓN 1 ===
Título: Grande es el Señor
...
=== FIN CANCIÓN 1 ===

=== CANCIÓN 2 ===
Título: Renuévame
...
=== FIN CANCIÓN 2 ===
```

### Ahora (Simple):
```
Título: Grande es el Señor
Artista: Marcos Witt
Tonalidad: G
Compás: 4/4
BPM: 72
Idioma: Castellano
Categorías: Adoración, Alabanza
---
Letra de la canción aquí...

===

Título: Renuévame
Artista: Marcos Witt
Tonalidad: D
Compás: 4/4
BPM: 68
Idioma: Castellano
Categorías: Adoración, Consagración
---
Letra de la canción aquí...
```

## ✅ Características

### Separador Simple
- Solo una línea de `===` entre canciones
- Fácil de leer y editar manualmente
- Compatible con cualquier editor de texto

### Metadata Completa
Cada canción incluye:
- Título
- Artista
- Tonalidad
- Compás
- BPM
- Idioma
- Categorías
- Letra completa

### Formatos Soportados

| Formato | Exportación | Importación Múltiple |
|---------|-------------|---------------------|
| **TXT** | ✅ Completo | ✅ Automática |
| **Word** | ✅ Completo | ✅ Automática |
| **PDF** | ✅ Completo | ✅ Automática |
| **Imagen** | ❌ No aplica | ❌ Una por una |

## 🔄 Flujo de Trabajo

### Exportar Múltiples Canciones

1. Selecciona varias canciones
2. Exporta como TXT, Word o PDF
3. El archivo tendrá este formato:
   ```
   [Canción 1]
   ===
   [Canción 2]
   ===
   [Canción 3]
   ```

### Importar Múltiples Canciones

1. Abre "Importar Canciones"
2. Selecciona el archivo
3. El sistema detecta automáticamente las canciones separadas por `===`
4. Confirma la importación
5. ¡Todas las canciones se crean automáticamente!

## 💡 Ejemplos Prácticos

### Ejemplo 1: Archivo TXT con 3 canciones

```
Título: Amazing Grace
Artista: John Newton
Tonalidad: G
Compás: 3/4
BPM: 80
Idioma: Inglés
Categorías: Himno
---
Amazing grace how sweet the sound
that saved a wretch like me

===

Título: Sublime Gracia
Artista: John Newton
Tonalidad: G
Compás: 3/4
BPM: 80
Idioma: Castellano
Categorías: Himno
---
Sublime gracia del Señor
que a un infeliz salvó

===

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
```

**Resultado al importar:**
- ✅ 3 canciones detectadas
- ✅ Metadata completa extraída
- ✅ Letras preservadas
- ✅ Listas para usar

### Ejemplo 2: Edición Manual

Puedes editar el archivo TXT/Word y:
- Agregar más canciones (siguiendo el formato)
- Modificar metadata
- Cambiar letras
- El sistema seguirá detectándolas correctamente

## 🎨 Características por Formato

### TXT
- Formato más simple y compatible
- Fácil de editar manualmente
- Tamaño de archivo pequeño
- Máxima compatibilidad

### Word
- Formato con estilos visuales
- Separadores visuales claros
- Metadata formateada
- Compatible con Word/Google Docs

### PDF
- Formato profesional imprimible
- Separadores visuales
- Metadata formateada
- Solo lectura (no editable)

## ⚠️ Consideraciones

### Al Exportar
- Los acordes se eliminan (solo letra)
- Si necesitas acordes, exporta individualmente
- El archivo es legible y editable

### Al Importar
- Las canciones van al himnario "Alabanzas" por defecto
- Puedes editar después para moverlas
- Si hay conflicto de nombres, se ajustan

### Edición Manual
- Usa `===` (3 o más signos) como separador
- Mantén el formato de metadata
- El sistema es flexible con espacios

## 🐛 Solución de Problemas

### "No se detectaron canciones"
- Verifica que haya líneas de `===` entre canciones
- Asegúrate de que cada canción tenga "Título:"
- Revisa que no haya caracteres extraños

### "Solo se importó una canción"
- El archivo puede tener solo una canción
- O los separadores `===` no están en líneas propias
- Verifica que cada `===` esté en su propia línea

### "Falta información"
- Edita la canción después de importar
- Agrega la información faltante manualmente

## 📊 Ventajas del Nuevo Sistema

✅ **Más simple**: Solo `===` como separador
✅ **Más flexible**: Fácil de editar manualmente
✅ **Más compatible**: Funciona en todos los formatos
✅ **Más rápido**: Detección automática eficiente
✅ **Más claro**: Formato fácil de entender

## 🎉 Conclusión

El sistema simplificado hace que compartir y respaldar canciones sea más fácil que nunca. Con solo líneas de `===` entre canciones, puedes exportar/importar múltiples canciones sin complicaciones.

**¡Prueba exportar e importar tus canciones hoy!**
