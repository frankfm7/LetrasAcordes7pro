# 🎵 Cancionero7Pro - Aplicación Completa

## ✅ Funcionalidades Implementadas

### 📚 Gestión de Himnarios
- ✅ **Crear himnarios personalizados** con icono, color, prefijo de código
- ✅ **Editar himnarios** existentes (nombre, descripción, idioma, icono, color, prefijo)
- ✅ **Eliminar himnarios** personalizados
- ✅ **5 himnarios predeterminados**: Alabanzas, Bautista, Cala (Aymara), Quechua, Mis Canciones
- ✅ **Vista de himnario** con lista de canciones

### 🎶 Gestión de Canciones
- ✅ **Crear canciones** con todos los campos: título, artista, tonalidad, compás, BPM, idioma, categorías, letra con acordes, notas
- ✅ **Editar canciones** completas (todos los campos incluyendo himnario)
- ✅ **Eliminar canciones**
- ✅ **Mover canciones** entre himnarios
- ✅ **14 canciones predeterminadas** con acordes incluidos

### 🔍 Búsqueda y Filtros
- ✅ **Búsqueda avanzada** por título, artista, código o letra
- ✅ **Filtros** por himnario
- ✅ **Resultados en tiempo real**

### ⭐ Favoritos
- ✅ **Agregar/quitar favoritos** con estrella
- ✅ **Página de favoritos** dedicada
- ✅ **Contador de favoritos** en sidebar

### 📋 Listas de Canciones (Setlists)
- ✅ **Crear listas** personalizadas
- ✅ **Agregar canciones** a listas
- ✅ **Eliminar canciones** de listas
- ✅ **Eliminar listas** completas
- ✅ **Vista detallada** de cada lista

### 📝 Órdenes de Evento
- ✅ **Crear órdenes** (Culto, Boda, Bautismo, Retiro, Conferencia, Otro)
- ✅ **Eliminar órdenes**
- ✅ **Contador de órdenes**

### 🎼 Vista de Canción
- ✅ **Letra con acordes** alineados
- ✅ **Transposición** en semitonos (+/-)
- ✅ **Auto-scroll** con control de velocidad
- ✅ **Navegación de secciones** sticky (VERSO, CORO, PUENTE, etc.)
- ✅ **Control de tamaño de letra** (14-32px)
- ✅ **Mostrar/ocultar acordes**
- ✅ **Soporte multi-idioma** (cambiar entre idiomas)
- ✅ **Copiar letra** al portapapeles
- ✅ **Compartir canción**
- ✅ **Agregar a lista** desde vista de canción
- ✅ **Editar canción** desde vista
- ✅ **Notas opcionales** para transposición rápida (2 notas configurables)
- ✅ **Selector de tonalidad** con botones (original + opcionales)

### 🎯 Selección Múltiple (Himnarios)
- ✅ **Modo selección** con checkbox
- ✅ **Seleccionar/deseleccionar todo**
- ✅ **Copiar canciones** seleccionadas
- ✅ **Pegar canciones** en otro himnario
- ✅ **Agregar a favoritos** en lote
- ✅ **Eliminar canciones** en lote
- ✅ **Long press** para selección en móvil (500ms)
- ✅ **Vibración** al seleccionar (si disponible)

### 🛠️ Herramientas
- ✅ **Metrónomo funcional** con:
  - Control de BPM (30-240)
  - Diferentes compases (2/4, 3/4, 4/4, 5/4, 6/4, 7/4)
  - Indicadores visuales de beat
  - Sonido de click (acento en primer beat)
  - Presets (Lento, Normal, Rápido, Muy Rápido)
  
- ✅ **Afinador funcional** con:
  - Detección de frecuencia desde micrófono
  - Identificación de nota más cercana
  - Indicador de cents (-50 a +50)
  - Estado visual (Perfecto, Casi, Desafinado)
  - Tabla de frecuencias de referencia

### 🎨 Personalización
- ✅ **Modo oscuro/claro** con persistencia
- ✅ **Imagen de fondo** personalizable
- ✅ **Quitar imagen de fondo**
- ✅ **Tema profesional** con gradientes y sombras

### 💾 Datos
- ✅ **Persistencia en localStorage**
- ✅ **Exportar datos** completos en JSON
- ✅ **Importar datos** desde JSON
- ✅ **Respaldo automático** de canciones personalizadas

### 📱 Interfaz
- ✅ **Diseño responsive** (móvil, tablet, desktop)
- ✅ **Sidebar deslizante** con estadísticas
- ✅ **Navegación inferior** tipo app móvil
- ✅ **Animaciones suaves**
- ✅ **Splash screen** al iniciar
- ✅ **Notificaciones** temporales
- ✅ **Modales** para todas las acciones

### 🌐 Multi-idioma
- ✅ **Soporte para canciones bilingües**
- ✅ **Cambio de idioma** en vista de canción
- ✅ **Himnarios en diferentes idiomas**: Castellano, Aymara, Quechua

### 📊 Estadísticas
- ✅ **Contador de favoritos**
- ✅ **Contador de listas**
- ✅ **Contador total de canciones**
- ✅ **Contador de canciones por himnario**

## 🎯 Funcionalidades Avanzadas

### Copiar/Pegar entre Himnarios
1. Selecciona canciones en un himnario (modo selección)
2. Copia las canciones seleccionadas
3. Ve a otro himnario
4. Pega las canciones (se crean con nuevos códigos)

### Notas Opcionales para Transposición
1. En vista de canción, abre menú (⋮)
2. Selecciona "Notas opcionales"
3. Configura hasta 2 notas alternativas
4. Aparecen como botones rápidos para transposición

### Navegación de Secciones
- Las secciones (VERSO, CORO, PUENTE, etc.) aparecen sticky en la parte superior
- Click en cualquier sección para navegar directamente
- Colores diferentes por tipo de sección

### Long Press (Móvil)
- Mantén presionado 500ms sobre una canción para entrar en modo selección
- Vibración de confirmación (si el dispositivo lo soporta)

## 🚀 Cómo Usar

### Crear un Himnario
1. Abre el menú lateral (☰)
2. Click en "Nuevo Himnario"
3. Completa los campos (nombre, icono, color, prefijo)
4. Click en "Crear Himnario"

### Agregar una Canción
1. Entra a un himnario
2. Click en el botón "+" (arriba a la derecha)
3. Completa todos los campos
4. Escribe la letra con acordes (formato: //Am F Em antes de la línea de letra)
5. Click en "Guardar Canción"

### Editar una Canción
1. Abre la canción
2. Click en el menú (⋮)
3. Selecciona "Editar"
4. Modifica los campos necesarios
5. Click en "Guardar Cambios"

### Copiar Canciones entre Himnarios
1. Entra al himnario origen
2. Activa modo selección (✓)
3. Selecciona las canciones
4. Click en "Opciones" → "Copiar"
5. Ve al himnario destino
6. Click en el botón de pegar (📋)

### Usar el Metrónomo
1. Ve a "Herramientas"
2. Click en "Metrónomo"
3. Ajusta BPM y compás
4. Click en "Iniciar"

### Usar el Afinador
1. Ve a "Herramientas"
2. Click en "Afinador"
3. Permite acceso al micrófono
4. Toca una nota cerca del micrófono
5. Verás la nota detectada y los cents de desviación

## 📝 Formato de Letra con Acordes

```
VERSO 1
//Am           F             Em       Am
Primera línea de la canción
//Am           F             Em       Am
Segunda línea de la canción

CORO
//F              G           Am
Letra del coro aquí
//F              G           Am
Con acordes arriba
```

- Usa `//` antes de los acordes
- Los acordes se alinean automáticamente con la letra
- Usa VERSO, CORO, PUENTE, INTRO, FINAL como encabezados

## 🎨 Personalización

### Cambiar Tema
- Click en el icono de sol/luna (arriba a la derecha)
- O desde el menú lateral

### Imagen de Fondo
1. Abre el menú lateral
2. Click en "Imagen de Fondo"
3. Selecciona una imagen
4. Para quitar: "Quitar Fondo"

## 💾 Respaldo

### Exportar
1. Abre el menú lateral
2. Click en "Exportar Datos"
3. Se descarga un archivo JSON con todos tus datos

### Importar
1. Abre el menú lateral
2. Click en "Importar Datos"
3. Selecciona el archivo JSON de respaldo
4. La página se recargará con los datos importados

## 🔧 Tecnologías

- **React 18** con TypeScript
- **Tailwind CSS** para estilos
- **Framer Motion** para animaciones
- **Lucide React** para iconos
- **LocalStorage** para persistencia
- **Web Audio API** para metrónomo y afinador

## 📱 Compatibilidad

- ✅ Chrome/Edge (recomendado)
- ✅ Firefox
- ✅ Safari
- ✅ Móvil (iOS/Android)
- ✅ Tablet
- ✅ Desktop

## 🎯 Próximas Mejoras Sugeridas

- [ ] Sincronización en la nube (Supabase/Firebase)
- [ ] Exportar listas a PDF
- [ ] Compartir himnarios entre usuarios
- [ ] Importar canciones desde archivos ChordPro
- [ ] Transposición automática inteligente
- [ ] Modo presentación para proyectar
- [ ] Grabación de audio de ensayos
- [ ] Estadísticas de uso de canciones

---

**Desarrollado con ❤️ para músicos y directores de alabanza**
