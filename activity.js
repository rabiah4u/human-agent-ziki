/* Human–Agent Activity & Approvals: prototype. Simulated data, in memory only. */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const P = {
    bot: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
    timer: '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
    check: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  };
  const I = (n, s = 20) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
  const fmt = (s) => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");

  const fresh = () => ({ offer: { res: null, left: 48 }, ask: { res: null } });
  let st = fresh();
  let view = new URLSearchParams(location.search).get("view") === "before" ? "before" : "after";

  const openCount = () => (st.offer.res ? 0 : 1) + (st.ask.res ? 0 : 1);

  function offerCard() {
    const o = st.offer;
    if (o.res === "yes") return `<article class="ncard"><div class="res">${I("check", 24)}Approved. Agent started.<button data-undo="offer">Undo</button></div></article>`;
    if (o.res === "no") return `<article class="ncard"><div class="res passed">${I("x", 24)}Skipped. Next person's agent gets it.<button data-undo="offer">Undo</button></article>`.replace("</article>", "</div></article>");
    if (o.res === "late") return `<article class="ncard"><div class="res passed">${I("timer", 24)}Time ran out. Passed on, no cost.</div></article>`;
    return `<article class="ncard hot" aria-label="Offer for issue 1150">
      <div class="nrow"><span class="who">${I("bot", 24)}</span><div><div class="who-n">Personal agent</div><div class="who-s">#1150 <span class="tag risk">${I("shield", 13)}Security</span></div></div>
        <span class="timer2 ${o.left <= 20 ? "hot" : ""}" id="tm">${I("timer", 16)}${fmt(o.left)}</span></div>
      <div class="q">Reset codes can be guessed</div>
      <div class="nbtns"><button class="btn yes" data-act="offer:yes">${I("check")}Approve</button><button class="btn" data-act="offer:no">Skip</button></div>
    </article>`;
  }
  function askCard() {
    const a = st.ask;
    if (a.res) return `<article class="ncard"><div class="res">${I("check", 24)}Sent: ${a.res}. Agent resumed.<button data-undo="ask">Undo</button></div></article>`;
    return `<article class="ncard" aria-label="Question from Tola's agent">
      <div class="nrow"><span class="who">${I("bot", 24)}</span><div><div class="who-n">Tola's agent</div><div class="who-s">#118 <span class="tag wait">${I("pause", 13)}Paused</span></div></div></div>
      <div class="q">Test on staging?</div>
      <div class="nbtns"><button class="btn yes" data-act="ask:Yes">Yes</button><button class="btn" data-act="ask:No">No</button></div>
    </article>`;
  }
  const attnAfter = () => {
    const n = openCount();
    return `<section class="attn" aria-labelledby="na"><div class="attn-h"><h2 id="na">Needs attention</h2>${n ? `<span class="badge-n">${n}</span>` : ""}</div>
      ${n === 0 && st.offer.res !== null && st.ask.res !== null ? "" : ""}
      <div class="cards">${offerCard()}${askCard()}</div>
      ${n === 0 ? `<div class="clear">${I("check", 24)}All clear</div>` : ""}
      <p class="rule1">${I("lock", 15)}Agents can't start work, spend or merge until you tap.</p></section>`;
  };
  const attnBefore = () => `<section class="panel"><h2>Needs Attention</h2>
      <h3>Your escalation responses</h3><p class="t">Replies guide your agent and can resume a paused claim. They do not grant pipeline approval.</p><p class="t" style="color:var(--muted)">No unanswered escalations on this page.</p><hr>
      <h3 style="margin-top:0">Pipeline approvals</h3><p class="t">Workspace owners and admins decide these gates. Approval may automatically resume an offer or merge. Requests belong to an issue and stage, not an assigned agent.</p><p class="t" style="color:var(--muted)">Workspace owner or admin access is required to review this queue.</p></section>`;
  const filters = `<section class="panel"><div class="filters"><div><label for="in">Issue number</label><input id="in" placeholder="123"></div><div><label for="cs">Claim state</label><select id="cs"><option>All claims</option></select></div><button class="btn accent">Filter</button><a href="#">Clear filters</a></div><p class="t" style="font-size:16px;color:var(--muted)">Issue number filters every section. Claim state filters Work History only. Each list shows up to 20 records.</p></section>`;
  const historyHtml = `<section class="panel wh"><h2>Work History</h2><hr style="margin:16px 0 0"><div class="row"><b>Personal agent</b> · Claim: offered · Issue: Open<a href="#">#1150 [Bug][Security] Magic-link and password-reset codes are 6 digits, looked up without the email, and the routes have no rate limit</a><small>Recorded Oct 28, 2026, 10:20 PM</small></div></section>`;

  function render() {
    const top = `<div class="act-top"><div><h1 class="pt">Human–Agent Activity &amp; Approvals</h1><p class="pd">Your agents' work, requests and activity in this workspace.</p><a class="manage" href="#">Manage agents</a></div>
      <div class="seg" role="group" aria-label="Prototype view"><button data-view="before" class="${view === "before" ? "on" : ""}">Original</button><button data-view="after" class="${view === "after" ? "on" : ""}">Proposed</button></div></div>`;
    $("#app").innerHTML = top + (view === "before" ? filters + attnBefore() + historyHtml : attnAfter() + filters + historyHtml);
  }

  let tt;
  function toast(m) { $("#toast-msg").textContent = m; $("#toast").classList.add("show"); clearTimeout(tt); tt = setTimeout(() => $("#toast").classList.remove("show"), 2600); }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.view) { view = b.dataset.view; history.replaceState(null, "", "?view=" + view); render(); return; }
    if (b.dataset.act) {
      const [k, v] = b.dataset.act.split(":");
      if (k === "offer") st.offer.res = v; else st.ask.res = v;
      render(); toast(k === "offer" && v === "yes" ? "Approved. The agent has started." : "Done."); return;
    }
    if (b.dataset.undo) { if (b.dataset.undo === "offer") { st.offer.res = null; st.offer.left = Math.max(st.offer.left, 30); } else st.ask.res = null; render(); }
  });

  setInterval(() => {
    if (view !== "after" || st.offer.res) return;
    st.offer.left -= 1;
    if (st.offer.left <= 0) { st.offer.res = "late"; render(); return; }
    const t = $("#tm"); if (t) { t.innerHTML = I("timer", 16) + fmt(st.offer.left); t.classList.toggle("hot", st.offer.left <= 20); }
  }, 1000);

  render();
})();
