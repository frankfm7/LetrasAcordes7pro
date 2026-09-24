import { useState, useMemo } from "react";
import { songs, categories, Song } from "./data/songs";

function App() {
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("normal");

  const filteredSongs = useMemo(() => {
    return songs.filter((song) => {
      const matchesCategory =
        selectedCategory === "Todas" || song.category === selectedCategory;
      const matchesSearch =
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.lyrics.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFavorites = !showFavoritesOnly || favorites.has(song.id);
      return matchesCategory && matchesSearch && matchesFavorites;
    });
  }, [selectedCategory, searchTerm, showFavoritesOnly, favorites]);

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => {
      const newFavs = new Set(prev);
      if (newFavs.has(id)) {
        newFavs.delete(id);
      } else {
        newFavs.add(id);
      }
      return newFavs;
    });
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case "large":
        return "text-lg";
      case "xlarge":
        return "text-xl";
      default:
        return "text-base";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Alabanza":
        return "bg-blue-100 text-blue-800";
      case "Adoración":
        return "bg-purple-100 text-purple-800";
      case "Himnos":
        return "bg-amber-100 text-amber-800";
      case "Juventud":
        return "bg-green-100 text-green-800";
      case "Navidad":
        return "bg-red-100 text-red-800";
      case "Infantil":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Vista de detalle de canción
  if (selectedSong) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <button
              onClick={() => setSelectedSong(null)}
              className="flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-3"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Volver al cancionero
            </button>
            <h1 className="text-2xl md:text-3xl font-bold">{selectedSong.title}</h1>
            <p className="text-white/80 mt-1">{selectedSong.artist}</p>
          </div>
        </div>

        {/* Song Info Bar */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedSong.category)}`}>
              {selectedSong.category}
            </span>
            <span className="flex items-center gap-1 text-sm text-gray-600">
              <span className="font-semibold">Tonalidad:</span> {selectedSong.key}
            </span>
            <span className="flex items-center gap-1 text-sm text-gray-600">
              <span className="font-semibold">Tempo:</span> {selectedSong.tempo}
            </span>
            <button
              onClick={() => toggleFavorite(selectedSong.id)}
              className={`ml-auto flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                favorites.has(selectedSong.id)
                  ? "bg-red-100 text-red-600"
                  : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill={favorites.has(selectedSong.id) ? "currentColor" : "none"}
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              {favorites.has(selectedSong.id) ? "Favorita" : "Agregar"}
            </button>
          </div>
        </div>

        {/* Font Size Controls */}
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="flex items-center gap-2 justify-end">
            <span className="text-sm text-gray-500">Tamaño:</span>
            <button
              onClick={() => setFontSize("normal")}
              className={`px-2 py-1 rounded text-xs font-medium ${
                fontSize === "normal" ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize("large")}
              className={`px-2 py-1 rounded text-sm font-medium ${
                fontSize === "large" ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              A+
            </button>
            <button
              onClick={() => setFontSize("xlarge")}
              className={`px-2 py-1 rounded text-base font-medium ${
                fontSize === "xlarge" ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              A++
            </button>
          </div>
        </div>

        {/* Lyrics */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Letra</h2>
            </div>
            <pre className={`whitespace-pre-wrap font-sans leading-relaxed text-gray-700 ${getFontSizeClass()}`}>
              {selectedSong.lyrics}
            </pre>
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <button
              onClick={() => {
                const idx = songs.findIndex((s) => s.id === selectedSong.id);
                if (idx > 0) setSelectedSong(songs[idx - 1]);
              }}
              disabled={songs.findIndex((s) => s.id === selectedSong.id) === 0}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Anterior
            </button>
            <button
              onClick={() => {
                const idx = songs.findIndex((s) => s.id === selectedSong.id);
                if (idx < songs.length - 1) setSelectedSong(songs[idx + 1]);
              }}
              disabled={songs.findIndex((s) => s.id === selectedSong.id) === songs.length - 1}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Siguiente
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vista principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Cancionero Digital</h1>
              <p className="text-white/70 text-sm">Tu repertorio musical en un solo lugar</p>
            </div>
          </div>
        </div>
      </header>

      {/* Search & Filters */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Search Bar */}
        <div className="relative mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Buscar por título, artista o letra..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-700 placeholder-gray-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Favorites Toggle */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {filteredSongs.length} {filteredSongs.length === 1 ? "canción" : "canciones"} encontradas
          </p>
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              showFavoritesOnly
                ? "bg-red-100 text-red-600"
                : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill={showFavoritesOnly ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            Favoritas ({favorites.size})
          </button>
        </div>
      </div>

      {/* Songs List */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        {filteredSongs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-600">No se encontraron canciones</h3>
            <p className="text-gray-400 mt-1">Intenta con otra búsqueda o categoría</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredSongs.map((song) => (
              <div
                key={song.id}
                onClick={() => setSelectedSong(song)}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer group overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors truncate">
                        {song.title}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">{song.artist}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(song.id);
                      }}
                      className={`flex-shrink-0 p-1 rounded-full transition-colors ${
                        favorites.has(song.id)
                          ? "text-red-500"
                          : "text-gray-300 hover:text-red-400"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill={favorites.has(song.id) ? "currentColor" : "none"}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(song.category)}`}>
                      {song.category}
                    </span>
                    <span className="text-xs text-gray-400">
                      Tonalidad: {song.key}
                    </span>
                    <span className="text-xs text-gray-400">
                      {song.tempo}
                    </span>
                  </div>
                </div>
                <div className="px-4 pb-3">
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                    {song.lyrics.split("\n")[0]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-4">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-400">
          <p>Cancionero Digital © 2024 • {songs.length} canciones disponibles</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
