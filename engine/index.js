import { parseBookmarks } from "./parse.js";
import { cleanUrl } from "./url.js";
import { findDuplicates, findSimilar } from "./dupes.js";
import { suggestTags } from "./tags.js";

export { parseBookmarks, cleanUrl, findDuplicates, findSimilar, suggestTags };
export { urlKey, hostOf } from "./url.js";
export { search, parseQuery } from "./search.js";
export { toNetscape, toCSV, toJSON } from "./export.js";

/** Reads a bookmarks file and works out what could be tidied. Nothing is changed yet. */
export function analyze(html) {
  const { bookmarks, skipped } = parseBookmarks(html);
  const duplicates = findDuplicates(bookmarks);
  const similar = findSimilar(bookmarks);
  const trackedIds = bookmarks.filter((b) => cleanUrl(b.url) !== b.url).map((b) => b.id);
  const hosts = new Map();
  for (const b of bookmarks) hosts.set(b.host, (hosts.get(b.host) || 0) + 1);
  const dated = bookmarks.filter((b) => b.added).map((b) => b.added);
  return {
    bookmarks,
    duplicates,
    similar,
    trackedIds,
    skipped,
    stats: {
      total: bookmarks.length,
      extraCopies: duplicates.reduce((n, g) => n + g.items.length - 1, 0),
      tracked: trackedIds.length,
      sites: hosts.size,
      untagged: bookmarks.filter((b) => !b.tags.length).length,
      oldest: dated.length ? Math.min(...dated) : null,
      topSites: [...hosts].sort((a, b) => b[1] - a[1]).slice(0, 8),
    },
  };
}

/** Applies your choices and returns a new list. removeIds: bookmarks to drop. */
export function applyCleanup(bookmarks, { removeIds = new Set(), stripTracking = true, tags = new Map() } = {}) {
  return bookmarks
    .filter((b) => !removeIds.has(b.id))
    .map((b) => ({
      ...b,
      url: stripTracking ? cleanUrl(b.url) : b.url,
      tags: [...new Set([...b.tags, ...(tags.get(b.id) || [])])],
    }));
}
