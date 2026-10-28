// Reads the bookmarks file every browser can export (the "Netscape bookmark" HTML format).
// No DOMParser, so the same code runs in the browser and in the tests.
import { hostOf, urlKey } from "./url.js";

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
export function decode(s) {
  return String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") {
      const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      try { return String.fromCodePoint(n); } catch { return m; }
    }
    return ENT[e.toLowerCase()] ?? m;
  });
}

function attrs(src) {
  const out = {};
  const re = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let m;
  while ((m = re.exec(src))) out[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? "");
  return out;
}

const TAG = /<(\/?)(dl|h3|a|dd|dt|p)\b([^>]*)>/gi;

/**
 * parseBookmarks(htmlText) -> { bookmarks, skipped }
 * Each bookmark: { id, title, url, key, host, added (ms or null), folder: [names], tags: [], note }
 */
export function parseBookmarks(html) {
  const text = String(html).replace(/^﻿/, "");
  const bookmarks = [];
  let skipped = 0;
  const stack = [];
  let pendingFolder = null;
  let last = null;
  let m;
  TAG.lastIndex = 0;
  while ((m = TAG.exec(text))) {
    const close = m[1] === "/";
    const name = m[2].toLowerCase();
    if (name === "dl") {
      if (close) { stack.pop(); last = null; } else { stack.push(pendingFolder); pendingFolder = null; }
    } else if (name === "h3" && !close) {
      const rest = text.slice(TAG.lastIndex);
      const e = rest.search(/<\/h3>/i);
      pendingFolder = decode((e < 0 ? rest : rest.slice(0, e)).replace(/<[^>]*>/g, "")).trim();
    } else if (name === "a" && !close) {
      const rest = text.slice(TAG.lastIndex);
      const e = rest.search(/<\/a>/i);
      const label = decode((e < 0 ? rest : rest.slice(0, e)).replace(/<[^>]*>/g, "")).trim();
      const a = attrs(m[3]);
      const url = (a.href || "").trim();
      if (!/^(https?|ftp):\/\//i.test(url)) { skipped++; last = null; continue; }
      const added = a.add_date && /^\d+$/.test(a.add_date) ? Number(a.add_date) * (a.add_date.length > 11 ? 1 : 1000) : null;
      last = {
        id: bookmarks.length,
        title: label || url,
        url,
        key: urlKey(url),
        host: hostOf(url),
        added,
        folder: stack.filter((x) => x),
        tags: a.tags ? a.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
        note: "",
      };
      bookmarks.push(last);
    } else if (name === "dd" && !close && last) {
      const rest = text.slice(TAG.lastIndex);
      const e = rest.search(/<(dt|dl|\/dl)\b/i);
      last.note = decode((e < 0 ? rest : rest.slice(0, e)).replace(/<[^>]*>/g, "")).trim();
    }
  }
  return { bookmarks, skipped };
}
