// Writes the cleaned bookmarks back out. The HTML file imports into Chrome, Edge, Firefox, Safari and Brave.

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function tree(list) {
  const root = { name: "", kids: new Map(), items: [] };
  for (const b of list) {
    let n = root;
    for (const f of b.folder) {
      if (!n.kids.has(f)) n.kids.set(f, { name: f, kids: new Map(), items: [] });
      n = n.kids.get(f);
    }
    n.items.push(b);
  }
  return root;
}

function node(n, pad, lines) {
  for (const [name, kid] of n.kids) {
    lines.push(pad + "<DT><H3>" + esc(name) + "</H3>");
    lines.push(pad + "<DL><p>");
    node(kid, pad + "    ", lines);
    lines.push(pad + "</DL><p>");
  }
  for (const b of n.items) {
    const add = b.added ? ' ADD_DATE="' + Math.floor(b.added / 1000) + '"' : "";
    const tags = b.tags.length ? ' TAGS="' + esc(b.tags.join(",")) + '"' : "";
    lines.push(pad + '<DT><A HREF="' + esc(b.url) + '"' + add + tags + ">" + esc(b.title) + "</A>");
    if (b.note) lines.push(pad + "<DD>" + esc(b.note));
  }
}

export function toNetscape(list) {
  const lines = [
    "<!DOCTYPE NETSCAPE-Bookmark-file-1>",
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    "<TITLE>Bookmarks</TITLE>",
    "<H1>Bookmarks</H1>",
    "<DL><p>",
  ];
  node(tree(list), "    ", lines);
  lines.push("</DL><p>");
  return lines.join("\n") + "\n";
}

const csvCell = (s) => {
  let v = String(s);
  if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; // stops spreadsheets from running a title as a formula
  return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
};

export function toCSV(list) {
  const rows = [["title", "url", "folder", "tags", "added", "note"]];
  for (const b of list) rows.push([b.title, b.url, b.folder.join(" / "), b.tags.join(" "), b.added ? new Date(b.added).toISOString().slice(0, 10) : "", b.note]);
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

export function toJSON(list) {
  return JSON.stringify(list.map(({ title, url, folder, tags, added, note }) => ({ title, url, folder, tags, added: added ? new Date(added).toISOString() : null, note })), null, 2);
}
