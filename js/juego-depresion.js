// Juego de Depresión: «Aquí estoy» (2D, 8 bits, novela visual)
// Mecánica: acompañas a Mateo, un personaje ficticio, y eliges qué decirle.
// No hay respuestas «prohibidas»: lo que dices cambia cómo se siente Mateo y cuánta conexión hay entre ustedes.
// La escena y los retratos se dibujan en canvas (motor 2D); textos y botones son HTML accesible.
(function () {
  "use strict";

  var area = document.getElementById("juego");
  if (!area || !window.Motor) return;

  var BASE = "../assets/sprites/depresion/";
  var Son = Motor.Sonido;
  var reducir = Motor.reducirMovimiento;

  /* ---------- Guion ---------- */
  // tipo: apoyo (2 pts), apoyo parcial (1), minimiza / consejo / culpa / centra (0).
  var TIPOS = {
    apoyo:     { n: "Escucha", pts: 12, txt: "Escuchar sin juzgar y validar lo que siente abre la conversación." },
    parcial:   { n: "Apoyo con respeto", pts: 5, txt: "Apoyar sin imponer respeta su decisión y su ritmo." },
    minimiza:  { n: "Minimiza", pts: -10, txt: "Decir que «ya pasará» o que «no es para tanto» puede hacer que la persona se sienta incomprendida." },
    consejo:   { n: "Consejo rápido", pts: -8, txt: "Dar soluciones rápidas, sin escuchar antes, suele sonar a que no entendimos lo que pasa." },
    culpa:     { n: "Culpa", pts: -18, txt: "La depresión no es falta de voluntad. Culpar aumenta la vergüenza y el aislamiento." },
    centra:    { n: "Habla de ti", pts: -8, txt: "Compartir una experiencia puede acompañar, pero si desvía la conversación, quien sufre se queda sin espacio." },
    pov:       { n: "Desde dentro", pts: 0, txt: "" },
    estigma:   { n: "Estigma", pts: -15, txt: "Pedir ayuda profesional no es «solo para gente muy mal»: es una forma de cuidarse." }
  };

  var ESCENAS = {
    parque:  { bg: "dep_fondo_parque_1f", nombre: "En el parque" },
    noche:   { bg: "dep_fondo_habitacion_noche_1f", nombre: "Esa noche" },
    cafe:    { bg: "dep_fondo_cafeteria_1f", nombre: "En la cafetería" },
    manana:  { bg: "dep_fondo_habitacion_dia_1f", nombre: "Desde dentro de Mateo" },
    consulta:{ bg: "dep_fondo_consultorio_1f", nombre: "En el consultorio" },
    dia:     { bg: "dep_fondo_habitacion_dia_1f", nombre: "Unos días después" }
  };

  // Cada nodo: escena, quien, ret (retrato), texto, y o bien opciones o sig.
  var G = {
    pr1: { esc: "parque", quien: "Narración", ret: null, paso: 1,
      texto: "Hace tres semanas que Mateo casi no contesta tus mensajes. Hoy, por fin, aceptó verte en el parque. Lo ves en una banca, con la mirada baja y una mochila sin abrir sobre las piernas.", sig: "pr2" },
    pr2: { esc: "parque", quien: "Narración", ret: null, paso: 1,
      texto: "Te sientas a su lado. Durante un rato nadie dice nada. Está bien: no tienes que llenar el silencio.", sig: "p1" },
    p1: { esc: "parque", quien: "Mateo", ret: "neutro", paso: 1,
      texto: "Hola… gracias por venir. Últimamente todo me cuesta más. No sé por qué.",
      op: [
        { t: "Ánimo, ya pasará.", tipo: "minimiza", r: { ret: "triste", texto: "Sí… tal vez. Seguro tienes razón." }, sig: "p2b" },
        { t: "Aquí estoy. ¿Quieres contarme?", tipo: "apoyo", r: { ret: "escuchado", texto: "…Gracias. Es como si todo pesara el doble, hasta levantarme." } },
        { t: "Todos tenemos días malos. Sal más y verás.", tipo: "consejo", r: { ret: "cansado", texto: "Quizá. Es que ya ni ganas tengo de salir." }, sig: "p2b" }
      ], sig: "p2" },
    p2b: { esc: "parque", quien: "Mateo", ret: "triste", paso: 2,
      texto: "Mejor… olvídalo. No es nada. ¿Cómo vas tú?",
      op: [
        { t: "Perdón. Aquí sigo, sin presionarte.", tipo: "apoyo", r: { ret: "escuchado", texto: "…Gracias. Todavía no sé cómo explicarlo." } },
        { t: "Está bien, hablemos de otra cosa.", tipo: "parcial", r: { ret: "neutro", texto: "Sí. Mejor. Gracias por no insistir." } },
        { t: "Siempre evitas hablar de lo que te pasa.", tipo: "culpa", f: "huye", sig: "q1c", marco: ["oscuro", 0.6], r: { ret: "triste", texto: "Ya me voy. Perdón por hacerte perder el tiempo." } }
      ], sig: "q1b" },
    q1b: { esc: "parque", quien: "Narración", ret: null, paso: 2,
      texto: "Mateo toca el cierre de su mochila, pero no saca nada. Quizá otro día.", sig: "i0" },
    q1c: { esc: "parque", quien: "Narración", ret: null, paso: 2, marco: ["oscuro", 0.8],
      texto: "Mateo se levanta y se va sin mirar atrás. Te quedas solo en la banca. Esa noche no contesta tus mensajes.", sig: "i0" },
    p2: { esc: "parque", quien: "Mateo", ret: "cansado", paso: 2,
      texto: "Antes me gustaba dibujar. Ahora ni lo intento. Y luego me siento culpable por no tener ganas.",
      op: [
        { t: "Es que no te esfuerzas lo suficiente.", tipo: "culpa", r: { ret: "triste", texto: "Sí… seguro es mi culpa." } },
        { t: "Suena agotador. Y no es tu culpa.", tipo: "apoyo", marco: ["calido", 0.5], r: { ret: "escuchado", texto: "Nunca lo había dicho en voz alta. Me da un poco de alivio." } },
        { t: "Yo también estuve mal una vez, te cuento…", tipo: "centra", r: { ret: "cansado", texto: "Ah… claro. Qué bueno que ya pasó." } }
      ], sig: "q1" },
    q1: { esc: "parque", quien: "Narración", ret: null, paso: 2, marca: "cuaderno",
      texto: "Mateo abre la mochila y saca un cuaderno de dibujo con las esquinas gastadas. Lo sostiene un momento. No lo abre. Vuelve a guardarlo.", sig: "i0" },
    i0: { esc: "manana", quien: "Narración", ret: null, paso: 3, marco: ["oscuro", 0.55],
      texto: function () { return (st.f.huye ? "Mateo se fue sin decir nada. Esta es la parte que no viste. " : "") + "Así se ve el mundo desde dentro de Mateo. Por unos minutos, mira desde ahí. No hay respuestas buenas ni malas: solo cómo pesa cada cosa."; }, sig: "i1" },
    i1: { esc: "manana", quien: "Mateo (por dentro)", pens: true, pov: true, lento: true, ret: null, paso: 3, marco: ["oscuro", 0.7],
      texto: "La alarma suena. Llevas veinte minutos mirando el techo. Sabes que tienes que levantarte, pero tu cuerpo no recibe la orden.",
      op: [
        { t: "Levantarme ya.", tipo: "pov", f: "levanto", r: { ret: null, texto: "Lo intentas. Es como empujar una puerta de plomo. Pasan diez minutos más antes de que tus pies toquen el suelo." } },
        { t: "Cinco minutos más.", tipo: "pov", r: { ret: null, texto: "Son cuarenta. Y ahora, además del cansancio, llega la culpa por haberte quedado en la cama." } }
      ], sig: "i2" },
    i2: { esc: "manana", quien: "Mateo (por dentro)", pens: true, pov: true, lento: true, ret: null, paso: 3, marco: ["oscuro", 0.78],
      texto: "Tienes catorce mensajes sin responder. Cada uno pesa como una tarea enorme. Ahí está el nombre de tu amigo en la pantalla.",
      op: [
        { t: "Responder «todo bien».", tipo: "pov", f: "mintio", r: { ret: null, texto: "Lo envías y dejas el teléfono boca abajo. Mentir cansa menos que explicar lo que ni tú entiendes." } },
        { t: "No responder.", tipo: "pov", f: "silencio", r: { ret: null, texto: "El silencio crece. Mientras más tardas, más difícil es escribir cualquier cosa." } },
        { t: "Escribir la verdad.", tipo: "pov", f: "verdad", r: { ret: null, texto: "Borras el mensaje tres veces. No sabes cómo decir «no sé qué me pasa» sin que suene a drama." } }
      ], sig: "i3" },
    i3: { esc: "manana", quien: "Mateo (por dentro)", pens: true, pov: true, lento: true, ret: null, paso: 3, marco: ["oscuro", 0.9],
      texto: "Tu cuaderno sigue en la mochila. Antes dibujar era tu lugar favorito. Ahora lo ves como detrás de un vidrio. No es que no quieras sentir algo: es que no llega.", sig: "n1" },
    n1: { esc: "noche", quien: "Narración", ret: null, paso: 3,
      texto: function () {
        var p = st.f.huye ? "Perdón por irme así." : st.f.verdad ? "Hoy quise escribirte la verdad y no pude." : st.f.mintio ? "Antes te dije que todo bien. No era cierto." : st.f.silencio ? "Perdón por no contestarte." : "Perdón por escribirte tan tarde.";
        return "Esa noche, Mateo te escribe: «" + p + " No dormí otra vez. Siento que molesto a todos con esto.»"; },
      op: [
        { t: "No molestas. ¿Te acompaño un rato aunque no hablemos?", tipo: "apoyo", marco: ["calido", 0.7], r: { ret: "escuchado", texto: "Gracias por quedarte. Hoy se siente menos pesado." } },
        { t: "No pienses eso, es una tontería.", tipo: "minimiza", f: "fria", marco: ["oscuro", 0.7], sig: "t1b", r: { ret: "cansado", texto: "Ok. Perdón por escribirte." } },
        { t: "Mejor duerme temprano y mañana te sentirás bien.", tipo: "consejo", f: "fria", marco: ["oscuro", 0.6], sig: "t1b", r: { ret: "cansado", texto: "Lo intento… pero no es tan fácil." } }
      ], sig: "t1" },
    t1: { esc: "noche", quien: "Mateo (por dentro)", pens: true, ret: null, marco: function () { return st.pts >= 55 ? ["calido", 0.5] : ["oscuro", 0.6]; }, retf: function () { return st.pts >= 55 ? "escuchado" : "cansado"; }, paso: 3,
      texto: function () { return st.pts >= 55 ? "…Alguien se quedó sin pedirme nada a cambio. Hacía mucho que no pasaba." : "…Mejor no escribirle más. Ya cansé a todos."; }, sig: "cf0" },
    t1b: { esc: "noche", quien: "Mateo (por dentro)", pens: true, ret: null, marco: ["oscuro", 0.7], retf: function () { return "cansado"; }, paso: 3,
      texto: "…Mejor no escribirle más. Ya cansé a todos.", sig: "cf0" },
    cf0: { esc: "cafe", quien: "Narración", ret: null, paso: 4,
      texto: function () { return (st.f.fria ? "Pasan días sin noticias. Al final, tú le escribes primero y Mateo solo responde: «¿Café?». " : "Unos días después, Mateo te pide que lo acompañes a una cafetería. ") + "Pide un chocolate caliente y lo deja enfriarse entre las manos."; }, sig: "c1" },
    c1: { esc: "cafe", quien: "Mateo", ret: "neutro", paso: 4,
      texto: "¿Tú crees que debería hablar con alguien? Un psicólogo, no sé… ¿Me lo estoy inventando?",
      op: [
        { t: "Los psicólogos son para gente muy mal.", tipo: "estigma", marco: ["oscuro", 0.8], r: { ret: "triste", texto: "Entonces yo no… no debo estar tan mal para ir." }, f: "sinayuda", sig: "c2x" },
        { t: "No te lo inventas. Creo que ayudaría, y puedo acompañarte a la cita.", tipo: "apoyo", marco: ["calido", 0.85], r: { ret: "esperanzado", texto: "¿De verdad? Con eso me siento capaz de intentarlo." } },
        { t: "Tú decides. Hay ayuda y la depresión se trata.", tipo: "parcial", marco: ["calido", 0.4], r: { ret: "neutro", texto: "Lo voy a pensar. Es bueno saber que se puede tratar." } }
      ], sig: "t2" },
    t2: { esc: "cafe", quien: "Mateo (por dentro)", pens: true, ret: null, marco: function () { var u = st.hist[st.hist.length - 1]; return u && (u.tipo === "apoyo" || u.tipo === "parcial") ? ["calido", 0.6] : ["oscuro", 0.5]; }, retf: function () { var u = st.hist[st.hist.length - 1]; return u && (u.tipo === "apoyo" || u.tipo === "parcial") ? "esperanzado" : "triste"; }, paso: 4,
      texto: function () { var u = st.hist[st.hist.length - 1]; return u && (u.tipo === "apoyo" || u.tipo === "parcial") ? "…Pedir ayuda no se siente como rendirse. Se siente como un primer paso, chiquito pero real." : "…Si ni él cree que valga la pena, quizá no estoy tan mal. Pero estoy muy cansado."; }, sig: "cf2" },
    cf2: { esc: "consulta", quien: "Narración", ret: null, paso: 5,
      texto: function () { var u = st.hist[st.hist.length - 1]; return u && u.tipo === "apoyo" ? "La psicóloga los recibe a los dos. Mateo se sienta en el sofá y tú, a su lado." : "Mateo entra solo al consultorio. Tú esperas afuera: por la puerta alcanzas a ver que se sienta en el sofá."; }, sig: "c2" },
    c2x: { esc: "cafe", quien: "Narración", ret: null, paso: 5, marco: ["oscuro", 0.45],
      texto: "Mateo termina su chocolate frío. No pide la cita. «Quizá no estoy tan mal», dice, y cambia de tema. Pero se queda mirando la puerta unos segundos.", sig: "d1" },
    c2: { esc: "consulta", quien: "Profesional de apoyo", ret: "amable", prof: true, paso: 5, marco: ["calido", 0.45],
      texto: function () { var u = st.hist[st.hist.length - 1]; return (u && u.tipo === "apoyo" ? "Gracias por venir los dos. " : "Qué bueno que diste este paso, Mateo. ") + "No hace falta tener todo claro para empezar. La depresión es un problema de salud, no una debilidad, y tiene tratamiento. Cuéntame lo que quieras, a tu ritmo."; },
      sig: "d1" }
  };

  /* ---------- Utilidades ---------- */
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------- Estructura de la página ---------- */
  area.innerHTML =
    '<div id="g-audio"></div>' +
    '<div class="g-stage"><canvas id="g-canvas" role="img" ' +
    'aria-label="Escena en 2D: Mateo, un personaje ficticio, y tú. Cuanta más conexión hay, más cálidos se ven los colores."></canvas></div>' +
    '<p class="sr-only" id="g-sr" aria-live="polite"></p>' +
    '<div id="g-panel"><p>Cargando el juego…</p></div>';
  var panel = document.getElementById("g-panel");
  var sr = document.getElementById("g-sr");
  Son.controles(document.getElementById("g-audio"));
  Son.musica(["../assets/audio/musica/dep_musica.mp3"]);

  /* ---------- Estado y sistema de diálogos (compartido, ver motor.js) ---------- */
  var E = { esc: "parque", ret: "neutro", prof: false, quien: null, calor: 0, calorVisible: 0, pts: 0, cargaTinte: 0 };
  var VOZ = { "Tú, como Mateo": "narra", "Lo que pasa": "narra", "Mateo": "mateo", "Mateo (por dentro)": "narra", "Tú": "tu", "Profesional de apoyo": "prof" };
  var N = Motor.Novela({
    area: area, panel: panel, sr: sr, nodos: G, tipos: TIPOS, voces: VOZ, pts0: 50,
    etiquetaOps: "¿Qué le dices?",
    srTexto: function (n, texto) { return ESCENAS[n.esc].nombre + ". " + n.quien + ": " + texto; },
    cabecera: function (n) { return cabecera(n.paso); },
    medidor: function (n, s, dif) { return conexion(dif); },
    alMostrar: function (n, s) {
      E.esc = n.esc; E.prof = !!n.prof; E.ret = n.retf ? n.retf() : n.ret;
      E.calor = n.pov ? 0 : clamp(s.pts / 100, 0, 1);
      J.marcar(typeof n.marco === "function" ? n.marco() : n.marco);
    },
    alElegir: function (n, op, T, s) {
      E.calor = n.pov ? 0 : clamp(s.pts / 100, 0, 1);
      E.ret = op.r.ret; E.prof = false;
      if (op.marco) J.marcar(op.marco);
      Son.sfx(T.pts > 0 ? "acierto" : T.pts < 0 ? "error" : "clic");
      if (T.pts > 0 && !reducir) J.chispas(122, 80, 10, ["#f0cf7a", "#f5f5f5"]);
    },
    nombreTu: function (n) { return n.pov ? "Tú, como Mateo" : "Tú"; },
    nombreRes: function (n) { return n.pov ? "Lo que pasa" : "Mateo"; },
    alHablar: function (voz) { E.habla = voz !== null && voz !== "tu"; },
    salida: function (s) { if (s === "d1") { cierreEscena(); return true; } return false; }
  });
  var st = N.st, esc = N.esc, pintar = N.pintar, caja = N.caja;
  function nuevo() { N.nuevo(); E.calor = 0.5; E.calorVisible = 0.5; }
  nuevo();

  var NOMBRES = [
    "dep_fondo_parque_1f", "dep_fondo_habitacion_noche_1f", "dep_fondo_habitacion_dia_1f", "dep_fondo_cafeteria_1f",
    "dep_mueble_banca_1f", "dep_mueble_cama_1f",
    "dep_per_personaje_pie_2f", "dep_per_personaje_sentado_2f", "dep_per_jugador_pie_2f", "dep_per_jugador_sentado_2f",
    "dep_ventana_lluvia_2f", "dep_obj_telefono_2f", "dep_obj_taza_1f",
    "dep_ret_personaje_neutro_1f", "dep_ret_personaje_triste_1f", "dep_ret_personaje_cansado_1f",
    "dep_ret_personaje_escuchado_1f", "dep_ret_personaje_esperanzado_1f",
    "dep_ret_profesional_neutro_1f", "dep_ret_profesional_amable_1f",
    "dep_per_personaje_acostado_2f", "dep_per_profesional_sentado_2f", "dep_fondo_consultorio_1f",
    "dep_marco_oscuro_1f", "dep_marco_calido_1f"
  ];

  var J = new Motor.Juego(document.getElementById("g-canvas"), { base: BASE });
  J.marcoPrefijo = "dep_marco_";   // marcos dibujados: oscuro = momento feo, cálido = momento bueno (ver motor.js)

  function retrato() {
    return E.prof ? "dep_ret_profesional_" + E.ret + "_1f" : "dep_ret_personaje_" + E.ret + "_1f";
  }

  // Iluminación ligada a la conexión: fría y oscura al inicio; con cada respuesta de escucha entra luz cálida
  function iluminarDep(e, w) {
    var L = [], amb = 0.26 * (1 - w) + (e === "noche" ? 0.24 : 0.04);
    var qx = e === "parque" ? 128 : e === "noche" ? 162 : e === "cafe" ? 190 : 118;
    var qy = e === "parque" ? 92 : e === "noche" ? 96 : e === "cafe" ? 98 : 100;
    L.push({ x: qx, y: qy, r: 22 + 30 * w, c: "#f0cf7a", g: 0.04 + 0.2 * w, corte: 0.35 + 0.5 * w, parp: 0.03 });
    if (e === "parque") L.push({ x: 34, y: 14, r: 120, c: "#f0cf7a", g: 0.02 + 0.14 * w, corte: 0.2 + 0.4 * w });
    if (e === "noche") {
      L.push({ x: 69, y: 58, r: 62, c: "#f0cf7a", g: 0.14, corte: 0.7, parp: 0.05 });
      L.push({ x: 155, y: 46, r: 52, c: "#bfeaff", g: 0.07, corte: 0.35 });
      if (J.cuadro(600)) L.push({ x: 104, y: 86, r: 14, c: "#bfeaff", g: 0.2, corte: 0.5 });
    }
    if (e === "cafe") [120, 244].forEach(function (x) { L.push({ x: x, y: 18, r: 56, c: "#f0cf7a", g: 0.12, corte: 0.6, parp: 0.03 }); });
    if (e === "dia") L.push({ x: 155, y: 47, r: 72, c: w < 0.6 ? "#8aa0d0" : "#f0cf7a", g: 0.08 + 0.1 * w, corte: 0.3 + 0.3 * w });
    J.iluminar({ ambiente: { c: "#0b0f1a", a: amb }, luces: L, vineta: 0.45 * (1 - w) + 0.12 });
  }

  function llover() {                              // lluvia dentro del marco de la ventana (134..177, 22..72)
    for (var i = 0; i < 14; i++) J.rect(135 + (i * 37) % 41, 22 + (reducir ? i * 7 : J.t / 35 + i * 11) % 46, 1, 3, "#8aa0d0");
  }

  J.actualizar = function (dt) {
    E.calorVisible += (E.calor - E.calorVisible) * Math.min(1, dt / 1200);   // los colores cambian poco a poco
  };

  J.dibujar = function (c) {
    var e = E.esc, w = E.calorVisible;
    J.spr(ESCENAS[e].bg, 0, 0);
    var f = J.cuadro(700);
    if (e === "parque") {
      J.spr("dep_mueble_banca_1f", 104, 96);
      J.spr("dep_per_personaje_sentado_2f", 112, 82, f);
      J.spr("dep_per_jugador_sentado_2f", 128, 82, f);
    } else if (e === "noche") {
      J.spr("dep_mueble_cama_1f", 150, 98);
      J.spr("dep_per_personaje_sentado_2f", 162, 84, f);
      J.spr("dep_obj_telefono_2f", 144, 94, reducir ? 1 : J.cuadro(600));
    } else if (e === "cafe") {
      J.spr("dep_per_personaje_sentado_2f", 142, 111, f);
      J.spr("dep_per_jugador_sentado_2f", 210, 111, f);
      J.spr("dep_obj_taza_1f", 183, 98);
    } else if (e === "consulta") {
      var u = st.hist[st.hist.length - 1];
      if (u && u.tipo === "apoyo") J.spr("dep_per_jugador_sentado_2f", 86, 96, f);
      J.spr("dep_per_personaje_sentado_2f", 112, 96, f);
      J.spr("dep_per_profesional_sentado_2f", 186, 92, f);
    } else if (e === "manana") {                    // Mateo solo, en su cuarto: la primera decisión cambia dónde está
      llover(); J.spr("dep_mueble_cama_1f", 150, 98);
      if (st.f.levanto) J.spr("dep_per_personaje_pie_2f", 112, 96, f);
      else J.spr("dep_per_personaje_acostado_2f", 154, 100, f);
      J.spr("dep_obj_telefono_2f", 174, 95, reducir ? 1 : J.cuadro(600));
    } else {
      if (w < 0.6) llover();
      J.spr("dep_mueble_cama_1f", 150, 98);
      J.spr("dep_per_personaje_pie_2f", 92, 96, f);
      J.spr("dep_per_jugador_pie_2f", 114, 96, f);
    }
    // tinte frío al inicio, cálido cuando hay conexión
    c.globalAlpha = 0.2 * (1 - w); J.rect(0, 0, J.w, J.h, "#3a4a73");
    c.globalAlpha = 0.12 * w; J.rect(0, 0, J.w, J.h, "#f0cf7a");
    c.globalAlpha = 1;
    iluminarDep(e, w);
    // retrato de quien habla, arriba a la derecha
    if (E.ret) {
      var x = J.w - 32 - 10, y = 8 + (E.habla && !reducir && Math.floor(J.t / 110) % 2 ? 1 : 0);
      J.rect(x - 3, y - 3, 38, 38, "#f5f5f5"); J.rect(x - 2, y - 2, 36, 36, "#0b0f1a");
      J.spr(retrato(), x, y);
    }
  };

  function cabecera(paso) {
    var puntos = "";
    for (var i = 1; i <= 5; i++) puntos += '<span class="g-dot' + (i < paso ? " done" : i === paso ? " now" : "") + '"></span>';
    return '<div class="g-head"><span>' + ESCENAS[E.esc].nombre + '</span><span class="g-dots" aria-hidden="true">' + puntos + '</span></div>';
  }
  function conexion(dif) {
    if (G[st.nodo] && G[st.nodo].pov) return "";
    var n = Math.round(clamp(st.pts, 0, 100));
    return '<div class="d-con"><span>Confianza</span><div class="g-bar" role="img" aria-label="Confianza de Mateo: ' + n + ' %"><span style="width:' + n + '%;background:#f0cf7a"></span></div>' + (dif ? '<span style="margin-left:6px;font-weight:700;color:' + (dif > 0 ? "#f0cf7a" : "#e07a7a") + '">' + (dif > 0 ? "+" : "−") + Math.abs(dif) + '</span>' : "") + '</div>';
  }
  /* ---------- Pantallas ---------- */
  function pantallaInicio() {
    nuevo(); E.esc = "parque"; E.ret = "triste"; E.prof = false; sr.textContent = ""; J.marcar(null);
    pintar(
      '<h2 class="g-title" data-foco>Aquí estoy</h2>' +
      '<p class="g-sub" data-tipear>Acompaña a Mateo, un personaje ficticio, y elige qué decirle. Son 5 escenas cortas.</p>' +
      '<p class="g-callout" data-tipear><strong>Cómo se juega.</strong> Mateo se siente mal desde hace semanas. En cada escena eliges qué responderle. ' +
      'No hay respuestas «prohibidas»: verás cómo cada una cambia lo que Mateo siente y los colores del mundo. ' +
      'La confianza de Mateo empieza a la mitad: sube despacio y se pierde rápido. Al final podrás ver qué ayuda y qué no tanto.</p>' +
      '<p class="g-callout soft" data-tipear>Este juego no reproduce ni mide la depresión, y Mateo es un personaje inventado. ' +
      'Habla de sentimientos difíciles: puedes pausar o dejar de jugar cuando quieras. ' +
      'Si te sientes así, habla con alguien de confianza o con un profesional.</p>' +
      '<button class="g-btn" data-accion="empezar" data-esperar>Empezar</button>', true);
    N.hablar({ ms: 16 });
  }

  function cierreEscena() {
    var p = st.pts, nivel = p >= 75 ? "alto" : p >= 45 ? "medio" : "bajo";
    var T = {
      alto:  { ret: "esperanzado", texto: "Hoy me sentí un poco mejor. " + (st.f.cuaderno ? "Abrí el cuaderno y dibujé la banca del parque. " : "") + "Gracias por quedarte y por no apurarme. Voy a ir con la psicóloga otra vez." },
      medio: { ret: "escuchado", texto: "Todavía cuesta. " + (st.f.cuaderno ? "Abrí el cuaderno y dibujé una sola línea… pero la dibujé. " : "Creo que puedo intentarlo. ") + "Gracias por estar, aunque no siempre sepas qué decir." },
      bajo:  { ret: "cansado", texto: "Fui a la cita porque la profesional fue amable. El cuaderno sigue cerrado, y no es fácil… pero ojalá pueda seguir hablando con alguien." }
    }[nivel];
    if (st.f.sinayuda) T = { ret: "cansado", texto: "No pedí la cita. El cuaderno sigue cerrado… pero sigo pensando en lo que me dijiste. Quizá otro día." };
    E.esc = "dia"; E.prof = false; E.ret = T.ret; st.fase = "final-escena";
    E.calor = Math.max(E.calor, nivel === "bajo" ? 0.25 : E.calor);
    J.marcar(st.f.sinayuda ? ["oscuro", 0.5] : nivel === "alto" ? ["calido", 0.9] : nivel === "medio" ? ["calido", 0.5] : ["oscuro", 0.45]);
    sr.textContent = "Unos días después. Mateo: " + T.texto;
    pintar(cabecera(5) + conexion() + caja("Mateo", T.texto) +
      '<button class="g-btn" data-esperar data-accion="final">Ver lo que aprendimos</button>', true);
    N.hablar();
  }

  function pantallaFinal() {
    st.fase = "final";
    var filas = st.hist.map(function (h, i) {
      var T = TIPOS[h.tipo];
      return '<tr><td>' + (i + 1) + '. «' + esc(h.t) + '»</td><td><strong>' + T.n + '.</strong> ' + T.txt + '</td></tr>';
    }).join("");
    Son.sfx("fin"); if (!reducir) J.chispas(112, 90, 20);
    pintar(
      '<h2 class="g-title" data-foco>Lo que nos llevamos</h2>' +
      '<table class="g-score d-tabla"><thead><tr><th>Lo que dijiste</th><th>Lo que provoca</th></tr></thead><tbody>' + filas + '</tbody></table>' +
      '<h3>Ideas para recordar</h3><ul class="g-takeaways">' +
      '<li><strong>Por dentro:</strong> cansancio que el descanso no quita, culpa y la sensación de que nada llega. Por eso a veces no responde mensajes: no es que no le importes, es que todo cuesta el doble.</li>' +
      '<li><strong>Escuchar primero:</strong> no hace falta arreglarlo todo. Estar presente y validar lo que siente ya ayuda.</li>' +
      '<li><strong>Evitar minimizar o culpar:</strong> «échale ganas» o «ya pasará» pueden aumentar la soledad.</li>' +
      '<li><strong>Acompañar hacia la ayuda profesional:</strong> la depresión se trata. Un amigo acompaña, pero no sustituye a un profesional.</li></ul>' +
      '<div class="g-callout"><strong>Si tú o alguien cercano lo necesita.</strong> Habla con una persona de confianza o con un profesional de la salud. ' +
      'En México puedes llamar a la Línea de la Vida: 800 911 2000 (gratuita, las 24 horas). ' +
      'Si hay peligro inmediato, llama al 911. En otros países, busca la línea de ayuda de tu región.</div>' +
      '<div class="g-callout soft">Este juego no reproduce ni mide la depresión, y Mateo es un personaje ficticio.</div>' +
      '<button class="g-btn" data-accion="reiniciar">Jugar de nuevo</button>' +
      '<a class="g-btn ghost" href="../depresion.html" style="text-decoration:none">Leer sobre la depresión</a>');
  }

  /* ---------- Eventos ---------- */
  area.addEventListener("click", function (ev) {
    if (N.clic(ev)) return;
    var el = ev.target.closest("[data-accion]");
    if (!el || el.disabled) return;
    var a = el.getAttribute("data-accion");
    if (a !== "op") Son.sfx("clic");
    switch (a) {
      case "empezar": Son.iniciar(); nuevo(); N.mostrar("pr1"); break;
      case "op": N.elegir(+el.getAttribute("data-i")); break;
      case "sigNodo": N.siguiente(); break;
      case "final": pantallaFinal(); break;
      case "reiniciar": pantallaInicio(); break;
    }
  });

  J.cargar(NOMBRES).then(function () { J.iniciar(); pantallaInicio(); });
})();
