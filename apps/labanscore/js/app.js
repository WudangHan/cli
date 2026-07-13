/* ==========================================================================
   LabanScore — live Labanotation score editor synchronized with video.
   Notation system after Ann Hutchinson Guest, "Labanotation: The System of
   Analyzing and Recording Movement" (4th ed.):
   - vertical staff read from bottom to top; the centre line divides the
     left and right sides of the body;
   - columns outward from centre: support (step), leg gesture, body, arm, head;
   - direction is shown by the shape of the sign, level by its shading
     (black = low, dot = middle, hatched = high);
   - the LENGTH of a sign shows its duration (time = length).
   ========================================================================== */
(function () {
  "use strict";

  /* ---------------- i18n ---------------- */
  const STR = {
    fr: {
      "app.tagline": "Portée de Labanotation en direct · vidéo déroulante",
      "btn.help": "Guide", "btn.import": "Importer JSON", "btn.exportJson": "Exporter JSON",
      "btn.exportSvg": "Exporter la portée (SVG)",
      "btn.undo": "Annuler", "btn.redo": "Rétablir", "btn.clear": "Tout effacer",
      "video.title": "Vidéo source", "video.load": "Charger une vidéo…",
      "video.placeholder": "Chargez une vidéo locale (danse, lutte, geste quotidien…). La portée défile en synchronisation avec la lecture.",
      "video.rate": "Vitesse", "video.duration": "Durée (s)",
      "live.title": "Notation en direct",
      "live.hint": "Pendant la lecture, maintenez le bouton d'une colonne : le signe choisi dans la palette est écrit au temps courant et sa longueur suit la durée d'appui (durée = temps, principe fondamental de la cinétographie).",
      "insp.title": "Signe sélectionné", "insp.column": "Colonne", "insp.start": "Début (s)",
      "insp.dur": "Durée (s)", "insp.level": "Niveau", "insp.delete": "Supprimer le signe",
      "level.high": "Haut", "level.mid": "Moyen", "level.low": "Bas",
      "pal.direction": "Direction", "pal.level": "Niveau", "pal.other": "Autres",
      "set.tempo": "Tempo", "set.beats": "Temps/mesure", "set.zoom": "Zoom",
      "set.snap": "Aimanter aux temps", "set.follow": "Suivre la vidéo",
      "staff.hint": "Clic : écrire le signe courant · Glisser : déplacer · Poignée : durée · Clic droit : supprimer · Alt+clic : positionner la vidéo à ce temps. La portée se lit de bas en haut.",
      "footer.ref": "Système de notation d'après Ann Hutchinson Guest, <em>Labanotation: The System of Analyzing and Recording Movement</em> (4ᵉ éd.). Sauvegarde automatique locale ; aucune donnée n'est transmise.",
      "help.title": "Lire et écrire la Labanotation",
      "help.staffTitle": "La portée",
      "help.staff": "La portée verticale représente le corps ; elle se lit de bas en haut. La ligne centrale sépare le côté gauche du côté droit. De part et d'autre du centre : appui (pas), geste de jambe, corps (torse), bras, tête. La double barre marque le début ; les barres de mesure suivent le tempo.",
      "help.timeTitle": "Le temps",
      "help.time": "La longueur d'un signe indique sa durée : un signe deux fois plus long dure deux fois plus longtemps. Une case vide dans la colonne d'appui signifie une absence d'appui (saut).",
      "help.dirTitle": "Les signes de direction",
      "help.dir": "La forme du signe donne la direction (place = rectangle ; avant/arrière = tenon ; côté = pointe ; diagonales = biseau). La teinte donne le niveau : noir plein = bas, point central = moyen, hachures = haut.",
      "help.otherTitle": "Autres signes",
      "help.other": "Tour à gauche/droite (parallélogramme), signe de tenue (o) pour conserver une position. Les versions futures ajouteront rotations chiffrées, épingles, chemins et signes de contact.",
      "help.ref": "Référence complète : Ann Hutchinson Guest, <em>Labanotation</em>, 4ᵉ édition, Routledge.",
      "col.support": "Appui", "col.leg": "Jambe", "col.body": "Corps", "col.arm": "Bras", "col.head": "Tête",
      "side.L": "G", "side.R": "D",
      "dir.place": "Place", "dir.fwd": "Avant", "dir.back": "Arrière",
      "dir.left": "Côté gauche", "dir.right": "Côté droit",
      "dir.diagFL": "Diagonale avant-gauche", "dir.diagFR": "Diagonale avant-droite",
      "dir.diagBL": "Diagonale arrière-gauche", "dir.diagBR": "Diagonale arrière-droite",
      "extra.turnL": "Tour à gauche", "extra.turnR": "Tour à droite", "extra.hold": "Tenue (o)",
      "confirm.clear": "Effacer tous les signes de la portée ?",
      "confirm.import": "Remplacer la partition actuelle par le fichier importé ?",
      "score.title": "Partition LabanScore",
      "score.credit": "Notation : Labanotation d'après Ann Hutchinson Guest — générée avec LabanScore (EMBODIAI)",
      "err.import": "Fichier JSON invalide.",
      "measure": "mes.",
    },
    en: {
      "app.tagline": "Live Labanotation score · scrolling video",
      "btn.help": "Guide", "btn.import": "Import JSON", "btn.exportJson": "Export JSON",
      "btn.exportSvg": "Export score (SVG)",
      "btn.undo": "Undo", "btn.redo": "Redo", "btn.clear": "Clear all",
      "video.title": "Source video", "video.load": "Load a video…",
      "video.placeholder": "Load a local video (dance, wrestling, everyday movement…). The staff scrolls in sync with playback.",
      "video.rate": "Speed", "video.duration": "Duration (s)",
      "live.title": "Live notation",
      "live.hint": "While the video plays, hold a column button: the sign selected in the palette is written at the current time and its length follows how long you hold (duration = length, the core principle of kinetography).",
      "insp.title": "Selected sign", "insp.column": "Column", "insp.start": "Start (s)",
      "insp.dur": "Duration (s)", "insp.level": "Level", "insp.delete": "Delete sign",
      "level.high": "High", "level.mid": "Middle", "level.low": "Low",
      "pal.direction": "Direction", "pal.level": "Level", "pal.other": "Other",
      "set.tempo": "Tempo", "set.beats": "Beats/bar", "set.zoom": "Zoom",
      "set.snap": "Snap to beats", "set.follow": "Follow video",
      "staff.hint": "Click: write current sign · Drag: move · Handle: duration · Right-click: delete · Alt+click: seek video to that time. The staff is read from bottom to top.",
      "footer.ref": "Notation system after Ann Hutchinson Guest, <em>Labanotation: The System of Analyzing and Recording Movement</em> (4th ed.). Local autosave; no data leaves your browser.",
      "help.title": "Reading and writing Labanotation",
      "help.staffTitle": "The staff",
      "help.staff": "The vertical staff represents the body and is read from bottom to top. The centre line divides the left side from the right side. Outward from the centre: support (step), leg gesture, body (torso), arm, head. The double bar marks the start; bar lines follow the tempo.",
      "help.timeTitle": "Time",
      "help.time": "The length of a sign shows its duration: a sign twice as long lasts twice as long. An empty space in the support column means absence of support (a spring or jump).",
      "help.dirTitle": "Direction signs",
      "help.dir": "The shape of the sign gives the direction (place = rectangle; forward/backward = tab; side = point; diagonals = bevel). Shading gives the level: solid black = low, centre dot = middle, hatched = high.",
      "help.otherTitle": "Other signs",
      "help.other": "Turn left/right (parallelogram), hold sign (o) to retain a position. Future versions will add measured rotations, pins, paths and contact hooks.",
      "help.ref": "Full reference: Ann Hutchinson Guest, <em>Labanotation</em>, 4th edition, Routledge.",
      "col.support": "Support", "col.leg": "Leg", "col.body": "Body", "col.arm": "Arm", "col.head": "Head",
      "side.L": "L", "side.R": "R",
      "dir.place": "Place", "dir.fwd": "Forward", "dir.back": "Backward",
      "dir.left": "Left side", "dir.right": "Right side",
      "dir.diagFL": "Left-forward diagonal", "dir.diagFR": "Right-forward diagonal",
      "dir.diagBL": "Left-backward diagonal", "dir.diagBR": "Right-backward diagonal",
      "extra.turnL": "Turn left", "extra.turnR": "Turn right", "extra.hold": "Hold (o)",
      "confirm.clear": "Erase every sign on the staff?",
      "confirm.import": "Replace the current score with the imported file?",
      "score.title": "LabanScore score",
      "score.credit": "Notation: Labanotation after Ann Hutchinson Guest — generated with LabanScore (EMBODIAI)",
      "err.import": "Invalid JSON file.",
      "measure": "bar",
    },
  };
  let lang = (new URLSearchParams(location.search).get("lang")) ||
    localStorage.getItem("labanscore.lang") || "fr";
  if (!STR[lang]) lang = "fr";
  const t = (k) => (STR[lang][k] !== undefined ? STR[lang][k] : k);

  /* ---------------- constants & state ---------------- */
  const COLW = 36, PADX = 56;
  let PADTOP = 56, PADBOT = 76; // recomputed from viewport so t=0 and t=end reach the now-line
  const INK = "#17151a";
  const COLUMNS = [
    { id: "headL", side: "L", key: "col.head" },
    { id: "armL", side: "L", key: "col.arm" },
    { id: "bodyL", side: "L", key: "col.body" },
    { id: "legL", side: "L", key: "col.leg" },
    { id: "supportL", side: "L", key: "col.support" },
    { id: "supportR", side: "R", key: "col.support" },
    { id: "legR", side: "R", key: "col.leg" },
    { id: "bodyR", side: "R", key: "col.body" },
    { id: "armR", side: "R", key: "col.arm" },
    { id: "headR", side: "R", key: "col.head" },
  ];
  const DIRS = ["place", "fwd", "back", "left", "right", "diagFL", "diagFR", "diagBL", "diagBR"];
  const LEVELS = ["high", "mid", "low"];
  const NOW_FRAC = 0.7; // must match .now-line { top: 70% }

  const score = { duration: 60, symbols: [] };
  const tool = { kind: "dir", dir: "fwd", level: "mid", turnDir: "left" };
  let pps = 72;               // pixels per second
  let selectedId = null;
  let idSeq = 1;
  let undoStack = [], redoStack = [];
  let hasVideo = false;
  const liveRec = {};         // colId -> symbol currently being recorded

  /* ---------------- DOM ---------------- */
  const $ = (id) => document.getElementById(id);
  const video = $("video"), svg = $("staff-svg"), viewport = $("staff-viewport");
  const nowLine = $("now-line"), nowBadge = $("now-badge");
  const bpmInput = $("bpm"), beatsInput = $("beats-per-bar");
  const snapInput = $("snap"), followInput = $("follow"), zoomInput = $("zoom");

  const beatSec = () => 60 / clamp(+bpmInput.value || 60, 20, 240);
  const barSec = () => beatSec() * clamp(+beatsInput.value || 4, 1, 12);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const snapT = (tv) => {
    if (!snapInput.checked) return Math.round(tv * 100) / 100;
    const sub = beatSec() / 2;
    return Math.round(tv / sub) * sub;
  };

  function updatePads() {
    const h = viewport.clientHeight || 600;
    PADTOP = Math.max(56, Math.ceil(h * NOW_FRAC) + 24);
    PADBOT = Math.max(76, Math.ceil(h * (1 - NOW_FRAC)) + 24);
  }
  const staffW = COLUMNS.length * COLW;
  const svgW = staffW + PADX * 2;
  const svgH = () => PADTOP + PADBOT + score.duration * pps;
  const yOf = (tv) => PADTOP + (score.duration - tv) * pps;
  const tOf = (y) => clamp(score.duration - (y - PADTOP) / pps, 0, score.duration);
  const colX = (i) => PADX + i * COLW;
  const centerX = PADX + staffW / 2;

  /* ---------------- symbol shapes (SVG path strings) ----------------
     Direction is shown by the SHAPE of the sign (Hutchinson Guest ch. 2):
     place = rectangle; forward/backward = half-width tab (top = forward,
     bottom = backward, on the body side of the column); side = point;
     diagonals = bevelled end. */
  function dirPath(dir, side, x, y, w, h) {
    const c = Math.min(h * 0.42, w * 0.9); // bevel size for diagonals
    switch (dir) {
      case "place":
        return `M${x},${y} h${w} v${h} h${-w} Z`;
      case "fwd":
        return side === "L"
          ? `M${x},${y} h${w / 2} v${h / 2} h${w / 2} v${h / 2} h${-w} Z`
          : `M${x + w / 2},${y} h${w / 2} v${h} h${-w} v${-h / 2} h${w / 2} Z`;
      case "back":
        return side === "L"
          ? `M${x},${y} h${w} v${h / 2} h${-w / 2} v${h / 2} h${-w / 2} Z`
          : `M${x},${y} h${w} v${h} h${-w / 2} v${-h / 2} h${-w / 2} Z`;
      case "left":
        return `M${x + w},${y} v${h} L${x},${y + h / 2} Z`;
      case "right":
        return `M${x},${y} v${h} L${x + w},${y + h / 2} Z`;
      case "diagFL":
        return `M${x},${y} L${x + w},${y + c} V${y + h} H${x} Z`;
      case "diagFR":
        return `M${x},${y + c} L${x + w},${y} V${y + h} H${x} Z`;
      case "diagBL":
        return `M${x},${y} H${x + w} V${y + h - c} L${x},${y + h} Z`;
      case "diagBR":
        return `M${x},${y} H${x + w} V${y + h} L${x},${y + h - c} Z`;
      default:
        return `M${x},${y} h${w} v${h} h${-w} Z`;
    }
  }
  function levelAttrs(level) {
    if (level === "low") return `fill="${INK}"`;
    if (level === "high") return `fill="url(#laban-hatch)"`;
    return `fill="none"`;
  }
  function midDot(dir, x, y, w, h) {
    let cx = x + w / 2;
    if (dir === "left") cx = x + w * 0.64;
    if (dir === "right") cx = x + w * 0.36;
    return `<circle cx="${cx}" cy="${y + h / 2}" r="${Math.min(3.2, w * 0.14)}" fill="${INK}" pointer-events="none"/>`;
  }
  function turnPath(dirTurn, x, y, w, h) {
    const off = Math.min(h * 0.32, 12);
    return dirTurn === "right"
      ? `M${x},${y} L${x + w},${y + off} V${y + h} L${x},${y + h - off} Z`
      : `M${x},${y + off} L${x + w},${y} V${y + h - off} L${x},${y + h} Z`;
  }

  function symbolMarkup(sym, interactive) {
    const i = COLUMNS.findIndex((c) => c.id === sym.col);
    if (i < 0) return "";
    const inset = 5, sx = colX(i) + inset, sw = COLW - inset * 2;
    const yTop = yOf(sym.start + sym.dur);
    const h = Math.max(6, sym.dur * pps);
    const sel = interactive && sym.id === selectedId;
    const common = `stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"`;
    let body = "", hitY = yTop - 4, hitH = h + 8;
    if (sym.kind === "hold") {
      const cy = yOf(sym.start) - 9;
      hitY = cy - 9; hitH = 18;
      body = `<circle class="sym-shape" cx="${colX(i) + COLW / 2}" cy="${cy}" r="6" fill="none" ${common}/>`;
    } else if (sym.kind === "turn") {
      body = `<path class="sym-shape" d="${turnPath(sym.dir, sx, yTop, sw, h)}" fill="none" ${common}/>`;
    } else {
      const side = COLUMNS[i].side;
      body = `<path class="sym-shape" d="${dirPath(sym.dir, side, sx, yTop, sw, h)}" ${levelAttrs(sym.level)} ${common}/>`;
      if (sym.level === "mid") body += midDot(sym.dir, sx, yTop, sw, h);
    }
    let handles = "";
    if (sel && sym.kind !== "hold") {
      handles = `<rect class="sym-handle" data-symid="${sym.id}" data-handle="top" x="${sx + sw / 2 - 5}" y="${yTop - 4}" width="10" height="8" rx="2"/>`;
    }
    return `<g class="sym${sel ? " selected" : ""}" data-symid="${sym.id}">` +
      `<rect x="${colX(i)}" y="${hitY}" width="${COLW}" height="${hitH}" fill="transparent"/>` +
      body + handles + `</g>`;
  }

  /* ---------------- staff rendering ---------------- */
  function staffMarkup(interactive) {
    const H = svgH();
    let out = `<defs><pattern id="laban-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
      `<rect width="6" height="6" fill="none"/><line x1="0" y1="0" x2="0" y2="6" stroke="${INK}" stroke-width="1.8"/></pattern></defs>`;
    out += `<rect x="0" y="0" width="${svgW}" height="${H}" fill="#f5f2ea"/>`;

    const yStart = yOf(0), yEnd = yOf(score.duration);
    // faint column guides (only the 3 main lines exist on a real staff)
    for (let i = 0; i <= COLUMNS.length; i++) {
      const x = colX(i);
      const main = i === COLUMNS.length / 2;
      const support = Math.abs(i - COLUMNS.length / 2) === 1;
      if (main) continue;
      out += `<line x1="${x}" y1="${yEnd}" x2="${x}" y2="${yStart}" stroke="${support ? INK : "#b9b2a4"}" ` +
        `stroke-width="${support ? 1.3 : 0.6}" ${support ? "" : `stroke-dasharray="2 5"`}/>`;
    }
    out += `<line x1="${centerX}" y1="${yEnd}" x2="${centerX}" y2="${yStart}" stroke="${INK}" stroke-width="1.8"/>`;

    // double bar at the start (bottom), bars and beat ticks upward
    out += `<line x1="${PADX}" y1="${yStart}" x2="${PADX + staffW}" y2="${yStart}" stroke="${INK}" stroke-width="2.2"/>`;
    out += `<line x1="${PADX}" y1="${yStart + 5}" x2="${PADX + staffW}" y2="${yStart + 5}" stroke="${INK}" stroke-width="2.2"/>`;
    const bs = barSec(), bt = beatSec();
    for (let k = 1, tv = bs; tv <= score.duration + 1e-6; k++, tv = k * bs) {
      const y = yOf(tv);
      out += `<line x1="${PADX}" y1="${y}" x2="${PADX + staffW}" y2="${y}" stroke="${INK}" stroke-width="1.1"/>`;
    }
    for (let tv = bt; tv <= score.duration + 1e-6; tv += bt) {
      const y = yOf(tv);
      out += `<line x1="${centerX - 4}" y1="${y}" x2="${centerX + 4}" y2="${y}" stroke="${INK}" stroke-width="1"/>`;
    }
    // measure numbers (left) and clock time (right)
    for (let k = 0, tv = 0; tv < score.duration; k++, tv = k * bs) {
      const y = yOf(tv);
      out += `<text x="${PADX - 10}" y="${y - 6}" text-anchor="end" font-size="11" font-family="DM Sans, sans-serif" fill="#6d6455">${k + 1}</text>`;
      out += `<text x="${PADX + staffW + 10}" y="${y - 6}" text-anchor="start" font-size="10" font-family="DM Sans, sans-serif" fill="#a09884">${fmtClock(tv)}</text>`;
    }
    for (const sym of score.symbols) out += symbolMarkup(sym, interactive);
    return out;
  }

  let renderQueued = false;
  function render() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      updatePads();
      svg.setAttribute("width", svgW);
      svg.setAttribute("height", svgH());
      svg.setAttribute("viewBox", `0 0 ${svgW} ${svgH()}`);
      svg.innerHTML = staffMarkup(true);
      saveLocal();
    });
  }

  function renderHeaders() {
    const wrap = $("staff-headers");
    wrap.innerHTML = "";
    wrap.style.width = svgW + "px";
    wrap.style.margin = "0 auto";
    wrap.style.paddingLeft = PADX + "px";
    wrap.style.paddingRight = PADX + "px";
    COLUMNS.forEach((c, i) => {
      const d = document.createElement("div");
      d.className = "col-head" + (i === 4 ? " center-left" : "");
      d.style.width = COLW + "px";
      d.textContent = `${t(c.key)} ${t("side." + c.side)}`;
      wrap.appendChild(d);
    });
  }

  /* ---------------- time helpers ---------------- */
  function fmtClock(s) {
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  function fmtTimecode(s) {
    const m = Math.floor(s / 60), sec = (s % 60).toFixed(2).padStart(5, "0");
    return `${String(m).padStart(2, "0")}:${sec}`;
  }
  const now = () => (hasVideo ? video.currentTime : 0);

  /* ---------------- undo / redo ---------------- */
  function pushUndo() {
    undoStack.push(JSON.stringify(score.symbols));
    if (undoStack.length > 80) undoStack.shift();
    redoStack.length = 0;
  }
  function undo() {
    if (!undoStack.length) return;
    redoStack.push(JSON.stringify(score.symbols));
    score.symbols = JSON.parse(undoStack.pop());
    selectedId = null; syncInspector(); render();
  }
  function redo() {
    if (!redoStack.length) return;
    undoStack.push(JSON.stringify(score.symbols));
    score.symbols = JSON.parse(redoStack.pop());
    selectedId = null; syncInspector(); render();
  }

  /* ---------------- symbol CRUD ---------------- */
  function makeSymbol(colId, start) {
    const base = { id: idSeq++, col: colId, start: Math.max(0, start) };
    if (tool.kind === "hold") return { ...base, kind: "hold", dur: 0 };
    if (tool.kind === "turn") return { ...base, kind: "turn", dir: tool.turnDir, dur: beatSec() };
    return { ...base, kind: "dir", dir: tool.dir, level: tool.level, dur: beatSec() };
  }
  function getSym(id) { return score.symbols.find((s) => s.id === id); }
  function deleteSym(id) {
    const i = score.symbols.findIndex((s) => s.id === id);
    if (i >= 0) { pushUndo(); score.symbols.splice(i, 1); }
    if (selectedId === id) { selectedId = null; syncInspector(); }
    render();
  }

  /* ---------------- inspector ---------------- */
  const insp = $("inspector");
  function syncInspector() {
    const sym = getSym(selectedId);
    insp.hidden = !sym;
    if (!sym) return;
    $("insp-column").value = sym.col;
    $("insp-start").value = sym.start.toFixed(2);
    $("insp-dur").value = sym.dur.toFixed(2);
    $("insp-level-wrap").style.display = sym.kind === "dir" ? "" : "none";
    if (sym.kind === "dir") $("insp-level").value = sym.level;
  }
  function bindInspector() {
    const colSel = $("insp-column");
    COLUMNS.forEach((c) => {
      const o = document.createElement("option");
      o.value = c.id; colSel.appendChild(o);
    });
    refreshInspectorLabels();
    colSel.addEventListener("change", () => {
      const sym = getSym(selectedId); if (!sym) return;
      pushUndo(); sym.col = colSel.value; render();
    });
    $("insp-start").addEventListener("change", () => {
      const sym = getSym(selectedId); if (!sym) return;
      pushUndo();
      sym.start = clamp(+$("insp-start").value || 0, 0, Math.max(0, score.duration - sym.dur));
      syncInspector(); render();
    });
    $("insp-dur").addEventListener("change", () => {
      const sym = getSym(selectedId); if (!sym) return;
      pushUndo();
      sym.dur = clamp(+$("insp-dur").value || beatSec(), 0.05, Math.max(0.05, score.duration - sym.start));
      syncInspector(); render();
    });
    $("insp-level").addEventListener("change", () => {
      const sym = getSym(selectedId); if (!sym || sym.kind !== "dir") return;
      pushUndo(); sym.level = $("insp-level").value; render();
    });
    $("insp-delete").addEventListener("click", () => deleteSym(selectedId));
  }
  function refreshInspectorLabels() {
    [...$("insp-column").options].forEach((o, i) => {
      o.textContent = `${t(COLUMNS[i].key)} ${t("side." + COLUMNS[i].side)}`;
    });
  }

  /* ---------------- palette ---------------- */
  function miniIcon(kind, dir, level) {
    const w = 18, h = 26;
    let inner = "";
    if (kind === "dir") {
      inner = `<path d="${dirPath(dir, dir === "left" || dir === "diagFL" || dir === "diagBL" ? "L" : "R", 1.5, 1.5, w - 3, h - 3)}" ` +
        `${level ? levelAttrs(level) : `fill="none"`} stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`;
      if (level === "mid") inner += `<circle cx="${w / 2}" cy="${h / 2}" r="2" fill="currentColor"/>`;
      inner = inner.replace(`fill="${INK}"`, `fill="currentColor"`)
        .replace(`fill="url(#laban-hatch)"`, `fill="url(#pal-hatch)"`);
    } else if (kind === "turn") {
      inner = `<path d="${turnPath(dir, 2, 2, w - 4, h - 4)}" fill="none" stroke="currentColor" stroke-width="1.5"/>`;
    } else {
      inner = `<circle cx="${w / 2}" cy="${h / 2}" r="5.5" fill="none" stroke="currentColor" stroke-width="1.6"/>`;
    }
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
      `<defs><pattern id="pal-hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
      `<line x1="0" y1="0" x2="0" y2="4" stroke="currentColor" stroke-width="1.3"/></pattern></defs>${inner}</svg>`;
  }

  function buildPalette() {
    const dirsBox = $("palette-dirs");
    DIRS.forEach((d) => {
      const b = document.createElement("button");
      b.innerHTML = miniIcon("dir", d, null);
      b.dataset.dir = d;
      b.addEventListener("click", () => { tool.kind = "dir"; tool.dir = d; refreshPalette(); });
      dirsBox.appendChild(b);
    });
    const lvlBox = $("palette-levels");
    LEVELS.forEach((lv) => {
      const b = document.createElement("button");
      b.innerHTML = miniIcon("dir", "place", lv);
      b.dataset.level = lv;
      b.addEventListener("click", () => { tool.level = lv; if (tool.kind !== "dir") tool.kind = "dir"; refreshPalette(); });
      lvlBox.appendChild(b);
    });
    const exBox = $("palette-extras");
    [["turnL", "turn", "left"], ["turnR", "turn", "right"], ["hold", "hold", null]].forEach(([key, kind, dirTurn]) => {
      const b = document.createElement("button");
      b.innerHTML = miniIcon(kind, dirTurn, null);
      b.dataset.extra = key;
      b.addEventListener("click", () => {
        tool.kind = kind;
        if (kind === "turn") tool.turnDir = dirTurn;
        refreshPalette();
      });
      exBox.appendChild(b);
    });
    refreshPalette();
  }
  function refreshPalette() {
    document.querySelectorAll("#palette-dirs button").forEach((b) => {
      b.classList.toggle("active", tool.kind === "dir" && b.dataset.dir === tool.dir);
      b.title = t("dir." + b.dataset.dir);
    });
    document.querySelectorAll("#palette-levels button").forEach((b) => {
      b.classList.toggle("active", tool.kind === "dir" && b.dataset.level === tool.level);
      b.title = t("level." + b.dataset.level);
    });
    document.querySelectorAll("#palette-extras button").forEach((b) => {
      const k = b.dataset.extra;
      const on = (k === "hold" && tool.kind === "hold") ||
        (k === "turnL" && tool.kind === "turn" && tool.turnDir === "left") ||
        (k === "turnR" && tool.kind === "turn" && tool.turnDir === "right");
      b.classList.toggle("active", on);
      b.title = t("extra." + k);
    });
  }

  /* ---------------- staff interaction ---------------- */
  let drag = null; // {mode:'move'|'resize', id, grabDT}
  function evtPos(e) {
    const r = svg.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  svg.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    const p = evtPos(e);
    const tv = tOf(p.y);
    if (e.altKey) {
      if (hasVideo) { video.currentTime = clamp(tv, 0, score.duration); scrollToNow(true); }
      return;
    }
    const handleEl = e.target.closest("[data-handle]");
    const symEl = e.target.closest("[data-symid]");
    if (handleEl) {
      drag = { mode: "resize", id: +handleEl.dataset.symid };
      pushUndo();
    } else if (symEl) {
      selectedId = +symEl.dataset.symid;
      const sym = getSym(selectedId);
      drag = { mode: "move", id: selectedId, grabDT: tv - sym.start, moved: false };
      syncInspector(); render();
    } else {
      const ci = Math.floor((p.x - PADX) / COLW);
      if (ci < 0 || ci >= COLUMNS.length || tv <= 0) { selectedId = null; syncInspector(); render(); return; }
      pushUndo();
      // the clicked point is the START of the sign; drag upward to lengthen it
      const sym = makeSymbol(COLUMNS[ci].id, snapT(tv));
      score.symbols.push(sym);
      selectedId = sym.id;
      drag = { mode: sym.kind === "hold" ? null : "resize-top-from-fresh", id: sym.id };
      syncInspector(); render();
    }
    if (drag) { try { svg.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ } }
  });
  svg.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const sym = getSym(drag.id);
    if (!sym) { drag = null; return; }
    const p = evtPos(e);
    const tv = tOf(p.y);
    if (drag.mode === "move") {
      if (!drag.moved) { pushUndo(); drag.moved = true; }
      sym.start = clamp(snapT(tv - drag.grabDT), 0, Math.max(0, score.duration - sym.dur));
      const ci = clamp(Math.floor((p.x - PADX) / COLW), 0, COLUMNS.length - 1);
      sym.col = COLUMNS[ci].id;
    } else { // resize / resize-top-from-fresh: pointer sets the END time
      sym.dur = Math.max(0.08, snapT(tv) - sym.start);
    }
    syncInspector(); render();
  });
  const endDrag = () => { drag = null; };
  svg.addEventListener("pointerup", endDrag);
  svg.addEventListener("pointercancel", endDrag);
  svg.addEventListener("contextmenu", (e) => {
    const symEl = e.target.closest("[data-symid]");
    if (symEl) { e.preventDefault(); deleteSym(+symEl.dataset.symid); }
  });

  /* ---------------- live recording strip ---------------- */
  function buildLiveStrip() {
    const strip = $("live-strip");
    strip.innerHTML = "";
    COLUMNS.forEach((c) => {
      const b = document.createElement("button");
      b.dataset.col = c.id;
      b.textContent = `${t(c.key)} ${t("side." + c.side)}`;
      b.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        try { b.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }
        startLive(c.id, b);
      });
      const stop = () => stopLive(c.id, b);
      b.addEventListener("pointerup", stop);
      b.addEventListener("pointercancel", stop);
      strip.appendChild(b);
    });
  }
  function startLive(colId, btn) {
    if (liveRec[colId]) return;
    pushUndo();
    const sym = makeSymbol(colId, snapInput.checked && !isPlaying() ? snapT(now()) : now());
    if (sym.kind !== "hold") sym.dur = 0.08;
    score.symbols.push(sym);
    liveRec[colId] = sym;
    btn.classList.add("recording");
    render();
  }
  function stopLive(colId, btn) {
    const sym = liveRec[colId];
    if (!sym) return;
    delete liveRec[colId];
    btn.classList.remove("recording");
    if (sym.kind !== "hold") {
      if (!isPlaying() && sym.dur <= 0.09) sym.dur = beatSec();
      if (snapInput.checked) {
        const end = snapT(sym.start + sym.dur);
        sym.start = snapT(sym.start);
        sym.dur = Math.max(beatSec() / 2, end - sym.start);
      }
    }
    selectedId = sym.id;
    syncInspector(); render();
  }

  /* ---------------- video ---------------- */
  const isPlaying = () => hasVideo && !video.paused && !video.ended;
  $("video-file").addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (!f) return;
    video.src = URL.createObjectURL(f);
    video.classList.add("has-src");
    $("video-placeholder").style.display = "none";
    hasVideo = true;
  });
  function adoptVideoDuration() {
    if (isFinite(video.duration) && video.duration > 0) {
      score.duration = Math.ceil(video.duration);
      $("manual-duration-wrap").style.display = "none";
    }
    render();
    requestAnimationFrame(() => scrollToNow(true));
  }
  video.addEventListener("loadedmetadata", adoptVideoDuration);
  video.addEventListener("durationchange", adoptVideoDuration);
  $("manual-duration").addEventListener("change", (e) => {
    const v = clamp(+e.target.value || 60, 5, 3600);
    const maxEnd = score.symbols.reduce((m, s) => Math.max(m, s.start + s.dur), 0);
    score.duration = Math.max(v, Math.ceil(maxEnd));
    render(); scrollToNow(true);
  });
  $("btn-play").addEventListener("click", togglePlay);
  function togglePlay() {
    if (!hasVideo) return;
    if (video.paused) { video.play(); followInput.checked = true; }
    else video.pause();
  }
  video.addEventListener("play", () => { $("btn-play").textContent = "❚❚"; });
  video.addEventListener("pause", () => { $("btn-play").textContent = "▶"; });
  video.addEventListener("ended", () => { $("btn-play").textContent = "▶"; });
  $("btn-step-back").addEventListener("click", () => { if (hasVideo) { video.pause(); video.currentTime = Math.max(0, video.currentTime - 1 / 30); scrollToNow(true); } });
  $("btn-step-fwd").addEventListener("click", () => { if (hasVideo) { video.pause(); video.currentTime = Math.min(video.duration, video.currentTime + 1 / 30); scrollToNow(true); } });
  $("rate").addEventListener("change", (e) => { video.playbackRate = +e.target.value; });
  video.addEventListener("click", togglePlay);
  video.addEventListener("seeked", () => scrollToNow(true));

  /* ---------------- scroll sync ---------------- */
  function scrollToNow(force) {
    if (!followInput.checked && !force) return;
    const y = yOf(now());
    viewport.scrollTop = y - viewport.clientHeight * NOW_FRAC;
  }
  viewport.addEventListener("wheel", () => { followInput.checked = false; }, { passive: true });

  function tick() {
    const tv = now();
    $("timecode").textContent = fmtTimecode(tv);
    nowBadge.textContent = `${tv.toFixed(2)} s · ${t("measure")} ${Math.floor(tv / barSec()) + 1}`;
    if (isPlaying()) {
      let dirty = false;
      for (const colId in liveRec) {
        const sym = liveRec[colId];
        if (sym.kind !== "hold") { sym.dur = Math.max(0.08, tv - sym.start); dirty = true; }
      }
      if (dirty) {
        svg.innerHTML = staffMarkup(true); // fast path: skip autosave during recording
      }
      scrollToNow(false);
    }
    requestAnimationFrame(tick);
  }

  /* ---------------- settings ---------------- */
  zoomInput.addEventListener("input", () => {
    const anchor = now();
    pps = +zoomInput.value;
    render();
    requestAnimationFrame(() => {
      const y = yOf(anchor);
      viewport.scrollTop = y - viewport.clientHeight * NOW_FRAC;
    });
  });
  bpmInput.addEventListener("change", render);
  beatsInput.addEventListener("change", render);

  /* ---------------- import / export ---------------- */
  function download(name, mime, data) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([data], { type: mime }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  $("btn-export-json").addEventListener("click", () => {
    const payload = {
      app: "LabanScore", version: 1, exportedAt: new Date().toISOString(),
      bpm: +bpmInput.value, beatsPerBar: +beatsInput.value,
      duration: score.duration, symbols: score.symbols,
      reference: "Labanotation after Ann Hutchinson Guest (4th ed.)",
    };
    download("labanscore.json", "application/json", JSON.stringify(payload, null, 2));
  });
  $("btn-import").addEventListener("click", () => $("import-file").click());
  $("import-file").addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (!f) return;
    f.text().then((txt) => {
      try {
        const data = JSON.parse(txt);
        if (!Array.isArray(data.symbols)) throw new Error("bad");
        if (score.symbols.length && !confirm(t("confirm.import"))) return;
        pushUndo();
        // sanitize: finite times only, duration bounded like the manual control
        if (+data.duration > 0 && !hasVideo) {
          score.duration = clamp(Math.ceil(+data.duration) || 60, 5, 3600);
          $("manual-duration").value = score.duration;
        }
        score.symbols = data.symbols
          .filter((s) => s && isFinite(+s.start) && +s.start >= 0 && isFinite(+s.dur))
          .map((s) => ({
            ...s, id: idSeq++,
            start: clamp(+s.start, 0, score.duration),
            dur: clamp(+s.dur, 0, score.duration),
          }));
        if (+data.bpm) bpmInput.value = clamp(+data.bpm, 20, 240);
        if (+data.beatsPerBar) beatsInput.value = clamp(+data.beatsPerBar, 1, 12);
        selectedId = null; syncInspector(); render();
      } catch { alert(t("err.import")); }
    });
    e.target.value = "";
  });
  $("btn-export-svg").addEventListener("click", () => {
    const screenPads = [PADTOP, PADBOT];
    PADTOP = 64; PADBOT = 56; // compact margins for the printed score
    const H = svgH();
    const head = `<text x="${svgW / 2}" y="26" text-anchor="middle" font-family="Georgia, serif" font-size="18" fill="${INK}">${t("score.title")} — ${new Date().toLocaleDateString(lang === "fr" ? "fr-CA" : "en-US")}</text>`;
    const foot = `<text x="${svgW / 2}" y="${H - 14}" text-anchor="middle" font-family="DM Sans, sans-serif" font-size="9" fill="#6d6455">${t("score.credit")}</text>`;
    const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${H}" viewBox="0 0 ${svgW} ${H}">` +
      staffMarkup(false) + head + foot + `</svg>`;
    [PADTOP, PADBOT] = screenPads;
    download("labanscore.svg", "image/svg+xml", doc);
  });
  $("btn-clear").addEventListener("click", () => {
    if (!score.symbols.length || confirm(t("confirm.clear"))) {
      pushUndo(); score.symbols = []; selectedId = null; syncInspector(); render();
    }
  });
  $("btn-undo").addEventListener("click", undo);
  $("btn-redo").addEventListener("click", redo);

  /* ---------------- persistence ---------------- */
  let saveTimer = null;
  function saveLocal() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem("labanscore.v1", JSON.stringify({
          symbols: score.symbols, duration: score.duration,
          bpm: +bpmInput.value, beatsPerBar: +beatsInput.value,
        }));
      } catch { /* storage full or unavailable */ }
    }, 400);
  }
  function loadLocal() {
    try {
      const raw = localStorage.getItem("labanscore.v1");
      if (!raw) return;
      const data = JSON.parse(raw);
      if (Array.isArray(data.symbols)) {
        score.symbols = data.symbols.map((s) => ({ ...s, id: idSeq++ }));
      }
      if (+data.duration > 0) { score.duration = +data.duration; $("manual-duration").value = score.duration; }
      if (+data.bpm) bpmInput.value = data.bpm;
      if (+data.beatsPerBar) beatsInput.value = data.beatsPerBar;
    } catch { /* corrupted save — start fresh */ }
  }

  /* ---------------- keyboard ---------------- */
  document.addEventListener("keydown", (e) => {
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "select" || tag === "textarea") return;
    if (e.code === "Space") { e.preventDefault(); togglePlay(); }
    else if (e.key === "Delete" || e.key === "Backspace") { if (selectedId != null) deleteSym(selectedId); }
    else if (e.key === "Escape") { selectedId = null; syncInspector(); render(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
    else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) { e.preventDefault(); redo(); }
  });

  /* ---------------- language ---------------- */
  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.innerHTML = t(el.dataset.i18n);
    });
    $("lang-fr").classList.toggle("lang-active", lang === "fr");
    $("lang-en").classList.toggle("lang-active", lang === "en");
    localStorage.setItem("labanscore.lang", lang);
    renderHeaders();
    buildLiveStrip();
    refreshPalette();
    refreshInspectorLabels();
  }
  $("lang-fr").addEventListener("click", () => { lang = "fr"; applyLang(); });
  $("lang-en").addEventListener("click", () => { lang = "en"; applyLang(); });

  /* ---------------- help dialog ---------------- */
  $("btn-help").addEventListener("click", () => $("help-dialog").showModal());
  $("help-close").addEventListener("click", () => $("help-dialog").close());

  /* ---------------- init ---------------- */
  loadLocal();
  pps = +zoomInput.value;
  window.addEventListener("resize", () => { render(); scrollToNow(false); });
  if (typeof ResizeObserver !== "undefined") {
    let lastH = 0;
    new ResizeObserver(() => {
      if (Math.abs(viewport.clientHeight - lastH) < 2) return;
      lastH = viewport.clientHeight;
      render();
      requestAnimationFrame(() => scrollToNow(false));
    }).observe(viewport);
  }
  buildPalette();
  bindInspector();
  applyLang();
  render();
  requestAnimationFrame(() => { scrollToNow(true); tick(); });
})();
