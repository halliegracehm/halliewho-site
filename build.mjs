// Builds the whole site into dist/. Run: node build.mjs
// No dependencies. Vercel runs this automatically on every push.
import fs from "node:fs";
import path from "node:path";
import cfg from "./site.config.mjs";

const quizzes = JSON.parse(fs.readFileSync("content/quizzes.json", "utf8"));
const extras = JSON.parse(fs.readFileSync("content/extras.json", "utf8"));
const EPISODES = JSON.parse(fs.readFileSync("content/episodes.json", "utf8")).sort((a, b) => b.date.localeCompare(a.date));
const OUT = "dist";
const today = new Date().toISOString().slice(0, 10);

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const slugify = (s) => s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const clip = (s, n = 155) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(" ", n - 1)) + "...");
const or = (url) => url || cfg.linksHub;

// ---------- model ----------
const QUIZ = quizzes.map((q) => {
  const x = extras.quizzes[q.id];
  const types = {};
  for (const [k, t] of Object.entries(q.types)) {
    const slug = slugify(t.title.replace(/^The /, "the "));
    types[k] = { ...t, key: k, slug, page: `patterns/${slug}/`, prompts: extras.prompts[`${q.id}:${k}`] || [] };
  }
  return { ...q, ...x, page: `find-your-pattern/${x.slug}/`, types };
});
const PATTERNS = QUIZ.flatMap((q) => Object.values(q.types).map((t) => ({ ...t, quiz: q })));
{
  const seen = new Set();
  for (const p of PATTERNS) { if (seen.has(p.slug)) throw new Error("Duplicate slug " + p.slug); seen.add(p.slug); }
}
const quizKind = (q) => q.types[Object.keys(q.types)[0]].badge.replace(/^Your /, "").replace(/^What you learned$/, "childhood love pattern");

// ---------- share images ----------
// Each page gets a card: the text drawn on its share image and Pinterest pin.
// Images live in assets/og/<key>.jpg (1200x630) and assets/pins/<key>.jpg (1000x1500).
// Make new ones after adding pages: node build.mjs && python3 tools/make-images.py
const cardKey = (page) => slugify(page) || "home";
const CARDS = {};
const card = (page, kicker, title, sub) => { CARDS[page] = { page, key: cardKey(page), kicker, title, sub }; };
card("", "Hallie Who", "These aren't personality tests. They're mirrors.", "Free quizzes and journals for the patterns you carry");
card("find-your-pattern/", "Free quizzes", "Find your pattern", "Six quizzes. One honest look at how you connect.");
card("patterns/", "Hallie Who", "Every pattern, in one place", "The patterns we carry, and what to do with them");
card("shop/", "Innershelf Studio", "Printable journals and art prints", "Small, honest tools for the patterns you carry");
card("journal/", "Pages for You", "A 30-day journal written only for you", "Around what you're carrying right now");
card("podcast/", "My Inner Mind podcast", "Honest conversations about the patterns we carry", "New episodes from Hallie Who");
card("walk-with-me/", "Free 21-day challenge", "Walk with me.", "20 minutes a day. One honest question to carry with you.");
card("talk-with-hallie/", "Talk with Hallie", "Sometimes you just need someone to talk it through with", "Phone calls, walk and talks, and accountability");
card("work-with-me/", "Work with Hallie", "Quiz funnels and lead magnets for creators", "Done for you, built to grow your list");
card("books/", "Books", "Books by Hallie Who", "A picture book and a memoir on the way");
for (const q of QUIZ) card(q.page, "Free quiz", q.title, q.sub);
for (const p of PATTERNS) card(p.page, p.badge, p.title, "Take the quiz: " + p.quiz.title);
for (const e of EPISODES) card(`podcast/${e.slug}/`, "My Inner Mind podcast", e.title, "Listen on YouTube");
const hasImg = (dir, key) => fs.existsSync(`assets/${dir}/${key}.jpg`);
const ogFor = (page) => {
  const key = cardKey(page === "/" ? "" : page);
  return cfg.siteUrl + "/assets/og/" + (hasImg("og", key) ? key : "home") + ".jpg";
};

// ---------- layout ----------
function rel(from, to) {
  if (from === "/") return "/" + to;
  const depth = from.split("/").filter(Boolean).length;
  return "../".repeat(depth) + to;
}

const NAV = [
  ["find-your-pattern/", "Quizzes"],
  ["patterns/", "Patterns"],
  ["shop/", "Shop"],
  ["podcast/", "Podcast"],
  ["books/", "Books"],
  ["talk-with-hallie/", "Talk with me"],
  ["work-with-me/", "Work with me"],
];

function layout({ page, title, description, body, jsonld = [], scripts = "", ogType = "website" }) {
  const r = (to) => rel(page, to);
  const canonical = cfg.siteUrl + "/" + (page === "/" ? "404.html" : page);
  const nav = NAV.map(([href, label]) => `<a href="${r(href)}"${page === href ? ' aria-current="page"' : ""}>${label}</a>`).join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="${esc(cfg.siteName)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogFor(page)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${ogFor(page)}">
<link rel="alternate" type="application/rss+xml" title="Hallie Who" href="${cfg.siteUrl}/pins.xml">
<meta name="theme-color" content="#F3EEF8">
<link rel="icon" href="${r("assets/favicon.svg")}" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${r("assets/style.css")}">
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join("\n")}
</head>
<body>
<div class="sheet">
<div class="inner">
<header class="site-head">
  <a class="wordmark" href="${r("") || "./"}">Hallie Who</a>
  <nav class="nav" aria-label="Main">${nav}</nav>
</header>
<main>
${body}
</main>
<footer class="site-foot">
  <a class="wordmark" href="${r("") || "./"}">Hallie Who</a>
  <p>${esc(cfg.tagline)}</p>
  <nav class="nav" aria-label="Footer">
    ${nav}
    <a href="${or(cfg.appStoreUrl)}">My Inner Mind app</a>
    <a href="${or(cfg.podcastUrl)}">My Inner Mind podcast</a>
    ${cfg.instagramUrl ? `<a href="${cfg.instagramUrl}">Instagram</a>` : ""}
    ${cfg.podcastInstagramUrl ? `<a href="${cfg.podcastInstagramUrl}">Podcast Instagram</a>` : ""}
    <a href="${cfg.linksHub}">All links</a>
  </nav>
  <p style="margin-top:14px"><a href="${r("support/")}">Support</a> · <a href="${r("terms-of-use/")}">Terms</a> · <a href="${r("privacy-policy/")}">Privacy</a></p>
  <p style="margin-top:8px">Made in Alabama. These quizzes are for reflection, not diagnosis.</p>
</footer>
</div>
</div>
${scripts}
<script>window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };</script>
<script defer src="/_vercel/insights/script.js"></script>
</body>
</html>`;
}

function write(page, html) {
  const file = path.join(OUT, page, page.endsWith(".html") || page.endsWith(".xml") || page.endsWith(".txt") || page.endsWith(".json") ? "" : "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

const crumbs = (items) => ({
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: items.map(([name, page], i) => ({ "@type": "ListItem", position: i + 1, name, item: cfg.siteUrl + "/" + page })),
});

const journalOffer = (r, heading, text, ref, secondary = "") => `
<div class="offer">
  <h3>${esc(heading)}</h3>
  <p>${esc(text)}</p>
  <div class="actions">
    <a class="btn" href="${cfg.journalUrl}?ref=${ref}">Get my journal, ${cfg.journalPrice}</a>
    ${secondary}
  </div>
</div>`;

// Etsy picks for a result: its matched printable, plus the seasonal one.
function picksFor(qid, key) {
  const out = [];
  const main = cfg.products[cfg.picks[`${qid}:${key}`]];
  if (main) out.push(main);
  const season = cfg.seasonalPick && cfg.products[cfg.seasonalPick];
  if (season && season !== main) out.push(season);
  return out;
}
const pickCards = (list) => `<div class="picks">${list.map((x) => `
  <a class="pick" href="${x.url}">
    ${x.img ? `<img class="pick-img" src="${x.img}" alt="${esc(x.name)}" loading="lazy" width="794" height="635">` : ""}
    <span class="pick-name">${esc(x.name)}</span>
    <span class="pick-why">${esc(x.why)}</span>
    <span class="pick-foot"><span class="pick-price">${esc(x.price)}</span><span class="pick-go">See it on Etsy</span></span>
  </a>`).join("")}</div>`;

// ---------- pages ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync("assets", path.join(OUT, "assets"), { recursive: true });
// Flamie's Leafy Games: plain HTML pages, copied as they are.
fs.cpSync("games", path.join(OUT, "games"), { recursive: true });

// Home
{
  const page = "";
  const r = (to) => rel(page, to) || "./";
  const toc = QUIZ.map((q) => `<li><a href="${q.page}"><span class="q">${esc(q.title)}</span><span class="s">${esc(q.sub)}</span></a></li>`).join("");
  write(page, layout({
    page,
    title: "Hallie Who | Honest quizzes and journals for the patterns you carry",
    description: "Free relationship and self-awareness quizzes from Hallie Who. Find your connection style, conflict style, and the patterns you learned growing up, then keep going with a journal made for you.",
    jsonld: [{ "@context": "https://schema.org", "@type": "WebSite", name: cfg.siteName, url: cfg.siteUrl + "/" },
             { "@context": "https://schema.org", "@type": "Person", name: "Hallie Who", url: cfg.siteUrl + "/", description: cfg.tagline }],
    body: `
<section class="hero first">
  <h1>These aren't personality tests. They're mirrors.</h1>
  <p class="lede measure">I spent a long time not understanding why relationships felt harder for me than they seemed to be for everyone else. Then I started paying attention to the patterns. Not just in other people. In myself. Pick one and see what comes up.</p>
  <ol class="toc measure" aria-label="Quizzes">${toc}</ol>
</section>

<section>
  <div class="about">
  <figure class="portrait">
    <img src="assets/hallie.jpg" alt="Hallie smiling with her arms crossed, wearing a lavender shirt" width="692" height="1000" loading="lazy">
    <figcaption>Photo by Haley Cleckler</figcaption>
  </figure>
  <div class="measure">
    <h2>Hi, I'm Hallie.</h2>
    <p class="body-serif">I built this space because I spent a long time looking for someone who understood, and I couldn't find her, so I decided to become her for someone else.</p>
    <p style="margin-top:16px">I'm an adopted kid from a big Alabama family, and I learned the hard way that understanding your patterns changes everything. No therapy-speak. No "cut everyone off" energy. Just honest questions and a place to sit with the answers.</p>
    <div class="actions"><a class="btn ghost" href="${r("talk-with-hallie/")}">Talk with me</a></div>
  </div>
  </div>
</section>

<section>
  <div class="pair">
    <div class="note">
      <h3>My Inner Mind</h3>
      <p>The app gives you a private place to journal and check in with yourself. The podcast is me, talking through these patterns out loud with the people I love.</p>
      <div class="actions"><a class="btn" href="${or(cfg.appStoreUrl)}">Get the app</a><a class="btn ghost" href="${or(cfg.podcastUrl)}">Listen to the podcast</a></div>
    </div>
    <div class="note">
      <h3>Pages for You</h3>
      <p>A 30-day journal written only for you, around what you're carrying right now. ${cfg.journalPrice}, delivered to your inbox.</p>
      <div class="actions"><a class="btn" href="${r("journal/")}">See the journal</a></div>
    </div>
  </div>
</section>

<section>
  <div class="about">
    <figure class="portrait"><img src="assets/walk-trail.jpg" alt="Hallie smiling on a wooded trail" loading="lazy"></figure>
    <div class="measure">
      <p class="kicker">Free ${cfg.walkChallenge.days}-day challenge</p>
      <h2>Walk with me.</h2>
      <p>${cfg.walkChallenge.minutes} minutes a day, one honest question to carry with you, wherever you are.</p>
      <div class="actions"><a class="btn" href="${r("walk-with-me/")}">Join the challenge</a></div>
    </div>
  </div>
</section>

<section>
  <div class="measure">
    <h2>From the shop</h2>
    <p>Printable journals and art prints from Innershelfstudio, my Etsy shop.</p>
    ${pickCards(cfg.homeShop.map((k) => cfg.products[k]).filter(Boolean))}
    <div class="art-strip">${cfg.artPrints.slice(0, 4).map((x) => `<a href="${r("shop/")}#art"><img src="${x.img}" alt="${esc(x.name)}, art print" loading="lazy"></a>`).join("")}</div>
    <div class="actions"><a class="btn ghost" href="${r("shop/")}">Visit the shop</a></div>
  </div>
</section>

<section>
  <div class="measure">
    <h2>Building something for your own audience?</h2>
    <p>I build quiz funnels, lead magnet pages, and Instagram DM automations for creators and small businesses. The quizzes on this site are the demo.</p>
    <div class="actions"><a class="btn ghost" href="${r("work-with-me/")}">See what I offer</a></div>
  </div>
</section>`,
  }));
}

// Quiz hub
{
  const page = "find-your-pattern/";
  const toc = QUIZ.map((q) => `<li><a href="${rel(page, q.page)}"><span class="q">${esc(q.title)}</span><span class="s">${esc(q.sub)}</span></a></li>`).join("");
  write(page, layout({
    page,
    title: "Find Your Pattern: 6 Free Relationship and Self-Awareness Quizzes | Hallie Who",
    description: "Six free quizzes on connection style, conflict style, childhood love patterns, emotional availability, friendship, and emotional intelligence. Ten honest questions each.",
    jsonld: [crumbs([["Home", ""], ["Find your pattern", page]])],
    body: `
<section class="first">
  <h1>Find your pattern</h1>
  <p class="lede measure">Six quizzes. One honest look at how you connect. Each one is ten questions and takes about three minutes.</p>
  <ol class="toc measure">${toc}</ol>
  <p class="small measure" style="margin-top:24px">Already know your result? <a href="${rel(page, "patterns/")}">Browse every pattern</a>.</p>
</section>`,
  }));
}

// Each quiz
for (const q of QUIZ) {
  const page = q.page;
  const types = {};
  for (const [k, t] of Object.entries(q.types)) {
    types[k] = { badge: t.badge, title: t.title, body: t.body, l1: t.l1, t1: t.t1, l2: t.l2, t2: t.t2, slug: t.slug, url: rel(page, t.page), picks: picksFor(q.id, k), pin: hasImg("pins", cardKey(t.page)) ? cfg.siteUrl + "/assets/pins/" + cardKey(t.page) + ".jpg" : "" };
  }
  const data = {
    qs: q.qs, types, mailchimp: cfg.mailchimp, journalUrl: cfg.journalUrl, journalPrice: cfg.journalPrice,
    hubUrl: rel(page, "find-your-pattern/"),
    share: { url: cfg.siteUrl + "/" + page, quiz: q.title },
  };
  const results = Object.values(q.types).map((t) => `<li><a href="${rel(page, t.page)}">${esc(t.title)}</a></li>`).join("");
  write(page, layout({
    page,
    title: `${q.seoTitle} | Hallie Who`,
    description: clip(q.intro),
    jsonld: [crumbs([["Home", ""], ["Find your pattern", "find-your-pattern/"], [q.title, page]])],
    body: `
<section class="first">
  <div class="measure">
    <h1>${esc(q.title)}</h1>
    <p class="lede">${esc(q.intro)}</p>
    <div id="quiz" class="quiz" aria-live="polite">
      <div class="actions"><button type="button" class="btn" id="start-quiz">Start the quiz</button></div>
      <p class="small" style="margin-top:12px">10 questions. Go with your first answer.</p>
    </div>
  </div>
</section>
<section>
  <div class="measure">
    <h2>The ${Object.keys(q.types).length} results</h2>
    <p>Curious before you start? Read about each one.</p>
    <ul class="related">${results}</ul>
  </div>
</section>
<script type="application/json" id="quiz-data">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`,
    scripts: `<script src="${rel(page, "assets/quiz.js")}"></script>`,
  }));
}

// Pattern index
{
  const page = "patterns/";
  const groups = QUIZ.map((q) => `
  <div class="pattern-group">
    <h3><a href="${rel(page, q.page)}">${esc(q.title)}</a></h3>
    <ul class="related">${Object.values(q.types).map((t) => `<li><a href="${rel(page, t.page)}">${esc(t.title)}</a></li>`).join("")}</ul>
  </div>`).join("");
  write(page, layout({
    page,
    title: "Every Pattern: Connection, Conflict, Love, and Friendship Patterns | Hallie Who",
    description: "Read about all 25 patterns from the Find Your Pattern quizzes, from The Overgiver to The Freezer, with journal prompts for each one.",
    jsonld: [crumbs([["Home", ""], ["Patterns", page]])],
    body: `
<section class="first">
  <div class="measure">
    <h1>Every pattern</h1>
    <p class="lede">All ${PATTERNS.length} results from the quizzes, each with what it looks like, what it costs, and three journal prompts to sit with.</p>
    ${groups}
  </div>
</section>`,
  }));
}

// Pattern pages
for (const p of PATTERNS) {
  const page = p.page;
  const q = p.quiz;
  const kind = quizKind(q);
  const siblings = Object.values(q.types).filter((t) => t.slug !== p.slug)
    .map((t) => `<li><a href="${rel(page, t.page)}">${esc(t.title)}</a></li>`).join("");
  const prompts = p.prompts.map((x) => `<li>${esc(x)}</li>`).join("");
  write(page, layout({
    page,
    title: `${p.title}: What This ${kind.replace(/\b\w/g, (c) => c.toUpperCase()).replace(/ Eq /, " EQ ")} Means for You | Hallie Who`,
    description: clip(p.body),
    jsonld: [
      crumbs([["Home", ""], ["Patterns", "patterns/"], [p.title, page]]),
      { "@context": "https://schema.org", "@type": "Article", headline: p.title, description: clip(p.body), author: { "@type": "Person", name: "Hallie Who" }, dateModified: today, mainEntityOfPage: cfg.siteUrl + "/" + page },
    ],
    body: `
<section class="first"><article>
  <div class="measure">
    <p class="kicker">A ${esc(kind)} from <a href="${rel(page, q.page)}">${esc(q.title)}</a></p>
    <h1 class="result-name">${esc(p.title)}</h1>
    <p class="body-serif">${esc(p.body)}</p>
    <div class="depth"><h2 style="font-size:28px;color:var(--violet)">${esc(p.l1)}</h2><p>${esc(p.t1)}</p></div>
    <div class="depth"><h2 style="font-size:28px;color:var(--violet)">${esc(p.l2)}</h2><p>${esc(p.t2)}</p></div>
    ${prompts ? `<div class="depth"><h2 style="font-size:28px">Three journal prompts for ${esc(p.title)}</h2><ul class="prompts">${prompts}</ul></div>` : ""}
    ${journalOffer(p, "Want thirty more?", "Pages for You is a 30-day journal written only for you, around what you're carrying right now. One page a day, at your own pace.", p.slug,
      `<a class="btn ghost" href="${rel(page, q.page)}">Take the quiz</a>`)}
    <div class="depth">
      <h2 style="font-size:28px">Or start small</h2>
      <p>Printables from my Etsy shop, Innershelfstudio, picked for ${esc(p.title)}. Instant download.</p>
      ${pickCards(picksFor(q.id, p.key))}
    </div>
  </div>
</article></section>
<section>
  <div class="measure">
    <h2>The other results in this quiz</h2>
    <ul class="related">${siblings}</ul>
  </div>
</section>`,
  }));
}

// Shop
{
  const page = "shop/";
  const all = Object.values(cfg.products);
  write(page, layout({
    page,
    title: "Shop: Printable Journals, Workbooks, and a Personalized Journal | Hallie Who",
    description: "Printable journals, gratitude pages, affirmations, a year in review workbook, and original art prints from Innershelfstudio, plus Pages for You, a 30-day journal written for you.",
    jsonld: [crumbs([["Home", ""], ["Shop", page]])],
    body: `
<section class="first">
  <div class="measure">
    <h1>Shop</h1>
    <p class="lede">Small, honest tools for the patterns you're working on, and art for the walls you look at every day. Everything is a digital download you can print at home.</p>
    ${journalOffer(null, "Pages for You", `A 30-day journal written only for you, around what you're carrying right now. ${cfg.journalPrice}.`, "shop",
      `<a class="btn ghost" href="${rel(page, "journal/")}">How it works</a>`)}
  </div>
</section>
<section>
  <div class="measure">
    <h2>Printables from Innershelfstudio</h2>
    <p>Sold through my Etsy shop. Instant download after checkout.</p>
    ${pickCards(all)}
  </div>
</section>
<section id="art">
  <div class="measure">
    <h2>Art prints</h2>
    <p>My paintings, as digital downloads you can print at any size. Sold through Etsy.</p>
  </div>
  <div class="art-grid">${cfg.artPrints.map((x) => `
    <a class="art" href="${x.url}">
      <img src="${x.img}" alt="${esc(x.name)}, art print by Hallie Who" loading="lazy">
      <span class="art-name">${esc(x.name)}</span>
      <span class="art-why">${esc(x.why)}</span>
    </a>`).join("")}</div>
  <div class="measure"><p style="margin-top:26px"><a href="${cfg.etsyShop}">See the whole shop on Etsy</a></p></div>
</section>
<section>
  <div class="measure">
    <h2>Not sure what you need?</h2>
    <p>Take a free quiz. Your result comes with a printable picked for your pattern.</p>
    <div class="actions"><a class="btn ghost" href="${rel(page, "find-your-pattern/")}">Find your pattern</a></div>
  </div>
</section>`,
  }));
}

// Journal
{
  const page = "journal/";
  write(page, layout({
    page,
    title: "Pages for You: A 30-Day Personalized Journal | Hallie Who",
    description: `A 30-day journal written only for you, around what you're carrying right now. ${cfg.journalPrice}, secure checkout.`,
    jsonld: [crumbs([["Home", ""], ["Journal", page]]),
      { "@context": "https://schema.org", "@type": "Product", name: "Pages for You: 30-Day Personalized Journal", description: "A 30-day journal written only for you.", brand: { "@type": "Brand", name: "Hallie Who" },
        offers: { "@type": "Offer", price: cfg.journalPrice.replace(/[^0-9.]/g, ""), priceCurrency: "USD", url: cfg.journalUrl, availability: "https://schema.org/InStock" } }],
    body: `
<section class="first">
  <div class="measure">
    <h1>Pages for You</h1>
    <p class="lede">A 30-day journal written only for you. You tell me a little about what you're carrying, and you get a month of prompts built around it.</p>
    <div class="actions"><a class="btn" href="${cfg.journalUrl}?ref=journal-page">Create my journal, ${cfg.journalPrice}</a></div>
    <p class="small" style="margin-top:12px">Secure payment through Stripe.</p>
  </div>
</section>
<section>
  <div class="measure">
    <h2>How it works</h2>
    <ol class="steps">
      <li>Answer a few short questions about where you are right now.</li>
      <li>Check out securely for ${cfg.journalPrice}.</li>
      <li>Your 30 days of prompts arrive, ready to print or write in.</li>
    </ol>
  </div>
</section>
<section>
  <div class="measure">
    <h2>Not sure where to start?</h2>
    <p>Take one of the quizzes first. Knowing your pattern makes the journal hit closer to home.</p>
    <div class="actions"><a class="btn ghost" href="${rel(page, "find-your-pattern/")}">Find your pattern</a></div>
  </div>
</section>`,
  }));
}

// Books
{
  const page = "books/";
  const books = cfg.books.map((bk) => `
  <div class="service">
    ${bk.cover ? `<img src="${rel(page, bk.cover)}" alt="Cover of ${esc(bk.title)}" width="900" height="900" style="width:min(320px,100%);height:auto;border-radius:6px;margin-bottom:18px;box-shadow:0 2px 14px rgba(42,23,54,.15)">` : ""}
    <div class="service-head"><h3>${esc(bk.title)}</h3><span class="price">${esc(bk.buyUrl ? bk.kind : bk.status)}</span></div>
    <p class="small">${esc(bk.kind)}</p>
    <p style="margin-top:8px">${esc(bk.blurb)}</p>
    <div class="actions" style="margin-top:16px">${bk.buyUrl
      ? `<a class="btn" href="${bk.buyUrl}">Buy the book</a>`
      : `<a class="btn ghost" href="${cfg.bookLaunchSignup}">Get notified when it's out</a>`}${bk.gamesUrl ? `<a class="btn ghost" href="${rel(page, bk.gamesUrl)}">Play Flamie's games</a>` : ""}</div>
  </div>`).join("");
  write(page, layout({
    page,
    title: "Books by Hallie Who: Underneath a Large Leafy Tree and What Are You",
    description: "Books by Hallie Who, including the children's picture book Underneath a Large Leafy Tree and the memoir What Are You.",
    jsonld: [crumbs([["Home", ""], ["Books", page]]),
      ...cfg.books.map((bk) => ({ "@context": "https://schema.org", "@type": "Book", name: bk.title, author: { "@type": "Person", name: "Hallie Who" }, description: bk.blurb }))],
    body: `
<section class="first">
  <div class="measure">
    <h1>Books</h1>
    <p class="lede">Stories for the little ones, and the one I needed to write for myself.</p>
  </div>
</section>
<section>
  <div class="measure">
    ${books}
  </div>
</section>`,
  }));
}


// Walk With Me challenge
{
  const page = "walk-with-me/";
  const w = cfg.walkChallenge;
  const days = w.prompts.map((t, i) => `<li><span class="day">Day ${i + 1}</span><span>${esc(t)}</span></li>`).join("");
  write(page, layout({
    page,
    title: `Walk With Me: A Free ${w.days}-Day Walking Challenge | Hallie Who`,
    description: `Join Hallie for a free ${w.days}-day walking challenge. ${w.minutes} minutes a day, one honest question to think about while you walk, wherever you are.`,
    jsonld: [crumbs([["Home", ""], ["Walk With Me", page]])],
    body: `
<section class="first">
  <div class="walk-hero">
    <div class="measure">
      <p class="kicker">Free challenge</p>
      <h1>Walk with me.</h1>
      <p class="lede">${w.days} days. ${w.minutes} minutes a day. One honest question to carry with you while you walk.</p>
      <p style="margin-top:16px">No gym, no tracker, no pace to keep. Just you, your own two feet, and a little room to think. Walk your street, a trail, a parking lot on your lunch break. I'll be walking too.</p>
      <form class="walk-form" id="walk-form">
        <label class="field"><span>Your email</span><input type="email" name="email" required autocomplete="email" placeholder="you@example.com"></label>
        <button class="btn" type="submit">Join the challenge</button>
      </form>
      <p class="small" id="walk-msg" role="status">Free. You can unsubscribe any time.</p>
    </div>
    <img class="walk-photo" src="${rel(page, "assets/walk-porch.jpg")}" alt="Hallie smiling on a wooden deck under a blue sky" width="800" height="1067">
  </div>
</section>
<section>
  <div class="measure">
    <h2>How it works</h2>
    <ol class="steps">
      <li><strong>Sign up</strong> with your email so I know you're walking with me.</li>
      <li><strong>Walk ${w.minutes} minutes</strong> a day, anywhere. Short on time? Ten counts.</li>
      <li><strong>Take the day's question</strong> with you. Don't solve it. Just let it walk alongside you.</li>
      <li><strong>Share if you want.</strong> Post a photo from your walk and tag <a href="${cfg.instagramUrl}">@halliewho_</a> so we can cheer each other on.</li>
    </ol>
  </div>
</section>
<section>
  <div class="measure">
    <h2>The ${w.days} questions</h2>
    <p>Bookmark this page. Each day, take the next one with you.</p>
    <ol class="walk-days">${days}</ol>
  </div>
</section>
<section>
  <div class="about">
    <figure class="portrait"><img src="${rel(page, "assets/walk-bridge.jpg")}" alt="Hallie on a footbridge on a wooded trail" loading="lazy"></figure>
    <div class="measure">
      <h2>Want to walk together for real?</h2>
      <p>Set It Down Saturdays are in-person community walks near Birmingham. And if you'd rather talk while you walk, book a <a href="${rel(page, "talk-with-hallie/")}">Walk &amp; Talk</a> with me, by phone or in person.</p>
      <div class="actions"><a class="btn ghost" href="${rel(page, "talk-with-hallie/")}">Book a Walk &amp; Talk</a></div>
    </div>
  </div>
</section>
<script>
(function () {
  var f = document.getElementById("walk-form"), msg = document.getElementById("walk-msg");
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var addr = f.email.value.trim(); if (!addr) return;
    try {
      var name = "mc-" + Date.now(), frame = document.createElement("iframe");
      frame.name = name; frame.style.display = "none"; document.body.appendChild(frame);
      var form = document.createElement("form"); form.action = ${JSON.stringify(cfg.mailchimp.action)}; form.method = "POST"; form.target = name; form.style.display = "none";
      var fields = { EMAIL: addr }; fields[${JSON.stringify(cfg.mailchimp.botField)}] = "";
      ${cfg.mailchimp.resultField ? `fields[${JSON.stringify(cfg.mailchimp.resultField)}] = ${JSON.stringify(w.signupLabel)};` : ""}
      for (var k in fields) { var i = document.createElement("input"); i.type = "hidden"; i.name = k; i.value = fields[k]; form.appendChild(i); }
      document.body.appendChild(form); form.submit();
    } catch (err) {}
    f.style.display = "none";
    msg.textContent = "You're in! Day 1 starts whenever you're ready. Scroll down for your first question.";
  });
})();
</script>`,
  }));
}

// Talk with Hallie
{
  const page = "talk-with-hallie/";
  const ask = (name) => `mailto:${cfg.contactEmail}?subject=${encodeURIComponent("Booking a " + name)}&body=${encodeURIComponent("Hi Hallie,\n\nI'd like to book a " + name + ".\n\nTimes that work for me:\n\nWhat I'd like to talk about (optional):\n")}`;
  const talks = cfg.talks.map((t) => `
  <div class="service${t.photo ? " has-photo" : ""}">
    ${t.photo ? `<img class="service-photo" src="${rel(page, t.photo)}" alt="Hallie" loading="lazy">` : ""}
    <div class="service-head"><h3>${esc(t.name)}</h3><span class="price">${esc(t.price)}</span></div>
    <p class="small">${esc(t.length)}</p>
    <p style="margin-top:8px">${esc(t.what)}</p>
    <div class="actions" style="margin-top:16px">${(t.bookings || []).length
      ? t.bookings.map((x, i) => `<a class="btn${i ? " ghost" : ""}" href="${x.url}">${esc(x.label)}</a>`).join("")
      : `<a class="btn ghost" href="${ask(t.name)}">Email to book</a>`}</div>
  </div>`).join("");
  write(page, layout({
    page,
    title: "Talk with Hallie: Phone Conversations, Walk and Talks, and Accountability | Hallie Who",
    description: "Book a conversation with Hallie: a 10 minute talk, a deep conversation, a walk and talk, or monthly accountability. Honest, down-to-earth support near Birmingham, Alabama, and by phone.",
    jsonld: [crumbs([["Home", ""], ["Talk with Hallie", page]])],
    body: `
<section class="first">
  <div class="measure">
    <h1>Talk with me</h1>
    <p class="lede">Sometimes you don't need advice from a stranger on the internet. You need someone to talk it through with you. That's what these are for.</p>
    <p style="margin-top:16px">${esc(cfg.talkHours)}. You pick the time that works when you book.</p>
  </div>
</section>
<section>
  <div class="measure">
    <h2>Ways we can talk</h2>
    ${talks}
  </div>
</section>
<section>
  <div class="measure">
    <h2>Before you book</h2>
    <p>These are conversations, not therapy, counseling, or crisis services. I'm not a licensed mental health professional. If you're in crisis or thinking about hurting yourself, call or text 988 to reach the Suicide and Crisis Lifeline, any time.</p>
    <p>Not ready to talk yet? <a href="${rel(page, "find-your-pattern/")}">Start with a quiz</a>, or join the free <a href="${rel(page, "walk-with-me/")}">Walk With Me challenge</a>.</p>
  </div>
</section>`,
  }));
}

// Work with me
{
  const page = "work-with-me/";
  const services = cfg.services.map((s) => `
  <div class="service">
    <div class="service-head"><h3>${esc(s.name)}</h3><span class="price">${esc(s.price)}</span></div>
    <p>${esc(s.what)}</p>
    <ul>${s.gets.map((g) => `<li>${esc(g)}</li>`).join("")}</ul>
  </div>`).join("");
  const mailto = `mailto:${cfg.contactEmail}?subject=${encodeURIComponent("Working with Hallie")}&body=${encodeURIComponent("Hi Hallie,\n\nWhat I'd like help with:\n\nMy business or page:\n\nWhen I'd like it done:\n")}`;
  write(page, layout({
    page,
    title: "Quiz Funnels and Email Capture, Done for You | Hallie Who",
    description: "Done-for-you quiz funnels, lead magnet pages, and Instagram DM automations for creators, coaches, and small businesses. Grow your email list without the tech headache.",
    jsonld: [crumbs([["Home", ""], ["Work with me", page]])],
    body: `
<section class="first">
  <div class="measure">
    <h1>Let your audience find you</h1>
    <p class="lede">I built the quizzes, email capture, and DM automations behind this site myself. I can build the same for you, so people join your list while you're busy doing everything else.</p>
    <div class="actions"><a class="btn" href="${mailto}">Email me about a project</a><a class="btn ghost" href="${rel(page, "find-your-pattern/")}">Try a live quiz</a></div>
  </div>
</section>
<section>
  <div class="measure">
    <h2>What I offer</h2>
    ${services}
  </div>
</section>
<section>
  <div class="measure">
    <h2>How it works</h2>
    <ol class="steps">
      <li>Email me what you want built and who it's for.</li>
      <li>I send a short plan and a fixed price. No hourly surprises.</li>
      <li>I build it, you review it, and we launch it together.</li>
    </ol>
    <div class="actions"><a class="btn" href="${mailto}">Email me about a project</a></div>
  </div>
</section>`,
  }));
}

// ---------- podcast ----------
// Episode data lives in content/episodes.json. Add a new episode at the top and push.
const SHOW = "My Inner Mind";
const epPage = (e) => `podcast/${e.slug}/`;
const longDate = (d) => new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const mins = (s) => `${Math.max(1, Math.round(s / 60))} min`;
const stamp = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const isoDur = (s) => `PT${Math.floor(s / 60)}M${s % 60}S`;
const seriesOf = (e) => (e.series && e.series !== SHOW ? e.series : "");

// Archive
{
  const page = "podcast/";
  const byYearMonth = {};
  for (const e of EPISODES) {
    const k = new Date(e.date + "T12:00:00Z").toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
    (byYearMonth[k] ||= []).push(e);
  }
  const groups = Object.entries(byYearMonth).map(([m, list]) => `
  <h2 class="ep-month">${esc(m)}</h2>
  <ol class="eps">${list.map((e) => `
    <li><a href="${rel(page, epPage(e))}">
      <span class="ep-title">${esc(e.title)}</span>
      <span class="ep-desc">${esc(e.desc)}</span>
      <span class="ep-meta">${longDate(e.date)} · ${mins(e.secs)}${seriesOf(e) ? ` · ${esc(seriesOf(e))}` : ""}</span>
    </a></li>`).join("")}
  </ol>`).join("");
  write(page, layout({
    page,
    title: `${SHOW} Podcast: Every Episode, Summarized | Hallie Who`,
    description: `Summaries of every ${SHOW} podcast episode (formerly My Sister's Closet) with Hallie: friendship, emotional intelligence, adoption, boundaries, healing, and growth.`,
    jsonld: [crumbs([["Home", ""], ["Podcast", page]]),
      { "@context": "https://schema.org", "@type": "PodcastSeries", name: SHOW, url: cfg.siteUrl + "/" + page, webFeed: "https://feed.podbean.com/halliegracehm/feed.xml",
        description: "Honest conversations about life, growth, relationships, healing, and community.", author: { "@type": "Person", name: "Hallie Who" } }],
    body: `
<section class="first">
  <div class="measure">
    <h1>The podcast</h1>
    <p class="lede">${SHOW} is a space for honest conversations about life, growth, relationships, healing, and everything we carry along the way. It started as My Sister's Closet. Every episode is here, with a short summary so you can find the one you need.</p>
    <div class="actions"><a class="btn" href="${or(cfg.podcastUrl)}">Watch on YouTube</a><a class="btn ghost" href="https://halliegracehm.podbean.com">Listen on Podbean</a>${cfg.podcastInstagramUrl ? `<a class="btn ghost" href="${cfg.podcastInstagramUrl}">Follow on Instagram</a>` : ""}</div>
    <p class="small" style="margin-top:14px">${EPISODES.length} episodes and counting.</p>
  </div>
</section>
<section>
  <div class="measure">${groups}</div>
</section>`,
  }));
}

// Each episode
EPISODES.forEach((e, i) => {
  const page = epPage(e);
  const series = seriesOf(e);
  const siblings = series ? EPISODES.filter((x) => x.series === e.series && x.slug !== e.slug).sort((a, b) => (a.part || 0) - (b.part || 0)) : [];
  const nearby = [EPISODES[i - 1], EPISODES[i + 1]].filter(Boolean).filter((x) => !siblings.includes(x));
  const more = [...siblings, ...nearby].slice(0, 6);
  const titleTag = `${e.title} | ${SHOW} Podcast`;
  write(page, layout({
    page,
    ogType: "article",
    title: titleTag.length > 70 ? e.title : titleTag,
    description: clip(e.desc),
    jsonld: [
      crumbs([["Home", ""], ["Podcast", "podcast/"], [e.title, page]]),
      { "@context": "https://schema.org", "@type": "PodcastEpisode", name: e.title, url: cfg.siteUrl + "/" + page, datePublished: e.date,
        description: e.desc, timeRequired: isoDur(e.secs), keywords: e.topics.join(", "),
        ...(e.audio ? { associatedMedia: { "@type": "MediaObject", contentUrl: e.audio } } : {}),
        partOfSeries: { "@type": "PodcastSeries", name: SHOW, url: cfg.siteUrl + "/podcast/" },
        author: { "@type": "Person", name: "Hallie Who" } },
    ],
    scripts: e.chapters ? `<script>
document.querySelectorAll(".chapters a").forEach((a) => a.addEventListener("click", (ev) => {
  const p = document.querySelector(".player");
  if (!p) { a.href = ${JSON.stringify(e.listen)}; return; }
  ev.preventDefault(); p.currentTime = +a.dataset.t; p.play();
}));
</script>` : "",
    body: `
<section class="first"><article>
  <div class="measure">
    <p class="kicker"><a href="${rel(page, "podcast/")}">${SHOW} podcast</a>${series ? ` · ${esc(series)}${e.part ? `, part ${e.part}` : ""}` : ""}</p>
    <h1 class="ep-h1">${esc(e.title)}</h1>
    <p class="small"><time datetime="${e.date}">${longDate(e.date)}</time> · ${mins(e.secs)}</p>
    ${e.audio ? `<audio class="player" controls preload="none" src="${e.audio}"></audio>` : ""}
    <div class="actions" style="margin-top:${e.audio ? 14 : 22}px"><a class="btn${e.audio ? " ghost" : ""}" href="${e.listen}">Listen on Podbean</a><a class="btn ghost" href="${or(cfg.podcastUrl)}">Watch on YouTube</a></div>
    <div class="depth">
      <h2 class="ep-h2">What this episode is about</h2>
      ${e.summary.map((p) => `<p class="body-serif">${esc(p)}</p>`).join("")}
    </div>
    ${e.chapters ? `<div class="depth">
      <h2 class="ep-h2">Chapters</h2>
      <ol class="chapters">${e.chapters.map((c) => `<li><a href="#t=${c.t}" data-t="${c.t}"><span class="ch-time">${stamp(c.t)}</span>${esc(c.title)}</a></li>`).join("")}</ol>
    </div>` : ""}
    <div class="depth">
      <h2 class="ep-h2">Takeaways</h2>
      <ul class="takeaways">${e.takeaways.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
    </div>
    <div class="depth">
      <h2 class="ep-h2">A question to sit with</h2>
      <ul class="prompts"><li>${esc(e.reflect)}</li></ul>
    </div>
    ${e.care ? `<p class="small" style="margin-top:28px">If you're struggling, you don't have to carry it alone. In the US, call or text 988 to reach the Suicide and Crisis Lifeline any time.</p>` : ""}
    <p class="tags">${e.topics.map((t) => `<span>${esc(t)}</span>`).join("")}</p>
    <div class="offer">
      <h3>Keep thinking about it</h3>
      <p>Journal through what came up in the My Inner Mind app, or take a free quiz to name the pattern behind it.</p>
      <div class="actions"><a class="btn" href="${or(cfg.appStoreUrl)}">Get the app</a><a class="btn ghost" href="${rel(page, "find-your-pattern/")}">Find your pattern</a></div>
    </div>
  </div>
</article></section>
<section>
  <div class="measure">
    <h2>${siblings.length ? `More from ${esc(series)}` : "More episodes"}</h2>
    <ul class="related">${more.map((x) => `<li><a href="${rel(page, epPage(x))}">${esc(x.title)}</a><span>${mins(x.secs)}</span></li>`).join("")}</ul>
    <p style="margin-top:18px"><a href="${rel(page, "podcast/")}">See every episode</a></p>
  </div>
</section>`,
  }));
});

// ---------- app pages: support, terms, privacy ----------
// These addresses are linked from the My Inner Mind App Store listing. Keep the paths the same.
const legalPage = (page, title, description, h1, updated, sections) => write(page, layout({
  page, title, description,
  jsonld: [crumbs([["Home", ""], [h1, page]])],
  body: `
<section class="first">
  <div class="measure legal">
    <h1>${esc(h1)}</h1>
    ${updated ? `<p class="small" style="margin-top:12px">Last updated ${esc(updated)}</p>` : ""}
    ${sections.map(([h, ps]) => `${h ? `<h2>${esc(h)}</h2>` : ""}${ps.map((p) => Array.isArray(p) ? `<ul>${p.map((li) => `<li>${li}</li>`).join("")}</ul>` : `<p>${p}</p>`).join("")}`).join("\n")}
  </div>
</section>`,
}));
const mail = `<a href="mailto:${cfg.supportEmail}">${cfg.supportEmail}</a>`;

legalPage("support/", "My Inner Mind Support | Hallie Who",
  "Get help with the My Inner Mind app: subscriptions, billing, account deletion, and how to reach Hallie.",
  "My Inner Mind support", "", [
    ["", [`Questions about the app, your account, or your subscription? Email ${mail} and I'll get back to you, usually within 24 to 48 hours.`]],
    ["Common questions", []],
    ["How do I cancel my subscription?", [`Subscriptions are billed through your Apple ID. On your iPhone, open Settings, tap your name, then Subscriptions, and choose My Inner Mind. Cancel at least 24 hours before your renewal date to avoid the next charge. If you need help, email ${mail}.`]],
    ["How do I delete my account?", ["Open the app, go to Account Settings, and choose delete account. This removes your account and the content tied to it. Deleting the app alone does not cancel a subscription, so cancel that in Settings too."]],
    ["I have a billing question.", [`Email ${mail} with the email address on your account and what you're seeing. Refunds for App Store purchases are handled by Apple through reportaproblem.apple.com.`]],
    ["I want to report a post or a person.", [`Use the report or block option on the post or profile inside the app. You can also email ${mail}.`]],
  ]);

legalPage("terms-of-use/", "Terms of Use | My Inner Mind",
  "Terms of use for the My Inner Mind app, including subscriptions, community guidelines, and your content.",
  "Terms of use", cfg.legalUpdated, [
    ["Agreeing to these terms", ["By using My Inner Mind, you agree to these terms. If you don't agree, please don't use the app."]],
    ["Subscriptions", [
      "My Inner Mind offers two auto-renewing subscriptions:",
      ["<strong>Community</strong>, $6.99 a month", "<strong>Off the Record</strong>, $12.99 a month"],
      "Payment is charged to your Apple ID when you confirm your purchase. Your subscription renews automatically unless you cancel at least 24 hours before the end of the current period. You can manage or cancel it any time in your iPhone's Settings under your Apple ID, then Subscriptions.",
    ]],
    ["Your content", ["Your journal entries are private by default. You decide what, if anything, to share with the community. You keep ownership of what you write. I will never sell your data."]],
    ["Community guidelines", ["Be kind. Posts that are objectionable, abusive, hateful, harassing, sexually explicit, or harmful to yourself or others are not allowed. You can report or block any post or person in the app. Content that breaks these rules is removed, and accounts that break them can be terminated right away."]],
    ["Not a substitute for care", ["My Inner Mind is a tool for reflection and connection. It isn't therapy, medical advice, or a crisis service. If you're in crisis in the US, call or text 988 any time."]],
    ["Privacy", [`Our <a href="${rel("terms-of-use/", "privacy-policy/")}">privacy policy</a> explains what we collect and how we use it, and is part of these terms.`]],
    ["Changes", ["These terms may be updated from time to time. If you keep using the app after a change, that means you accept the updated terms."]],
    ["Contact", [`Questions? Email ${mail}.`]],
  ]);

legalPage("privacy-policy/", "Privacy Policy | My Inner Mind and Hallie Who",
  "How the My Inner Mind app and halliewho.com collect, use, and protect your information.",
  "Privacy policy", cfg.legalUpdated, [
    ["", ["This policy covers the My Inner Mind app and halliewho.com, run by Hallie Who. The short version: your journal is yours, I collect only what the app needs to work, and I never sell your data."]],
    ["What we collect", [[
      "<strong>Account details</strong>, like your email address and display name, so you can sign in.",
      "<strong>What you write and log in the app</strong>, like journal entries, mood check-ins, and anything you choose to post to the community.",
      "<strong>Subscription status.</strong> Purchases go through Apple. We see whether your subscription is active, but never your card or payment details.",
      "<strong>Basic usage and device information</strong>, like crash reports, needed to keep the app working.",
      "<strong>Quiz answers and email</strong>, if you take a quiz on halliewho.com and choose to enter your email.",
    ]]],
    ["How we use it", [[
      "To run the app: saving your entries, showing your history, and running the community",
      "To manage your subscription",
      "To send emails you signed up for, like a welcome email or your quiz result. You can unsubscribe any time.",
      "To keep the community safe, including reviewing reported content",
    ]]],
    ["Who we share it with", [
      "We never sell your information or use it for advertising. We only share it with the services that run the app and site:",
      ["Supabase, which stores account data and app content", "Apple and RevenueCat, which handle subscriptions", "Mailchimp, which sends emails", "Vercel, which hosts the website"],
      "We may also share information if the law requires it.",
    ]],
    ["Private by default", ["Journal entries and check-ins are private unless you choose to share them. Posts you share to the community can be seen by other members."]],
    ["Keeping or deleting your data", [`We keep your information while your account is open. You can delete your account any time in the app under Account Settings, which deletes your data from our systems. You can also email ${mail} to ask for a copy of your data or to have it deleted.`]],
    ["Children", ["My Inner Mind isn't meant for children under 13, and we don't knowingly collect their information."]],
    ["Website", ["halliewho.com uses privacy-friendly visitor statistics from Vercel to count page views. It doesn't use advertising cookies."]],
    ["Changes", ["If this policy changes, the date at the top will change too."]],
    ["Contact", [`Questions about your privacy? Email ${mail}.`]],
  ]);

// 404
write("404.html", layout({ canonicalPage: "404.html",
  page: "/",
  title: "Page not found | Hallie Who",
  description: "This page doesn't exist.",
  body: `<section class="first"><div class="measure"><h1>This page wandered off</h1><p class="lede">The link may be old or mistyped. Start from one of the quizzes instead.</p><div class="actions"><a class="btn" href="/find-your-pattern/">Find your pattern</a><a class="btn ghost" href="/">Go home</a></div></div></section>`,
}));

// Sitemap and robots
const pages = ["", "find-your-pattern/", "patterns/", "shop/", "journal/", "podcast/", ...EPISODES.map(epPage), "books/", "games/", "walk-with-me/", "talk-with-hallie/", "work-with-me/", "support/", "terms-of-use/", "privacy-policy/", ...QUIZ.map((q) => q.page), ...PATTERNS.map((p) => p.page)];
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${cfg.siteUrl}/${p}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`);
// Pinterest feed: Pinterest checks this and pins anything new, automatically.
{
  const rfc = (d) => new Date(d + "T12:00:00Z").toUTCString();
  const added = "2026-10-18";
  const items = Object.values(CARDS).filter((c) => hasImg("pins", c.key)).map((c) => {
    const ep = EPISODES.find((e) => `podcast/${e.slug}/` === c.page);
    const img = `${cfg.siteUrl}/assets/pins/${c.key}.jpg`;
    const link = cfg.siteUrl + "/" + c.page;
    return `<item>
  <title>${esc(c.title)}</title>
  <link>${link}</link>
  <guid isPermaLink="true">${link}</guid>
  <description>${esc(c.sub.replace(/[.?!]$/, "") + "." + (c.kicker === "Hallie Who" ? "" : " " + c.kicker + " from Hallie Who."))}</description>
  <pubDate>${rfc(ep ? ep.date : added)}</pubDate>
  <enclosure url="${img}" type="image/jpeg" length="0"/>
  <media:content url="${img}" medium="image" type="image/jpeg"/>
</item>`;
  });
  write("pins.xml", `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
<title>Hallie Who</title>
<link>${cfg.siteUrl}/</link>
<description>${esc(cfg.tagline)}</description>
${items.join("\n")}
</channel>
</rss>
`);
  write("cards.json", JSON.stringify(Object.values(CARDS), null, 1));
}
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${cfg.siteUrl}/sitemap.xml\n`);

console.log(`Built ${pages.length} pages into ${OUT}/`);
