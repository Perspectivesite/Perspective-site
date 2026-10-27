// Motor 2D mínimo de Perspective (8 bits).
// - Canvas lógico 256x144 escalado con píxeles nítidos.
// - Carga de sprites por nombre (el sufijo _Nf indica N cuadros).
// - Animación por cuadros, tweens, partículas.
// - Sonido: efectos sintetizados (ondas cuadradas) + música opcional desde archivo.
(function (global) {
  "use strict";

  var reducir = !!(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var Motor = { reducirMovimiento: reducir };

  /* =========================== SONIDO =========================== */
  var S = { ctx: null, sfxOn: true, musOn: true, luces: true, vol: 0.6, mus: null, musOk: false, ui: null };
  var CLAVE = "perspective_audio";
  try {
    var g = JSON.parse(global.localStorage.getItem(CLAVE) || "{}");
    if (typeof g.sfxOn === "boolean") S.sfxOn = g.sfxOn;
    if (typeof g.musOn === "boolean") S.musOn = g.musOn;
    if (typeof g.luces === "boolean") S.luces = g.luces;
    if (typeof g.vol === "number") S.vol = g.vol;
  } catch (e) {}
  function guardar() {
    try { global.localStorage.setItem(CLAVE, JSON.stringify({ sfxOn: S.sfxOn, musOn: S.musOn, luces: S.luces, vol: S.vol })); } catch (e) {}
  }

  S.iniciar = function () {                       // llamar tras un gesto del usuario
    if (!S.ctx) {
      try { S.ctx = new (global.AudioContext || global.webkitAudioContext)(); } catch (e) {}
    }
    if (S.ctx && S.ctx.state === "suspended") S.ctx.resume();
    if (S.mus && S.musOn && S.musOk) { var p = S.mus.play(); if (p && p.catch) p.catch(function () {}); }
  };

  S.tono = function (f, dur, tipo, vol, retraso, fFin) {
    if (!S.ctx) return;
    var t0 = S.ctx.currentTime + (retraso || 0);
    var o = S.ctx.createOscillator(), g = S.ctx.createGain();
    o.type = tipo || "square";
    o.frequency.setValueAtTime(f, t0);
    if (fFin) o.frequency.linearRampToValueAtTime(fFin, t0 + dur);
    var v = (vol || 0.15) * S.vol;
    g.gain.setValueAtTime(v, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(S.ctx.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  };

  // Voces tipo Undertale/Omori: un «blip» corto por letra, con tono propio por personaje
  var VOCES = {
    mateo: { f: 190, tipo: "triangle", v: 0.9, r: 28 },
    tu:    { f: 330, tipo: "square",   v: 0.45, r: 24 },
    prof:  { f: 250, tipo: "sine",     v: 1.1, r: 14 },
    narra: { f: 120, tipo: "sine",     v: 0.5, r: 8 }
  };
  VOCES.carmen  = { f: 210, tipo: "triangle", v: 0.9, r: 20 };
  VOCES.valeria = { f: 300, tipo: "triangle", v: 0.8, r: 22 };
  // mal = true: la palabra «no sale». El blip baja de tono y suena acompañado de una nota que no encaja.
  S.voz = function (id, mal, ruido) {
    if (!S.sfxOn || !S.ctx) return;
    var v = VOCES[id] || VOCES.narra;
    if (ruido > 0.5) {                              // sobrecarga: el blip se vuelve ruido áspero
      S.tono(110 + Math.random() * 320, 0.07, "sawtooth", 0.04 + 0.1 * ruido);
      return;
    }
    var f = v.f + (Math.random() - 0.5) * v.r * 2;
    if (mal) {
      var g = f * (0.6 + Math.random() * 0.5);
      S.tono(g, 0.11, v.tipo, 0.12 * v.v, 0, g * 0.72);
      S.tono(g * 1.41, 0.09, "square", 0.04 * v.v, 0.01, g * 1.2);
      return;
    }
    S.tono(f, 0.05, v.tipo, 0.14 * v.v);
  };

  S.sfx = function (n) {
    if (!S.sfxOn || !S.ctx) return;
    switch (n) {
      case "clic":     S.tono(740, 0.05, "square", 0.12); break;
      case "acierto":  S.tono(523, 0.09, "square", 0.15, 0); S.tono(659, 0.09, "square", 0.15, 0.09); S.tono(784, 0.16, "square", 0.15, 0.18); break;
      case "error":    S.tono(220, 0.16, "triangle", 0.25, 0); S.tono(165, 0.22, "triangle", 0.25, 0.15); break;
      case "baja":     S.tono(520, 0.4, "sawtooth", 0.08, 0, 220); break;
      case "sube":     S.tono(220, 0.4, "sawtooth", 0.08, 0, 520); break;
      case "ayuda":    S.tono(660, 0.08, "triangle", 0.2, 0); S.tono(880, 0.12, "triangle", 0.2, 0.08); break;
      case "fin":      [523, 523, 659, 784, 1047].forEach(function (f, i) { S.tono(f, 0.14, "square", 0.14, i * 0.12); }); break;
    }
  };

  S.musica = function (urls) {                    // urls: lista de alternativas (mp3, ogg)
    if (S.mus) { S.mus.pause(); S.mus = null; }
    S.musOk = false;
    var i = 0;
    function probar() {
      if (i >= urls.length) { S.musOk = false; actualizarUI(); return; }
      var a = new global.Audio();
      a.loop = true; a.preload = "auto"; a.volume = S.vol * 0.7;
      a.addEventListener("canplaythrough", function () { S.mus = a; S.musOk = true; actualizarUI(); }, { once: true });
      a.addEventListener("error", function () { i++; probar(); }, { once: true });
      a.src = urls[i];
      a.load();
    }
    probar();
  };

  S.parar = function () { if (S.mus) { S.mus.pause(); S.mus.currentTime = 0; } };

  function aplicar() {
    if (S.mus) {
      S.mus.volume = S.vol * 0.7;
      if (S.musOn && S.musOk && S.ctx) { var p = S.mus.play(); if (p && p.catch) p.catch(function () {}); }
      else S.mus.pause();
    }
    guardar(); actualizarUI();
  }
  function actualizarUI() {
    if (!S.ui) return;
    var bs = S.ui.querySelector('[data-k="sfx"]'), bm = S.ui.querySelector('[data-k="mus"]'), r = S.ui.querySelector("input");
    var bl = S.ui.querySelector('[data-k="luz"]'), bf = S.ui.querySelector('[data-k="fs"]');
    bs.setAttribute("aria-pressed", S.sfxOn ? "true" : "false");
    bs.textContent = S.sfxOn ? "Efectos: sí" : "Efectos: no";
    bm.setAttribute("aria-pressed", S.musOn ? "true" : "false");
    bm.textContent = S.musOn ? "Música: sí" : "Música: no";
    bm.disabled = !S.musOk;
    bm.title = S.musOk ? "" : "Aún no hay archivo de música";
    bl.setAttribute("aria-pressed", S.luces ? "true" : "false");
    bl.textContent = S.luces ? "Iluminación: sí" : "Iluminación: no";
    var full = enPantalla();
    bf.setAttribute("aria-pressed", full ? "true" : "false");
    bf.textContent = full ? "Salir de pantalla completa" : "Pantalla completa";
    r.value = Math.round(S.vol * 100);
  }

  /* ---------- Pantalla completa ----------
     Usa la API nativa y, si el navegador no la ofrece (p. ej. iPhone) o la rechaza,
     amplía el juego a toda la ventana con CSS (clase g-full). */
  function juegoEl() { return S.ui ? S.ui.closest("#juego") : null; }
  function enPantalla() { var el = juegoEl(); return !!(el && el.classList.contains("g-full")); }
  function reajustar() { setTimeout(function () { global.dispatchEvent(new Event("resize")); }, 60); }
  function alVolver() {                                   // cada pantalla nueva empieza arriba
    var el = juegoEl(), pn = el && el.querySelector("#g-panel");
    if (S._mo) { S._mo.disconnect(); S._mo = null; }
    if (el && pn && global.MutationObserver) {
      S._mo = new MutationObserver(function () { el.scrollTop = 0; pn.scrollTop = 0; });
      S._mo.observe(pn, { childList: true });
    }
  }
  function entrarPantalla() {
    var el = juegoEl(); if (!el) return;
    el.classList.add("g-full"); document.body.classList.add("g-bloq");
    var p = el.requestFullscreen ? el.requestFullscreen() : el.webkitRequestFullscreen ? el.webkitRequestFullscreen() : null;
    if (p && p.catch) p.catch(function () {});            // si falla, queda la ampliación por CSS
    alVolver(); actualizarUI(); reajustar();
  }
  function salirPantalla() {
    var el = juegoEl(); if (!el) return;
    if (document.fullscreenElement && document.exitFullscreen) { var p = document.exitFullscreen(); if (p && p.catch) p.catch(function () {}); }
    else if (document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
    el.classList.remove("g-full"); document.body.classList.remove("g-bloq");
    if (S._mo) { S._mo.disconnect(); S._mo = null; }
    actualizarUI(); reajustar();
  }
  function cambioNativo() {                                // Esc u otra salida del modo nativo
    if (!document.fullscreenElement && !document.webkitFullscreenElement && enPantalla() && S._nativo) salirPantalla();
    S._nativo = !!(document.fullscreenElement || document.webkitFullscreenElement);
    reajustar();
  }
  document.addEventListener("fullscreenchange", cambioNativo);
  document.addEventListener("webkitfullscreenchange", cambioNativo);
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && enPantalla() && !document.fullscreenElement && !document.webkitFullscreenElement) salirPantalla();
  });
  S.enPantalla = enPantalla;

  S.controles = function (el) {
    el.className = "g-audiobar";
    el.innerHTML =
      '<button type="button" class="g-mini" data-k="sfx" aria-pressed="true"></button>' +
      '<button type="button" class="g-mini" data-k="mus" aria-pressed="true"></button>' +
      '<button type="button" class="g-mini" data-k="luz" aria-pressed="true"></button>' +
      '<button type="button" class="g-mini" data-k="fs" aria-pressed="false"></button>' +
      '<label class="g-vol">Volumen <input type="range" min="0" max="100" aria-label="Volumen"></label>';
    S.ui = el;
    el.addEventListener("click", function (ev) {
      var b = ev.target.closest("button"); if (!b) return;
      var k = b.getAttribute("data-k");
      if (k === "fs") { if (enPantalla()) salirPantalla(); else entrarPantalla(); b.focus(); return; }
      if (k === "sfx") S.sfxOn = !S.sfxOn;
      else if (k === "mus") S.musOn = !S.musOn;
      else if (k === "luz") S.luces = !S.luces;
      S.iniciar(); aplicar();
    });
    el.querySelector("input").addEventListener("input", function (ev) { S.vol = ev.target.value / 100; aplicar(); });
    actualizarUI();
  };
  Motor.Sonido = S;

  // Huecos: «{~Valeria~}» se ve como «_ _ _ _ _ _ _» y suena desafinado (la palabra no llega).
  // Devuelve el texto visible, el texto para lectores de pantalla y, por letra, si es parte de un hueco.
  Motor.huecos = function (texto) {
    var vis = "", srt = "", mal = [], partes = String(texto).split(/\{~([^~]*)~\}/);
    for (var k = 0; k < partes.length; k++) {
      var p = partes[k], j;
      if (k % 2 === 0) { vis += p; srt += p; for (j = 0; j < p.length; j++) mal.push(false); }
      else {
        var g = p.replace(/\S/g, "_").split("").join(" ");
        vis += g; srt += "[la palabra no llega]"; for (j = 0; j < g.length; j++) mal.push(true);
      }
    }
    return { vis: vis, sr: srt, mal: mal };
  };

  // Máquina de escribir: muestra el texto letra a letra con blips y pausas en la puntuación.
  // El resto del texto queda oculto pero ocupa su sitio (no hay saltos de línea). Con «reducir movimiento» sale de golpe.
  Motor.escribir = function (el, texto, o) {
    o = o || {};
    var H = Motor.huecos(texto); texto = H.vis;
    var a = document.createElement("span"), b = document.createElement("span"), i = 0, h = 0, fin = false, ms = o.ms || 32;
    b.style.visibility = "hidden"; el.textContent = ""; el.appendChild(a); el.appendChild(b);
    // o.nivel() -> 0..1: sobrecarga sensorial. Sube la velocidad, hace temblar las letras y ensucia el blip.
    function esc(t) { return t.replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
    function poner(n) {
      var lv = (!reducir && o.nivel) ? o.nivel() : 0;
      if (lv > 0.3) {
        el.style.setProperty("--tr", (lv * 2.6).toFixed(1) + "px");
        a.innerHTML = texto.slice(0, n).split("").map(function (ch, k) {
          return ch === " " ? " " : '<span class="tr" style="animation-delay:-' + ((k * 53) % 300) + 'ms">' + esc(ch) + '</span>';
        }).join("");
      } else a.textContent = texto.slice(0, n);
      if (o.nivel) el.classList.toggle("tw-alto", lv > 0.6);
      b.textContent = texto.slice(n);
    }
    function terminar() {
      clearTimeout(h); poner(texto.length);
      if (!fin) { fin = true; if (o.alTerminar) o.alTerminar(); }
    }
    if (reducir) { terminar(); return { saltar: terminar, parar: function () { fin = true; clearTimeout(h); } }; }
    poner(0);
    (function paso() {
      if (fin) return;
      i++; poner(i);
      var c = texto.charAt(i - 1), m = H.mal[i - 1];
      if (m) { if (c === "_") S.voz(o.voz, true); }
      else if (/[A-Za-zÁÉÍÓÚÜáéíóúüÑñ0-9]/.test(c) && i % 2 === 0) S.voz(o.voz, false, o.nivel ? o.nivel() : 0);
      if (i >= texto.length) return terminar();
      var rapido = o.nivel ? 1 - 0.55 * o.nivel() : 1;   // con sobrecarga el texto sale más rápido y sin pausas
      h = setTimeout(paso, (m ? ms * 4 : /[.…!?]/.test(c) ? ms * (rapido < 0.8 ? 2 : 7) : c === "," ? ms * 4 : ms) * rapido);
    })();
    return { saltar: terminar, parar: function () { fin = true; clearTimeout(h); } };
  };

  /* ============================ NOVELA ============================
     Sistema de diálogos compartido por los tres juegos:
     nodos con texto, opciones, reacciones y marcas (st.f) que cambian lo que pasa después.
     Texto en cajas con blips, clic para saltar, botones que esperan a que termine el texto.
     Config: area, panel, sr, nodos, tipos {pts,n,txt}, voces {nombre: vozId}, pts0,
             cabecera(n,st), medidor(n,st,dif), srTexto(n,texto), alMostrar(n,st,texto), alElegir(n,op,T,st),
             alHablar(vozId), nombreTu(n), nombreRes(n,op), salida(id,st,N), etiquetaOps. */
  Motor.Novela = function (o) {
    var N = { st: {}, maq: null, tk: 0 }, st = N.st, panel = o.panel, sr = o.sr;
    function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    N.esc = esc; N.clamp = clamp;

    N.nuevo = function (extra) {
      Object.keys(st).forEach(function (k) { delete st[k]; });
      var base = { nodo: null, pts: o.pts0 == null ? 50 : o.pts0, hist: [], fase: "inicio", f: {}, sigOpt: null }, k;
      for (k in base) st[k] = base[k];
      for (k in (extra || {})) st[k] = extra[k];
      return st;
    };

    N.pintar = function (html, sinScroll) {
      if (N.maq) { N.maq.parar(); N.maq = null; }
      N.tk++;
      panel.innerHTML = html;
      var f = panel.querySelector("[data-foco]");
      if (f) { f.setAttribute("tabindex", "-1"); f.focus({ preventScroll: true }); }
      if (!sinScroll) o.area.scrollIntoView({ block: "start", behavior: reducir ? "auto" : "smooth" });
    };

    N.caja = function (nombre, texto, extra, cls) {
      var T = Motor.huecos(texto);
      return '<div class="d-box' + (cls || "") + '" data-voz="' + esc((o.voces || {})[nombre] || "narra") + '"><p class="d-name">' + esc(nombre) + '</p>' +
        '<p class="d-text" data-foco><span class="sr-only">' + esc(T.sr) + '</span><span class="tw" aria-hidden="true" data-t="' +
        esc(texto).replace(/"/g, "&quot;") + '"></span></p>' + (extra || "") + '</div>';
    };

    // Convierte un párrafo marcado con data-tipear en texto que se escribe solo (para introducciones).
    function preparar(el) {
      var raw = el.textContent.replace(/\s+/g, " ").trim();
      var s1 = document.createElement("span"), s2 = document.createElement("span");
      s1.className = "sr-only"; s1.textContent = raw;
      s2.className = "tw"; s2.setAttribute("aria-hidden", "true"); s2.setAttribute("data-t", raw);
      el.textContent = ""; el.appendChild(s1); el.appendChild(s2);
      return s2;
    }

    // Escribe cajas y párrafos una tras otra; lo marcado con data-esperar aparece al terminar.
    N.hablar = function (op) {
      op = op || {};
      var tk = ++N.tk, i = 0;
      var cajas = [].slice.call(panel.querySelectorAll(".d-box, [data-tipear]"));
      var esp = [].slice.call(panel.querySelectorAll("[data-esperar]"));
      esp.forEach(function (b) { b.style.visibility = "hidden"; });
      function sig() {
        if (tk !== N.tk) return;
        if (i >= cajas.length) {
          if (o.alHablar) o.alHablar(null);
          esp.forEach(function (b) { b.style.visibility = ""; });
          var p = esp.filter(function (b) { return b.tagName === "BUTTON"; })[0] || panel.querySelector("button.g-btn");
          if (p && p.focus && esp.length) p.focus({ preventScroll: true });
          return;
        }
        var cj = cajas[i++], t = cj.classList.contains("d-box") ? cj.querySelector(".tw") : preparar(cj);
        var voz = cj.getAttribute("data-voz") || "narra";
        if (o.alHablar) o.alHablar(voz);
        var ms = +cj.getAttribute("data-ms") || (typeof op.ms === "function" ? op.ms() : op.ms) || 32;
        N.maq = Motor.escribir(t, t.getAttribute("data-t"), { ms: ms, voz: voz, nivel: op.nivel, alTerminar: sig });
      }
      sig();
    };

    N.saltar = function () { if (N.maq) { N.maq.saltar(); return true; } return false; };
    N.clic = function (ev) { return !!(N.maq && ev.target.closest(".d-box, [data-tipear]") && N.saltar()); };

    function val(x) { return typeof x === "function" ? x() : x; }
    function lento() { var n = o.nodos[st.nodo]; return n && n.lento ? 68 : 32; }

    N.mostrar = function (id) {
      var n = o.nodos[id]; st.nodo = id; st.fase = "dialogo";
      if (n.marca) st.f[n.marca] = 1;
      var texto = val(n.texto) || "";
      if (o.alMostrar) o.alMostrar(n, st, texto);
      if (n.run) return n.run(N, n, st);
      sr.textContent = o.srTexto ? o.srTexto(n, texto) : n.quien + ": " + Motor.huecos(texto).sr;
      var cab = (o.cabecera ? o.cabecera(n, st) : "") + (o.medidor ? o.medidor(n, st, 0) : "");
      var caja = N.caja(n.quien, texto, "", n.pens ? " d-pens" : "");
      if (n.op) {
        var ops = n.op.map(function (p, k) {
          return '<button class="g-btn ghost d-op" data-accion="op" data-i="' + k + '">' + esc(p.t) + '</button>';
        }).join("");
        N.pintar(cab + caja + '<div class="d-ops" data-esperar role="group" aria-label="' + esc(o.etiquetaOps || "¿Qué haces?") + '">' + ops + '</div>', true);
      } else {
        N.pintar(cab + caja + '<button class="g-btn" data-esperar data-accion="sigNodo">Continuar</button>', true);
      }
      N.hablar({ ms: lento });
    };

    N.elegir = function (i) {
      var n = o.nodos[st.nodo], p = n.op[i], T = o.tipos[p.tipo];
      st.sigOpt = p.sig || null; if (p.f) st.f[p.f] = 1;
      st.pts = clamp(st.pts + T.pts, 0, 100);
      if (!n.pov) st.hist.push({ t: p.t, tipo: p.tipo });
      st.fase = "reaccion";
      if (o.alElegir) o.alElegir(n, p, T, st);
      var tu = o.nombreTu ? o.nombreTu(n) : "Tú", res = p.r.quien || (o.nombreRes ? o.nombreRes(n, p) : n.quien);
      var extra = p.r.extra || [];
      sr.textContent = tu + ": " + p.t + ". " + res + ": " + Motor.huecos(p.r.texto).sr + extra.map(function (e) { return " " + e[0] + ": " + e[1]; }).join("");
      var cajas = N.caja(tu, p.t, "", n.pov ? " d-yo d-pens" : " d-yo") + N.caja(res, p.r.texto, "", n.pov ? " d-pens" : "");
      extra.forEach(function (e) { cajas += N.caja(e[0], e[1], "", e[2] || ""); });
      N.pintar((o.cabecera ? o.cabecera(n, st) : "") + (o.medidor ? o.medidor(n, st, T.pts) : "") + cajas +
        '<button class="g-btn" data-esperar data-accion="sigNodo">Continuar</button>', true);
      N.hablar({ ms: lento });
    };

    N.siguiente = function () {
      var n = o.nodos[st.nodo], s = st.sigOpt || n.sig; st.sigOpt = null;
      if (o.salida && o.salida(s, st, N)) return;
      N.mostrar(s);
    };

    return N;
  };

  /* ============================ JUEGO ============================ */
  var EASE = {
    lineal: function (p) { return p; },
    suave: function (p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }
  };

  function Juego(canvas, o) {
    o = o || {};
    this.canvas = canvas;
    this.w = o.ancho || 256; this.h = o.alto || 144;
    this.base = o.base || "";
    canvas.width = this.w; canvas.height = this.h;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.sprites = {}; this.tweens = []; this.parts = [];
    this.mk = { n: null, a: 0, aT: 0 }; this.marcoPrefijo = ""; this.marcoQuieto = false;
    this.t = 0; this._raf = 0; this._last = 0;
    this.actualizar = function () {}; this.dibujar = function () {};
    var self = this;
    this._ajustar = function () { self.ajustar(); };
    global.addEventListener("resize", this._ajustar);
    this._visible = function () { if (document.hidden) self.detener(); else self.iniciar(); };
    document.addEventListener("visibilitychange", this._visible);
    this.ajustar();
  }

  Juego.prototype.ajustar = function () {
    var padre = this.canvas.parentNode, ancho = padre ? padre.clientWidth : this.w;
    var full = !!(this.canvas.closest && this.canvas.closest("#juego.g-full"));
    if (full) {                                   // pantalla completa: la escena ocupa ~la mitad de la altura
      var dos = !!(global.matchMedia && global.matchMedia("(min-width: 900px) and (min-aspect-ratio: 4/3)").matches);
      var maxH = dos ? global.innerHeight - 110 : Math.max(120, global.innerHeight * 0.52 - 30);   // dos columnas: escena grande
      ancho = Math.min(ancho, Math.floor(maxH * this.w / this.h));
    }
    var kk = Math.floor(ancho / this.w);
    // escala entera (píxeles perfectos); si sobra más del 20 % de ancho, se ajusta de forma fluida
    var entera = ancho >= this.w && (kk >= 2 || (ancho - this.w * kk) / ancho <= 0.2);
    if (full) {
      var wpx = entera ? this.w * Math.min(8, kk) : ancho;
      this.canvas.style.width = wpx + "px";
      this.canvas.style.height = Math.round(wpx * this.h / this.w) + "px";
    } else if (entera) {
      var k = Math.max(1, Math.min(4, kk));
      this.canvas.style.width = this.w * k + "px";
      this.canvas.style.height = this.h * k + "px";
    } else {                                      // pantallas estrechas: ajuste fluido
      this.canvas.style.width = "100%";
      this.canvas.style.height = "auto";
    }
  };

  Juego.prototype.cargar = function (nombres) {
    var self = this;
    return Promise.all(nombres.map(function (n) {
      return new Promise(function (ok) {
        var m = /_(\d+)f$/.exec(n), frames = m ? +m[1] : 1, img = new Image();
        img.onload = function () {
          self.sprites[n] = { img: img, frames: frames, fw: img.width / frames, fh: img.height }; ok();
        };
        img.onerror = function () {                // si falta el archivo: cuadro magenta, no se rompe el juego
          var c = document.createElement("canvas"); c.width = 16 * frames; c.height = 16;
          var x = c.getContext("2d"); x.fillStyle = "#ff00ff"; x.fillRect(0, 0, c.width, 16);
          self.sprites[n] = { img: c, frames: frames, fw: 16, fh: 16 }; ok();
        };
        img.src = self.base + n + ".png";
      });
    }));
  };

  Juego.prototype.spr = function (n, x, y, frame, alpha) {
    var s = this.sprites[n]; if (!s) return;
    var c = this.ctx; if (alpha != null) c.globalAlpha = alpha;
    c.drawImage(s.img, ((frame || 0) % s.frames) * s.fw, 0, s.fw, s.fh, Math.round(x), Math.round(y), s.fw, s.fh);
    if (alpha != null) c.globalAlpha = 1;
  };
  Juego.prototype.recorte = function (n, frame, sx, sy, sw, sh, dx, dy) {
    var s = this.sprites[n]; if (!s || sw <= 0 || sh <= 0) return;
    this.ctx.drawImage(s.img, (frame % s.frames) * s.fw + sx, sy, sw, sh, Math.round(dx), Math.round(dy), sw, sh);
  };
  Juego.prototype.rect = function (x, y, w, h, color) {
    this.ctx.fillStyle = color; this.ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };
  Juego.prototype.texto = function (s, x, y, color, centro) {
    var c = this.ctx; c.font = "bold 8px monospace"; c.textBaseline = "top";
    c.textAlign = centro ? "center" : "left";
    c.fillStyle = "#0b0f1a";
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(function (d) { c.fillText(s, Math.round(x) + d[0], Math.round(y) + d[1]); });
    c.fillStyle = color || "#f5f5f5"; c.fillText(s, Math.round(x), Math.round(y));
  };
  // cuadro de animación en bucle (2 cuadros por defecto); sin movimiento si el usuario lo prefiere
  Juego.prototype.cuadro = function (ms, n) { return reducir ? 0 : Math.floor(this.t / (ms || 500)) % (n || 2); };

  /* ---------- Iluminación ----------
     iluminar({ ambiente:{c,a}, luces:[{x,y,r,c,g,corte,parp}], vineta, vc })
     - ambiente: color y opacidad de la oscuridad general de la escena.
     - luces: cada una abre un «hueco» de luz (corte 0..1) y puede añadir brillo de color (g).
     - parp: parpadeo suave del radio (lento y mínimo; se anula con «reducir movimiento»).
     - vineta: oscurecimiento de los bordes. Todo por bandas, para conservar el aspecto 8 bits. */
  Juego.prototype.iluminar = function (o) {
    if (!S.luces || !o) return;
    var W = this.w, H = this.h, ctx = this.ctx, t = this.t, i;
    var luces = o.luces || [], amb = o.ambiente;
    function radio(l) { return Math.max(1, Math.round(l.r * ((reducir || !l.parp) ? 1 : 1 + l.parp * Math.sin(t / 700 + (l.x || 0))))); }
    // Luces grandes = más bandas y más finas (sin anillos marcados); luces pequeñas = pocas bandas (aspecto 8 bits)
    function banda(c, l, total, cortar) {
      var r = radio(l), x = Math.round(l.x), y = Math.round(l.y), n = Math.max(3, Math.min(11, Math.round(r / 7)));
      var a = cortar ? Math.min(1, total / n * 1.6) : total / n;
      for (var j = 0; j < n; j++) {
        c.globalAlpha = a; c.beginPath();
        c.arc(x, y, Math.max(1, Math.round(r * (1 - j / n))), 0, 6.2832); c.fill();
      }
    }
    if (amb && amb.a > 0.005) {
      if (!this._L) {
        var cv = document.createElement("canvas"); cv.width = W; cv.height = H;
        this._L = cv; this._Lx = cv.getContext("2d");
      }
      var L = this._Lx;
      L.globalCompositeOperation = "source-over"; L.clearRect(0, 0, W, H);
      L.globalAlpha = amb.a; L.fillStyle = amb.c; L.fillRect(0, 0, W, H);
      L.globalCompositeOperation = "destination-out"; L.fillStyle = "#000";
      luces.forEach(function (l) { banda(L, l, l.corte == null ? 0.8 : l.corte, true); });
      L.globalAlpha = 1; L.globalCompositeOperation = "source-over";
      ctx.drawImage(this._L, 0, 0);
    }
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    luces.forEach(function (l) { if (l.g) { ctx.fillStyle = l.c || "#f0cf7a"; banda(ctx, l, l.g, false); } });
    ctx.restore();
    if (o.vineta > 0) {
      ctx.save(); ctx.fillStyle = o.vc || "#0b0f1a"; ctx.globalAlpha = o.vineta / 4;
      for (i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.rect(0, 0, W, H);
        ctx.ellipse(W / 2, H / 2, W * (0.8 - 0.09 * i), H * (0.8 - 0.09 * i), 0, 0, 6.2832);
        ctx.fill("evenodd");
      }
      ctx.restore();
    }
  };

  // Marco dibujado (sprite de pantalla completa) con transparencia variable. Se apaga con «Iluminación: no».
  Juego.prototype.marco = function (n, a) {
    var s = this.sprites[n]; if (!s || !S.luces || !(a > 0.01)) return;
    this.ctx.globalAlpha = Math.min(1, a); this.ctx.drawImage(s.img, 0, 0, this.w, this.h); this.ctx.globalAlpha = 1;
  };

  // Marcos de momentos importantes: J.marcar(["oscuro", 0.8]) los enciende con un fundido; J.marcar(null) los apaga.
  // El sprite se llama <prefijo><nombre>_1f (por ejemplo alz_marco_oscuro_1f). El cálido «respira» salvo con movimiento reducido.
  Juego.prototype.marcar = function (m) {
    if (!m) { this.mk.aT = 0; return; }
    this.mk.n = m[0]; this.mk.aT = m[1];
  };

  Juego.prototype.tween = function (ms, fn, fin, ease) {
    this.tweens.push({ t0: this.t, ms: reducir ? 1 : ms, fn: fn, fin: fin, e: EASE[ease || "suave"] });
  };
  Juego.prototype.chispas = function (x, y, n, cols) {
    if (reducir) return;
    cols = cols || ["#f0cf7a", "#f5f5f5", "#bfeaff"];
    for (var i = 0; i < (n || 14); i++) {
      var a = Math.random() * Math.PI * 2, v = 12 + Math.random() * 28;
      this.parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 14, vida: 0.7 + Math.random() * 0.5, c: cols[i % cols.length] });
    }
  };

  Juego.prototype._paso = function (ahora) {
    var dt = Math.min(50, ahora - this._last); this._last = ahora; this.t += dt;
    for (var i = this.tweens.length - 1; i >= 0; i--) {
      var w = this.tweens[i], p = Math.min(1, (this.t - w.t0) / w.ms);
      w.fn(w.e(p));
      if (p >= 1) { this.tweens.splice(i, 1); if (w.fin) w.fin(); }
    }
    for (var j = this.parts.length - 1; j >= 0; j--) {
      var q = this.parts[j]; q.vida -= dt / 1000; q.vy += 60 * dt / 1000;
      q.x += q.vx * dt / 1000; q.y += q.vy * dt / 1000;
      if (q.vida <= 0) this.parts.splice(j, 1);
    }
    this.actualizar(dt);
    var mk = this.mk;
    mk.a = reducir ? mk.aT : mk.a + (mk.aT - mk.a) * Math.min(1, dt / 450);
    if (mk.aT === 0 && mk.a < 0.01) mk.n = null;
    this.ctx.clearRect(0, 0, this.w, this.h);
    this.dibujar(this.ctx);
    if (mk.n) this.marco(this.marcoPrefijo + mk.n + "_1f", mk.a * (mk.n === "calido" && !reducir && !this.marcoQuieto ? 0.92 + 0.08 * Math.sin(this.t / 700) : 1));
    for (var k = 0; k < this.parts.length; k++) {
      var r = this.parts[k]; this.ctx.fillStyle = r.c; this.ctx.fillRect(Math.round(r.x), Math.round(r.y), 2, 2);
    }
  };
  Juego.prototype.iniciar = function () {
    if (this._raf) return;
    var self = this; this._last = performance.now();
    (function bucle(t) { self._raf = requestAnimationFrame(bucle); self._paso(t); })(this._last);
  };
  Juego.prototype.detener = function () { if (this._raf) { cancelAnimationFrame(this._raf); this._raf = 0; } };
  Juego.prototype.destruir = function () {
    this.detener(); global.removeEventListener("resize", this._ajustar);
    document.removeEventListener("visibilitychange", this._visible);
  };

  Motor.Juego = Juego;
  global.Motor = Motor;
})(window);
