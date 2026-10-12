// Builds the whole site into dist/. Run: node build.mjs
// No dependencies. Vercel runs this automatically on every push.
import fs from "node:fs";
import path from "node:path";
import cfg from "./site.config.mjs";

const quizzes = JSON.parse(fs.readFileSync("content/quizzes.json", "utf8"));
const extras = JSON.parse(fs.readFileSync("content/extras.json", "utf8"));
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
  ["books/", "Books"],
  ["talk-with-hallie/", "Talk with me"],
  ["work-with-me/", "Work with me"],
];

function layout({ page, title, description, body, jsonld = [], scripts = "" }) {
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
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(cfg.siteName)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary">
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
    <a href="${cfg.linksHub}">All links</a>
  </nav>
  <p style="margin-top:14px">Made in Alabama. These quizzes are for reflection, not diagnosis.</p>
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
  const file = path.join(OUT, page, page.endsWith(".html") || page.endsWith(".xml") || page.endsWith(".txt") ? "" : "index.html");
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
  <div class="measure">
    <h2>Hi, I'm Hallie.</h2>
    <p class="body-serif">I built this space because I spent a long time looking for someone who understood, and I couldn't find her, so I decided to become her for someone else.</p>
    <p style="margin-top:16px">I'm an adopted kid from a big Alabama family, and I learned the hard way that understanding your patterns changes everything. No therapy-speak. No "cut everyone off" energy. Just honest questions and a place to sit with the answers.</p>
    <div class="actions"><a class="btn ghost" href="${r("talk-with-hallie/")}">Talk with me</a></div>
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
    types[k] = { badge: t.badge, title: t.title, body: t.body, l1: t.l1, t1: t.t1, l2: t.l2, t2: t.t2, slug: t.slug, url: rel(page, t.page), picks: picksFor(q.id, k) };
  }
  const data = {
    qs: q.qs, types, mailchimp: cfg.mailchimp, journalUrl: cfg.journalUrl, journalPrice: cfg.journalPrice,
    hubUrl: rel(page, "find-your-pattern/"),
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
    description: "Printable journals, gratitude pages, affirmations, and a year in review workbook from Innershelfstudio, plus Pages for You, a 30-day journal written for you.",
    jsonld: [crumbs([["Home", ""], ["Shop", page]])],
    body: `
<section class="first">
  <div class="measure">
    <h1>Shop</h1>
    <p class="lede">Small, honest tools for the patterns you're working on. Everything is a digital download you can print at home.</p>
    ${journalOffer(null, "Pages for You", `A 30-day journal written only for you, around what you're carrying right now. ${cfg.journalPrice}.`, "shop",
      `<a class="btn ghost" href="${rel(page, "journal/")}">How it works</a>`)}
  </div>
</section>
<section>
  <div class="measure">
    <h2>Printables from Innershelfstudio</h2>
    <p>Sold through my Etsy shop. Instant download after checkout.</p>
    ${pickCards(all)}
    <p style="margin-top:22px">Looking for art prints? <a href="${cfg.etsyShop}">See the whole shop on Etsy</a>.</p>
  </div>
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

// Talk with Hallie
{
  const page = "talk-with-hallie/";
  const ask = (name) => `mailto:${cfg.contactEmail}?subject=${encodeURIComponent("Booking a " + name)}&body=${encodeURIComponent("Hi Hallie,\n\nI'd like to book a " + name + ".\n\nTimes that work for me:\n\nWhat I'd like to talk about (optional):\n")}`;
  const talks = cfg.talks.map((t) => `
  <div class="service">
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
    <p>Not ready to talk yet? <a href="${rel(page, "find-your-pattern/")}">Start with a quiz</a> and see what comes up.</p>
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

// 404
write("404.html", layout({ canonicalPage: "404.html",
  page: "/",
  title: "Page not found | Hallie Who",
  description: "This page doesn't exist.",
  body: `<section class="first"><div class="measure"><h1>This page wandered off</h1><p class="lede">The link may be old or mistyped. Start from one of the quizzes instead.</p><div class="actions"><a class="btn" href="/find-your-pattern/">Find your pattern</a><a class="btn ghost" href="/">Go home</a></div></div></section>`,
}));

// Sitemap and robots
const pages = ["", "find-your-pattern/", "patterns/", "shop/", "journal/", "books/", "games/", "talk-with-hallie/", "work-with-me/", ...QUIZ.map((q) => q.page), ...PATTERNS.map((p) => p.page)];
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${cfg.siteUrl}/${p}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`);
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${cfg.siteUrl}/sitemap.xml\n`);

console.log(`Built ${pages.length} pages into ${OUT}/`);
