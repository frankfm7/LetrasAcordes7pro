export interface Song {
  id: number;
  title: string;
  artist: string;
  category: string;
  key: string;
  tempo: string;
  lyrics: string;
  chords?: string;
  favorite?: boolean;
}

export const categories = [
  "Todas",
  "Alabanza",
  "Adoración",
  "Himnos",
  "Juventud",
  "Navidad",
  "Infantil",
];

export const songs: Song[] = [
  {
    id: 1,
    title: "Grande es tu Fidelidad",
    artist: "Himno Tradicional",
    category: "Himnos",
    key: "G",
    tempo: "Moderato",
    lyrics: `Grande es tu fidelidad,
Dios mi Padre, no hay sombra de variación.
No cambias Tú, Tú eres siempre el mismo,
¡Grande es tu fidelidad!

Grande es tu fidelidad,
Grande es tu fidelidad,
Cada mañana yo veo
Nueva luz, nuevas bendiciones,
¡Grande es tu fidelidad!

Cuando el dolor viene a mi corazón,
Cuando la prueba me viene a tentar,
Tú me das fuerzas, Tú me das ánimo,
¡Grande es tu fidelidad!

Perdón de pecados, paz y consuelo,
Tú me das siempre, mi Dios y Señor.
Toda mi vida te quiero servir,
¡Grande es tu fidelidad!`,
  },
  {
    id: 2,
    title: "Renuévame",
    artist: "Marcos Witt",
    category: "Adoración",
    key: "D",
    tempo: "Lento",
    lyrics: `Renuévame, Jesús,
ya no quiero ser igual.
Renuévame, Jesús,
ya no quiero ser igual.

Quita de en medio de mí
todo lo que no te agrada.
Renuévame, Jesús,
ya no quiero ser igual.

Pon tus ojos en mí,
mira mi corazón.
Tú sabes que deseo ser mejor.
Pon tus ojos en mí,
mira mi corazón.
Tú sabes que deseo ser mejor.

Renuévame, Jesús,
ya no quiero ser igual.
Renuévame, Jesús,
ya no quiero ser igual.`,
  },
  {
    id: 3,
    title: "Al que está sentado en el trono",
    artist: "Marcos Witt",
    category: "Alabanza",
    key: "A",
    tempo: "Alegre",
    lyrics: `Al que está sentado en el trono
y al Cordero, sea la alabanza,
el honor, la gloria y el poder,
por los siglos de los siglos.

Al que está sentado en el trono
y al Cordero, sea la alabanza,
el honor, la gloria y el poder,
por los siglos de los siglos. Amén.

¡Aleluya! ¡Aleluya!
¡Aleluya! ¡Aleluya!
¡Aleluya! ¡Aleluya!
¡Aleluya! ¡Aleluya!`,
  },
  {
    id: 4,
    title: "Dios es Bueno",
    artist: "Jesús Adrián Romero",
    category: "Alabanza",
    key: "E",
    tempo: "Moderato",
    lyrics: `Dios es bueno, siempre es bueno,
nunca deja de ser bueno.
Dios es bueno, siempre es bueno,
¡Dios es bueno!

Él es bueno, siempre es bueno,
nunca deja de ser bueno.
Él es bueno, siempre es bueno,
¡Él es bueno!

Porque su misericordia es para siempre,
su amor es para siempre.
Su fidelidad es para siempre,
¡Él es bueno!

Dios es bueno, siempre es bueno,
nunca deja de ser bueno.
Dios es bueno, siempre es bueno,
¡Dios es bueno!`,
  },
  {
    id: 5,
    title: "Cuan Grande es Él",
    artist: "Himno Tradicional",
    category: "Himnos",
    key: "G",
    tempo: "Moderato",
    lyrics: `Señor mi Dios, al contemplar los cielos,
el firmamento y las estrellas mil,
al oír tu voz en los potentes truenos,
y ver brillar al sol en su cenit:

Mi corazón entona la canción,
¡Cuán grande es Él! ¡Cuán grande es Él!

Al recorrer los montes y los valles,
y ver las bellas flores al pasar,
al escuchar el canto de las aves,
y el arroyuelo en su murmurar:

Mi corazón entona la canción,
¡Cuán grande es Él! ¡Cuán grande es Él!

Cuando yo pienso que Dios, su Hijo amado,
no dudó en enviarnos a salvar,
en una cruz murió por mis pecados,
y así el cielo me pudo heredar:

Mi corazón entona la canción,
¡Cuán grande es Él! ¡Cuán grande es Él!`,
  },
  {
    id: 6,
    title: "Océanos",
    artist: "Hillsong en Español",
    category: "Adoración",
    key: "D",
    tempo: "Lento",
    lyrics: `En medio de la tormenta
cuando las aguas se levantan
yo confío en Ti

En medio de la noche
cuando las sombras me rodean
yo confío en Ti

Llámame sobre las aguas
donde mis pies puedan fallar
ahí yo te seguiré

Mi corazón confiará en Ti
porque Tú eres fiel

Tú me llamas sobre las aguas
donde mis pies pueden fallar
y ahí te seguiré

Mi corazón confiará en Ti
porque Tú eres fiel`,
  },
  {
    id: 7,
    title: "Tu Fidelidad es Grande",
    artist: "Hillsong en Español",
    category: "Adoración",
    key: "G",
    tempo: "Lento",
    lyrics: `Tu fidelidad es grande, oh Dios
Tu fidelidad es grande, oh Dios
Nunca cambias, nunca fallas
Tu fidelidad es grande

Las montañas pueden caer
y los mares pueden secarse
pero tu amor por mí
siempre será el mismo

Tu fidelidad es grande, oh Dios
Tu fidelidad es grande, oh Dios
Nunca cambias, nunca fallas
Tu fidelidad es grande`,
  },
  {
    id: 8,
    title: "No hay Dios tan grande como Tú",
    artist: "Alabanza Infantil",
    category: "Infantil",
    key: "C",
    tempo: "Alegre",
    lyrics: `No hay Dios tan grande como Tú,
no hay Dios tan grande como Tú,
no hay Dios tan grande como Tú,
Señor, no hay Dios tan grande como Tú.

Y por eso yo te amo,
y por eso yo te adoro,
y por eso yo te doy
mi corazón.

No hay Dios tan grande como Tú,
no hay Dios tan grande como Tú,
no hay Dios tan grande como Tú,
Señor, no hay Dios tan grande como Tú.`,
  },
  {
    id: 9,
    title: "Un día viviré",
    artist: "Marcos Witt",
    category: "Juventud",
    key: "D",
    tempo: "Moderato",
    lyrics: `Un día viviré en la presencia del Señor,
un día viviré en la presencia del Señor.
Y por la eternidad cantaré,
y por la eternidad cantaré.

Un día viviré en la presencia del Señor,
un día viviré en la presencia del Señor.
Y por la eternidad cantaré,
y por la eternidad cantaré.

¡Aleluya! ¡Aleluya!
¡Aleluya! ¡Aleluya!

Un día viviré en la presencia del Señor,
un día viviré en la presencia del Señor.`,
  },
  {
    id: 10,
    title: "Noche de Paz",
    artist: "Villancico Tradicional",
    category: "Navidad",
    key: "C",
    tempo: "Lento",
    lyrics: `Noche de paz, noche de amor,
todo duerme en derredor.
Entre los astros que esparcen su luz,
bela anunciando al niñito Jesús,
brilla la estrella de paz,
brilla la estrella de paz.

Noche de paz, noche de amor,
en los campos a Belén
los pastores van al buen Redentor,
con los ángeles cantando su amor,
¡Gloria al que ha de nacer!
¡Gloria al que ha de nacer!

Noche de paz, noche de amor,
oye humilde fiel pastor
los coros celestiales que anuncian salud,
gracias y glorias en gran plenitud,
por nuestro buen Redentor,
por nuestro buen Redentor.`,
  },
  {
    id: 11,
    title: "Eres Todopoderoso",
    artist: "Marcos Witt",
    category: "Alabanza",
    key: "G",
    tempo: "Alegre",
    lyrics: `Eres todopoderoso,
eres todopoderoso,
eres todopoderoso,
Señor.

Eres todopoderoso,
eres todopoderoso,
eres todopoderoso,
Señor.

¡Aleluya! ¡Aleluya!
¡Aleluya! ¡Aleluya!

Eres todopoderoso,
eres todopoderoso,
eres todopoderoso,
Señor.`,
  },
  {
    id: 12,
    title: "Te amo",
    artist: "Jesús Adrián Romero",
    category: "Adoración",
    key: "A",
    tempo: "Lento",
    lyrics: `Te amo, te amo, te amo,
te amo, te amo, te amo.
Te amo, te amo, te amo,
Señor, te amo.

Yo te amo más que a la luz del sol,
yo te amo más que a la luna y las estrellas.
Yo te amo más que al aire que respiro,
yo te amo, yo te amo, yo te amo, Señor.

Te amo, te amo, te amo,
te amo, te amo, te amo.
Te amo, te amo, te amo,
Señor, te amo.`,
  },
  {
    id: 13,
    title: "Arrebatado",
    artist: "Marcos Witt",
    category: "Juventud",
    key: "E",
    tempo: "Alegre",
    lyrics: `¡Aleluya! ¡Aleluya!
¡Aleluya! ¡Aleluya!

Arrebatado, estoy arrebatado,
por tu amor, por tu amor.
Arrebatado, estoy arrebatado,
por tu amor, por tu amor.

Cuando pienso en tu amor,
cuando pienso en tu cruz,
cuando pienso en tu gracia,
me arrebato de amor.

Arrebatado, estoy arrebatado,
por tu amor, por tu amor.
Arrebatado, estoy arrebatado,
por tu amor, por tu amor.`,
  },
  {
    id: 14,
    title: "Castillo Fuerte",
    artist: "Martín Lutero",
    category: "Himnos",
    key: "D",
    tempo: "Moderato",
    lyrics: `Castillo fuerte es nuestro Dios,
defensa y buen escudo;
con su poder nos librará
en este trance rudo.

Con furia y con afán
acósanos Satán,
por armas deja ver
astucia y gran poder;
cual no hay en la tierra igual.

Nuestro valor es nada,
pronto seremos vencidos;
mas por nosotros peleará
el elegido Cristo.

Y si nos han de tragar
los demonios sin piedad,
no temeremos nosotros,
pues ya está condenado;

El príncipe infernal
que el juicio sufrirá;
una palabra bastará
que a él ha de espantar.`,
  },
  {
    id: 15,
    title: "Dios Todopoderoso",
    artist: "Alabanza Congregacional",
    category: "Alabanza",
    key: "G",
    tempo: "Moderato",
    lyrics: `Dios todopoderoso,
Dios todopoderoso,
Dios todopoderoso,
¡Aleluya!

Dios todopoderoso,
Dios todopoderoso,
Dios todopoderoso,
¡Aleluya!

¡Aleluya! ¡Aleluya!
¡Aleluya! ¡Aleluya!

Dios todopoderoso,
Dios todopoderoso,
Dios todopoderoso,
¡Aleluya!`,
  },
  {
    id: 16,
    title: "Alas de Águila",
    artist: "Marcos Witt",
    category: "Adoración",
    key: "D",
    tempo: "Lento",
    lyrics: `Los que esperan en Jehová tendrán nuevas fuerzas,
levantarán alas como las águilas.
Correrán y no se cansarán,
caminarán y no se fatigarán.

Levanta alas de águila,
levanta alas de águila,
levántate y vuela alto,
levanta alas de águila.

Los que esperan en Jehová tendrán nuevas fuerzas,
levantarán alas como las águilas.
Correrán y no se cansarán,
caminarán y no se fatigarán.

Levanta alas de águila,
levanta alas de águila,
levántate y vuela alto,
levanta alas de águila.`,
  },
  {
    id: 17,
    title: "Mi Dios es Tan Grande",
    artist: "Alabanza Infantil",
    category: "Infantil",
    key: "C",
    tempo: "Alegre",
    lyrics: `Mi Dios es tan grande,
tan fuerte y tan poderoso.
Mi Dios es tan grande,
tan fuerte y tan poderoso.

No hay nadie como Él,
no hay nadie como Él,
no hay nadie como Él,
en la tierra ni en el cielo.

Mi Dios es tan grande,
tan fuerte y tan poderoso.
Mi Dios es tan grande,
tan fuerte y tan poderoso.

No hay nadie como Él,
no hay nadie como Él,
no hay nadie como Él,
en la tierra ni en el cielo.`,
  },
  {
    id: 18,
    title: "Campana sobre campana",
    artist: "Villancico Tradicional",
    category: "Navidad",
    key: "G",
    tempo: "Alegre",
    lyrics: `Campana sobre campana,
sobre campana y una más,
asómate y verás al Niño en la cuna.

Belén, campanas de Belén,
que los ángeles tocan,
¿qué nueva me traéis?

Campana sobre campana,
sobre campana y una más,
asómate y verás al Niño en la cuna.

Recoge tu rebaño,
pastor, y vamos a Belén
a adorar al Niño que ha nacido.

Belén, campanas de Belén,
que los ángeles tocan,
¿qué nueva me traéis?`,
  },
  {
    id: 19,
    title: "En la Cruz",
    artist: "Himno Tradicional",
    category: "Himnos",
    key: "D",
    tempo: "Lento",
    lyrics: `En la cruz, en la cruz, do primero la vi,
del amado Jesús, yo creí y fui feliz.
En la cruz, en la cruz, do primero la vi,
del amado Jesús, yo creí y fui feliz.

En la cruz, do mi Salvador murió,
por el mundo pecador, yo me humillo.
En la cruz, do mi Salvador murió,
por el mundo pecador, yo me humillo.

Yo seré siempre fiel a la cruz,
y desprecio su afrenta y baldón.
Yo seré siempre fiel a la cruz,
y desprecio su afrenta y baldón.

Y al final, cuando en gloria esté,
la corona tendré, por la cruz.
Y al final, cuando en gloria esté,
la corona tendré, por la cruz.`,
  },
  {
    id: 20,
    title: "Cristo es Suficiente",
    artist: "Jesús Adrián Romero",
    category: "Adoración",
    key: "A",
    tempo: "Moderato",
    lyrics: `Cristo es suficiente,
Cristo es suficiente,
Cristo es suficiente para mí.

Su gracia es suficiente,
su gracia es suficiente,
su gracia es suficiente para mí.

Cristo es suficiente,
Cristo es suficiente,
Cristo es suficiente para mí.

En Él tengo todo,
en Él tengo paz,
en Él tengo gozo,
en Él tengo amor.

Cristo es suficiente,
Cristo es suficiente,
Cristo es suficiente para mí.`,
  },
];
