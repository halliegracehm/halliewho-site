/* Flamie's Leafy Games: shared art, sounds, voice, stars and the win screen. */
(function () {
  const INK = "#4A2A1B";
  const S = `stroke="${INK}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;
  const svg = (inner, vb = "0 0 100 100") => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;

  // ---------- Art, hand-drawn style with dark brown ink lines like the book ----------
  const ART = {
    leaf: (c = "#F08A24") => svg(`<path d="M50 8C80 24 88 56 50 90C12 56 20 24 50 8Z" fill="${c}" ${S}/><path d="M50 22V96M50 46l-14-10M50 46l14-10M50 64l-16-10M50 64l16-10" fill="none" ${S} stroke-width="2.5"/>`),
    maple: (c = "#C7364F") => svg(`<path d="M50 6l9 20 15-8-4 19 20-2-12 16 14 10-22 4 3 15-23-12-23 12 3-15-22-4 14-10-12-16 20 2-4-19 15 8z" fill="${c}" ${S}/><path d="M50 30v66" fill="none" ${S} stroke-width="2.5"/>`),
    acorn: () => svg(`<path d="M28 46h44c0 26-10 44-22 46C38 90 28 72 28 46Z" fill="#C98A4B" ${S}/><path d="M22 46c0-14 12-22 28-22s28 8 28 22Z" fill="#7A4A2B" ${S}/><path d="M50 24v-12" fill="none" ${S}/><path d="M36 58c2 10 6 18 12 22" fill="none" stroke="#fff" stroke-width="3" opacity=".5" stroke-linecap="round"/>`),
    mushroom: () => svg(`<path d="M40 56h20l4 32H36Z" fill="#FFF3DC" ${S}/><path d="M10 58C10 30 28 14 50 14s40 16 40 44Z" fill="#C7364F" ${S}/><circle cx="34" cy="36" r="6" fill="#fff"/><circle cx="58" cy="28" r="5" fill="#fff"/><circle cx="70" cy="46" r="6" fill="#fff"/><circle cx="46" cy="48" r="4" fill="#fff"/>`),
    rock: () => svg(`<path d="M14 78c-6-18 6-38 24-44 10-14 34-12 42 4 14 6 16 30 6 40Z" fill="#A9A3B5" ${S}/><path d="M34 52c6-4 14-4 18 0M58 64c6-2 12 0 14 4" fill="none" ${S} stroke-width="2.5" opacity=".6"/>`),
    pinecone: () => svg(`<path d="M50 10C70 24 76 52 66 76 60 90 40 90 34 76 24 52 30 24 50 10Z" fill="#9A5B33" ${S}/><path d="M38 34c8 6 16 6 24 0M34 50c10 7 22 7 32 0M34 66c10 7 22 7 32 0" fill="none" ${S} stroke-width="2.5"/>`),
    flower: (c = "#E9839A") => svg(`<path d="M50 60v34" ${S} fill="none" stroke="#4E8F2A"/><g fill="${c}" ${S}><circle cx="50" cy="20" r="14"/><circle cx="72" cy="36" r="14"/><circle cx="64" cy="60" r="14"/><circle cx="36" cy="60" r="14"/><circle cx="28" cy="36" r="14"/></g><circle cx="50" cy="42" r="12" fill="#FFE066" ${S}/>`),
    apple: () => svg(`<path d="M50 30c-14-10-38-4-38 22 0 22 16 40 28 40 5 0 7-3 10-3s5 3 10 3c12 0 28-18 28-40 0-26-24-32-38-22Z" fill="#C7364F" ${S}/><path d="M50 30c0-10 2-16 6-20" fill="none" ${S}/><path d="M56 18c8-8 18-8 22-4-6 8-14 10-22 4Z" fill="#7CC243" ${S}/>`),
    feather: () => svg(`<path d="M24 86C20 50 46 18 82 12 84 46 62 78 24 86Z" fill="#8FD3F4" ${S}/><path d="M18 92 70 26" fill="none" ${S} stroke-width="2.5"/>`),
    sun: () => svg(`<g ${S} fill="none" stroke="#F08A24"><path d="M50 6v12M50 82v12M6 50h12M82 50h12M19 19l8 8M73 73l8 8M19 81l8-8M73 27l8-8"/></g><circle cx="50" cy="50" r="22" fill="#FFE066" ${S}/>`),
    // Little friends
    bunny: () => svg(`<ellipse cx="38" cy="28" rx="8" ry="22" fill="#F4F1F6" ${S}/><ellipse cx="62" cy="28" rx="8" ry="22" fill="#F4F1F6" ${S}/><ellipse cx="38" cy="30" rx="3" ry="14" fill="#E9839A"/><ellipse cx="62" cy="30" rx="3" ry="14" fill="#E9839A"/><circle cx="50" cy="64" r="28" fill="#F4F1F6" ${S}/><circle cx="40" cy="60" r="4" fill="${INK}"/><circle cx="60" cy="60" r="4" fill="${INK}"/><path d="M46 70h8l-4 4z" fill="#E9839A" ${S} stroke-width="2"/><circle cx="32" cy="72" r="5" fill="#E9839A" opacity=".5"/><circle cx="68" cy="72" r="5" fill="#E9839A" opacity=".5"/>`),
    hedgehog: () => svg(`<path d="M10 78C8 42 30 22 56 24c20 2 34 18 34 40v14Z" fill="#8A5A3F" ${S}/><path d="M18 44l-8-6M28 32l-4-10M42 26l0-12M58 26l6-10M72 32l10-6M84 46l10-2" fill="none" ${S}/><path d="M50 52c20 0 36 10 40 26H40c-4-16 0-26 10-26Z" fill="#F6DDB8" ${S}/><circle cx="64" cy="62" r="4" fill="${INK}"/><circle cx="90" cy="74" r="5" fill="${INK}"/><circle cx="58" cy="70" r="5" fill="#E9839A" opacity=".5"/>`),
    squirrel: () => svg(`<path d="M68 90C96 80 96 40 80 26 70 16 56 22 62 34c10 4 16 20 6 34Z" fill="#D9792E" ${S}/><circle cx="40" cy="62" r="24" fill="#E8913E" ${S}/><path d="M24 44l-4-16 14 8M48 40l6-14 6 16" fill="#E8913E" ${S}/><ellipse cx="38" cy="70" rx="12" ry="9" fill="#FBE3C4"/><circle cx="32" cy="58" r="4" fill="${INK}"/><circle cx="50" cy="58" r="4" fill="${INK}"/><circle cx="41" cy="67" r="3" fill="${INK}"/>`),
    frog: () => svg(`<circle cx="32" cy="34" r="14" fill="#7CC243" ${S}/><circle cx="68" cy="34" r="14" fill="#7CC243" ${S}/><ellipse cx="50" cy="64" rx="38" ry="26" fill="#7CC243" ${S}/><circle cx="32" cy="34" r="6" fill="#fff"/><circle cx="68" cy="34" r="6" fill="#fff"/><circle cx="33" cy="35" r="3.5" fill="${INK}"/><circle cx="67" cy="35" r="3.5" fill="${INK}"/><path d="M34 66c10 8 22 8 32 0" fill="none" ${S}/><circle cx="24" cy="60" r="5" fill="#E9839A" opacity=".5"/><circle cx="76" cy="60" r="5" fill="#E9839A" opacity=".5"/>`),
    ladybug: () => svg(`<circle cx="50" cy="28" r="14" fill="${INK}"/><circle cx="50" cy="58" r="32" fill="#C7364F" ${S}/><path d="M50 28v62" ${S} fill="none"/><circle cx="36" cy="50" r="6" fill="${INK}"/><circle cx="64" cy="50" r="6" fill="${INK}"/><circle cx="34" cy="72" r="5" fill="${INK}"/><circle cx="66" cy="72" r="5" fill="${INK}"/><circle cx="44" cy="24" r="3" fill="#fff"/><circle cx="56" cy="24" r="3" fill="#fff"/>`),
    snail: () => svg(`<path d="M8 84c0-10 8-14 16-14h52c8 0 12 6 12 14Z" fill="#F6DDB8" ${S}/><path d="M78 72V40M88 72V44" fill="none" ${S}/><circle cx="78" cy="38" r="5" fill="${INK}"/><circle cx="88" cy="42" r="5" fill="${INK}"/><circle cx="46" cy="52" r="28" fill="#E9A54B" ${S}/><path d="M46 52c0-6 8-6 8 0 0 10-16 10-16 0 0-14 24-14 24 0" fill="none" ${S}/>`),
    butterfly: () => svg(`<path d="M50 50C30 14 6 20 10 40s24 14 40 10ZM50 50C70 14 94 20 90 40S66 54 50 50ZM50 52C34 60 18 76 30 86s20-14 20-34ZM50 52c16 8 32 24 20 34S50 72 50 52Z" fill="#8E6BC7" ${S}/><path d="M50 30v52" ${S} fill="none"/><circle cx="26" cy="36" r="6" fill="#FFE066"/><circle cx="74" cy="36" r="6" fill="#FFE066"/>`),
    // Icons
    star: () => svg(`<path d="M50 6l13 28 30 3-23 20 7 30-27-16-27 16 7-30L7 37l30-3z" fill="#FFE066" ${S}/>`),
    speaker: () => svg(`<path d="M14 38h16l22-18v60L30 62H14Z" fill="#5B3523"/><path d="M66 34c8 8 8 24 0 32M76 24c14 14 14 38 0 52" fill="none" stroke="#5B3523" stroke-width="7" stroke-linecap="round"/>`),
    mute: () => svg(`<path d="M14 38h16l22-18v60L30 62H14Z" fill="#5B3523"/><path d="M64 38l24 24M88 38 64 62" fill="none" stroke="#5B3523" stroke-width="7" stroke-linecap="round"/>`),
  };

  // Shapes for the shape games
  const SHAPES = {
    circle: (f, s) => `<circle cx="50" cy="50" r="38" ${f} ${s}/>`,
    square: (f, s) => `<rect x="14" y="14" width="72" height="72" rx="6" ${f} ${s}/>`,
    triangle: (f, s) => `<path d="M50 10 90 84H10Z" ${f} ${s}/>`,
    star: (f, s) => `<path d="M50 6l13 28 30 3-23 20 7 30-27-16-27 16 7-30L7 37l30-3z" ${f} ${s}/>`,
    heart: (f, s) => `<path d="M50 88C20 66 6 50 6 32 6 18 18 8 30 8c9 0 16 5 20 13 4-8 11-13 20-13 12 0 24 10 24 24 0 18-14 34-44 56Z" ${f} ${s}/>`,
    rectangle: (f, s) => `<rect x="6" y="26" width="88" height="48" rx="6" ${f} ${s}/>`,
    oval: (f, s) => `<ellipse cx="50" cy="50" rx="44" ry="28" ${f} ${s}/>`,
    diamond: (f, s) => `<path d="M50 6 88 50 50 94 12 50Z" ${f} ${s}/>`,
    hexagon: (f, s) => `<path d="M28 12h44l22 38-22 38H28L6 50Z" ${f} ${s}/>`,
  };
  const shape = (name, color) => svg(SHAPES[name](`fill="${color}"`, S));
  const outline = (name) => svg(SHAPES[name](`fill="rgba(91,53,35,.08)"`, `stroke="#8A5A3F" stroke-width="3.5" stroke-dasharray="8 7" stroke-linejoin="round"`));

  // ---------- Storage that never breaks the page ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };

  // ---------- Sound ----------
  let muted = store.get("flamie-muted", false);
  let ctx = null;
  function tone(freq, start, dur, type = "sine", vol = .18) {
    if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    const t = ctx.currentTime + start;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + .02);
    g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + dur + .05);
  }
  function play(kind) {
    if (muted) return;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
    } catch (e) { return; }
    if (kind === "good") { tone(660, 0, .18); tone(880, .1, .25); }
    else if (kind === "bad") { tone(220, 0, .22, "triangle", .12); }
    else if (kind === "pop") { tone(520 + Math.random() * 200, 0, .12, "sine", .14); }
    else if (kind === "win") { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .13, .3)); }
  }

  // ---------- Voice, so little ones who can't read yet can play ----------
  function say(text, lang = "en-US") {
    if (muted || !("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang; u.rate = .9; u.pitch = 1.15;
      const v = speechSynthesis.getVoices().find((x) => x.lang && x.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  // ---------- Stars collected across every game ----------
  function renderStars() {
    const el = document.getElementById("stars");
    if (el) el.innerHTML = `${ART.star()}<span>${store.get("flamie-stars", 0)}</span>`;
  }
  function addStar(n = 1) {
    store.set("flamie-stars", store.get("flamie-stars", 0) + n);
    renderStars();
    const el = document.getElementById("stars");
    if (el) { el.classList.remove("bounce"); void el.offsetWidth; el.classList.add("bounce"); }
  }

  function renderMute() {
    const b = document.getElementById("mute");
    if (!b) return;
    b.innerHTML = muted ? ART.mute() : ART.speaker();
    b.setAttribute("aria-label", muted ? "Turn sound on" : "Turn sound off");
  }

  // ---------- Celebrations ----------
  const LEAF_COLORS = ["#F08A24", "#C7364F", "#FFE066", "#7CC243", "#E9839A"];
  function confetti(n = 26) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = document.createElement("div");
    box.className = "confetti";
    for (let i = 0; i < n; i++) {
      const c = LEAF_COLORS[i % LEAF_COLORS.length];
      box.insertAdjacentHTML("beforeend", i % 2 ? ART.leaf(c) : ART.maple(c));
      const s = box.lastElementChild;
      s.style.left = Math.random() * 100 + "vw";
      s.style.animationDelay = Math.random() * .6 + "s";
      s.style.animationDuration = 1.8 + Math.random() * 1.2 + "s";
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3600);
  }

  function win({ title = "You did it!", text = "", again }) {
    let w = document.getElementById("win");
    if (!w) {
      w = document.createElement("div");
      w.id = "win"; w.className = "win"; w.setAttribute("role", "dialog"); w.setAttribute("aria-modal", "true");
      document.body.appendChild(w);
    }
    w.innerHTML = `<div class="card"><div class="flamie"></div><h2>${title}</h2><p>${text}</p>
      <div class="row"><button class="btn" id="play-again">Play again</button><a class="btn alt" href="../">More games</a></div></div>`;
    w.classList.add("show");
    play("win"); confetti(); addStar(3);
    say(title);
    const b = w.querySelector("#play-again");
    b.focus();
    b.onclick = () => { w.classList.remove("show"); again && again(); };
  }

  function drift(n = 7) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = document.createElement("div");
    box.className = "drift";
    for (let i = 0; i < n; i++) {
      const c = LEAF_COLORS[i % LEAF_COLORS.length];
      box.insertAdjacentHTML("beforeend", i % 2 ? ART.maple(c) : ART.leaf(c));
      const s = box.lastElementChild;
      s.style.left = (i / n) * 100 + Math.random() * 8 + "vw";
      s.style.animationDuration = 14 + Math.random() * 10 + "s";
      s.style.animationDelay = -Math.random() * 20 + "s";
    }
    document.body.prepend(box);
  }

  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  window.Kit = { ART, SHAPES, shape, outline, svg, store, play, say, addStar, win, confetti, shuffle, pick, LEAF_COLORS,
    isMuted: () => muted };

  document.addEventListener("DOMContentLoaded", () => {
    drift(); renderStars(); renderMute();
    const b = document.getElementById("mute");
    if (b) b.onclick = () => {
      muted = !muted; store.set("flamie-muted", muted); renderMute();
      if (muted && "speechSynthesis" in window) speechSynthesis.cancel(); else play("pop");
    };
  });
})();

// Leaf progress row: Kit.progress(el, total) returns a function to set how many are earned.
Kit.progress = function (el, total) {
  el.innerHTML = Array.from({ length: total }, (_, i) => (i % 2 ? Kit.ART.leaf(Kit.LEAF_COLORS[i % 5]) : Kit.ART.maple(Kit.LEAF_COLORS[i % 5]))).join("");
  el.setAttribute("role", "img");
  el.classList.toggle("many", total > 10);
  return (n) => {
    [...el.children].forEach((s, i) => s.classList.toggle("on", i < n));
    el.setAttribute("aria-label", `${n} of ${total} leaves`);
  };
};
