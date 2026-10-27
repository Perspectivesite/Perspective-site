// Juego de Autismo: «Mismo lugar, distintos sentidos» (2D, 8 bits)
// Mecánica: responder preguntas sencillas mientras el entorno sube o baja el nivel sensorial.
// Ronda 1: sin apoyos. Ronda 2: horario visual y temporizador. Ronda 3: audífonos, luz tenue, fidget y rincón tranquilo.
// Ronda 4: otra persona con necesidades DISTINTAS: lo que ayuda a una no ayuda igual a la otra.
// La escena se dibuja en canvas (motor 2D); textos y botones son HTML accesible.
(function () {
  "use strict";

  var area = document.getElementById("juego");
  if (!area || !window.Motor) return;

  var BASE = "../assets/sprites/autismo/";
  var Son = Motor.Sonido;

  /* ---------- Datos ---------- */
  var ORDEN = ["comer", "jugar", "leer", "salir"];
  var PICTO = { comer: "Comer", jugar: "Jugar", leer: "Leer", salir: "Salir" };
  function sprPicto(id) { return "aut_picto_" + id + "_1f"; }

  // p = cambio de nivel sensorial para el protagonista; s = para el segundo personaje
  var TOOLS = {
    horario:      { n: "Horario visual", spr: "aut_picto_leer_1f", p: -8, s: -4, fr: 1,
                    t: "Saber qué viene después reduce la incertidumbre." },
    temporizador: { n: "Temporizador", spr: "aut_obj_temporizador_1f", p: -8, s: -4, fr: 1,
                    t: "Ver cuánto falta para que algo termine da calma." },
    audifonos:    { n: "Audífonos", spr: "aut_obj_audifonos_1f", p: -22, s: -22, fr: 1,
                    t: "Bajan el ruido del entorno." },
    luz:          { n: "Luz tenue", spr: "aut_obj_luz_tenue_1f", p: -16, s: -12, fr: 1,
                    t: "Una luz más suave cansa menos." },
    fidget:       { n: "Fidget", spr: "aut_obj_fidget_1f", p: -8, s: 10, fr: 1,
                    t: "Mover las manos puede calmar o ayudar a concentrarse, según la persona." },
    rincon:       { n: "Rincón tranquilo", spr: "aut_mueble_rincon_1f", p: -30, s: -20, fr: 1, w: 32, h: 24,
                    t: "Un lugar para descansar de los estímulos." },
    bocina:       { n: "Música de fondo", spr: "aut_obj_bocina_2f", p: 16, s: 22, fr: 2,
                    t: "Algunas personas necesitan más estímulo sonoro para sentirse bien." }
  };

  // nar: lo que se cuenta al entrar (quién, texto). pista: indicación de juego. enc: cuál encuentro con una persona sigue a las preguntas.
  var RONDAS = [
    { titulo: "La fiesta", bg: "aut_fondo_fiesta_1f", base: 82, quien: "protagonista", zona: [0, 45],
      tools: [], luz: true, bocina: true, globos: true,
      nar: [["Narración", "Hoy es el cumpleaños de tu primo Santi. Llevas tu mapa bajo el brazo: dibujaste tu calle como si fuera una línea de metro, con todas las estaciones."],
            ["Mamá", "Cuando tú quieras se lo enseñas a la tía Lupe. Sin prisa."],
            ["Narración", "Entras. Hay globos, luces que parpadean y música muy fuerte. Todos hablan a la vez."]],
      pista: "Responde las preguntas del adulto como puedas. Todavía no sabes qué podría ayudarte.",
      resumen: "Cuando el entorno tiene demasiada luz, ruido y movimiento a la vez, procesar lo que se dice cuesta mucho más. Para muchas personas autistas esto es el día a día, no una exageración." },
    { titulo: "En el aula", bg: "aut_fondo_aula_1f", base: 62, quien: "protagonista", zona: [0, 45],
      tools: ["horario", "temporizador"], luz: true, bocina: false, pizarra: true,
      nar: [["Narración", "En clase, la maestra Ana pegó el horario en la pizarra, con dibujos. Hoy te toca enseñar tu mapa al grupo, después de leer."],
            ["Maestra Ana", "Después de leer es tu turno. Lo ves aquí en el horario. ¿Qué necesitas para estar listo?"]],
      pista: "Hay una luz fuerte y ruido de fondo. Esta vez cuentas con dos apoyos: un horario visual y un temporizador. Actívalos cuando quieras.",
      resumen: "Los apoyos visuales (horarios, pictogramas, temporizadores) hacen predecible lo que viene. Anticipar reduce la ansiedad y libera energía para lo demás." },
    { titulo: "La fiesta, otra vez", bg: "aut_fondo_fiesta_1f", base: 82, quien: "protagonista", zona: [0, 45],
      tools: ["horario", "audifonos", "luz", "fidget", "rincon"], luz: true, bocina: true, globos: true,
      nar: [["Narración", "Vuelves a la fiesta. Esta vez sabes qué cosas te ayudan."],
            ["Mamá", "Si necesitas salir al rincón, me haces la seña. Yo me encargo."]],
      pista: "Puedes ajustar tu entorno: audífonos, luz tenue, fidget y un rincón tranquilo. Prueba qué te funciona.",
      resumen: "El mismo lugar puede ser abrumador o disfrutable según los ajustes. Pequeños cambios (menos ruido, menos luz, un descanso) son adaptaciones, no caprichos." },
    { titulo: "Otra persona, otras necesidades", bg: "aut_fondo_comedor_1f", base: 32, quien: "segundo", zona: [35, 75],
      tools: ["horario", "audifonos", "luz", "fidget", "rincon", "bocina"], luz: false, bocina: false, preguntar: true,
      nar: [["Narración", "Ahora es el comedor de la escuela. Dani está en la mesa de al lado. Lo reconoces: también se pone raro con las cosas, pero distinto a ti."],
            ["Narración", "Hoy te toca a ti preguntar. Sabes lo que cuesta que no te escuchen."]],
      pista: "Pregúntale a Dani qué necesita antes de ayudarle. ¿Lo que te sirvió a ti le sirve también a él?",
      resumen: "Dos personas autistas pueden necesitar cosas opuestas: una busca silencio y otra, ruido de fondo y movimiento. Por eso la mejor ayuda empieza preguntando y escuchando." }
  ];

  /* ---------- Respuestas con pictogramas y encuentros con personas ---------- */
  var PICTO_R = {
    pausa:    { n: "Pausa", spr: "aut_picto_pausa_1f", txt: "Pedir una pausa dice con claridad que necesitas parar. Funciona mejor cuando los demás esperan." },
    masbajo:  { n: "Más bajo", spr: "aut_picto_masbajo_1f", txt: "Pedir menos ruido o menos luz es un ajuste razonable, y ayuda cuando alguien escucha." },
    mapa:     { n: "Mostrar mapa", spr: "aut_picto_mapa_1f", txt: "Hablar de lo que te gusta da energía y conexión, pero no baja el ruido." },
    no:       { n: "No", spr: "aut_picto_no_1f", txt: "Decir «no» a algo que te ayuda es poner un límite, y merece respeto." },
    todobien: { n: "Todo bien", spr: "aut_picto_todobien_1f", txt: "Hacer como que todo está bien baja la tensión en el momento, pero cuesta energía después." }
  };
  // niv: cambio inmediato del nivel sensorial. conf: cambio de confianza. finge: Iker hizo como que todo estaba bien.
  var ENC = [
    { quien: "Santi", texto: "¡Ven a jugar! Es solo ruido, no pasa nada.",
      dentro: "El ruido no es solo ruido. Es como si me hablaran todos al mismo tiempo.",
      orden: ["pausa", "masbajo", "mapa", "todobien"],
      ops: {
        pausa:    { r: ["Santi", "¿Ahorita? Ay… ok. Te espero."], niv: -8, conf: 6 },
        masbajo:  { r: ["Santi", "No sé cómo se baja… ¡pero vamos afuera!"], niv: -15, conf: 8 },
        mapa:     { r: ["Santi", "¡Wow! ¿Eso es un mapa? ¿Esta línea es mi casa?"], niv: 0, conf: 10, nota: "Hablar de lo que te gusta da energía, pero el ruido sigue ahí." },
        todobien: { r: ["Santi", "¡Ves! No pasa nada."], extra: ["Narración", "Sonríes como en las fotos. Por dentro, el ruido sigue."], niv: -5, conf: -4, finge: true }
      } },
    { quien: "Maestra Ana", texto: "Falta poco para que sea tu turno. ¿Cómo vas?",
      dentro: "Quiero enseñarlo, pero primero necesito que todo esté un poco más quieto.",
      orden: ["pausa", "masbajo", "mapa", "todobien"],
      ops: {
        pausa:    { r: ["Maestra Ana", "Claro. Cuando tú digas. Te guardo el turno."], niv: -10, conf: 8 },
        masbajo:  { r: ["Maestra Ana", "Pongo a todos en voz baja un rato. ¿Mejor?"], niv: -12, conf: 8 },
        mapa:     { r: ["Maestra Ana", "¡Lo vamos a mirar juntos! Primero lo colgamos aquí."], niv: -4, conf: 10 },
        todobien: { r: ["Maestra Ana", "Qué bien, entonces seguimos."], extra: ["Narración", "Ana sigue con la clase. Tú también, con la voz apagada por dentro."], niv: -3, conf: -4, finge: true }
      } },
    { quien: "Tía Lupe",
      texto: function () { return st.tools.audifonos ? "A ver, quítate eso, mi cielo, que te quiero oír." : "¡Mi niño! A ver, enséñame ese mapa que me dijeron."; },
      dentro: "Quiero que la tía vea el mapa, pero habla muy cerca y muy fuerte.",
      orden: ["pausa", "no", "mapa", "todobien"],
      ops: {
        pausa:    { r: ["Tía Lupe", "Ay, perdón. Voy por mi café y regreso."], niv: -8, conf: 8 },
        no:       { r: function () { return ["Tía Lupe", st.tools.audifonos ? "¿No? Ah… ¿te ayudan? No lo sabía. Pues déjatelos." : "Ay, perdón. A veces soy mucho. Te doy espacio."]; }, niv: -4, conf: 10 },
        mapa:     { r: ["Tía Lupe", "¡Pero qué cosa! ¿Y esta estación qué es?"], extra: function () { return st.tools.audifonos ? ["Narración", "Lupe baja la voz para no hacerte daño."] : null; }, niv: -2, conf: 12 },
        todobien: { r: function () { return ["Tía Lupe", st.tools.audifonos ? "Mucho mejor sin eso." : "¡Mucho mejor! ¡Ven, un abrazo!"]; },
                    extra: function () { return ["Narración", st.tools.audifonos ? "Lupe te quita los audífonos. El ruido entra de golpe." : "Lupe te abraza fuerte y habla muy cerca de tu oído."]; },
                    niv: function () { return st.tools.audifonos ? 20 : 10; }, conf: -8, finge: true }
      } },
    null
  ];
  var FINALES = {
    A: [["Narración", "Unos días después, tía Lupe viene a casa a ver el mapa con calma. Dibujas una estación nueva: «Rincón tranquilo»."],
        ["Tía Lupe", "Déjame ponerle otra, con lápiz. «Silencio». Esa es mi favorita."],
        ["Narración", "Los dos se ríen. Es tu mapa, y hoy alguien lo miró con calma."]],
    B: [["Narración", "Unos días después, tía Lupe pasa a ver tu mapa un momento. Estás cansado, pero se lo enseñas."],
        ["Tía Lupe", "Está padrísimo, Iker."],
        ["Narración", "Hoy fue mucho, pero lo lograste."]],
    C: [["Narración", "Llegas a casa y no sacas el mapa. Se queda en la mochila."],
        ["Mamá", "Hoy fue mucho, ¿verdad? ¿Qué necesitas?"],
        ["Narración", "Le muestras el dibujo de Pausa. Mamá apaga la luz de arriba y deja una lamparita encendida."]]
  };
  var VOZ = { "Santi": "tu", "Maestra Ana": "prof", "Tía Lupe": "valeria", "Mamá": "prof", "Dani": "mateo",
              "Iker": "narra", "Iker (por dentro)": "narra", "Narración": "narra" };

  /* ---------- Utilidades ---------- */
  function mezclar(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function icono(spr, w, h, frames, k) {
    k = k || 3;
    return '<span class="px a-ico" aria-hidden="true" style="width:' + w * k + 'px;height:' + h * k +
      'px;background-image:url(' + BASE + spr + '.png);background-size:' + w * k * frames + 'px ' + h * k + 'px"></span>';
  }
  function garble(txt, p) {
    var o = "";
    for (var i = 0; i < txt.length; i++) {
      var c = txt.charAt(i);
      o += (c !== " " && /[A-Za-zÁÉÍÓÚáéíóúñ]/.test(c) && Math.random() < p) ? "▒" : c;
    }
    return o;
  }

  /* ---------- Estructura de la página ---------- */
  area.innerHTML =
    '<div id="g-audio"></div>' +
    '<div class="g-stage"><canvas id="g-canvas" role="img" ' +
    'aria-label="Escena en 2D de un lugar con mucha luz y ruido. El personaje cambia de postura según su nivel sensorial."></canvas></div>' +
    '<p class="sr-only" id="g-sr" aria-live="polite"></p>' +
    '<div id="g-panel"><p>Cargando el juego…</p></div>';
  var panel = document.getElementById("g-panel");
  var sr = document.getElementById("g-sr");
  Son.controles(document.getElementById("g-audio"));
  var N = Motor.Novela({ area: area, panel: panel, sr: sr, nodos: {}, tipos: {}, voces: VOZ });   // sistema de textos compartido
  Son.musica(["../assets/audio/musica/aut_musica_calma.mp3"]);

  // Capa de «ruido» de la música: sube con el nivel sensorial (si existe el archivo; si no, silencio)
  var capaRuido = null;
  (function () {
    try {
      var a = new Audio(); a.loop = true; a.preload = "auto"; a.volume = 0;
      var ok = false;
      a.addEventListener("canplaythrough", function () { ok = true; });
      a.addEventListener("error", function () { ok = false; capaRuido = null; }, { once: true });
      a.src = "../assets/audio/musica/aut_musica_ruido.mp3";
      capaRuido = { el: a, listo: function () { return ok; } };
    } catch (e) { capaRuido = null; }
  })();

  /* ---------- Estado ---------- */
  var st = null;                                   // estado de la partida
  var efectos = !Motor.reducirMovimiento;          // luces parpadeantes, temblor, difuminado, ruido
  var S = 20;                                      // nivel sensorial 0..100

  function nuevo() {
    st = { r: 0, fase: "inicio", q: 0, preguntas: [], ok: [0, 0, 0, 0], tZona: [0, 0, 0, 0], tTotal: [0, 0, 0, 0],
           tools: {}, enRincon: false, preguntado: false, pregCount: [0, 0, 0, 0],
           conf: 50, finge: [false, false, false, false], hist: [], ajuste: 0, pen: 0, enc: null, escribiendo: false };
  }
  nuevo();

  function ronda() { return RONDAS[st.r]; }
  function zona() { return ronda().zona; }
  function meta(idTool) { var t = TOOLS[idTool], seg = ronda().quien === "segundo"; return seg ? t.s : t.p; }
  function objetivo() {
    var R = ronda(), v = R.base + st.ajuste + (R.quien === "segundo" ? 0 : st.pen), id;
    for (id in st.tools) if (st.tools[id]) v += meta(id);
    if (efectos) v += 4 * Math.sin(J.t / 1500);
    return clamp(v, 0, 100);
  }
  // Cuánto sufre el texto: 0 (calmo) a 1 (sobrecarga). Los audífonos lo amortiguan; «reducir efectos» lo apaga.
  function nivelTexto() {
    if (!efectos || !st || st.enRincon) return 0;
    var n = clamp((S - zona()[1] + 10) / 50, 0, 1);
    return st.tools.audifonos ? n * 0.3 : n;
  }
  function categoria() {
    var z = zona();
    if (S > z[1] + 25) return "muy-alto";
    if (S > z[1]) return "alto";
    if (S < z[0] - 12) return "bajo";
    return "bien";
  }
  var TXT_CAT = {
    "muy-alto": "Demasiado: la luz, el ruido y el movimiento abruman.",
    "alto": "Alto: cuesta concentrarse.",
    "bien": "Cómodo: puedes pensar con claridad.",
    "bajo": "Muy bajo: te sientes apagado o aburrido."
  };

  /* ---------- Escena 2D ---------- */
  var J = new Motor.Juego(document.getElementById("g-canvas"), { base: BASE });
  J.marcoPrefijo = "aut_marco_";   // marcos dibujados: oscuro, cálido (momentos) y, aparte, rojo (sobrecarga) y calma (rincón)
  J.marcoQuieto = !efectos;        // con «reducir efectos» los marcos no respiran ni titilan
  var NOMBRES = [
    "aut_fondo_fiesta_1f", "aut_fondo_aula_1f", "aut_fondo_comedor_1f",
    "aut_per_protagonista_idle_2f", "aut_per_protagonista_abrumado_2f", "aut_per_protagonista_tranquilo_2f",
    "aut_per_segundo_idle_2f", "aut_per_segundo_abrumado_2f", "aut_per_segundo_tranquilo_2f",
    "aut_per_otro_a_2f", "aut_per_otro_b_2f", "aut_per_adulto_2f",
    "aut_obj_luz_fuerte_2f", "aut_obj_luz_tenue_1f", "aut_obj_bocina_2f", "aut_obj_globos_2f",
    "aut_obj_audifonos_1f", "aut_obj_temporizador_1f", "aut_obj_fidget_1f",
    "aut_picto_comer_1f", "aut_picto_jugar_1f", "aut_picto_leer_1f", "aut_picto_salir_1f",
    "aut_mueble_pizarra_1f", "aut_mueble_rincon_1f",
    "aut_per_santi_2f", "aut_per_ana_2f", "aut_per_lupe_2f", "aut_per_mama_2f",
    "aut_marco_oscuro_1f", "aut_marco_calido_1f", "aut_marco_rojo_1f", "aut_marco_calma_1f"
  ];
  var PERSONA_SPR = { "Santi": "aut_per_santi_2f", "Maestra Ana": "aut_per_ana_2f", "Tía Lupe": "aut_per_lupe_2f" };

  function pose() {
    var z = zona(), seg = ronda().quien === "segundo";
    if (S > z[1]) return "abrumado";
    if (seg) return S < z[0] ? "idle" : "tranquilo";
    return S <= 25 ? "tranquilo" : "idle";
  }

  // Iluminación ligada al estado: luz dura que sobreexpone, luz tenue cálida, rincón acogedor o lámparas del comedor
  function iluminarAut(R, tool) {
    var L = [], amb = null, vin = 0, g = clamp(S / 100, 0, 1);
    if (st.enRincon) {
      amb = { c: "#1f2a44", a: 0.34 }; vin = 0.25;
      L.push({ x: 222, y: 116, r: 36, c: "#f0cf7a", g: 0.16, corte: 0.9, parp: 0.03 });
    } else if (tool.luz) {
      amb = { c: "#1f2a44", a: 0.34 }; vin = 0.22;
      L.push({ x: 128, y: 14, r: 100, c: "#f0cf7a", g: 0.14, corte: 0.85, parp: 0.02 });
    } else if (R.luz) {
      L.push({ x: 128, y: 10, r: 110 + 40 * g, c: "#f5f5f5", g: 0.1 + 0.25 * g, corte: 1 });
    } else {
      amb = { c: "#0b0f1a", a: 0.10 };
      [60, 150].forEach(function (lx) { L.push({ x: lx, y: 18, r: 44, c: "#f0cf7a", g: 0.10, corte: 0.7 }); });
    }
    J.iluminar({ ambiente: amb, luces: L, vineta: vin });
  }

  J.actualizar = function (dt) {
    if (!st || st.fase === "inicio" || st.fase === "final") { S += (25 - S) * Math.min(1, dt / 1000); return; }
    S += (objetivo() - S) * Math.min(1, dt / 1000 * 1.2);
    if (st.fase === "juego") {
      var z = zona();
      st.tTotal[st.r] += dt;
      if (S >= z[0] - 12 && S <= z[1]) st.tZona[st.r] += dt;
    }
  };

  J.dibujar = function (c) {
    var R = st.fase === "inicio" || st.fase === "final" ? RONDAS[0] : ronda();
    var p = pose(), alto = S > zona()[1];
    var dx = (efectos && alto && Math.floor(J.t / 90) % 2) ? 1 : 0;
    c.save(); c.translate(dx, 0);
    J.spr(R.bg, 0, 0);
    if (R.pizarra) J.spr("aut_mueble_pizarra_1f", 96, 64);
    if (R.globos) J.spr("aut_obj_globos_2f", 204, 30, J.cuadro(500));
    if (R.bocina) J.spr("aut_obj_bocina_2f", 24, 66, alto || !efectos ? J.cuadro(250) : J.cuadro(500));
    var tool = st.tools;
    if (R.luz && !tool.luz) J.spr("aut_obj_luz_fuerte_2f", 120, 4, J.cuadro(efectos ? 450 : 1000));
    if (tool.luz) J.spr("aut_obj_luz_tenue_1f", 120, 4);
    if (st.r >= 2 || R.tools.indexOf("rincon") !== -1) J.spr("aut_mueble_rincon_1f", 206, 112);
    // otros personajes
    var pro = R.quien === "protagonista";
    J.spr("aut_per_otro_a_2f", 60, 98, J.cuadro(500));
    J.spr("aut_per_otro_b_2f", 186, 98, J.cuadro(500) ? 0 : 1);
    var quien = (st.fase === "encuentro" || st.fase === "encuentro-r") && st.enc ? PERSONA_SPR[st.enc.quien]
              : (st.fase === "intro" && R.nar && R.nar.some(function (x) { return x[0] === "Mamá"; })) ? "aut_per_mama_2f" : null;
    if (quien) J.spr(quien, 134, 96, J.cuadro(500));             // la persona con la que habla Iker se acerca
    else J.spr("aut_per_adulto_2f", 150, 94, J.cuadro(500));
    if (!pro) J.spr("aut_per_protagonista_idle_2f", 86, 98, J.cuadro(500));
    // personaje principal (en el rincón si está descansando)
    var px = st.enRincon ? 214 : 110, py = st.enRincon ? 100 : 96;
    J.spr("aut_per_" + R.quien + "_" + (st.enRincon ? "tranquilo" : p) + "_2f", px, py,
          p === "abrumado" && !st.enRincon ? J.cuadro(200) : J.cuadro(500));
    if (tool.audifonos && !st.enRincon) J.spr("aut_obj_audifonos_1f", px, py - 5);
    c.restore();
    // luz: parpadeo (≈1 Hz, nunca más rápido) y tenue
    if (efectos && R.luz && !tool.luz && Math.floor(J.t / 500) % 2) {
      J.ctx.globalAlpha = 0.08 + 0.22 * (S / 100); J.rect(0, 0, J.w, J.h, "#f5f5f5"); J.ctx.globalAlpha = 1;
    }
    iluminarAut(R, tool);
    if (alto && efectos) {                         // marco rojo dibujado: sobrecarga (se cierra más cuanto más alto el nivel; sin parpadeo rápido)
      J.marco("aut_marco_rojo_1f", clamp(0.3 + (S - zona()[1]) / 70, 0.3, 0.85) + 0.06 * Math.sin(J.t / 600));
    } else if (st.enRincon) {                      // rincón tranquilo: marco azul suave
      J.marco("aut_marco_calma_1f", 0.6);
    } else if (S < zona()[0] - 12) {               // niebla gris: bajo estímulo
      J.ctx.globalAlpha = 0.25; J.rect(0, 0, J.w, J.h, "#3a4a73"); J.ctx.globalAlpha = 1;
    }
  };

  /* ---------- Sonido de sobrecarga (solo si efectos activados) ---------- */
  var ultimoRuido = 0;
  setInterval(function () {
    if (!st || st.fase !== "juego" || !efectos || !Son.sfxOn || !Son.ctx) return;
    if (st.tools.audifonos || st.enRincon) return;
    var z = zona();
    if (S > z[1] + 10 && ronda().quien === "protagonista") {
      Son.tono(150 + Math.random() * 250, 0.18, "sawtooth", 0.05 + 0.1 * (S / 100), 0);
    }
  }, 1100);
  setInterval(function () {                        // capa de música «ruido»
    if (!capaRuido || !capaRuido.listo()) return;
    try {
      var a = capaRuido.el, on = Son.musOn && Son.mus && !Son.mus.paused;
      if (on) { if (a.paused) { a.currentTime = Son.mus.currentTime % (a.duration || 1); a.play().catch(function () {}); } }
      else if (!a.paused) a.pause();
      a.volume = clamp(Son.vol * 0.7 * (S / 100) * (st && st.tools.audifonos ? 0.4 : 1), 0, 1);
      if (Son.mus) Son.mus.volume = clamp(Son.vol * 0.7 * (1 - S / 160), 0, 1);
    } catch (e) {}
  }, 300);

  /* ---------- Panel ---------- */
  var pintar = N.pintar;

  function cabecera() {
    var puntos = "";
    for (var i = 0; i < RONDAS.length; i++)
      puntos += '<span class="g-dot' + (i < st.r ? " done" : i === st.r ? " now" : "") + '"></span>';
    return '<div class="g-head"><span>Ronda ' + (st.r + 1) + ' de ' + RONDAS.length + ' · ' + ronda().titulo +
           '</span><span class="g-dots" aria-hidden="true">' + puntos + '</span></div>';
  }

  function hud() {
    var z = zona(), R = ronda();
    var herr = R.tools.map(function (id) {
      var t = TOOLS[id], on = !!st.tools[id], w = t.w || 16, h = t.h || 16;
      return '<button type="button" class="a-tool" data-accion="tool" data-id="' + id + '" aria-pressed="' + on + '" title="' + t.t + '">' +
             icono(t.spr, w, h, t.fr, w > 16 ? 1.5 : 3) + '<span>' + t.n + '</span></button>';
    }).join("");
    var horario = (R.tools.indexOf("horario") !== -1 && st.tools.horario)
      ? '<div class="a-horario" aria-label="Horario visual: comer, jugar, leer, salir">' +
        ORDEN.map(function (id) { return icono(sprPicto(id), 16, 16, 1, 3) + '<span class="sr-only">' + PICTO[id] + '</span>'; })
             .join('<span class="a-flecha" aria-hidden="true">›</span>') + '</div>' : "";
    return '<div class="a-hud">' +
      '<div class="a-meter-wrap"><span class="a-meter-lbl">Nivel sensorial</span>' +
      '<div class="a-meter" role="img" id="a-meter" aria-label="Nivel sensorial"><div class="a-zone" style="left:' + z[0] + '%;width:' + (z[1] - z[0]) + '%"></div>' +
      '<div class="a-mark" id="a-mark"></div></div>' +
      '<p class="a-estado" id="a-estado"></p></div>' +
      (herr ? '<div class="a-tools" role="group" aria-label="Apoyos disponibles">' + herr + '</div>' : '<p class="g-sub">Aún no tienes ningún apoyo.</p>') +
      horario + '</div>';
  }

  var catPrevia = "";
  setInterval(function () {                        // actualiza medidor, estado y texto «ruidoso»
    if (!st) return;
    var m = document.getElementById("a-mark"), e = document.getElementById("a-estado"), mt = document.getElementById("a-meter");
    if (m) m.style.left = clamp(S, 0, 100) + "%";
    var cat = categoria();
    if (e && cat !== catPrevia) { e.textContent = TXT_CAT[cat]; catPrevia = cat; if (st.fase === "juego") sr.textContent = TXT_CAT[cat]; }
    if (mt) mt.setAttribute("aria-label", "Nivel sensorial: " + Math.round(S) + " de 100. Zona cómoda: " + zona()[0] + " a " + zona()[1] + ".");
    var g = document.getElementById("a-q-vis"), real = document.getElementById("a-q-real"), ops = document.getElementById("a-opts");
    var alto = S > zona()[1] + 15 && ronda().quien === "protagonista" && !st.tools.audifonos;
    if (g && real && !st.escribiendo) {
      var nv = nivelTexto(), nuevoT = (efectos && alto) ? garble(real.textContent, clamp((S - 55) / 120, 0.05, 0.3)) : real.textContent;
      if (g.textContent !== nuevoT) g.textContent = nuevoT;
      g.style.setProperty("--tr", (nv * 2.6).toFixed(1) + "px");
      g.classList.toggle("tw-temblor", nv > 0.3); g.classList.toggle("tw-alto", nv > 0.6);
    }
    if (ops) ops.style.filter = (efectos && S > zona()[1] + 20) ? "blur(" + clamp((S - 60) / 35, 0, 1.4).toFixed(1) + "px)" : "none";
  }, 700);

  /* ---------- Preguntas ---------- */
  function construirPreguntas() {
    var pares = [];
    for (var i = 0; i < ORDEN.length - 1; i++) {
      pares.push({ texto: "¿Qué toca después de «" + PICTO[ORDEN[i]] + "»?", correcta: ORDEN[i + 1] });
      pares.push({ texto: "¿Qué hicimos antes de «" + PICTO[ORDEN[i + 1]] + "»?", correcta: ORDEN[i] });
    }
    return mezclar(pares).slice(0, 3);
  }

  /* ---------- Pantallas ---------- */
  function pantallaInicio() {
    nuevo(); S = 20; sr.textContent = ""; J.marcar(null);
    var plan = ORDEN.map(function (id) { return icono(sprPicto(id), 16, 16, 1, 3) + '<span class="a-pl">' + PICTO[id] + '</span>'; })
                    .join('<span class="a-flecha" aria-hidden="true">›</span>');
    pintar(
      '<h2 class="g-title" data-foco>Mismo lugar, distintos sentidos</h2>' +
      '<p class="g-sub" data-tipear>Responde preguntas sencillas mientras el entorno cambia. Son 4 rondas cortas.</p>' +
      '<p class="g-callout" data-tipear>El plan de hoy, que te cuentan al llegar:</p>' +
      '<div class="a-plan" data-esperar>' + plan + '</div>' +
      '<p class="g-callout" data-tipear>En cada ronda te harán preguntas sobre ese plan mientras la luz, el ruido y el movimiento cambian. ' +
      'Al lado verás tu nivel sensorial: la franja verde es la zona donde estás cómodo.</p>' +
      '<p class="g-callout soft" data-tipear>El autismo es un espectro: no todas las personas autistas viven los sentidos igual, ' +
      'y la sensibilidad sensorial es solo una parte de la experiencia. Este juego no reproduce el autismo; ' +
      'ayuda a entender por qué los ajustes del entorno importan.</p>' +
      '<label class="g-check" data-esperar><input type="checkbox" id="g-efectos"' + (efectos ? "" : " checked") + '><span>Reducir efectos de luz, ruido y movimiento (sin destellos, temblor, difuminado ni sonidos fuertes)</span></label>' +
      '<button class="g-btn" data-accion="empezar" data-esperar>Empezar</button>', true);
    N.hablar({ ms: 16 });
  }

  function introRonda() {
    var R = ronda();
    st.fase = "intro"; st.tools = {}; st.enRincon = false; st.preguntado = false; st.ajuste = 0;
    st.pen = st.r > 0 && st.finge[st.r - 1] ? 12 : 0;                     // hacer como que todo estaba bien se paga después
    S = clamp(R.base - 30 + (R.quien === "segundo" ? 0 : st.pen), 0, 100); catPrevia = "";
    var nar = R.nar.slice();
    if (st.r === 1 && st.finge[0]) nar.unshift(["Narración", "Llegas al lunes todavía cansado de la fiesta."]);
    if (st.r === 2 && st.finge[1]) nar.unshift(["Narración", "Todavía traes en el cuerpo lo del aula, aunque nadie lo notó."]);
    sr.textContent = R.titulo + ". " + nar.map(function (x) { return x[0] + ": " + x[1]; }).join(" ");
    J.marcar(null);
    pintar(cabecera() + '<h2 class="g-title" data-foco>' + R.titulo + '</h2>' +
      nar.map(function (x) { return N.caja(x[0], x[1]); }).join("") +
      '<p class="g-sub" data-tipear>' + R.pista + '</p>' +
      (R.tools.length ? '<p class="g-sub" data-tipear>Apoyos de esta ronda: ' + R.tools.map(function (id) { return TOOLS[id].n; }).join(", ") + '.</p>' : "") +
      '<button class="g-btn" data-accion="ronda" data-esperar>Entrar</button>');
    N.hablar({ ms: 24 });
  }

  // Confianza: cuánto siente Iker que lo escuchan
  function confHtml(dif) {
    var n = Math.round(clamp(st.conf, 0, 100));
    return '<div class="d-con"><span>Confianza</span><div class="g-bar" role="img" aria-label="Confianza: ' + n + ' %"><span style="width:' + n + '%;background:#f0cf7a"></span></div>' +
      (dif ? '<span style="margin-left:6px;font-weight:700;color:' + (dif > 0 ? "#f0cf7a" : "#e07a7a") + '">' + (dif > 0 ? "+" : "−") + Math.abs(dif) + '</span>' : "") + '</div>';
  }

  // Encuentro con una persona: Iker responde con pictogramas
  function encuentro() {
    var e = ENC[st.r], t = typeof e.texto === "function" ? e.texto() : e.texto;
    st.fase = "encuentro"; st.enc = e;
    sr.textContent = e.quien + ": " + t + " Iker piensa: " + e.dentro;
    var ops = e.orden.map(function (id) {
      var pr = PICTO_R[id];
      return '<button class="g-opt" data-accion="picto" data-id="' + id + '">' + icono(pr.spr, 16, 16, 1, 4) + pr.n + '<span class="tag"></span></button>';
    }).join("");
    pintar(cabecera() + hud() + confHtml() +
      N.caja(e.quien, t) + N.caja("Iker (por dentro)", e.dentro, "", " d-pens") +
      '<div class="g-options" id="a-picto" data-esperar role="group" aria-label="¿Qué muestras?">' + ops + '</div>', true);
    J.marcar(null);
    N.hablar({ ms: 30, nivel: nivelTexto });
  }

  function elegirPicto(id) {
    var e = st.enc, o = e.ops[id], pr = PICTO_R[id];
    var r = typeof o.r === "function" ? o.r() : o.r;
    var extra = typeof o.extra === "function" ? o.extra() : o.extra;
    var niv = typeof o.niv === "function" ? o.niv() : o.niv;
    st.ajuste += niv; st.conf = clamp(st.conf + o.conf, 0, 100);
    if (o.finge) st.finge[st.r] = true;
    st.hist.push({ ronda: st.r, id: id, quien: e.quien });
    st.fase = "encuentro-r";
    Son.sfx(o.conf > 0 ? "acierto" : o.conf < 0 ? "error" : "clic");
    if (o.conf > 0 && !Motor.reducirMovimiento) J.chispas(118, 100, 10, ["#f0cf7a", "#f5f5f5"]);
    // momento importante: ser escuchado se siente cálido; hacer como que todo está bien, no
    J.marcar(o.finge ? ["oscuro", 0.45] : id === "mapa" ? ["calido", 0.7] : ["calido", 0.45]);
    sr.textContent = "Iker muestra: " + pr.n + ". " + r[0] + ": " + r[1] + (extra ? " " + extra[1] : "") + (o.nota ? " " + o.nota : "");
    pintar(cabecera() + hud() + confHtml(o.conf) +
      '<div class="g-feedback"><p class="a-muestra" data-foco>Iker muestra: ' + icono(pr.spr, 16, 16, 1, 3) + ' <strong>' + pr.n + '</strong></p></div>' +
      N.caja(r[0], r[1]) + (extra ? N.caja(extra[0], extra[1]) : "") +
      (o.nota ? '<p class="g-sub" data-tipear>' + o.nota + '</p>' : "") +
      '<button class="g-btn" data-esperar data-accion="resumen">Continuar</button>', true);
    N.hablar({ ms: 30, nivel: nivelTexto });
  }

  function empezarRonda() {
    st.fase = "juego"; st.q = 0; st.preguntas = construirPreguntas();
    preguntar();
  }

  function preguntar() {
    var R = ronda(), q = st.preguntas[st.q];
    q.resp = false;
    var opciones = mezclar(ORDEN).map(function (id) {
      return '<button class="g-opt" data-accion="resp" data-id="' + id + '">' + icono(sprPicto(id), 16, 16, 1, 4) + PICTO[id] + '<span class="tag"></span></button>';
    }).join("");
    var pregunta = R.preguntar && !st.preguntado
      ? '<button class="g-btn ghost" data-accion="preguntar" id="a-preg">Preguntarle qué necesita</button>' : "";
    pintar(cabecera() + hud() +
      '<p class="g-sub">Pregunta ' + (st.q + 1) + ' de 3 · el adulto dice:</p>' +
      '<h2 class="g-q" data-foco><span class="sr-only" id="a-q-real">' + q.texto + '</span><span id="a-q-vis" aria-hidden="true">' + q.texto + '</span></h2>' +
      '<div class="g-options" id="a-opts">' + opciones + '</div>' + pregunta +
      '<div id="g-msg" aria-live="polite"></div>', true);
    catPrevia = "";
    var vis = document.getElementById("a-q-vis");
    st.escribiendo = true;
    N.maq = Motor.escribir(vis, q.texto, { ms: 30, voz: "narra", nivel: nivelTexto, alTerminar: function () { st.escribiendo = false; } });
  }

  function responder(id) {
    var q = st.preguntas[st.q];
    if (q.resp) return;
    q.resp = true;
    var bien = id === q.correcta, cat = categoria();
    if (bien) { st.ok[st.r]++; Son.sfx("acierto"); J.chispas(118, 100, 14); } else Son.sfx("error");
    panel.querySelectorAll(".g-opt").forEach(function (b) {
      var bid = b.getAttribute("data-id"); b.disabled = true;
      if (bid === q.correcta) { b.classList.add("correct"); b.querySelector(".tag").textContent = "✓ Respuesta"; }
      else if (bid === id) { b.classList.add("wrong"); b.querySelector(".tag").textContent = "Tu respuesta"; }
      else b.classList.add("dim");
    });
    var ops = document.getElementById("a-opts"); if (ops) ops.style.filter = "none";
    var g = document.getElementById("a-q-vis");
    if (g) { if (N.maq) N.maq.saltar(); st.escribiendo = false; g.textContent = q.texto; g.classList.remove("tw-temblor", "tw-alto"); }
    var nota = "";
    if (cat === "muy-alto" || cat === "alto") nota = bien ? "Lo lograste aunque había mucho estímulo, y eso cuesta energía." : "Con tanto estímulo es difícil procesar lo que se pregunta. No es falta de atención.";
    else if (cat === "bajo") nota = "Con muy poco estímulo cuesta enfocarse y mantenerse activo.";
    else nota = bien ? "Con un entorno cómodo, pensar es mucho más fácil." : "Un error normal. Con calma se puede intentar de nuevo.";
    var ultima = st.q === 2;
    document.getElementById("g-msg").innerHTML =
      '<div class="g-feedback"><p>' + (bien ? "Correcto: " : "Era «" + PICTO[q.correcta] + "». ") + nota + '</p></div>' +
      '<button class="g-btn" data-accion="' + (ultima ? "cierre" : "sig") + '" id="g-sig">' + (ultima ? "Ver resultado de la ronda" : "Siguiente pregunta") + '</button>';
    var s = document.getElementById("g-sig"); if (s) s.focus();
  }

  function preguntarNecesidad() {
    st.preguntado = true;
    var b = document.getElementById("a-preg"); if (b) b.remove();
    var m = document.getElementById("g-msg");
    var n = document.createElement("div");
    n.className = "g-feedback";
    n.innerHTML = '<p><strong>Dani responde:</strong> «Con mucho silencio me apago. Me ayuda tener música de fondo y mover las manos mientras pienso. Los audífonos y la luz baja no me sirven.»</p>';
    if (m) m.parentNode.insertBefore(n, m);
    Son.sfx("ayuda");
    sr.textContent = "Dani dice: con mucho silencio me apago. Me ayuda tener música de fondo y mover las manos. Los audífonos y la luz baja no me sirven.";
  }

  function alternarTool(id) {
    st.tools[id] = !st.tools[id];
    if (id === "rincon") st.enRincon = !!st.tools[id];
    Son.sfx(st.tools[id] ? "baja" : "sube");
    var b = panel.querySelector('.a-tool[data-id="' + id + '"]'); if (b) b.setAttribute("aria-pressed", st.tools[id] ? "true" : "false");
    var h = panel.querySelector(".a-hud"), ya = panel.querySelector(".a-horario");
    if (id === "horario") {                        // mostrar u ocultar el horario sin repintar todo
      var tmp = document.createElement("div"); tmp.innerHTML = hud();
      var nuevoH = tmp.querySelector(".a-horario");
      if (ya) ya.remove();
      if (nuevoH && h) h.appendChild(nuevoH);
    }
    sr.textContent = TOOLS[id].n + (st.tools[id] ? " activado. " : " desactivado. ") + TOOLS[id].t;
  }

  function resumenRonda() {
    var R = ronda(), ult = st.r === RONDAS.length - 1;
    var pct = st.tTotal[st.r] ? Math.round(100 * st.tZona[st.r] / st.tTotal[st.r]) : 0;
    st.fase = "resumen"; st.tools.rincon = false; st.enRincon = false;
    var cierre = "";
    if (ult) {                                      // Dani: si le preguntaste, quiere compartir lo suyo
      cierre = st.preguntado
        ? N.caja("Dani", "¿Tu mapa tiene sonido? Si le doy golpecitos a cada estación, ¿suena?") +
          N.caja("Narración", "Le pasas el mapa. Dani toca las estaciones y se ríe.")
        : N.caja("Narración", "Dani se queda callado, mirando su charola. Quizá otro día te cuente qué le ayuda.");
    }
    var nota = st.finge[st.r] ? " Hacer como que todo estaba bien costó energía después: la siguiente ronda empieza más arriba."
             : st.r === 1 ? " La maestra Ana preguntó «¿qué necesitas?» y esperó. Eso también es un apoyo." : "";
    J.marcar(ult && st.preguntado ? ["calido", 0.6] : st.finge[st.r] ? ["oscuro", 0.35] : null);
    sr.textContent = ult && st.preguntado ? "Dani: ¿Tu mapa tiene sonido? Le pasas el mapa y Dani toca las estaciones." : "";
    pintar(cabecera() + '<h2 class="g-title" data-foco>Ronda completada</h2>' + cierre +
      '<p class="g-sub">Respondiste bien ' + st.ok[st.r] + ' de 3. Pasaste el ' + pct + ' % del tiempo en una zona cómoda.</p>' +
      (ult ? "" : confHtml()) +
      '<div class="g-callout"><strong>Lo que nos enseña esta ronda.</strong> ' + R.resumen + N.esc(nota) + '</div>' +
      '<button class="g-btn" data-esperar data-accion="' + (ult ? "final" : "siguienteRonda") + '">' + (ult ? "Ver el final" : "Siguiente ronda") + '</button>');
    N.hablar({ ms: 30, nivel: nivelTexto });
  }

  // A: vuelve el mapa con calma. B: se enseña, pero cansado. C: no sale el mapa; mamá pregunta.
  function finalDe() {
    var nF = st.finge.filter(function (x) { return x; }).length;
    if (nF >= 2 || st.conf < 35) return "C";
    return st.conf >= 70 ? "A" : "B";
  }

  function pantallaFinal() {
    st.fase = "final";
    var f = finalDe();
    var filas = RONDAS.map(function (R, i) {
      var pct = st.tTotal[i] ? Math.round(100 * st.tZona[i] / st.tTotal[i]) : 0;
      return '<tr><td>' + (i + 1) + '. ' + R.titulo + '</td><td>' + st.ok[i] + ' / 3 · ' + pct + ' % cómodo</td></tr>';
    }).join("");
    var enc = st.hist.map(function (h, i) {
      var pr = PICTO_R[h.id];
      return '<tr><td>' + (i + 1) + '. ' + icono(pr.spr, 16, 16, 1, 2) + ' ' + pr.n + ' <span class="a-pl">(con ' + h.quien + ')</span></td><td>' + pr.txt + '</td></tr>';
    }).join("");
    Son.sfx("fin"); J.chispas(118, 100, 24);
    J.marcar(f === "A" ? ["calido", 0.9] : f === "B" ? ["calido", 0.45] : ["oscuro", 0.55]);
    sr.textContent = FINALES[f].map(function (x) { return x[0] + ": " + x[1]; }).join(" ");
    pintar('<h2 class="g-title" data-foco>El mapa</h2>' +
      FINALES[f].map(function (x) { return N.caja(x[0], x[1]); }).join("") +
      '<div data-esperar>' +
      '<p class="g-sub">El final cambia según cómo te acompañaron y cuántas veces hiciste como que todo estaba bien. No es una calificación.</p>' +
      confHtml() +
      '<h3>Lo que mostraste y lo que provoca</h3>' +
      '<table class="g-score d-tabla"><thead><tr><th>Lo que mostraste</th><th>Lo que provoca</th></tr></thead><tbody>' + enc + '</tbody></table>' +
      '<h3>Las rondas</h3>' +
      '<table class="g-score"><thead><tr><th>Ronda</th><th>Resultado</th></tr></thead><tbody>' + filas + '</tbody></table>' +
      '<p>La capacidad de responder no cambió entre rondas: cambió el entorno. Cuando el lugar se ajustó, la persona pudo participar con más calma.</p>' +
      '<h3>Ideas para recordar</h3><ul class="g-takeaways">' +
      '<li><strong>Anticipar ayuda:</strong> horarios, pictogramas y avisos hacen el día más predecible.</li>' +
      '<li><strong>Ajustar el entorno:</strong> bajar luz y ruido, y ofrecer pausas, son adaptaciones razonables, no caprichos.</li>' +
      '<li><strong>Preguntar y esperar:</strong> «¿qué necesitas?» es mejor ayuda que adivinar. Lo que calma a una persona puede apagar a otra.</li>' +
      '<li><strong>Hacer como que todo está bien también cuesta:</strong> baja la tensión un rato y la devuelve después.</li>' +
      '<li><strong>Lo que ama una persona no es un problema que arreglar:</strong> es su forma de estar en el mundo.</li></ul>' +
      '<div class="g-callout soft">Este juego no reproduce ni mide el autismo. El autismo es un espectro y lo sensorial es solo una parte. ' +
      'Para saber más, lee la página sobre autismo y, si tienes dudas sobre ti o alguien cercano, consulta con profesionales y con organizaciones de personas autistas.</div>' +
      '<button class="g-btn" data-accion="reiniciar">Jugar de nuevo</button>' +
      '<a class="g-btn ghost" href="../autismo.html" style="text-decoration:none">Leer sobre el autismo</a></div>');
    N.hablar({ ms: 30 });
  }

  /* ---------- Eventos ---------- */
  area.addEventListener("click", function (ev) {
    if (N.clic(ev)) return;
    var el = ev.target.closest("[data-accion]");
    if (!el || el.disabled) return;
    var a = el.getAttribute("data-accion");
    if (a !== "resp" && a !== "tool" && a !== "picto") Son.sfx("clic");
    switch (a) {
      case "empezar":
        Son.iniciar();
        var chk = document.getElementById("g-efectos");
        efectos = !(chk && chk.checked); J.marcoQuieto = !efectos;
        nuevo(); introRonda();
        if (capaRuido && capaRuido.el) { /* se sincroniza sola cuando la música suena */ }
        break;
      case "ronda": empezarRonda(); break;
      case "resp": responder(el.getAttribute("data-id")); break;
      case "tool": alternarTool(el.getAttribute("data-id")); break;
      case "preguntar": preguntarNecesidad(); break;
      case "sig": st.q++; preguntar(); break;
      case "cierre": if (ENC[st.r]) encuentro(); else resumenRonda(); break;
      case "picto": elegirPicto(el.getAttribute("data-id")); break;
      case "resumen": resumenRonda(); break;
      case "siguienteRonda": st.r++; introRonda(); break;
      case "final": pantallaFinal(); break;
      case "reiniciar": pantallaInicio(); break;
    }
  });

  J.cargar(NOMBRES).then(function () { J.iniciar(); pantallaInicio(); });
})();
