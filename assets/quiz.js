(function () {
  var data = JSON.parse(document.getElementById("quiz-data").textContent);
  var mc = data.mailchimp;
  var root = document.getElementById("quiz");
  var cur = 0, answers = [], email = "";

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    for (var k in attrs || {}) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }

  function progress(pct) {
    var bar = el("div", { class: "progress", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": String(Math.round(pct)) });
    var fill = el("span");
    bar.appendChild(fill);
    requestAnimationFrame(function () { fill.style.width = pct + "%"; });
    return bar;
  }

  function renderQuestion() {
    var q = data.qs[cur];
    root.innerHTML = "";
    root.appendChild(progress((cur / data.qs.length) * 100));
    root.appendChild(el("p", { class: "qcount" }, "Question " + (cur + 1) + " of " + data.qs.length));
    var h = el("h2", { class: "qtext", tabindex: "-1" }, q.t);
    root.appendChild(h);
    var ul = el("ul", { class: "opts" });
    q.os.forEach(function (o, i) {
      var li = el("li");
      var b = el("button", { type: "button", class: "opt", "aria-pressed": answers[cur] === i ? "true" : "false" }, o.t);
      b.addEventListener("click", function () {
        answers[cur] = i;
        b.setAttribute("aria-pressed", "true");
        setTimeout(function () {
          cur++;
          if (cur < data.qs.length) renderQuestion(); else renderGate();
        }, 180);
      });
      li.appendChild(b);
      ul.appendChild(li);
    });
    root.appendChild(ul);
    var nav = el("div", { class: "qnav" });
    var back = el("button", { type: "button", class: "linkbtn" }, "Back");
    back.disabled = cur === 0;
    back.addEventListener("click", function () { cur--; renderQuestion(); });
    nav.appendChild(back);
    root.appendChild(nav);
    if (cur > 0) h.focus();
  }

  function score() {
    var counts = {};
    answers.forEach(function (ai, qi) {
      var k = data.qs[qi].os[ai].k;
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0];
  }

  function sendToMailchimp(addr, resultTitle) {
    try {
      var frameName = "mc-frame-" + Date.now();
      var iframe = el("iframe", { name: frameName, title: "signup", style: "display:none" });
      document.body.appendChild(iframe);
      var form = el("form", { action: mc.action, method: "POST", target: frameName, style: "display:none" });
      var fields = { EMAIL: addr };
      fields[mc.botField] = "";
      if (mc.resultField) fields[mc.resultField] = resultTitle;
      for (var name in fields) {
        var input = el("input", { type: "hidden", name: name });
        input.value = fields[name];
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
      setTimeout(function () { form.remove(); }, 1000);
    } catch (e) { /* the result still shows even if signup fails */ }
  }

  function renderGate() {
    root.innerHTML = "";
    root.appendChild(progress(100));
    var wrap = el("div", { class: "gate" });
    var h = el("h2", { tabindex: "-1" }, "Your result is ready.");
    wrap.appendChild(h);
    wrap.appendChild(el("p", { class: "lede" }, "Enter your email to see it. You'll also get honest notes from me now and then. Unsubscribe anytime."));
    var form = el("form", { novalidate: "" });
    var field = el("div", { class: "field" });
    var label = el("label", { for: "email", class: "small", style: "position:absolute;left:-9999px" }, "Email address");
    var input = el("input", { id: "email", type: "email", autocomplete: "email", placeholder: "you@email.com", required: "" });
    var btn = el("button", { type: "submit", class: "btn" }, "Show my result");
    field.appendChild(label); field.appendChild(input); field.appendChild(btn);
    var err = el("p", { class: "err", role: "alert" });
    form.appendChild(field); form.appendChild(err);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { err.textContent = "Enter an email like name@example.com."; input.focus(); return; }
      email = v;
      var key = score();
      sendToMailchimp(v, data.types[key].title);
      renderResult(key);
    });
    wrap.appendChild(form);
    var back = el("button", { type: "button", class: "linkbtn", style: "margin-top:18px" }, "Back to the last question");
    back.addEventListener("click", function () { cur = data.qs.length - 1; renderQuestion(); });
    wrap.appendChild(back);
    root.appendChild(wrap);
    h.focus();
  }

  function renderResult(key) {
    var r = data.types[key];
    root.innerHTML = "";
    var k = el("p", { class: "kicker" }, r.badge);
    var name = el("h2", { class: "result-name", tabindex: "-1" }, r.title);
    root.appendChild(k); root.appendChild(name);
    root.appendChild(el("p", { class: "body-serif" }, r.body));
    [[r.l1, r.t1], [r.l2, r.t2]].forEach(function (pair) {
      if (!pair[0]) return;
      var d = el("div", { class: "depth" });
      d.appendChild(el("h3", null, pair[0]));
      d.appendChild(el("p", null, pair[1]));
      root.appendChild(d);
    });
    var offer = el("div", { class: "offer" });
    offer.appendChild(el("h3", null, "Keep going with a journal made for you"));
    offer.appendChild(el("p", null, "Pages for You is a 30-day journal written around what you're carrying right now, so you can keep working with this pattern one page at a time. " + data.journalPrice + "."));
    var acts = el("div", { class: "actions" });
    acts.appendChild(el("a", { class: "btn", href: data.journalUrl + "?ref=" + r.slug }, "Get my journal"));
    acts.appendChild(el("a", { class: "btn ghost", href: r.url }, "Read the full pattern"));
    offer.appendChild(acts);
    root.appendChild(offer);
    var again = el("div", { class: "actions" });
    var retake = el("button", { type: "button", class: "linkbtn" }, "Retake this quiz");
    retake.addEventListener("click", function () { cur = 0; answers = []; renderQuestion(); });
    again.appendChild(retake);
    again.appendChild(el("a", { href: data.hubUrl }, "Take another quiz"));
    root.appendChild(again);
    name.focus();
    window.scrollTo({ top: root.offsetTop - 20 });
  }

  var start = document.getElementById("start-quiz");
  if (start) start.addEventListener("click", function () { start.parentNode.remove(); renderQuestion(); });
  else renderQuestion();
})();
