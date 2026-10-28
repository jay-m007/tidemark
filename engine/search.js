// Search with a few simple operators: tag:code  site:github.com  folder:work  -word  "exact phrase"

export function parseQuery(q) {
  const out = { words: [], not: [], tags: [], sites: [], folders: [] };
  const re = /(-?)(?:(tag|site|folder):)?(?:"([^"]+)"|(\S+))/gi;
  let m;
  while ((m = re.exec(String(q)))) {
    const neg = m[1] === "-";
    const op = m[2] && m[2].toLowerCase();
    const val = (m[3] ?? m[4] ?? "").toLowerCase();
    if (!val) continue;
    if (op === "tag") out.tags.push(val.replace(/^#/, ""));
    else if (op === "site") out.sites.push(val.replace(/^www\./, ""));
    else if (op === "folder") out.folders.push(val);
    else if (neg) out.not.push(val);
    else out.words.push(val);
  }
  return out;
}

export function matches(b, p) {
  const title = b.title.toLowerCase();
  const url = b.url.toLowerCase();
  const note = b.note.toLowerCase();
  const hay = title + " " + url + " " + note + " " + b.tags.join(" ");
  if (p.not.some((w) => hay.includes(w))) return false;
  if (!p.words.every((w) => hay.includes(w))) return false;
  if (!p.tags.every((t) => b.tags.includes(t))) return false;
  if (!p.sites.every((s) => b.host === s || b.host.endsWith("." + s))) return false;
  if (!p.folders.every((f) => b.folder.some((x) => x.toLowerCase().includes(f)))) return false;
  return true;
}

function score(b, p) {
  let s = 0;
  const title = b.title.toLowerCase();
  for (const w of p.words) {
    if (title.includes(w)) s += 3;
    if (b.tags.includes(w)) s += 2;
    if (b.host.includes(w)) s += 1;
  }
  return s;
}

export function search(list, q) {
  const p = parseQuery(q);
  const hits = list.filter((b) => matches(b, p));
  if (!p.words.length) return hits;
  return hits.map((b) => [b, score(b, p)]).sort((a, c) => c[1] - a[1] || a[0].id - c[0].id).map((x) => x[0]);
}
