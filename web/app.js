import { analyze, applyCleanup, cleanUrl, suggestTags, search, toNetscape, toCSV, toJSON } from "./engine/index.js";
import { sampleBookmarks } from "./sample.js";

const $ = (id) => document.getElementById(id);
const el = (tag, props = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") n.className = v;
    else if (k === "text") n.textContent = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else if (v === true) n.setAttribute(k, "");
    else if (v !== false && v != null) n.setAttribute(k, v);
  }
  for (const k of kids.flat()) if (k != null) n.append(k);
  return n;
};
const plural = (n, one, many) => `${n.toLocaleString()} ${n === 1 ? one : many}`;

let A = null;                 // analysis of the loaded file
let removeIds = new Set();    // bookmarks to drop on export
let tagPick = new Map();      // id -> Set of suggested tags still switched on
let suggestions = new Map();  // id -> suggested tags
let stripTracking = true;

// ---------- loading ----------
function load(html) {
  const a = analyze(html);
  if (!a.stats.total) {
    $("err").textContent = "No bookmarks found in that file. Use the HTML file your browser exports, not a JSON or backup file.";
    return;
  }
  $("err").textContent = "";
  A = a;
  removeIds = new Set(a.duplicates.flatMap((g) => g.items.filter((b) => b.id !== g.keepId).map((b) => b.id)));
  stripTracking = true;
  $("strip").checked = true;
  suggestions = new Map();
  tagPick = new Map();
  for (const b of a.bookmarks) {
    if (b.tags.length) continue;
    const s = suggestTags(b);
    if (s.length) { suggestions.set(b.id, s); tagPick.set(b.id, new Set(s)); }
  }
  $("start").hidden = true;
  $("work").hidden = false;
  renderAll();
  window.scrollTo(0, 0);
}

async function handleFile(f) {
  if (!f) return;
  if (f.size > 60 * 1024 * 1024) { $("err").textContent = "That file is too large to be a bookmarks file."; return; }
  try { load(await f.text()); } catch { $("err").textContent = "Could not read that file."; }
}

$("file").addEventListener("change", (e) => { handleFile(e.target.files[0]); e.target.value = ""; });
$("sample").addEventListener("click", () => load(sampleBookmarks()));
const drop = $("drop");
["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
drop.addEventListener("drop", (e) => handleFile(e.dataTransfer.files[0]));
$("restart").addEventListener("click", () => { A = null; $("work").hidden = true; $("start").hidden = false; });

// ---------- tabs ----------
const tabs = ["clean", "library", "tags", "export"];
function showTab(name) {
  for (const t of tabs) {
    const on = t === name;
    $("tab-" + t).setAttribute("aria-selected", on);
    $("tab-" + t).tabIndex = on ? 0 : -1;
    $("panel-" + t).hidden = !on;
  }
  if (name === "export") renderExport();
  if (name === "library") renderLibrary();
  if (name === "tags") renderSuggest();
}
tabs.forEach((t, i) => {
  $("tab-" + t).addEventListener("click", () => showTab(t));
  $("tab-" + t).addEventListener("keydown", (e) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    const n = tabs[(i + d + tabs.length) % tabs.length];
    showTab(n); $("tab-" + n).focus();
  });
});

// ---------- summary ----------
function renderSummary() {
  const s = A.stats;
  const stat = (n, label) => el("div", { class: "stat" }, el("b", { text: n.toLocaleString() }), el("span", { text: label }));
  $("summary").replaceChildren(
    stat(s.total, "bookmarks"),
    stat(s.extraCopies, "extra copies"),
    stat(s.tracked, "links with tracking"),
    stat(s.untagged, "without tags"),
  );
}

// ---------- clean up ----------
function ago(ms) { return ms ? new Date(ms).toISOString().slice(0, 10) : "no date"; }

function copyRow(g, b, onChange) {
  const keep = b.id === g.keepId;
  const row = el("label", { class: "copy" + (removeIds.has(b.id) ? " gone" : "") });
  const cb = el("input", { type: "checkbox", "aria-label": "Remove " + b.title, checked: removeIds.has(b.id) });
  cb.addEventListener("change", () => { cb.checked ? removeIds.add(b.id) : removeIds.delete(b.id); row.classList.toggle("gone", cb.checked); onChange(); });
  row.append(cb, el("span", {},
    el("span", { class: "t" }, keep ? el("span", { class: "keepmark", text: "keep" }) : null, b.title),
    el("span", { class: "u", text: b.url }),
    el("span", { class: "meta", text: [b.folder.join(" / ") || "no folder", ago(b.added), b.tags.length ? b.tags.join(", ") : null, b.note ? "has a note" : null].filter(Boolean).join(" · ") }),
  ));
  return row;
}

function renderGroups(box, groups, emptyText) {
  box.replaceChildren();
  if (!groups.length) { box.append(el("p", { class: "empty", text: emptyText })); return; }
  for (const g of groups) {
    const head = el("h3", { text: g.key });
    const card = el("div", { class: "group" }, head);
    for (const b of g.items) card.append(copyRow(g, b, () => {}));
    box.append(card);
  }
}

function renderClean() {
  const t = A.stats.tracked;
  $("strip-label").textContent = t ? `Remove tracking from ${plural(t, "link", "links")}` : "Remove tracking from links (none found)";
  renderGroups($("dupes"), A.duplicates, "No duplicates found. Nice and tidy.");
  renderGroups($("similar"), A.similar, "Nothing that looks like the same page under a different address.");
}
$("strip").addEventListener("change", (e) => { stripTracking = e.target.checked; });
$("all-copies").addEventListener("click", () => { for (const g of A.duplicates) for (const b of g.items) b.id === g.keepId ? removeIds.delete(b.id) : removeIds.add(b.id); renderGroups($("dupes"), A.duplicates, ""); });
$("no-copies").addEventListener("click", () => { for (const g of A.duplicates) for (const b of g.items) removeIds.delete(b.id); renderGroups($("dupes"), A.duplicates, ""); });

// ---------- library ----------
const PAGE = 100;
let shown = PAGE;
function allTags() {
  const m = new Map();
  for (const b of A.bookmarks) for (const t of b.tags) m.set(t, (m.get(t) || 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
function renderLibrary() {
  const bar = $("tagbar");
  bar.replaceChildren();
  for (const [t, n] of allTags().slice(0, 14)) {
    bar.append(el("button", { class: "tag", type: "button", title: n + " bookmarks", text: t, onclick: () => { $("q").value = ($("q").value.replace(new RegExp("\\btag:" + t + "\\b", "g"), "").trim() + " tag:" + t).trim(); shown = PAGE; renderList(); } }));
  }
  renderList();
}
function renderList() {
  const hits = search(A.bookmarks.filter((b) => !removeIds.has(b.id)), $("q").value);
  $("count").textContent = plural(hits.length, "bookmark", "bookmarks") + ($("q").value.trim() ? " match" : "");
  const ul = $("list");
  ul.replaceChildren();
  for (const b of hits.slice(0, shown)) ul.append(libraryItem(b));
  $("more").hidden = hits.length <= shown;
}
function libraryItem(b) {
  const tagsBox = el("div", { class: "tags" });
  const draw = () => { tagsBox.replaceChildren(...b.tags.map((t) => el("span", { class: "tag sm", text: t })), el("button", { class: "btn ghost", type: "button", text: b.tags.length ? "Edit tags" : "Add tags", onclick: openEdit })); };
  const li = el("li", { class: "item" },
    el("a", { href: b.url, target: "_blank", rel: "noopener noreferrer", text: b.title }),
    el("span", { class: "where", text: b.host + (b.folder.length ? " · " + b.folder.join(" / ") : "") }),
    tagsBox);
  function openEdit() {
    const input = el("input", { type: "text", value: b.tags.join(", "), "aria-label": "Tags, separated by commas", placeholder: "tags, separated by commas" });
    const save = () => { b.tags = [...new Set(input.value.split(",").map((t) => t.trim().toLowerCase().replace(/\s+/g, "-")).filter(Boolean))]; edit.remove(); draw(); renderLibraryTags(); };
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { edit.remove(); } });
    const edit = el("div", { class: "edit" }, input, el("button", { class: "btn primary", type: "button", text: "Save", onclick: save }));
    li.append(edit); input.focus();
  }
  draw();
  return li;
}
function renderLibraryTags() {
  const bar = $("tagbar");
  bar.replaceChildren();
  for (const [t, n] of allTags().slice(0, 14)) bar.append(el("button", { class: "tag", type: "button", title: n + " bookmarks", text: t, onclick: () => { $("q").value = ("tag:" + t); renderList(); } }));
}
$("q").addEventListener("input", () => { shown = PAGE; renderList(); });
$("more").addEventListener("click", () => { shown += PAGE; renderList(); });

// ---------- suggested tags ----------
let sShown = PAGE;
function renderSuggest() {
  const ids = [...suggestions.keys()].filter((id) => !removeIds.has(id));
  const on = ids.reduce((n, id) => n + tagPick.get(id).size, 0);
  $("tags-count").textContent = ids.length ? `${plural(on, "tag", "tags")} selected for ${plural(ids.length, "bookmark", "bookmarks")}` : "";
  const ul = $("suggest");
  ul.replaceChildren();
  if (!ids.length) ul.append(el("li", { class: "empty", text: "Everything already has tags, or nothing could be suggested." }));
  for (const id of ids.slice(0, sShown)) {
    const b = A.bookmarks[id];
    const row = el("div", { class: "tags" });
    for (const t of suggestions.get(id)) {
      const on = tagPick.get(id).has(t);
      row.append(el("button", { class: "tag sug" + (on ? "" : " off"), type: "button", "aria-pressed": on, text: t, onclick: () => { const s = tagPick.get(id); s.has(t) ? s.delete(t) : s.add(t); renderSuggest(); } }));
    }
    ul.append(el("li", { class: "item" }, el("a", { href: b.url, target: "_blank", rel: "noopener noreferrer", text: b.title }), el("span", { class: "where", text: b.host }), row));
  }
  $("suggest-more").hidden = ids.length <= sShown;
}
$("tags-all").addEventListener("click", () => { for (const [id, s] of suggestions) tagPick.set(id, new Set(s)); renderSuggest(); });
$("tags-none").addEventListener("click", () => { for (const id of suggestions.keys()) tagPick.set(id, new Set()); renderSuggest(); });
$("suggest-more").addEventListener("click", () => { sShown += PAGE; renderSuggest(); });

// ---------- export ----------
function result() {
  const tags = new Map();
  for (const [id, s] of tagPick) if (s.size) tags.set(id, [...s]);
  return applyCleanup(A.bookmarks, { removeIds, stripTracking, tags });
}
function renderExport() {
  const out = result();
  const removed = A.bookmarks.length - out.length;
  const cleaned = stripTracking ? A.bookmarks.filter((b) => !removeIds.has(b.id) && cleanUrl(b.url) !== b.url).length : 0;
  let tagged = 0, tagCount = 0;
  for (const [id, s] of tagPick) if (!removeIds.has(id) && s.size) { tagged++; tagCount += s.size; }
  const li = (n, text) => el("li", {}, el("b", { text: n.toLocaleString() }), " " + text);
  $("plan").replaceChildren(
    li(out.length, `bookmarks in the new file (from ${A.bookmarks.length.toLocaleString()})`),
    li(removed, "copies removed"),
    li(cleaned, "links cleaned of tracking"),
    li(tagged, `bookmarks get new tags (${tagCount.toLocaleString()} tags in all)`),
  );
}
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = el("a", { href: url, download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
const today = () => new Date().toISOString().slice(0, 10);
$("dl-html").addEventListener("click", () => download(`bookmarks-tidy-${today()}.html`, toNetscape(result()), "text/html"));
$("dl-csv").addEventListener("click", () => download(`bookmarks-${today()}.csv`, toCSV(result()), "text/csv"));
$("dl-json").addEventListener("click", () => download(`bookmarks-${today()}.json`, toJSON(result()), "application/json"));

function renderAll() { renderSummary(); renderClean(); showTab("clean"); }
