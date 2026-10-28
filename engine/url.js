// URL cleaning and a "same page" key, so the same link saved in different shapes is found as one.

const TRACK = /^(utm_[a-z_]*|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|igshid|yclid|_hsenc|_hsmi|mkt_tok|vero_id|oly_[a-z_]*)$/i;
const BY_HOST = [
  [/(^|\.)(youtube\.com|youtu\.be)$/, /^(si|feature|pp)$/i],
  [/(^|\.)(twitter\.com|x\.com)$/, /^(s|t|ref_src|ref_url)$/i],
];

export function hostOf(url) {
  try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ""); } catch { return ""; }
}

function parse(url) {
  try { return new URL(String(url).trim()); } catch { return null; }
}

/** The link with tracking parameters removed. Everything else stays as it was. */
export function cleanUrl(url) {
  const u = parse(url);
  if (!u || !/^https?:$/.test(u.protocol)) return String(url).trim();
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  const extra = BY_HOST.find(([h]) => h.test(host));
  for (const k of [...u.searchParams.keys()]) {
    if (TRACK.test(k) || (extra && extra[1].test(k))) u.searchParams.delete(k);
  }
  if (u.hash && !/^#[/!]/.test(u.hash)) u.hash = "";
  let s = u.toString();
  if (u.pathname === "/" && !u.search && !u.hash) s = s.replace(/\/$/, "");
  return s;
}

/** Two links with the same key point at the same page. */
export function urlKey(url) {
  const u = parse(url);
  if (!u || !/^https?:$/.test(u.protocol)) return String(url).trim().toLowerCase();
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  // Short and long YouTube links are the same video.
  if (host === "youtu.be") {
    const id = u.pathname.slice(1);
    if (id) return "youtube.com/watch?v=" + id;
  }
  if (host === "youtube.com" && u.pathname === "/watch" && u.searchParams.get("v")) {
    return "youtube.com/watch?v=" + u.searchParams.get("v");
  }
  const c = new URL(cleanUrl(url));
  const params = [...c.searchParams.entries()].sort(([a, x], [b, y]) => (a === b ? x.localeCompare(y) : a.localeCompare(b)));
  const q = params.length ? "?" + params.map(([k, v]) => k + "=" + v).join("&") : "";
  let path = c.pathname.replace(/\/+$/, "");
  if (c.port && !["80", "443"].includes(c.port)) return host + ":" + c.port + path + q;
  return host + path + q + (c.hash || "");
}
