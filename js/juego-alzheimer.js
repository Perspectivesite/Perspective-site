// Juego de Alzheimer: «Un domingo en casa de Carmen» (2D, 8 bits, novela visual con rondas de memoria)
// Historia: vives un día de Carmen (78 años) con su nieta Valeria. Cada ronda de memoria es una escena del día.
// Cada objeto guarda un recuerdo: lo que se olvida no es un punto, es esa historia.
// Decisiones con consecuencias (disimular o pedir ayuda, aceptar apoyos), el nombre que se escapa,
// y al final cambias de lugar: eres Valeria y alguien te pregunta por quien ya no está.
// Los diálogos, ramas y marcas viven en el motor (Motor.Novela); aquí solo está el guion y las rondas.
(function () {
  "use strict";

  var area = document.getElementById("juego");
  if (!area || !window.Motor) return;

  var BASE = "../assets/sprites/alzheimer/";
  var reducir = Motor.reducirMovimiento;
  var Son = Motor.Sonido;

  /* ---------- Objetos y sus recuerdos ---------- */
  var O = {
    llaves: "Llaves", gafas: "Gafas", paraguas: "Paraguas", bolso: "Bolso", gorra: "Gorra",
    telefono: "Teléfono", zapatos: "Zapatos", bufanda: "Bufanda", taza: "Taza de café",
    pastillero: "Pastillero", reloj: "Reloj despertador", libro: "Libro de recetas", manzana: "Manzana",
    leche: "Vaso de leche", pan: "Pan dulce", calendario: "Calendario", foto: "Foto familiar",
    planta: "Helecho", linterna: "Linterna", cepillo: "Cepillo de dientes"
  };
  var RECUERDO = {
    llaves: "Las de la casa de la calle Hidalgo, donde criaste a tus hijos.",
    gafas: "Con ellas leíste en voz alta, cada noche, a tus nietos.",
    paraguas: "El que Tomás te regaló un día de lluvia, antes de casarse.",
    bolso: "Tu bolso del mercado: ahí cabe el domingo entero.",
    gorra: "La gorra de Tomás, que sigues guardando junto a la puerta.",
    telefono: "Por aquí te llama tu hija Marta, todas las tardes.",
    zapatos: "Los zapatos con los que bailaste en la boda de Marta.",
    bufanda: "La azul que tejiste para el primer invierno de Valeria.",
    taza: "Tu café de las seis de la mañana, siempre en la misma taza.",
    pastillero: "Cada día tiene su casita, y tú lo llenas los domingos.",
    reloj: "Despertó a la casa entera desde antes de que nacieran tus hijos.",
    libro: "Tiene las manchas de todas las comidas de domingo.",
    manzana: "Como las del árbol del patio de tu mamá, en el pueblo.",
    leche: "Tu leche tibia con canela, antes de dormir.",
    pan: "El pan dulce que Valeria trae cada domingo de la esquina.",
    calendario: "Ahí marcas con rojo el cumpleaños de cada uno de los tuyos.",
    planta: "El helecho que Tomás sembró y que sigue verde.",
    linterna: "La de las noches de apagón, cuando contabas cuentos con sombras.",
    cepillo: "Tu rutina de la noche: cepillo, crema y rezo."
  };
  function sprObj(id) { return "alz_obj_" + id + "_1f"; }

  // Muebles de la sala: posición, ranuras donde caben objetos y zona de rutina.
  var MUEBLES = [
    { id: "puerta", zona: "Junto a la puerta", etiqueta: "PUERTA", spr: "alz_mueble_mesita_1f", x: 54, y: 76, w: 32, ranuras: 2 },
    { id: "repisa", zona: "En la repisa", etiqueta: "REPISA", spr: "alz_mueble_repisa_1f", x: 92, y: 66, w: 48, ranuras: 3 },
    { id: "mesa", zona: "Sobre la mesa", etiqueta: "MESA", spr: "alz_mueble_mesa_1f", x: 152, y: 84, w: 48, ranuras: 3 }
  ];
  MUEBLES.forEach(function (m) { m.cubre = { x: m.x - 1, y: m.y - 18, w: m.w + 2, h: 28 }; });
  function mueble(id) { return MUEBLES.filter(function (m) { return m.id === id; })[0]; }

  var ZONAS = [
    { id: "puerta", n: "Junto a la puerta", items: ["llaves", "paraguas", "bolso", "gorra"] },
    { id: "mesa", n: "Sobre la mesa", items: ["taza", "pastillero", "gafas", "libro"] },
    { id: "repisa", n: "En la repisa", items: ["reloj", "planta", "linterna", "calendario"] }
  ];
  var TODOS_ZONAS = [].concat(ZONAS[0].items, ZONAS[1].items, ZONAS[2].items);

  /* ---------- Rondas de memoria (son escenas del día) ---------- */
  // flag: marca que activa el apoyo. Si no se activó, se usa la variante «sin».
  var RONDAS = [
    { titulo: "La entrada", n: 4, seg: 9,
      pool: ["llaves", "gafas", "paraguas", "bolso", "gorra", "telefono", "zapatos", "bufanda"],
      preguntas: ["presente", "ausente", "presente"], apoyo: null,
      resumen: "Sin ningún apoyo, retener varias cosas solo con la atención exige esfuerzo. Olvidar algún detalle es muy común." },
    { titulo: "La mesa", n: 6, seg: 10,
      pool: ["taza", "pastillero", "reloj", "libro", "manzana", "leche", "pan", "gafas", "telefono", "calendario"],
      preguntas: ["presente", "ausente", "presente"], apoyo: null,
      resumen: "Con más cosas que retener, recordar cuesta más para cualquiera. Y cada objeto que se escapa se lleva su historia con él." },
    { titulo: "Cada cosa en su lugar", flag: "rutina", n: 6, seg: 10, zonas: true,
      preguntas: ["lugar", "lugar", "presente"],
      apoyo: { nombre: "Rutina",
        texto: "Las llaves siempre junto a la puerta, el pastillero siempre sobre la mesa. Cuando cada objeto tiene su sitio fijo y marcado, no hace falta recordarlo: la casa lo recuerda por ti." },
      resumen: "Las rutinas y los espacios ordenados reducen la cantidad de cosas que hay que recordar. Por eso en el Alzheimer se recomienda mantener horarios y lugares estables.",
      sin: { zonas: false, pool: TODOS_ZONAS, preguntas: ["presente", "ausente", "presente"], apoyo: null,
        resumen: "Sin un lugar fijo, cada objeto hay que recordarlo por separado. Decir que no a un apoyo es una decisión válida; quien acompaña puede volver a ofrecerlo, sin presionar." } },
    { titulo: "La libreta", flag: "libreta", n: 7, seg: 11, nota: true, acompanante: true,
      pool: ["llaves", "gafas", "pastillero", "taza", "telefono", "libro", "manzana", "reloj", "cepillo", "calendario", "bufanda", "pan"],
      preguntas: ["presente", "ausente", "presente"],
      apoyo: { nombre: "Libreta y acompañamiento",
        texto: "Mientras observas puedes apuntar lo que quieras en la libreta. Después, Valeria estará cerca: puedes pedirle ayuda cuando una pregunta te cueste. Pedir ayuda no es un fracaso; es parte de cuidarse." },
      resumen: "Las notas, las listas y el acompañamiento de otras personas ayudan a mantener la autonomía y la tranquilidad, tanto de quien vive con la enfermedad como de su familia.",
      sin: { nota: false, acompanante: false, apoyo: null,
        resumen: "Sin libreta y sin pedir ayuda, todo depende de la memoria del momento. Es tu decisión, y aun así Valeria sigue cerca." } }
  ];

  /* ---------- Decisiones: qué provocan ---------- */
  var TIPOS = {
    abre:      { n: "Decir lo que cuesta", pts: 10, txt: "Decir «hoy me cuesta» no es rendirse: permite que los demás ayuden a tiempo y sin adivinar." },
    disimula:  { n: "Disimular", pts: -6, txt: "Disimular protege el orgullo un rato, pero cansa y deja a los demás sin saber cómo ayudar." },
    enojo:     { n: "Enojo", pts: -12, txt: "El enojo suele ser miedo con otra cara. A veces lo que se dice no es lo que se siente." },
    acepta:    { n: "Aceptar un apoyo", pts: 8, txt: "Aceptar una etiqueta o una libreta no quita autonomía: la sostiene." },
    rechaza:   { n: "Rechazar un apoyo", pts: -3, txt: "Rechazar un apoyo también es una decisión válida. Quien acompaña puede ofrecerlo otra vez, sin presionar." },
    corrige:   { n: "Corregir de golpe", pts: -12, txt: "Dar el dato de golpe puede hacer que la persona viva la pérdida como si fuera la primera vez, cada vez." },
    acompana:  { n: "Acompañar lo que siente", pts: 14, txt: "Entrar en el sentimiento, en vez de discutir el dato, calma y mantiene la conexión." },
    redirige:  { n: "Redirigir con suavidad", pts: 10, txt: "Llevar la conversación hacia algo que da seguridad (una foto, una canción) suele ayudar." }
  };

  var ESCENAS = {
    manana:   { n: "Domingo por la mañana", luz: "manana", tu: "prot" },
    mediodia: { n: "Mediodía", luz: "mediodia", tu: "prot" },
    tarde:    { n: "Por la tarde", luz: "tarde", tu: "prot" },
    noche:    { n: "Esa noche", luz: "noche", tu: "acomp" }
  };

  /* ---------- Guion ---------- */
  // Cada nodo: esc, quien, paso, texto (puede ser función), y o bien op (decisiones) o sig, o bien run (ronda de memoria).
  // «{~palabra~}» = palabra que no llega: sale con huecos y suena desafinada.
  var YO_C = "Carmen (tú)", YO_V = "Valeria (tú)";
  var G = {
    a0: { esc: "manana", quien: "Narración", paso: 1,
      texto: "Es domingo por la mañana. Eres Carmen, tienes 78 años y esta sala es tu casa desde hace cuarenta y cinco. Hoy vienen a comer tus hijos y tus nietos.", sig: "a1" },
    a1: { esc: "manana", quien: "Narración", paso: 1, marca: "fotoVista",
      texto: "Valeria, tu nieta, llegó temprano con pan dulce. Junto a la puerta cuelga la foto de la boda de tu hija Marta, donde salen todos. Es lo primero que miras cada mañana.", sig: "a2" },
    a2: { esc: "manana", quien: "Valeria", paso: 1, yo: YO_C,
      texto: "Buenos días, abue. Hoy viene toda la familia. ¿Me ayudas a dejar lista la entrada? Hay cosas que vas a necesitar.",
      op: [
        { t: "Yo sé dónde va todo, tú no te preocupes.", tipo: "disimula", f: "orgullo", r: { texto: "Va, abue. Pero aquí ando, por si acaso." } },
        { t: "Qué bueno que estás. Hoy ando medio distraída.", tipo: "abre", f: "abre1", r: { texto: "Para eso vine. Vamos poco a poco, ¿sí?" } },
        { t: "Siempre me tratan como si no pudiera.", tipo: "enojo", f: "enojo1", r: { texto: "No es eso, abue… perdón." } }
      ], sig: "r1" },
    r1: { esc: "manana", paso: 1, ronda: 0, sig: "b0", run: function () { iniciarRonda(0); } },

    b0: { esc: "mediodia", quien: "Narración", paso: 2,
      texto: function () {
        return "Pasan las horas. Valeria va y viene de la cocina, y tú de la sala a la mesa." +
          (perdidas(0).length ? " Cuando no mirabas, dejó a la vista, sin decir nada, lo que se te escapó en la entrada." : "") +
          (st.f.enojo1 ? " Habla más bajito que en la mañana." : ""); },
      sig: "r2" },
    r2: { esc: "mediodia", paso: 2, ronda: 1, sig: "c0", run: function () { iniciarRonda(1); } },
    c0: { esc: "mediodia", quien: "Narración", paso: 2,
      texto: "Tus hijos van llegando. En la sala hay abrazos, platos y ruido. Valeria sale de la cocina con un trapo al hombro y se detiene frente a ti.", sig: "c1" },
    c1: { esc: "mediodia", quien: "Valeria", paso: 2,
      texto: "Abue, ya van a servir. ¿Me acompañas a la mesa?", sig: "c2" },
    c2: { esc: "mediodia", quien: "Carmen (por dentro)", pens: true, lento: true, niebla: true, marco: ["oscuro", 0.85], paso: 2, yo: YO_C,
      texto: "Sabes quién es. La conoces desde que cabía en una cobija. Pero su nombre… su nombre es {~Valeria~}.",
      op: [
        { t: "Sí, mi niña, vamos.", tipo: "disimula", f: "disimulo", marco: ["oscuro", 0.5],
          r: { quien: "Valeria", texto: "Vamos, abue.", extra: [["Narración", "Valeria sonríe, pero tarda un segundo de más en contestar. Se dio cuenta."]] } },
        { t: "Perdóname, hija. Se me fue tu nombre.", tipo: "abre", f: "honesta", marco: ["calido", 0.5],
          r: { quien: "Valeria", texto: "Soy Valeria, abue. Está bien. Ya regresa, y si no, aquí estoy igual.", extra: [["Narración", "Te aprieta la mano. Respiras hondo por primera vez en un rato."]] } },
        { t: "¡No me mires así! ¡Yo sé quién eres!", tipo: "enojo", f: "grito", marco: ["oscuro", 0.9],
          r: { quien: "Valeria", texto: "Perdón, abue. No quise…", extra: [["Narración", "Valeria baja la mirada y da un paso atrás. Algo en la sala se enfría."]] } }
      ], sig: "c3" },
    c3: { esc: "mediodia", quien: "Narración", paso: 2,
      texto: function () {
        return st.f.honesta ? "El nombre no llega, pero la sala se siente más ancha."
          : st.f.grito ? "Durante toda la comida, Valeria te sirve con cuidado, como quien camina sobre vidrio."
          : "Nadie lo dice en voz alta, pero las dos saben que algo se escapó."; },
      sig: "d0" },

    d0: { esc: "tarde", quien: "Narración", paso: 3,
      texto: "Después de comer, la casa queda llena de platos sucios y de cosas fuera de su sitio. Valeria saca unas tiras de papel de colores de su bolso.", sig: "d1" },
    d1: { esc: "tarde", quien: "Valeria", paso: 3, yo: YO_C,
      texto: function () {
        return st.f.grito
          ? "Abue… hice unas etiquetas, si quieres. Sin presión. ¿Las probamos?"
          : "Abue, hice unas etiquetas: PUERTA, REPISA, MESA. Si cada cosa vive siempre en su lugar, no tienes que acordarte tú: la casa te lo recuerda. ¿Probamos?"; },
      op: [
        { t: "Sí, vamos a probar.", tipo: "acepta", f: "rutina",
          r: { texto: "Listo. Las llaves, el paraguas y el bolso junto a la puerta; lo de la mesa en la mesa; y lo de arriba, en la repisa." } },
        { t: "Gracias, pero así estoy bien.", tipo: "rechaza",
          r: { texto: "Está bien, abue. Si cambias de idea, las dejo en la cocina." } }
      ], sig: "r3" },
    r3: { esc: "tarde", paso: 3, ronda: 2, sig: "e0", run: function () { iniciarRonda(2); } },
    e0: { esc: "tarde", quien: "Narración", paso: 3,
      texto: "Cae la tarde. Valeria saca una libreta pequeña y la deja sobre la mesa, abierta en una hoja en blanco.", sig: "e1" },
    e1: { esc: "tarde", quien: "Valeria", paso: 3, yo: YO_C,
      texto: function () {
        return st.f.honesta
          ? "Abue, como me dijiste hoy: lo que cueste, lo vamos viendo juntas. ¿Apuntamos aquí lo que no quieres que se te pierda?"
          : "Abue, ¿apuntamos aquí lo que no quieres que se te pierda? Yo me quedo contigo mientras tanto."; },
      op: [
        { t: "Sí. Tú apunta y yo te digo.", tipo: "acepta", f: "libreta", r: { texto: "Aquí lo tengo. Y si dudas, me preguntas." } },
        { t: "No necesito libreta. Tengo cabeza.", tipo: "rechaza", r: { texto: "Está bien, abue. Aquí me quedo, de todos modos." } }
      ], sig: "r4" },
    r4: { esc: "tarde", paso: 3, ronda: 3, sig: "f0", run: function () { iniciarRonda(3); } },

    f0: { esc: "noche", quien: "Narración", paso: 4, marca: "fotoMano",
      texto: "Todos se fueron. Valeria se quedó a recoger. Ahora, por unos minutos, vas a mirar desde sus ojos.", sig: "f1" },
    f1: { esc: "noche", quien: "Narración", paso: 4, yo: YO_V, grande: true,
      texto: "Ahora eres Valeria. Carmen está en el sillón, con la foto de la boda sobre las piernas. Hace rato que la mira.", sig: "f2" },
    f2: { esc: "noche", quien: "Carmen", paso: 4, yo: YO_V, grande: true, marco: ["oscuro", 0.4],
      texto: "¿Ya llegó Tomás? Tengo que servirle su cena, se le va a enfriar.",
      op: [
        { t: "Abue, el abuelo Tomás murió hace seis años.", tipo: "corrige", f: "corrigio", marco: ["oscuro", 0.9],
          r: { texto: "¿Qué…? ¿Cuándo? Nadie me dijo nada…", extra: [["Narración", "Carmen se queda quieta. Para ella es la primera vez que lo escucha, otra vez."]] } },
        { t: "Lo extrañas, ¿verdad? Cuéntame cómo llegaba a cenar.", tipo: "acompana", f: "acompano", marco: ["calido", 0.7],
          r: { texto: "Siempre tarde, con el sombrero en la mano, diciendo «ya sé, ya sé».", extra: [["Narración", "Carmen sonríe con los ojos cerrados. Hablan de él un buen rato."]] } },
        { t: "Ven, vamos a ver la foto. ¿Quién sale ahí?", tipo: "redirige", f: "redirigio", marco: ["calido", 0.5],
          r: { texto: "Ay, mira… ahí está Marta con su vestido. Y ese que ríe, ese es…", extra: [["Narración", "Se queda buscando. Tú le acercas la foto a la luz."]] } }
      ], sig: "g0" },
    g0: { esc: "noche", quien: "Carmen", paso: 4, yo: YO_V, grande: true, marco: function () { var f = final(); return f === "A" ? ["calido", 0.9] : f === "B" ? ["calido", 0.45] : ["oscuro", 0.55]; },
      texto: function () {
        var f = final();
        return f === "A" ? "Ahí estás tú, Valeria, la de las trenzas. Qué bonita foto."
          : f === "B" ? "No me sale tu nombre, hija… pero sé que eres de los míos."
          : "Estoy cansada. ¿Ya se fueron todos?"; },
      sig: "g1" },
    g1: { esc: "noche", quien: "Narración", paso: 4, yo: YO_V, grande: true, marco: function () { var f = final(); return f === "A" ? ["calido", 0.9] : f === "B" ? ["calido", 0.45] : ["oscuro", 0.55]; },
      texto: function () {
        var f = final(), perdidas = recs(false).length;
        return (f === "A" ? "Su nombre volvió. No siempre vuelve, y aun así esta noche volvió."
          : f === "B" ? "Te sostiene la mano. No hace falta que el nombre llegue para saber que estás ahí."
          : "Te quedas un rato a su lado, aunque no te lo pidan. A veces acompañar es solo eso.") +
          (perdidas ? " Antes de irte, anotas en la libreta las historias que se escaparon hoy, para volver a contárselas mañana."
                    : " Mañana habrá que volver a contarle todas las historias igual. También eso es acompañar."); },
      sig: "fin" }
  };

  /* ---------- Utilidades ---------- */
  function mezclar(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function muestra(a, k) { return mezclar(a).slice(0, k); }
  function restar(a, b) { return a.filter(function (x) { return b.indexOf(x) === -1; }); }
  function mezc(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return o; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function zonaDe(id) {
    for (var i = 0; i < ZONAS.length; i++) if (ZONAS[i].items.indexOf(id) !== -1) return ZONAS[i];
    return null;
  }
  function img(nombre, px, extra) {
    return '<img class="px" src="' + BASE + nombre + '.png" width="' + px + '" height="' + px + '" alt=""' + (extra || "") + '>';
  }

  /* ---------- Estructura de la página ---------- */
  area.innerHTML =
    '<div id="g-audio"></div>' +
    '<div class="g-stage"><canvas id="g-canvas" role="img" ' +
    'aria-label="La sala de Carmen: una puerta, una mesita, una repisa y una mesa. La luz cambia con la hora del día. Carmen y su nieta Valeria hablan en la sala."></canvas></div>' +
    '<p class="sr-only" id="g-sr" aria-live="polite"></p>' +
    '<div id="g-panel"><p>Cargando el juego…</p></div>';
  var panel = document.getElementById("g-panel");
  var sr = document.getElementById("g-sr");
  Son.controles(document.getElementById("g-audio"));
  Son.musica(["../assets/audio/musica/alz_musica.mp3"]);

  /* ---------- Escena 2D ---------- */
  var J = new Motor.Juego(document.getElementById("g-canvas"), { base: BASE });
  var POS = { dialogo: [98, 130], ronda: [22, 216], inicio: [22, 216] };
  var E = {
    items: [], visibles: true, cubierto: 0, prot: "idle", acomp: "idle",
    px: 22, ax: 216, pxT: 22, axT: 216, protDx: 0, mod: "inicio", tu: "prot", habla: null,
    burbuja: null, resalta: null, etiquetas: false, nota: false, luz: "manana", faseOsc: 0,
    foto: false, fotoGrande: false, niebla: 0, nieblaT: 0,
    osc: 0.04, oscT: 0.04, pulso: -99999
  };
  // Marcos dibujados para momentos importantes (oscuro = momento feo, cálido = momento bueno): los pone el motor.
  J.marcoPrefijo = "alz_marco_";
  function marcar(m) { J.marcar(m); }
  var AMBIENTE = { manana: 0.04, mediodia: 0, tarde: 0.06, noche: 0.40 };
  function fijarLuz() { E.oscT = AMBIENTE[E.luz] + E.faseOsc; }

  var NOMBRES = ["alz_fondo_sala_1f", "alz_mueble_mesa_1f", "alz_mueble_repisa_1f", "alz_mueble_mesita_1f",
    "alz_cortina_2f", "alz_nota_1f", "alz_per_protagonista_idle_2f", "alz_per_protagonista_pensando_2f",
    "alz_per_acompanante_idle_2f", "alz_per_acompanante_hablando_2f", "alz_marco_oscuro_1f", "alz_marco_calido_1f"];
  Object.keys(O).forEach(function (id) { NOMBRES.push(sprObj(id)); });

  function burbujaDibuja(cx, cy, id, tachar) {
    J.rect(cx - 1, cy - 1, 22, 22, "#0b0f1a");
    J.rect(cx, cy, 20, 20, "#f5f5f5");
    J.rect(cx + 8, cy + 20, 4, 3, "#0b0f1a"); J.rect(cx + 9, cy + 20, 2, 2, "#f5f5f5");
    J.spr(sprObj(id), cx + 2, cy + 2);
    if (tachar) {
      var c = J.ctx; c.strokeStyle = "#c4413f"; c.lineWidth = 2; c.beginPath();
      c.moveTo(cx + 3, cy + 3); c.lineTo(cx + 17, cy + 17); c.moveTo(cx + 17, cy + 3); c.lineTo(cx + 3, cy + 17); c.stroke();
    }
  }
  function flecha(x, y) {                          // marca de quien habla
    J.rect(x - 3, y - 1, 7, 1, "#0b0f1a"); J.rect(x - 2, y, 5, 1, "#f5f5f5"); J.rect(x - 1, y + 1, 3, 1, "#f5f5f5"); J.rect(x, y + 2, 1, 1, "#f5f5f5");
  }

  // Iluminación: la luz de la ventana cambia con la hora; de noche, lámparas cálidas en los muebles
  var LUZ_V = { manana: ["#bfeaff", 0.06], mediodia: ["#f5f5f5", 0.05], tarde: ["#f0a050", 0.12], noche: ["#8aa0d0", 0.05] };
  function luzAlz() {
    var v = LUZ_V[E.luz], L = [{ x: 200, y: 50, r: 78, c: v[0], g: v[1], corte: E.luz === "noche" ? 0.2 : 0.5 }];
    var noche = E.luz === "noche";
    MUEBLES.forEach(function (m) { L.push({ x: m.x + m.w / 2, y: m.y - 4, r: 34, c: "#f0cf7a", g: noche ? 0.14 : 0.07, corte: noche ? 0.7 : 0.5, parp: 0.04 }); });
    if (noche && E.mod === "dialogo") L.push({ x: E.px + 24, y: 100, r: 56, c: "#f0cf7a", g: 0.12, corte: 0.6, parp: 0.03 });
    if (E.fotoGrande) L.push({ x: 120, y: 68, r: 40, c: "#f0cf7a", g: 0.16, corte: 0.7, parp: 0.03 });
    if (st && st.fase === "obs" && E.visibles && E.cubierto < 0.5)
      E.items.forEach(function (it) { L.push({ x: it.x + 8, y: it.y + 8, r: 14, c: "#f0cf7a", g: 0.2, corte: 0.8 }); });
    var edad = J.t - E.pulso;
    if (!reducir && edad < 1400)
      L.push({ x: E.px + 8, y: 110, r: 34, c: "#f0cf7a", g: 0.3 * (1 - edad / 1400), corte: 0.6 * (1 - edad / 1400) });
    return { ambiente: { c: "#0b0f1a", a: E.osc }, luces: L, vineta: 0.22 + 0.3 * E.niebla };
  }

  J.actualizar = function (dt) {
    var k = Math.min(1, dt / 500);
    E.osc += (E.oscT - E.osc) * k;
    E.niebla += (E.nieblaT - E.niebla) * k;

    if (reducir) { E.px = E.pxT; E.ax = E.axT; }
    else { var m = Math.min(1, dt / 220); E.px += (E.pxT - E.px) * m; E.ax += (E.axT - E.ax) * m; }
  };

  J.dibujar = function (c) {
    J.spr("alz_fondo_sala_1f", 0, 0);
    // el cielo de la ventana cambia con la hora
    if (E.luz === "tarde") { c.globalAlpha = 0.38; J.rect(170, 18, 60, 58, "#f09a4a"); c.globalAlpha = 1; }
    else if (E.luz === "noche") {
      c.globalAlpha = 0.85; J.rect(170, 18, 60, 58, "#0d1330"); c.globalAlpha = 1;
      [[180, 28], [205, 24], [218, 40], [190, 50], [212, 58], [198, 36]].forEach(function (p) { J.rect(p[0], p[1], 1, 1, "#f5f5f5"); });
    }
    MUEBLES.forEach(function (m) {
      J.spr(m.spr, m.x, m.y);
      if (E.resalta === m.id && (reducir || Math.floor(J.t / 250) % 2 === 0)) {
        c.strokeStyle = "#f0cf7a"; c.lineWidth = 1;
        c.strokeRect(m.x - 0.5, m.y - 16.5, m.w + 1, 40);
      }
    });
    if (E.foto && !E.fotoGrande) J.spr("alz_obj_foto_1f", 62, 44);
    if (E.visibles) {
      E.items.forEach(function (it, i) {
        var bob = (reducir || E.cubierto > 0) ? 0 : (Math.floor(J.t / 400 + i) % 2 ? 1 : 0);
        J.spr(sprObj(it.id), it.x, it.y - bob);
      });
    }
    // personajes
    var px = Math.round(E.px), ax = Math.round(E.ax);
    J.spr("alz_per_protagonista_" + E.prot + "_2f", px + E.protDx, 98, J.cuadro(500));
    J.spr("alz_per_acompanante_" + E.acomp + "_2f", ax, 100, J.cuadro(500));
    // la foto de la boda, en grande, entre las dos
    if (E.fotoGrande) {
      J.rect(101, 49, 38, 38, "#0b0f1a"); J.rect(102, 50, 36, 36, "#f5f5f5");
      var s = J.sprites["alz_obj_foto_1f"];
      if (s) c.drawImage(s.img, 0, 0, 16, 16, 104, 52, 32, 32);
    }
    // telas que cubren los muebles
    if (E.cubierto > 0) {
      MUEBLES.forEach(function (m) {
        var b = m.cubre, h = Math.ceil(b.h * E.cubierto);
        J.recorte("alz_cortina_2f", 0, 8, 8, b.w, h, b.x, b.y);
        J.rect(b.x, b.y + h - 1, b.w, 1, "#f0cf7a");
      });
    }
    // tinte de la hora
    if (E.luz === "tarde") { c.globalAlpha = 0.10; J.rect(0, 0, J.w, J.h, "#f09a4a"); c.globalAlpha = 1; }
    else if (E.luz === "manana") { c.globalAlpha = 0.04; J.rect(0, 0, J.w, J.h, "#bfeaff"); c.globalAlpha = 1; }
    J.iluminar(luzAlz());
    if (E.niebla > 0.02) { c.globalAlpha = 0.3 * E.niebla; J.rect(0, 0, J.w, J.h, "#8a8f9e"); c.globalAlpha = 1; }
    // etiquetas de rutina
    if (E.etiquetas) MUEBLES.forEach(function (m) { J.texto(m.etiqueta, m.x + m.w / 2, m.cubre.y - 8, "#f0cf7a", true); });
    // nota de la libreta
    if (E.nota) J.spr("alz_nota_1f", 146, 52 - (reducir ? 0 : (Math.floor(J.t / 600) % 2)));
    // quién eres tú y quién habla (solo en las escenas de diálogo)
    if (E.mod === "dialogo") {
      var yoX = (E.tu === "prot" ? px : ax) + 8;
      J.texto("TÚ", yoX, 80, "#f0cf7a", true);
      if (E.habla === "carmen") flecha(px + 8, 91 + (reducir ? 0 : Math.floor(J.t / 300) % 2));
      else if (E.habla === "valeria") flecha(ax + 8, 93 + (reducir ? 0 : Math.floor(J.t / 300) % 2));
    }
    // burbuja de pensamiento
    if (E.burbuja) {
      var b = E.burbuja, bx = b.quien === "prot" ? px : ax, by = b.quien === "prot" ? 98 : 100;
      burbujaDibuja(Math.min(232, bx - 3), by - 26, b.id, b.tachar);
    }
  };

  /* ---------- Diálogos (motor compartido) ---------- */
  var VOZ = { "Carmen": "carmen", "Carmen (por dentro)": "carmen", "Carmen (tú)": "carmen", "Valeria": "valeria", "Valeria (tú)": "valeria" };
  var N = Motor.Novela({
    area: area, panel: panel, sr: sr, nodos: G, tipos: TIPOS, voces: VOZ, pts0: 50,
    etiquetaOps: "¿Qué haces?",
    srTexto: function (n, texto) { return ESCENAS[n.esc].n + ". " + n.quien + ": " + Motor.huecos(texto).sr; },
    cabecera: function (n) { return cabecera(n.paso, ESCENAS[n.esc].n); },
    medidor: function (n, s, dif) { return n.pens ? "" : cercania(dif); },
    alMostrar: function (n, s) {
      var e = ESCENAS[n.esc];
      E.luz = e.luz; E.tu = e.tu; E.faseOsc = 0; fijarLuz();
      E.mod = n.run ? "ronda" : "dialogo";
      var p = POS[E.mod]; E.pxT = p[0]; E.axT = p[1];
      E.foto = !!s.f.fotoVista && !s.f.fotoMano; E.fotoGrande = !!n.grande;
      E.prot = n.pens ? "pensando" : "idle"; E.acomp = "idle";
      marcar(typeof n.marco === "function" ? n.marco() : n.marco);
      E.nieblaT = n.niebla ? 1 : 0; E.burbuja = null; E.resalta = null; E.etiquetas = false;
      E.nota = false; E.items = []; E.cubierto = 0; E.visibles = true;
    },
    alElegir: function (n, op, T) {
      Son.sfx(T.pts > 0 ? "acierto" : T.pts < 0 ? "error" : "clic");
      if (T.pts > 0 && !reducir) { J.chispas((n.esc === "noche" ? E.ax : E.px) + 8, 100, 10, ["#f0cf7a", "#f5f5f5"]); E.pulso = J.t; }
      E.nieblaT = 0; if (op.marco) marcar(op.marco);
      if (op.r.quien === "Valeria" || n.quien === "Valeria") E.acomp = "hablando";
      if (n.quien === "Carmen") E.prot = "pensando";
    },
    nombreTu: function (n) { return n.yo || YO_C; },
    nombreRes: function (n) { return n.quien; },
    alHablar: function (voz) {
      E.habla = voz;
      E.acomp = voz === "valeria" ? "hablando" : "idle";
      if (E.mod === "dialogo") E.prot = (voz === "carmen" && G[st.nodo] && G[st.nodo].pens) ? "pensando" : "idle";
    },
    salida: function (s) { if (s === "fin") { pantallaFinal(); return true; } return false; }
  });
  var st = N.st, pintar = N.pintar;

  function perdidas(r) { return st.rec.filter(function (x) { return x.r === r && !x.ok; }); }
  function recs(ok) { return st.rec.filter(function (x) { return x.ok === ok; }); }

  // A: vuelve el nombre. B: no vuelve, pero hay cercanía. C: hay distancia.
  function final() {
    var p = st.pts, f = st.f;
    if (!f.corrigio && p >= 70) return "A";
    if (p < 35 || (f.corrigio && p < 60)) return "C";
    return "B";
  }

  function nuevaPartida(extra) {
    limpiarTimers();
    N.nuevo({ extra: !!extra, r: 0, rec: [], ayudas: 0, timer: null, tick: null, esc: null, preguntas: [], q: 0, nota: "", token: 0 });
    E.items = []; E.visibles = true; E.cubierto = 0; E.burbuja = null; E.resalta = null; E.etiquetas = false; E.nota = false;
    E.foto = false; E.fotoGrande = false; E.nieblaT = 0; E.protDx = 0;
  }
  function limpiarTimers() {
    if (st && st.timer) { clearTimeout(st.timer); st.timer = null; }
    if (st && st.tick) { clearInterval(st.tick); st.tick = null; }
  }

  /* ---------- Cabeceras y medidor ---------- */
  function cabecera(paso, nombre, extra) {
    var puntos = "";
    for (var i = 1; i <= 4; i++) puntos += '<span class="g-dot' + (i < paso ? " done" : i === paso ? " now" : "") + '"></span>';
    return '<div class="g-head"><span>' + nombre + (extra ? " · " + extra : "") + '</span><span class="g-dots" aria-hidden="true">' + puntos + '</span></div>';
  }
  function cabeceraRonda() {
    var n = G[st.nodo];
    return cabecera(n.paso, ESCENAS[n.esc].n, "Ronda " + (st.r + 1) + ": " + RONDAS[st.r].titulo);
  }
  function cercania(dif) {
    var n = Math.round(clamp(st.pts, 0, 100));
    return '<div class="d-con"><span>Cercanía con Valeria</span><div class="g-bar" role="img" aria-label="Cercanía con Valeria: ' + n + ' %">' +
      '<span style="width:' + n + '%;background:#f0cf7a"></span></div>' +
      (dif ? '<span style="margin-left:6px;font-weight:700;color:' + (dif > 0 ? "#f0cf7a" : "#e07a7a") + '">' + (dif > 0 ? "+" : "−") + Math.abs(dif) + '</span>' : "") + '</div>';
  }
  function recHud() {                               // las historias que se quedaron y las que se fueron
    if (!st.rec.length) return "";
    var ic = st.rec.map(function (x) {
      return '<img class="px' + (x.ok ? "" : " lost") + '" src="' + BASE + sprObj(x.id) + '.png" width="24" height="24" alt="" title="' + O[x.id] + (x.ok ? "" : " (se fue)") + '">';
    }).join("");
    return '<div class="a-rechud" role="img" aria-label="Historias que se quedaron: ' + recs(true).length + '. Historias que se fueron: ' + recs(false).length + '.">' +
      '<span class="a-rechud-t">Recuerdos</span>' + ic + '</div>';
  }
  function listaRec(arr, clase) {
    if (!arr.length) return '<p class="g-sub">Ninguno.</p>';
    return '<ul class="a-recs ' + (clase || "") + '">' + arr.map(function (x) {
      return '<li>' + img(sprObj(x.id), 32) + '<span><strong>' + O[x.id] + '.</strong> ' + RECUERDO[x.id] + '</span></li>';
    }).join("") + '</ul>';
  }

  /* ---------- Colocación de objetos en la escena ---------- */
  function ranuraPos(m, k) { return { x: m.x + k * 16, y: m.y - 14 }; }
  function colocar(shown, zonas) {
    var out = [];
    if (zonas) {
      MUEBLES.forEach(function (m) {
        var its = shown.filter(function (id) { return zonaDe(id).id === m.id; });
        var ks = muestra([0, 1, 2].slice(0, m.ranuras), its.length);
        its.forEach(function (id, i) { var p = ranuraPos(m, ks[i]); out.push({ id: id, x: p.x, y: p.y, mueble: m.id }); });
      });
    } else {
      var libres = [];
      MUEBLES.forEach(function (m) { for (var k = 0; k < m.ranuras; k++) libres.push({ m: m, k: k }); });
      var elegidas = muestra(libres, shown.length);
      shown.forEach(function (id, i) {
        var s = elegidas[i], p = ranuraPos(s.m, s.k); out.push({ id: id, x: p.x, y: p.y, mueble: s.m.id });
      });
    }
    return out;
  }

  /* ---------- Pantallas ---------- */
  function pantallaInicio() {
    nuevaPartida(false);
    E.mod = "inicio"; E.luz = "manana"; E.faseOsc = 0; fijarLuz(); E.pxT = POS.inicio[0]; E.axT = POS.inicio[1]; E.habla = null;
    E.prot = "idle"; E.acomp = "idle"; E.niebla = 0; E.nieblaT = 0;
    sr.textContent = ""; marcar(null);
    pintar(
      '<h2 class="g-title" data-foco>Un domingo en casa de Carmen</h2>' +
      '<p class="g-sub" data-tipear>Vive un día de Carmen, que tiene 78 años, con su nieta Valeria. Son cuatro momentos del día.</p>' +
      '<p class="g-callout" data-tipear><strong>Cómo se juega.</strong> Vas a conversar y a decidir qué decir. A lo largo del día habrá cuatro rondas de memoria: ' +
      'verás unos objetos unos segundos y luego te preguntarán por ellos. Cada objeto guarda un recuerdo de Carmen: ' +
      'si se olvida, lo que se pierde es esa historia. Al final de la noche, cambiarás de lugar.</p>' +
      '<p class="g-callout soft" data-tipear>Este juego no reproduce ni mide el Alzheimer, y no es una prueba de memoria. Carmen y Valeria son personajes inventados. ' +
      'Trata de una pérdida: puedes pausar o dejar de jugar cuando quieras.</p>' +
      '<label class="g-check" data-esperar><input type="checkbox" id="g-extra"><span>Quiero más tiempo para observar</span></label>' +
      '<button class="g-btn" data-accion="empezar" data-esperar>Empezar</button>', true);
    N.hablar({ ms: 16 });
  }

  /* ---------- Rondas de memoria ---------- */
  function ronda() { var r = RONDAS[st.r]; return r.flag && !st.f[r.flag] ? mezc(r, r.sin) : r; }

  function iniciarRonda(i) {
    st.r = i; st.fase = "ronda";
    observar();
  }

  function observar() {
    marcar(null);
    var R = ronda(), shown, hidden;
    if (R.zonas) {
      shown = [];
      ZONAS.forEach(function (z) { shown = shown.concat(muestra(z.items, 2)); });
      hidden = restar(TODOS_ZONAS, shown);
    } else {
      shown = muestra(R.pool, R.n); hidden = restar(R.pool, shown);
    }
    st.esc = { shown: shown, hidden: hidden }; st.nota = ""; st.fase = "obs";
    var tk = ++st.token;
    var seg = Math.round(R.seg * (st.extra ? 1.6 : 1));

    E.items = colocar(shown, !!R.zonas); E.visibles = true; E.cubierto = 1;
    E.prot = "idle"; E.acomp = "idle"; E.burbuja = null; E.resalta = null; E.habla = null;
    E.etiquetas = !!R.zonas; E.nota = false; E.faseOsc = 0.16; fijarLuz();

    if (R.zonas) {
      sr.textContent = "Objetos en la escena. " + MUEBLES.map(function (m) {
        var n = E.items.filter(function (it) { return it.mueble === m.id; }).map(function (it) { return O[it.id]; });
        return m.zona + ": " + n.join(" y ");
      }).join(". ") + ".";
    } else {
      sr.textContent = "Objetos en la escena: " + shown.map(function (id) { return O[id]; }).join(", ") + ".";
    }

    var apoyo = R.apoyo ? '<div class="g-callout"><strong>Apoyo de esta ronda: ' + R.apoyo.nombre + '.</strong> ' + R.apoyo.texto + '</div>' : "";
    var nota = R.nota
      ? '<div class="g-note"><label for="g-nota">Tu libreta (apunta lo que quieras recordar)</label>' +
        '<textarea id="g-nota" maxlength="300" placeholder="Ej.: llaves, taza, libro…"></textarea></div>' : "";
    var orden = E.items.slice().sort(function (a, b) { return a.x - b.x; });
    var lista = '<ul class="a-recs">' + orden.map(function (it) {
      return '<li>' + img(sprObj(it.id), 32) + '<span><strong>' + O[it.id] + '.</strong> ' + RECUERDO[it.id] + '</span></li>';
    }).join("") + '</ul>';
    pintar(
      cabeceraRonda() + '<h2 class="g-title" data-foco>Observa con calma</h2>' + apoyo +
      '<div class="g-timer"><p class="g-timer-text" id="g-seg">Descubriendo los objetos…</p>' +
      '<div class="g-bar" aria-hidden="true"><span id="g-barra"></span></div></div>' + lista + nota +
      '<button class="g-btn" data-accion="listo">Ya los tengo</button>', false);

    Son.sfx("sube");
    J.tween(450, function (p) { E.cubierto = 1 - p; }, function () {
      if (tk !== st.token || st.fase !== "obs") return;
      var barra = document.getElementById("g-barra"), txt = document.getElementById("g-seg"), resta = seg;
      if (txt) txt.textContent = "Tienes " + seg + " segundos.";
      if (barra) { barra.style.transition = "width " + seg + "s linear"; setTimeout(function () { barra.style.width = "0%"; }, 60); }
      st.tick = setInterval(function () { resta--; if (txt && resta > 0) txt.textContent = "Quedan " + resta + " segundos."; }, 1000);
      st.timer = setTimeout(ocultar, seg * 1000);
    });
  }

  function ocultar() {
    if (st.fase !== "obs") return;
    st.fase = "ocultando";
    var notaEl = document.getElementById("g-nota");
    st.nota = notaEl ? notaEl.value.trim() : "";
    limpiarTimers();
    st.preguntas = construirPreguntas(); st.q = 0;
    sr.textContent = "Las telas cubren los muebles. Los objetos ya no se ven.";
    Son.sfx("baja");
    J.tween(450, function (p) { E.cubierto = p; }, function () { E.visibles = false; });
    E.nota = !!st.nota; E.faseOsc = 0.22; fijarLuz();
    pintar(
      cabeceraRonda() + '<h2 class="g-title" data-foco>Los objetos se han cubierto</h2>' +
      '<p class="g-sub">¿Qué recuerdas? Responde con tranquilidad: no hay prisa.</p>' +
      '<button class="g-btn" data-accion="preguntar">Ver las preguntas</button>', true);
  }

  function construirPreguntas() {
    var esc = st.esc, usados = [], out = [];
    ronda().preguntas.forEach(function (tipo) {
      var q, c, opts;
      if (tipo === "presente") {
        c = muestra(restar(esc.shown, usados), 1)[0]; usados.push(c);
        opts = mezclar([c].concat(muestra(esc.hidden, 3)));
        q = { tipo: tipo, texto: "¿Cuál de estos objetos estaba en la escena?", ids: opts, correcta: c, item: c, burbuja: c,
              etiqueta: function (id) { return { spr: sprObj(id), n: O[id] }; } };
      } else if (tipo === "ausente") {
        c = muestra(esc.hidden, 1)[0];
        opts = mezclar([c].concat(muestra(esc.shown, 3)));
        q = { tipo: tipo, texto: "¿Cuál de estos objetos NO estaba en la escena?", ids: opts, correcta: c, item: null, burbuja: c, tachar: true,
              etiqueta: function (id) { return { spr: sprObj(id), n: O[id] }; } };
      } else {
        c = muestra(restar(esc.shown, usados), 1)[0]; usados.push(c);
        var z = zonaDe(c);
        q = { tipo: tipo, texto: "¿Dónde estaba «" + O[c] + "»?", item: c, itemSpr: sprObj(c), ids: ZONAS.map(function (x) { return x.id; }),
              correcta: z.id, burbuja: c, resalta: z.id,
              etiqueta: function (id) { var m = mueble(id); return { spr: m.spr, n: m.zona, ancho: m.w * 2 }; } };
      }
      q.ayudaUsada = false; q.respondida = false;
      out.push(q);
    });
    return out;
  }

  function retro(q, bien) {
    var h = q.item ? "«" + RECUERDO[q.item] + "»" : "";
    if (q.tipo === "presente")
      return bien ? "Lo recuerdas. " + h : "Estaba: " + O[q.item] + ". Con él se escapó su historia. " + h;
    if (q.tipo === "ausente")
      return bien ? "Bien: ese no estaba. Saber qué falta también es recordar." : "El que no estaba era: " + O[q.correcta] + ". Es una pregunta que confunde a mucha gente.";
    var z = zonaDe(q.item);
    return bien ? "Correcto: " + O[q.item] + " vive " + z.n.toLowerCase() + ". Cuando cada cosa tiene su lugar, la casa recuerda por ti. " + h
                : "Estaba " + z.n.toLowerCase() + ". Con ello se escapó su historia. " + h;
  }

  function preguntar() {
    var R = ronda(), q = st.preguntas[st.q];
    E.prot = "pensando"; E.burbuja = null; E.resalta = null; E.acomp = "idle";
    var opciones = q.ids.map(function (id) {
      var et = q.etiqueta(id);
      var w = et.ancho || 48, h = et.ancho ? Math.round(et.ancho / 2) : 48;
      return '<button class="g-opt" data-accion="resp" data-id="' + id + '">' +
             '<img class="px" src="' + BASE + et.spr + '.png" width="' + w + '" height="' + h + '" alt="">' +
             et.n + '<span class="tag"></span></button>';
    }).join("");
    var nota = R.nota
      ? '<div class="g-note"><span class="lbl">Tu libreta</span><textarea id="g-nota-ro" readonly aria-label="Tu libreta"></textarea></div>' : "";
    var ayuda = R.acompanante ? '<button class="g-btn ghost" data-accion="ayuda" id="g-ayuda">Pedir ayuda a Valeria</button>' : "";
    pintar(
      cabeceraRonda() + recHud() + '<p class="g-sub">Pregunta ' + (st.q + 1) + ' de ' + st.preguntas.length + '</p>' +
      (q.itemSpr ? '<div class="g-askitem">' + img(q.itemSpr, 64) + '</div>' : "") +
      '<h2 class="g-q" data-foco>' + q.texto + '</h2>' + nota +
      '<div class="g-options" id="g-opts">' + opciones + '</div>' +
      '<div id="g-msg" aria-live="polite"></div>' + ayuda, true);
    var ro = document.getElementById("g-nota-ro");
    if (ro) ro.value = st.nota || "(No apuntaste nada)";
  }

  function pedirAyuda() {
    var q = st.preguntas[st.q];
    if (q.respondida || q.ayudaUsada) return;
    q.ayudaUsada = true; st.ayudas++;
    Son.sfx("ayuda");
    E.acomp = "hablando";
    setTimeout(function () { E.acomp = "idle"; }, 1800);
    var malas = muestra(q.ids.filter(function (id) { return id !== q.correcta; }), 2);
    panel.querySelectorAll(".g-opt").forEach(function (b) {
      if (malas.indexOf(b.getAttribute("data-id")) !== -1) {
        b.classList.add("dim"); b.disabled = true; b.querySelector(".tag").textContent = "Descartada";
      }
    });
    document.getElementById("g-msg").innerHTML =
      '<div class="g-feedback"><p><strong>Valeria:</strong> «Yo descartaría estas dos. ¿Qué dice tu libreta?»</p></div>';
    var btn = document.getElementById("g-ayuda"); if (btn) btn.disabled = true;
  }

  function responder(id) {
    var q = st.preguntas[st.q];
    if (q.respondida) return;
    q.respondida = true;
    var bien = id === q.correcta;
    if (q.item) st.rec.push({ id: q.item, r: st.r, ok: bien });

    E.resalta = q.resalta || null;
    if (bien) {
      Son.sfx("acierto"); E.prot = "idle";
      E.burbuja = { quien: "prot", id: q.burbuja, tachar: !!q.tachar };
      J.chispas(E.px + 8, 102, 16); E.pulso = J.t;
    } else {
      Son.sfx("error"); E.prot = "idle";
      E.burbuja = { quien: "acomp", id: q.burbuja, tachar: !!q.tachar };
      if (!reducir) J.tween(400, function (p) { E.protDx = Math.round(Math.sin(p * Math.PI * 6) * 2 * (1 - p)); }, function () { E.protDx = 0; }, "lineal");
    }

    panel.querySelectorAll(".g-opt").forEach(function (b) {
      var bid = b.getAttribute("data-id"); b.disabled = true;
      if (bid === q.correcta) { b.classList.add("correct"); b.querySelector(".tag").textContent = "✓ Respuesta correcta"; }
      else if (bid === id) { b.classList.add("wrong"); b.querySelector(".tag").textContent = "Tu respuesta"; }
      else if (!b.classList.contains("dim")) b.classList.add("dim");
    });
    var ultima = st.q === st.preguntas.length - 1;
    var ay = document.getElementById("g-ayuda"); if (ay) ay.disabled = true;
    var hud = panel.querySelector(".a-rechud"); if (hud) hud.outerHTML = recHud() || "";
    if (!hud && st.rec.length) { var gh = panel.querySelector(".g-head"); if (gh) gh.insertAdjacentHTML("afterend", recHud()); }
    document.getElementById("g-msg").innerHTML =
      '<div class="g-feedback"><p>' + retro(q, bien) + '</p></div>' +
      '<button class="g-btn" data-accion="' + (ultima ? "cierre" : "sig") + '" id="g-sig">' +
      (ultima ? "Ver lo que quedó de esta ronda" : "Siguiente pregunta") + '</button>';
    var s = document.getElementById("g-sig"); if (s) s.focus();
  }

  function resumenRonda() {
    var R = ronda(), mias = st.rec.filter(function (x) { return x.r === st.r; });
    E.burbuja = null; E.resalta = null; E.prot = "idle"; E.visibles = true; E.faseOsc = 0; fijarLuz();
    Son.sfx("sube");
    J.tween(450, function (p) { E.cubierto = 1 - p; });
    sr.textContent = "Las telas se levantan. Los objetos eran: " + st.esc.shown.map(function (id) { return O[id]; }).join(", ") + ".";
    var q = mias.filter(function (x) { return x.ok; }), p = mias.filter(function (x) { return !x.ok; });
    marcar(p.length >= 2 ? ["oscuro", 0.5] : (!p.length && q.length >= 2) ? ["calido", 0.45] : null);
    pintar(
      cabeceraRonda() + '<h2 class="g-title" data-foco>Esto se quedó y esto se fue</h2>' +
      '<h3>Se quedaron</h3>' + listaRec(q) + '<h3>Se fueron</h3>' + listaRec(p, "lost") +
      '<div class="g-callout"><strong>Lo que nos enseña esta ronda.</strong> ' + R.resumen + '</div>' +
      '<button class="g-btn" data-accion="rondaSig">Seguir con el día</button>');
  }

  function pantallaFinal() {
    st.fase = "final";
    E.mod = "inicio"; E.habla = null; E.fotoGrande = true; E.pxT = 98; E.axT = 130;
    var f = final();
    var filas = st.hist.map(function (h, i) {
      var T = TIPOS[h.tipo];
      return '<tr><td>' + (i + 1) + '. «' + N.esc(h.t) + '»</td><td><strong>' + T.n + '.</strong> ' + T.txt + '</td></tr>';
    }).join("");
    var fin = f === "A" ? "Esa noche, Carmen volvió a decir tu nombre."
      : f === "B" ? "Esa noche, Carmen no dijo tu nombre, pero se quedó con tu mano."
      : "Esa noche hubo distancia, y aun así te quedaste a su lado.";
    Son.sfx("fin"); J.chispas(E.px + 8, 102, 24); J.chispas(E.ax + 8, 102, 24);
    pintar(
      '<h2 class="g-title" data-foco>Lo que nos llevamos</h2>' +
      '<p>' + fin + ' No es una calificación: el final cambia según cómo acompañaste.</p>' +
      '<h3>Lo que decidiste</h3>' +
      '<table class="g-score d-tabla"><thead><tr><th>Lo que dijiste</th><th>Lo que provoca</th></tr></thead><tbody>' + filas + '</tbody></table>' +
      '<h3>Las historias del día</h3>' +
      '<p>Se quedaron ' + recs(true).length + ' y se fueron ' + recs(false).length + '. ' +
      (st.ayudas ? 'Pediste ayuda a Valeria ' + st.ayudas + (st.ayudas === 1 ? ' vez. ' : ' veces. ') : '') +
      'Olvidar no es un fallo de Carmen: es lo que le pasa a la enfermedad, y es lo que otras personas pueden ayudar a sostener.</p>' +
      '<h4>Se quedaron</h4>' + listaRec(recs(true)) + '<h4>Se fueron</h4>' + listaRec(recs(false), "lost") +
      '<h3>Ideas para recordar</h3><ul class="g-takeaways">' +
      '<li><strong>Rutinas:</strong> horarios y lugares fijos disminuyen la carga de recordar y dan seguridad.</li>' +
      '<li><strong>Recordatorios:</strong> notas, calendarios, etiquetas y alarmas sostienen la autonomía.</li>' +
      '<li><strong>Decir lo que cuesta:</strong> disimular cansa. Decir «hoy me cuesta» permite que te ayuden sin adivinar.</li>' +
      '<li><strong>Cuando pregunta por quien ya no está:</strong> no hay una sola respuesta correcta. Dar el dato de golpe puede doler como la primera vez; acompañar lo que siente o redirigir con suavidad suele calmar más.</li>' +
      '<li><strong>Acompañamiento:</strong> una persona paciente, que sugiere sin corregir ni avergonzar, marca la diferencia.</li></ul>' +
      '<div class="g-callout soft">Este juego no reproduce ni mide el Alzheimer. Si te preocupa tu memoria o la de alguien cercano, ' +
      'consulta con un profesional de la salud. Quien cuida también necesita apoyo.</div>' +
      '<button class="g-btn" data-accion="reiniciar">Jugar de nuevo</button>' +
      '<a class="g-btn ghost" href="../alzheimer.html" style="text-decoration:none">Leer sobre el Alzheimer</a>');
  }

  /* ---------- Eventos ---------- */
  area.addEventListener("click", function (ev) {
    if (N.clic(ev)) return;
    var el = ev.target.closest("[data-accion]");
    if (!el || el.disabled) return;
    var a = el.getAttribute("data-accion");
    if (a !== "resp" && a !== "op") Son.sfx("clic");
    switch (a) {
      case "empezar":
        Son.iniciar();
        var chk = document.getElementById("g-extra"), mas = !!(chk && chk.checked);
        nuevaPartida(mas); N.mostrar("a0"); break;
      case "op": N.elegir(+el.getAttribute("data-i")); break;
      case "sigNodo": N.siguiente(); break;
      case "listo": ocultar(); break;
      case "preguntar": preguntar(); break;
      case "resp": responder(el.getAttribute("data-id")); break;
      case "ayuda": pedirAyuda(); break;
      case "sig": st.q++; preguntar(); break;
      case "cierre": resumenRonda(); break;
      case "rondaSig": N.siguiente(); break;
      case "reiniciar": pantallaInicio(); break;
    }
  });
  area.addEventListener("input", function (ev) {
    if (ev.target && ev.target.id === "g-nota") E.nota = ev.target.value.trim().length > 0;
  });

  J.cargar(NOMBRES).then(function () { J.iniciar(); pantallaInicio(); });
})();
