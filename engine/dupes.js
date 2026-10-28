// Finds bookmarks that point at the same page, and suggests which one to keep.

function keepScore(b) {
  // Prefer the one you took care of (tags, a note, a folder), then the oldest.
  return (b.tags.length ? 4 : 0) + (b.note ? 2 : 0) + (b.folder.length ? 1 : 0);
}

export function pickKeeper(items) {
  return [...items].sort((a, b) => keepScore(b) - keepScore(a) || (a.added ?? Infinity) - (b.added ?? Infinity) || a.id - b.id)[0];
}

/** Exact duplicates: same page after tracking junk, www, trailing slash and YouTube short links are ignored. */
export function findDuplicates(list) {
  const by = new Map();
  for (const b of list) {
    if (!by.has(b.key)) by.set(b.key, []);
    by.get(b.key).push(b);
  }
  const groups = [];
  for (const [key, items] of by) {
    if (items.length > 1) groups.push({ key, items, keepId: pickKeeper(items).id });
  }
  return groups.sort((a, b) => b.items.length - a.items.length || a.key.localeCompare(b.key));
}

/** Possible duplicates: same site and same title, but different addresses. Never removed automatically. */
export function findSimilar(list) {
  const by = new Map();
  for (const b of list) {
    const title = b.title.toLowerCase().replace(/\s+/g, " ").trim();
    if (title.length < 6 || title === b.url.toLowerCase()) continue;
    const k = b.host + "\u0000" + title;
    if (!by.has(k)) by.set(k, []);
    by.get(k).push(b);
  }
  const groups = [];
  for (const items of by.values()) {
    // One entry per distinct address, so exact copies do not pad the group.
    const per = new Map();
    for (const b of items) if (!per.has(b.key) || pickKeeper([per.get(b.key), b]) === b) per.set(b.key, b);
    if (per.size > 1) {
      const list2 = [...per.values()];
      groups.push({ key: list2[0].host + " \u2014 " + list2[0].title, items: list2, keepId: pickKeeper(list2).id });
    }
  }
  return groups.sort((a, b) => b.items.length - a.items.length);
}
