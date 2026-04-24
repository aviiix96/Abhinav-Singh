/**
 *  BFHL Frontend — Gen-Z Edition
 *  Clean, emoji-rich, punchy interactions
 */
(() => {
  "use strict";

  const BASE = window.location.origin;
  const DEMO = "A->B, A->C, B->D, C->E, E->F, X->Y, Y->Z, Z->X, P->Q, Q->R, G->H, G->H, G->I, hello, 1->2, A->";

  const $ = (id) => document.getElementById(id);

  const inp    = $("edge-input");
  const goBtn  = $("btn-go");
  const tryBtn = $("btn-try");
  const errBox = $("err");
  const errMsg = $("err-msg");
  const output = $("results");
  const jsonO  = $("json-out");

  // ── events ──
  tryBtn.onclick = () => {
    inp.value = DEMO;
    inp.focus();
    pulse(inp);
  };

  goBtn.onclick = run;
  inp.addEventListener("keydown", e => { if (e.ctrlKey && e.key === "Enter") run() });

  // ── main flow ──
  async function run() {
    const raw = inp.value.trim();
    if (!raw) return yell("type something first fr 😤");

    const tokens = raw.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
    spin(true);
    hush();
    output.hidden = true;

    try {
      const r = await fetch(`${BASE}/bfhl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: tokens }),
      });
      if (!r.ok) {
        const b = await r.json().catch(() => ({}));
        throw new Error(b.error || `nah, server said ${r.status}`);
      }
      show(await r.json());
    } catch (e) {
      yell(e.message || "can't reach the API rn 😵");
    } finally {
      spin(false);
    }
  }

  // ── render ──
  function show(d) {
    $("v-trees").textContent  = d.summary.total_trees;
    $("v-cycles").textContent = d.summary.total_cycles;
    $("v-big").textContent    = d.summary.largest_tree_root || "—";

    // hierarchy cards
    const grid = $("cards-grid");
    grid.innerHTML = "";

    d.hierarchies.forEach((h, i) => {
      const cyc = !!h.has_cycle;
      const card = document.createElement("div");
      card.className = `hcard${cyc ? " hcard--cycle" : ""}`;
      card.style.animationDelay = `${i * 60}ms`;

      const lClass = cyc ? "hcard__letter hcard__letter--cycle" : "hcard__letter hcard__letter--tree";

      card.innerHTML = `
        <div class="hcard__top">
          <div class="hcard__root">
            <span class="${lClass}">${esc(h.root)}</span>
            <div class="hcard__meta">
              <strong>${esc(h.root)}</strong><br/>
              ${cyc ? "cyclic group 🔄" : "tree 🌳"}
            </div>
          </div>
          <div>
            ${cyc
              ? '<span class="tag tag--cycle">⟳ cycle</span>'
              : `<span class="tag tag--ok">✓ tree</span> <span class="tag tag--depth">depth ${h.depth}</span>`}
          </div>
        </div>
        ${cyc ? cycleBanner() : drawTree(h.tree)}
      `;
      grid.appendChild(card);
    });

    // issues
    chips("inv", d.invalid_entries, "itag--red");
    chips("dup", d.duplicate_edges, "itag--amber");

    jsonO.textContent = JSON.stringify(d, null, 2);

    output.hidden = false;
    output.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ── tree renderer ──
  function drawTree(obj) {
    function walk(o) {
      const keys = Object.keys(o);
      if (!keys.length) return "";
      let h = "<ul>";
      for (const k of keys) {
        const sub = o[k];
        const has = Object.keys(sub).length > 0;
        h += `<li><span class="node-tag">${esc(k)}</span>${has ? walk(sub) : ""}</li>`;
      }
      return h + "</ul>";
    }
    return `<div class="tree-vis">${walk(obj)}</div>`;
  }

  function cycleBanner() {
    return `<div class="cycle-msg">🔄 cycle detected — can't draw a tree for this one</div>`;
  }

  function chips(id, arr, cls) {
    const box = $(id);
    if (!arr || !arr.length) { box.innerHTML = '<span class="itag--empty">none 🎉</span>'; return; }
    box.innerHTML = arr.map(v => `<span class="itag ${cls}">${esc(v || "(empty)")}</span>`).join("");
  }

  // ── helpers ──
  function spin(on) {
    goBtn.disabled = on;
    $("go-text").textContent = on ? "crunching..." : "Analyze 🚀";
    $("go-spin").hidden = !on;
  }

  function yell(msg) { errMsg.textContent = msg; errBox.hidden = false }
  function hush() { errBox.hidden = true }

  function esc(s) { const d = document.createElement("span"); d.textContent = s; return d.innerHTML }

  function pulse(el) {
    el.style.transition = "box-shadow .3s";
    el.style.boxShadow = "0 0 0 3px rgba(168,255,120,.2)";
    setTimeout(() => el.style.boxShadow = "", 400);
  }
})();
