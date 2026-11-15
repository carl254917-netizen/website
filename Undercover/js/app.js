(() => {
  const $ = (s) => document.querySelector(s);
  const ITEM_W = 72, MIN_P = 3, MAX_P = 10;

  const state = {
    lang: localStorage.getItem("uc-lang") || "fr",
    rows: [],               // paires du CSV
    themes: new Set(),      // thèmes sélectionnés (aucun par défaut)
    players: 5,
    game: null              // { civil, spy, spyIndex, current }
  };

  const t = (k) => I18N[state.lang][k];

  /* ---------- CSV ---------- */
  async function loadCSV() {
    const res = await fetch("data/words.csv");
    if (!res.ok) throw new Error("CSV");
    const lines = (await res.text()).trim().split(/\r?\n/);
    const head = lines.shift().split(",");
    return lines.filter(Boolean).map((l) => {
      const c = l.split(",");
      return Object.fromEntries(head.map((h, i) => [h, (c[i] || "").trim()]));
    });
  }

  /* ---------- Navigation ---------- */
  function show(id, dark) {
    document.querySelectorAll(".screen").forEach((s) => (s.hidden = s.id !== id));
    document.body.className = dark ? "dark" : "light";
    document.querySelector('meta[name="theme-color"]').content = dark ? "#0f151b" : "#eef2f4";
    window.scrollTo(0, 0);
    if (id === "home") centerWheel(state.players, false);
  }

  /* ---------- Langue ---------- */
  function applyLang() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll("[data-i18n]").forEach((e) => (e.textContent = t(e.dataset.i18n)));
    document.querySelectorAll(".lang").forEach((b) => b.classList.toggle("active", b.dataset.lang === state.lang));
    renderThemes();
    if (state.game) $("#player-name").textContent = t("player").replace("{n}", state.game.current + 1);
  }

  /* ---------- Thèmes ---------- */
  function renderThemes() {
    const keys = [...new Set(state.rows.map((r) => r.theme))];
    const box = $("#themes");
    box.innerHTML = "";
    keys.forEach((k) => {
      const b = document.createElement("button");
      b.className = "theme" + (state.themes.has(k) ? " on" : "");
      b.textContent = t("themeNames")[k] || k;
      b.setAttribute("aria-pressed", state.themes.has(k));
      b.onclick = () => {
        state.themes.has(k) ? state.themes.delete(k) : state.themes.add(k);
        renderThemes();
      };
      box.appendChild(b);
    });
    $("#start").disabled = state.themes.size === 0;
  }

  /* ---------- Wheel picker ---------- */
  function buildWheel() {
    const w = $("#wheel");
    for (let n = MIN_P; n <= MAX_P; n++) {
      const b = document.createElement("button");
      b.className = "wheel-item";
      b.textContent = n;
      b.dataset.n = n;
      b.onclick = () => centerWheel(n, true);
      w.appendChild(b);
    }
    let raf;
    w.addEventListener("scroll", () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const n = MIN_P + Math.round(w.scrollLeft / ITEM_W);
        setPlayers(Math.min(MAX_P, Math.max(MIN_P, n)));
      });
    }, { passive: true });
  }
  function setPlayers(n) {
    state.players = n;
    document.querySelectorAll(".wheel-item").forEach((e) => e.classList.toggle("active", +e.dataset.n === n));
  }
  function centerWheel(n, smooth) {
    setPlayers(n);
    $("#wheel").scrollTo({ left: (n - MIN_P) * ITEM_W, behavior: smooth ? "smooth" : "auto" });
  }

  /* ---------- Partie ---------- */
  function startGame() {
    const pool = state.rows.filter((r) => state.themes.has(r.theme));
    const pair = pool[Math.floor(Math.random() * pool.length)];
    const words = [pair[state.lang + "_1"], pair[state.lang + "_2"]];
    if (Math.random() < 0.5) words.reverse();
    state.game = {
      civil: words[0], spy: words[1],
      spyIndex: Math.floor(Math.random() * state.players),
      current: 0
    };
    showPlayer();
  }
  function showPlayer() {
    $("#player-name").textContent = t("player").replace("{n}", state.game.current + 1);
    show("player", true);
  }
  function showWord() {
    const g = state.game;
    $("#word-text").textContent = g.current === g.spyIndex ? g.spy : g.civil;
    show("word", true);
  }
  function next() {
    state.game.current++;
    if (state.game.current >= state.players) show("end", false);
    else showPlayer();
  }

  /* ---------- Init ---------- */
  async function init() {
    buildWheel();
    document.querySelectorAll(".lang").forEach((b) => (b.onclick = () => {
      state.lang = b.dataset.lang;
      localStorage.setItem("uc-lang", state.lang);
      applyLang();
    }));
    $("#start").onclick = startGame;
    $("#see").onclick = showWord;
    $("#next").onclick = next;
    $("#replay").onclick = startGame;
    $("#back").onclick = () => { state.game = null; show("home", false); };

    try { state.rows = await loadCSV(); }
    catch { const e = $("#error"); e.hidden = false; e.textContent = t("loadError"); }
    applyLang();
    show("home", false);
  }
  init();
})();
