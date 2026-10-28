import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { analyze, applyCleanup, cleanUrl, urlKey, parseBookmarks, parseQuery, search, suggestTags, toNetscape, toCSV, toJSON, findSimilar } from "../engine/index.js";

const file = readFileSync(new URL("./fixtures/bookmarks.html", import.meta.url), "utf8");

test("reads links, folders, dates, tags, notes and entities", () => {
  const { bookmarks, skipped } = parseBookmarks(file);
  assert.equal(bookmarks.length, 11);
  assert.equal(skipped, 2); // javascript: and chrome://
  const first = bookmarks[0];
  assert.equal(first.title, "Statement Sleuth & friends");
  assert.deepEqual(first.folder, ["Bookmarks bar"]);
  assert.equal(first.added, 1650000000 * 1000);
  const yt = bookmarks.find((b) => b.url.includes("youtu.be"));
  assert.deepEqual(yt.folder, ["Bookmarks bar", "Learning"]);
  assert.equal(yt.note, "Watch before the exam");
  const hn = bookmarks.find((b) => b.title === "Hacker News");
  assert.deepEqual(hn.tags, ["news", "tech"]);
  assert.equal(bookmarks.at(-1).title, "Some gadget – Amazon.in");
});

test("folders close properly", () => {
  const { bookmarks } = parseBookmarks(file);
  assert.deepEqual(bookmarks.find((b) => b.title === "Hacker News").folder, ["Other bookmarks"]);
  assert.deepEqual(bookmarks.find((b) => b.title.startsWith("URL")).folder, ["Bookmarks bar", "Learning"]);
});

test("cleanUrl removes tracking only", () => {
  assert.equal(cleanUrl("https://github.com/a/b?utm_source=x&tab=readme"), "https://github.com/a/b?tab=readme");
  assert.equal(cleanUrl("https://www.youtube.com/watch?v=1&si=2&feature=share"), "https://www.youtube.com/watch?v=1");
  assert.equal(cleanUrl("https://example.com/p?ref=main"), "https://example.com/p?ref=main"); // generic ref is kept
  assert.equal(cleanUrl("https://example.com/p#section"), "https://example.com/p");
  assert.equal(cleanUrl("https://app.example.com/#/inbox"), "https://app.example.com/#/inbox");
  assert.equal(cleanUrl("https://example.com/?fbclid=1"), "https://example.com");
});

test("urlKey treats the same page as the same", () => {
  assert.equal(urlKey("https://www.example.com/a/"), urlKey("http://example.com/a"));
  assert.equal(urlKey("https://example.com/a?x=1&y=2"), urlKey("https://example.com/a?y=2&x=1"));
  assert.equal(urlKey("https://youtu.be/abc?si=1"), urlKey("https://www.youtube.com/watch?v=abc&feature=share"));
  assert.notEqual(urlKey("https://example.com/a"), urlKey("https://example.com/b"));
  assert.notEqual(urlKey("https://example.com/a?id=1"), urlKey("https://example.com/a?id=2"));
});

test("finds duplicates and picks the one you cared about", () => {
  const a = analyze(file);
  const keys = a.duplicates.map((g) => g.items.length);
  assert.deepEqual(keys, [2, 2, 2, 2]); // github, youtube, hacker news, example.com/a
  const hn = a.duplicates.find((g) => g.items[0].title === "Hacker News");
  const keeper = hn.items.find((b) => b.id === hn.keepId);
  assert.deepEqual(keeper.tags, ["news", "tech"]); // the tagged copy wins
  const yt = a.duplicates.find((g) => g.items[0].url.includes("abc123") || g.items[0].url.includes("youtu"));
  assert.equal(yt.items.find((b) => b.id === yt.keepId).note, "Watch before the exam");
  assert.equal(a.stats.extraCopies, 4);
});

test("similar pages are listed separately and never counted as duplicates", () => {
  const a = analyze(file);
  assert.equal(a.similar.length, 1);
  assert.ok(a.similar[0].items.some((b) => b.url.endsWith("/other-page")));
  assert.equal(findSimilar([]).length, 0);
});

test("tracked links are counted", () => {
  const a = analyze(file);
  assert.ok(a.stats.tracked >= 3);
});

test("applyCleanup removes copies, strips tracking and adds tags", () => {
  const a = analyze(file);
  const remove = new Set(a.duplicates.flatMap((g) => g.items.filter((b) => b.id !== g.keepId).map((b) => b.id)));
  const out = applyCleanup(a.bookmarks, { removeIds: remove, tags: new Map([[0, ["code"]]]) });
  assert.equal(out.length, a.bookmarks.length - 4);
  assert.ok(out.every((b) => !/utm_|fbclid|feature=|si=/.test(b.url)));
  assert.ok(out.find((b) => b.id === 0).tags.includes("code"));
  assert.equal(analyze(toNetscape(out)).duplicates.length, 0);
});

test("suggested tags come from the site, folder and title", () => {
  const a = analyze(file);
  const gh = a.bookmarks[0];
  assert.ok(suggestTags(gh).includes("code"));
  const yt = a.bookmarks.find((b) => b.title.startsWith("Crash"));
  const t = suggestTags(yt);
  assert.ok(t.includes("video") && t.includes("learning") && t.includes("learning".slice(0)));
  assert.ok(t.length <= 4);
  const hn = a.bookmarks.find((b) => b.tags.length);
  assert.ok(!suggestTags(hn).includes("news")); // already has it
});

test("search understands operators", () => {
  const { bookmarks } = analyze(file);
  assert.deepEqual(parseQuery('tag:news site:www.ycombinator.com -ads "hello world" foo').words, ["hello world", "foo"]);
  assert.equal(search(bookmarks, "site:github.com").length, 2);
  assert.equal(search(bookmarks, "tag:news").length, 1);
  assert.ok(search(bookmarks, "folder:learning").length === 3);
  assert.equal(search(bookmarks, "hacker -news").length, 0);
  assert.ok(search(bookmarks, "javascript")[0].title.includes("JavaScript"));
  assert.equal(search(bookmarks, "").length, bookmarks.length);
});

test("exported HTML reads back the same, with folders, tags and notes", () => {
  const { bookmarks } = analyze(file);
  const html = toNetscape(bookmarks);
  const back = parseBookmarks(html).bookmarks;
  assert.equal(back.length, bookmarks.length);
  const byUrl = (list) => [...list].sort((a, b) => a.url.localeCompare(b.url) || a.title.localeCompare(b.title));
  const x = byUrl(bookmarks), y = byUrl(back);
  for (let i = 0; i < y.length; i++) {
    assert.equal(y[i].url, x[i].url);
    assert.equal(y[i].title, x[i].title);
    assert.deepEqual(y[i].tags, x[i].tags);
    assert.equal(y[i].note, x[i].note);
    assert.deepEqual(y[i].folder, x[i].folder);
  }
  assert.ok(back.find((b) => b.title.startsWith("URL")).folder.join("/") === "Bookmarks bar/Learning");
});

test("titles with markup are escaped on export", () => {
  const html = toNetscape([{ id: 0, title: '<img src=x onerror=alert(1)> "q"', url: "https://e.com/?a=1&b=2", key: "e", host: "e.com", added: null, folder: [], tags: [], note: "" }]);
  assert.ok(!html.includes("<img"));
  const back = parseBookmarks(html).bookmarks[0];
  assert.equal(back.title, '<img src=x onerror=alert(1)> "q"');
  assert.equal(back.url, "https://e.com/?a=1&b=2");
});

test("CSV protects against spreadsheet formulas and quotes properly", () => {
  const csv = toCSV([{ id: 0, title: '=HYPERLINK("x")', url: "https://e.com", key: "e", host: "e.com", added: 0, folder: ["A", "B"], tags: ["x", "y"], note: "a,b" }]);
  const lines = csv.trim().split("\r\n");
  assert.equal(lines[0], "title,url,folder,tags,added,note");
  assert.ok(lines[1].startsWith("\"'=HYPERLINK(\"\"x\"\")\""));
  assert.ok(lines[1].includes('"a,b"'));
  assert.ok(lines[1].includes("A / B"));
});

test("JSON export has the useful fields only", () => {
  const { bookmarks } = analyze(file);
  const j = JSON.parse(toJSON(bookmarks));
  assert.equal(j.length, bookmarks.length);
  assert.deepEqual(Object.keys(j[0]).sort(), ["added", "folder", "note", "tags", "title", "url"]);
});

test("handles an empty or unrelated file", () => {
  assert.equal(analyze("").stats.total, 0);
  assert.equal(analyze("<html><body>hello</body></html>").stats.total, 0);
});

test("handles thousands of bookmarks quickly", () => {
  let s = "<DL><p>";
  for (let i = 0; i < 20000; i++) s += `<DT><A HREF="https://site${i % 700}.com/p/${i % 5000}?utm_source=x" ADD_DATE="1600000000">Item ${i}</A>\n`;
  s += "</DL><p>";
  const t = Date.now();
  const a = analyze(s);
  assert.equal(a.stats.total, 20000);
  assert.ok(Date.now() - t < 5000, "took " + (Date.now() - t) + "ms");
});
