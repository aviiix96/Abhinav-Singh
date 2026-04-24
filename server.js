/**
 *  BFHL Node-Graph Resolver
 *  Author: Abhinav Singh
 *  Parses directed edge strings into forest/cycle structures.
 */

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ── personal info ──
const MY_INFO = Object.freeze({
  uid: "abhinavsingh_27062004",
  mail: "as9346@srm.edu.in",
  roll: "RA2311003030135",
});

const EDGE_RE = /^([A-Z])->([A-Z])$/;


function parseToken(raw) {
  const trimmed = String(raw).trim();
  if (!trimmed) return { ok: false, raw };

  const m = EDGE_RE.exec(trimmed);
  if (!m) return { ok: false, raw };

  const [, src, dst] = m;
  if (src === dst) return { ok: false, raw }; // self-loop → invalid

  return { ok: true, src, dst, canon: `${src}->${dst}`, raw };
}


function bucketize(tokens) {
  const encountered = new Set();
  const dupeSet = new Set();
  const edges = [];        // first-seen valid edges
  const bad = [];           // invalid entries

  for (const tok of tokens) {
    const p = parseToken(tok);
    if (!p.ok) { bad.push(p.raw); continue; }
    if (encountered.has(p.canon)) { dupeSet.add(p.canon); continue; }
    encountered.add(p.canon);
    edges.push(p);
  }
  return { edges, bad, dupes: [...dupeSet] };
}


function buildAdj(edges) {
  const graph = {};      // src → [dst, …]
  const parentOf = {};   // child → its accepted parent
  const nodes = new Set();

  for (const { src, dst } of edges) {
    nodes.add(src);
    nodes.add(dst);

    // multi-parent guard
    if (dst in parentOf) continue;

    parentOf[dst] = src;
    if (!graph[src]) graph[src] = [];
    graph[src].push(dst);
  }

  return { graph, parentOf, nodes };
}

/* ------------------------------------------------------------------ *
 *  Union-Find (path-compressed) to partition nodes into components
 * ------------------------------------------------------------------ */
function makeUF(nodes) {
  const boss = {};
  for (const n of nodes) boss[n] = n;

  function root(x) {
    while (boss[x] !== x) { boss[x] = boss[boss[x]]; x = boss[x]; }
    return x;
  }
  function link(a, b) {
    const ra = root(a), rb = root(b);
    if (ra !== rb) boss[ra] = rb;
  }
  return { root, link };
}


function hasCycleIn(component, graph) {
  const color = {};
  for (const n of component) color[n] = 0;

  function visit(u) {
    color[u] = 1;
    for (const v of (graph[u] || [])) {
      if (!component.has(v)) continue;
      if (color[v] === 1) return true;
      if (color[v] === 0 && visit(v)) return true;
    }
    color[u] = 2;
    return false;
  }

  for (const n of component) {
    if (color[n] === 0 && visit(n)) return true;
  }
  return false;
}

/* ------------------------------------------------------------------ *
 *  Recursively construct nested object tree from adjacency
 * ------------------------------------------------------------------ */
function subtree(node, graph) {
  const kids = graph[node] || [];
  const branch = {};
  for (const k of kids) branch[k] = subtree(k, graph);
  return branch;
}

function nest(node, graph) {
  return { [node]: subtree(node, graph) };
}

/* 
 *  Measure depth: count of nodes on longest root-to-leaf path
                                                                 */
function measureDepth(obj) {
  const keys = Object.keys(obj);
  if (!keys.length) return 0;
  let best = 0;
  for (const k of keys) best = Math.max(best, measureDepth(obj[k]));
  return 1 + best;
}

/* ------------------------------------------------------------------ *
 *  Main resolver: tokens → full response object
 * ------------------------------------------------------------------ */
function resolve(tokens) {
  const { edges, bad, dupes } = bucketize(tokens);
  const { graph, parentOf, nodes } = buildAdj(edges);

  // partition into components
  const uf = makeUF(nodes);
  for (const src of Object.keys(graph)) {
    for (const dst of graph[src]) uf.link(src, dst);
  }

  const groups = {};
  for (const n of nodes) {
    const rep = uf.root(n);
    if (!groups[rep]) groups[rep] = new Set();
    groups[rep].add(n);
  }

  // track first-appearance order so hierarchies output preserves input order
  const firstSeen = {};
  let seq = 0;
  for (const { src, dst } of edges) {
    if (!(src in firstSeen)) firstSeen[src] = seq;
    if (!(dst in firstSeen)) firstSeen[dst] = seq;
    seq++;
  }

  const hierarchies = [];

  for (const comp of Object.values(groups)) {

    const childNodes = new Set();
    for (const n of comp) { if (n in parentOf) childNodes.add(n); }

    const roots = [...comp].filter(n => !childNodes.has(n)).sort();
    const cyclic = hasCycleIn(comp, graph);

    let rootLabel;
    if (roots.length === 0) {

      rootLabel = [...comp].sort()[0];
    } else {
      rootLabel = roots[0];
    }

    if (cyclic) {
      hierarchies.push({ root: rootLabel, tree: {}, has_cycle: true });
    } else {
      const tree = nest(rootLabel, graph);
      hierarchies.push({ root: rootLabel, tree, depth: measureDepth(tree) });
    }
  }

  // sort by first-appearance
  hierarchies.sort((a, b) => (firstSeen[a.root] ?? Infinity) - (firstSeen[b.root] ?? Infinity));


  const acyclicOnes = hierarchies.filter(h => !h.has_cycle);
  const cyclicOnes = hierarchies.filter(h => !!h.has_cycle);

  let biggestRoot = "";
  let biggestDepth = 0;
  for (const t of acyclicOnes) {
    if (t.depth > biggestDepth || (t.depth === biggestDepth && t.root < biggestRoot)) {
      biggestDepth = t.depth;
      biggestRoot = t.root;
    }
  }

  return {
    user_id: MY_INFO.uid,
    email_id: MY_INFO.mail,
    college_roll_number: MY_INFO.roll,
    hierarchies,
    invalid_entries: bad,
    duplicate_edges: dupes,
    summary: {
      total_trees: acyclicOnes.length,
      total_cycles: cyclicOnes.length,
      largest_tree_root: biggestRoot,
    },
  };
}

/* ── routes ── */

app.post("/bfhl", (req, res) => {
  try {
    const { data } = req.body || {};
    if (!Array.isArray(data))
      return res.status(400).json({ is_success: false, error: "'data' must be an array." });
    return res.json({ is_success: true, ...resolve(data) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ is_success: false, error: "Server error." });
  }
});

app.get("/bfhl", (_req, res) => res.json({ operation_code: 1 }));

app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`▶  listening on :${PORT}`));
