import { useState } from 'react'

interface Song {
  id: number
  title: string
  artist: string
  lyrics: string
  category: string
}

const songs: Song[] = [
  {
    id: 1,
    title: "Cielito Lindo",
    artist: "Tradicional Mexicana",
    category: "Tradicional",
    lyrics: `Ay, ay, ay, ay,
canta y no llores,
porque cantando se alegran,
cielito lindo, los corazones.

Lo que es ese lunarcito,
cielito lindo, de tu mejilla,
que me importa que sea un lunar,
cielito lindo, si es que me brillas.

¡Ay, ay, ay, ay!
Canta y no llores,
porque cantando se alegran,
cielito lindo, los corazones.

De la Sierra Morena,
cielito lindo, vienen bajando,
un par de ojitos negros,
cielito lindo, de contrabando.

¡Ay, ay, ay, ay!
Canta y no llores,
porque cantando se alegran,
cielito lindo, los corazones.`
  },
  {
    id: 2,
    title: "Guantanamera",
    artist: "José Fernández Díaz",
    category: "Cubana",
    lyrics: `Guajira guantanamera,
guajira guantanamera,
guajira guantanamera,
guajira guantanamera.

Yo soy un hombre sincero,
de donde crece la palma,
y antes de morirme quiero,
desde el alma echarle un alma.

Guajira guantanamera,
guajira guantanamera,
guajira guantanamera,
guajira guantanamera.

Mi verso es de un verde claro,
y de un carmín encendido,
mi verso es un ciervo herido,
que busca en el monte amparo.

Guajira guantanamera,
guajira guantanamera,
guajira guantanamera,
guajira guantanamera.`
  },
  {
    id: 3,
    title: "La Bamba",
    artist: "Tradicional Veracruzana",
    category: "Tradicional",
    lyrics: `Para bailar la bamba
se necesita una poca de gracia,
una poca de gracia y otra cosita.

Arriba y arriba,
arriba y arriba,
por ti seré, por ti seré,
por ti seré.

Yo no soy marinero,
yo no soy marinero,
yo no soy marinero,
soy capitán, soy capitán,
soy capitán.

Bamba, bamba,
bamba, bamba,
bamba, bamba,
bamba, bamba.

Para bailar la bamba
se necesita una poca de gracia,
una poca de gracia y otra cosita.

Arriba y arriba,
arriba y arriba.`
  },
  {
    id: 4,
    title: "Bésame Mucho",
    artist: "Consuelo Velázquez",
    category: "Bolero",
    lyrics: `Bésame, bésame mucho,
como si fuera esta noche
la última vez.

Bésame, bésame mucho,
que tengo miedo a perderte,
perderte después.

Quiero sentirte muy cerca,
mirarme en tus ojos,
verte junto a mí.

Piensa que tal vez mañana
yo esté muy lejos,
muy lejos de ti.

Bésame, bésame mucho,
como si fuera esta noche
la última vez.

Bésame, bésame mucho,
que tengo miedo a perderte,
perderte después.`
  },
  {
    id: 5,
    title: "Despacito",
    artist: "Luis Fonsi ft. Daddy Yankee",
    category: "Pop Latino",
    lyrics: `Ay, fonsi, dy
Oh, oh no, oh no
Hey yeah, diridiri, daddy go

Sí, sabes que ya llevo un rato mirándote,
tengo que bailar contigo hoy (dy)
Vi que tu mirada ya estaba llamándome,
muéstrame el camino que yo voy.

Despacito,
quiero respirar tu cuello despacito,
deja que te diga cosas al oído,
para que te acuerdes si no estás conmigo.

Despacito,
quiero desnudarte a besos despacito,
firmar las paredes de tu laberinto,
y hacer de tu cuerpo todo un manuscrito.

Quiero ver bailar tu pelo,
quiero ser tu ritmo,
que le enseñes a mi boca
tus lugares favoritos.`
  },
  {
    id: 6,
    title: "Volver, Volver",
    artist: "Vicente Fernández",
    category: "Ranchera",
    lyrics: `Todavía siento mariposas en mi pecho
y me tiembla la voz cada vez que te veo
y no importa lo que digan
tú eres lo que más deseo
y a tu lado yo me siento como en el cielo.

Volver, volver, volver,
a tus brazos llegaré,
volver, volver, volver,
regresar a tu lado.

Volver, volver, volver,
a tus brazos llegaré,
volver, volver, volver,
regresar a tu lado.

Todavía siento mariposas en mi pecho
y me tiembla la voz cada vez que te veo
y no importa lo que digan
tú eres lo que más deseo
y a tu lado yo me siento como en el cielo.`
  },
  {
    id: 7,
    title: "De Colores",
    artist: "Tradicional Mexicana",
    category: "Tradicional",
    lyrics: `De colores se viste el campo
en la primavera,
de colores son los pajaritos
que vienen de afuera.

De colores se ve el arco iris
que vemos lucir,
y el mismo que nos promete
un bello porvenir.

De colores, de colores
se viste el campo en la primavera,
de colores, de colores
son los pajaritos que vienen de afuera.

Cantemos con toda el alma
para celebrar,
una nueva vida
donde reine la paz.

De colores, de colores
se viste el campo en la primavera,
de colores, de colores
son los pajaritos que vienen de afuera.`
  },
  {
    id: 8,
    title: "La Cucaracha",
    artist: "Tradicional Mexicana",
    category: "Tradicional",
    lyrics: `La cucaracha, la cucaracha,
ya no puede caminar,
porque no tiene, porque le falta
marihuana que fumar.

Ay, ay, ay, ay,
la cucaracha,
ay, ay, ay, ay,
la cucaracha,
porque no tiene, porque le falta
marihuana que fumar.

Que bonitos ojos tiene
la cucaracha de atrás,
son dos luceritos
que le brillan al compás.

La cucaracha, la cucaracha,
ya no puede caminar,
porque no tiene, porque le falta
marihuana que fumar.`
  },
  {
    id: 9,
    title: "Contigo Aprendí",
    artist: "Armando Manzanero",
    category: "Bolero",
    lyrics: `Contigo aprendí
a ver todo lo bello
y lo que es más,
contigo aprendí
a pedir a la vida
lo que se da.

Contigo aprendí
a mirar cada estrella,
a sentir cada brisa,
a vivir cada instante.

Contigo aprendí
que el amor es posible,
que la vida es hermosa,
que vale la pena vivir.

Y ahora que te vas,
me queda la tristeza
de saber que aprendí
todo contigo
y que ya no estás aquí.`
  },
  {
    id: 10,
    title: "Cielito Lindo",
    artist: "Quirino Mendoza y Cortés",
    category: "Tradicional",
    lyrics: `Canta y no llores,
porque cantando se alegran,
cielito lindo, los corazones.

Ay, ay, ay, ay,
canta y no llores,
porque cantando se alegran,
cielito lindo, los corazones.

De la Sierra Morena,
cielito lindo, vienen bajando,
un par de ojitos negros,
cielito lindo, de contrabando.

¡Ay, ay, ay, ay!
Canta y no llores,
porque cantando se alegran,
cielito lindo, los corazones.`
  }
]

const categories = ["Todas", ...Array.from(new Set(songs.map(s => s.category)))]

function App() {
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todas")

  const filteredSongs = songs.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "Todas" || song.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🎵</span>
            <div>
              <h1 className="text-3xl font-bold">Mi Cancionero</h1>
              <p className="text-orange-100 text-sm">Canciones para cantar en grupo</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Search and filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar canción o artista..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Song List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-orange-50 px-4 py-3 border-b border-orange-100">
                <h2 className="font-semibold text-gray-700">
                  📋 Canciones ({filteredSongs.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {filteredSongs.map(song => (
                  <button
                    key={song.id}
                    onClick={() => setSelectedSong(song)}
                    className={`w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors ${
                      selectedSong?.id === song.id ? 'bg-orange-100 border-l-4 border-orange-500' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-800">{song.title}</div>
                    <div className="text-sm text-gray-500">{song.artist}</div>
                    <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {song.category}
                    </span>
                  </button>
                ))}
                {filteredSongs.length === 0 && (
                  <div className="px-4 py-8 text-center text-gray-400">
                    No se encontraron canciones
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Song Detail */}
          <div className="lg:col-span-2">
            {selectedSong ? (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-5 text-white">
                  <h2 className="text-2xl font-bold">{selectedSong.title}</h2>
                  <p className="text-orange-100">{selectedSong.artist}</p>
                  <span className="inline-block mt-2 text-xs bg-white/20 px-2 py-1 rounded-full">
                    {selectedSong.category}
                  </span>
                </div>
                <div className="px-6 py-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">🎤</span>
                    <h3 className="font-semibold text-gray-700">Letra</h3>
                  </div>
                  <pre className="whitespace-pre-wrap font-serif text-gray-700 leading-relaxed text-lg bg-amber-50 p-6 rounded-lg border border-amber-100">
                    {selectedSong.lyrics}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="text-6xl mb-4">🎶</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Selecciona una canción
                </h3>
                <p className="text-gray-400">
                  Elige una canción de la lista para ver su letra
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 py-4 text-center text-gray-500 text-sm">
        <p>🎵 Mi Cancionero — Canciones para cantar en grupo 🎵</p>
      </footer>
    </div>
  )
}

export default App
