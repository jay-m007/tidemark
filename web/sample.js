// A made-up bookmarks file, so you can try the tool without exporting your own.
const rows = [
  ["Bookmarks bar", "https://github.com/vercel/next.js", "GitHub - vercel/next.js: The React Framework", 1580000000],
  ["Bookmarks bar", "https://www.github.com/vercel/next.js/?utm_source=newsletter&utm_medium=email", "next.js", 1620000000],
  ["Bookmarks bar", "https://news.ycombinator.com/", "Hacker News", 1560000000],
  ["Bookmarks bar", "https://news.ycombinator.com", "Hacker News", 1640000000],
  ["Bookmarks bar", "https://mail.google.com/mail/u/0/#inbox", "Inbox", 1550000000],
  ["Learning/JavaScript", "https://www.youtube.com/watch?v=PkZNo7MFNFg&feature=share", "Learn JavaScript - Full Course for Beginners", 1590000000],
  ["Learning/JavaScript", "https://youtu.be/PkZNo7MFNFg?si=a1B2c3", "Learn JavaScript - Full Course for Beginners", 1650000000],
  ["Learning/JavaScript", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", "JavaScript Guide - JavaScript | MDN", 1600000000],
  ["Learning/JavaScript", "https://javascript.info/", "The Modern JavaScript Tutorial", 1601000000],
  ["Learning/Python", "https://docs.python.org/3/tutorial/index.html", "The Python Tutorial — Python 3 documentation", 1602000000],
  ["Learning/Python", "https://realpython.com/python-f-strings/", "Python's F-String for String Interpolation and Formatting", 1603000000],
  ["Learning/Python", "https://realpython.com/python-f-strings/?utm_campaign=rss&utm_source=feedly", "Python's F-String for String Interpolation and Formatting", 1670000000],
  ["Learning", "https://leetcode.com/problemset/", "Problems - LeetCode", 1604000000],
  ["Learning", "https://www.coursera.org/learn/machine-learning", "Machine Learning | Coursera", 1605000000],
  ["Design", "https://www.figma.com/community", "Figma Community", 1606000000],
  ["Design", "https://dribbble.com/shots/popular", "Popular Shots on Dribbble", 1607000000],
  ["Design", "https://fonts.google.com/specimen/Inter", "Inter - Google Fonts", 1608000000],
  ["Design", "https://coolors.co/palettes/trending", "Trending Color Palettes", 1609000000],
  ["Shopping", "https://www.amazon.in/dp/B09G9HD6PD?tag=abc&ref=sr_1_3&th=1", "Apple iPhone 13 (128GB) - Amazon.in", 1610000000],
  ["Shopping", "https://www.flipkart.com/apple-iphone-13/p/itm6c601e0a58b3c", "Apple iPhone 13 (Blue, 128 GB)", 1611000000],
  ["Shopping", "https://www.myntra.com/sneakers", "Sneakers for Men - Myntra", 1612000000],
  ["Travel", "https://www.makemytrip.com/flights/", "Flight Booking - MakeMyTrip", 1613000000],
  ["Travel", "https://www.booking.com/city/in/goa.html?aid=123&label=gen173", "Hotels in Goa - Booking.com", 1614000000],
  ["Reading", "https://paulgraham.com/greatwork.html", "How to Do Great Work", 1615000000],
  ["Reading", "https://medium.com/@someone/why-i-quit-my-job-4f2a9", "Why I quit my job (and what happened next)", 1616000000],
  ["Reading", "https://medium.com/@someone/why-i-quit-my-job-4f2a9?source=rss------", "Why I quit my job (and what happened next)", 1617000000],
  ["Reading", "https://stratechery.com/", "Stratechery by Ben Thompson", 1618000000],
  ["Reading", "https://www.theverge.com/", "The Verge", 1619000000],
  ["Reading", "https://www.theverge.com/tech", "The Verge", 1619500000],
  ["Cooking", "https://www.youtube.com/watch?v=Q3x1F0sLyFo", "Butter Chicken Recipe | Easy Dinner", 1621000000],
  ["Cooking", "https://www.nytimes.com/recipes/1017060-simple-roast-chicken", "Simple Roast Chicken Recipe", 1622000000],
  ["Cooking", "https://www.nytimes.com/recipes/1017060-simple-roast-chicken?smid=url-share", "Simple Roast Chicken Recipe", 1623000000],
  ["Cooking", "https://www.bbc.co.uk/food/recipes/easy_pancakes_29860", "Easy pancakes recipe", 1624000000],
  ["Work", "https://notion.so/Roadmap-9f2c1a", "Roadmap", 1625000000],
  ["Work", "https://docs.google.com/spreadsheets/d/1AbCdEf/edit#gid=0", "Q3 budget", 1626000000],
  ["Work", "https://linear.app/team/active", "Active issues", 1627000000],
  ["Work", "https://vercel.com/dashboard", "Dashboard – Vercel", 1628000000],
  ["Work", "https://aws.amazon.com/console/", "AWS Management Console", 1629000000],
  ["Fitness", "https://www.strongerbyscience.com/", "Stronger By Science", 1630000000],
  ["Fitness", "https://www.youtube.com/watch?v=UItWltVZZmE&si=p0q9", "20 Minute Full Body Workout", 1631000000],
  ["Money", "https://www.investopedia.com/terms/s/sip.asp", "Systematic Investment Plan (SIP)", 1632000000],
  ["Money", "https://zerodha.com/varsity/", "Zerodha Varsity: stock market, investing", 1633000000],
  ["AI", "https://arxiv.org/abs/1706.03762", "[1706.03762] Attention Is All You Need", 1634000000],
  ["AI", "https://arxiv.org/abs/1706.03762?utm_source=twitter", "[1706.03762] Attention Is All You Need", 1635000000],
  ["AI", "https://huggingface.co/models", "Models - Hugging Face", 1636000000],
  ["AI", "https://platform.openai.com/docs/overview", "Overview - OpenAI API docs", 1637000000],
  ["Other bookmarks", "https://www.reddit.com/r/programming/", "r/programming", 1638000000],
  ["Other bookmarks", "https://twitter.com/jack/status/20?s=20&t=abc", "just setting up my twttr", 1639000000],
  ["Other bookmarks", "https://x.com/jack/status/20", "just setting up my twttr", 1639500000],
  ["Other bookmarks", "https://en.wikipedia.org/wiki/Bookmark_(digital)", "Bookmark (digital) - Wikipedia", 1641000000],
  ["Other bookmarks", "https://www.spotify.com/", "Spotify - Web Player", 1642000000],
  ["Other bookmarks", "https://example.com/old-link", "Example Domain", 1500000000],
  ["Other bookmarks", "https://example.com/old-link/", "Example Domain", 1510000000],
  ["Other bookmarks", "https://www.linkedin.com/in/jaymaurya", "Jay Maurya | LinkedIn", 1643000000],
  ["Other bookmarks", "https://github.com/jay-m007", "jay-m007 (bytebyjay)", 1644000000],
  ["Other bookmarks", "https://www.npmjs.com/package/express", "express - npm", 1645000000],
  ["Other bookmarks", "https://www.npmjs.com/package/express?activeTab=versions", "express - npm", 1646000000],
  ["Other bookmarks", "https://stackoverflow.com/questions/11227809", "Why is processing a sorted array faster? - Stack Overflow", 1647000000],
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export function sampleBookmarks() {
  const folders = new Map();
  for (const [f, url, title, t] of rows) {
    const path = f.split("/");
    let m = folders;
    for (const p of path) { if (!m.has(p)) m.set(p, { kids: new Map(), items: [] }); m = m.get(p).kids; }
    let node = null; let mm = folders;
    for (const p of path) { node = mm.get(p); mm = node.kids; }
    node.items.push(`<DT><A HREF="${esc(url)}" ADD_DATE="${t}">${esc(title)}</A>`);
  }
  const out = (m) => [...m].map(([name, n]) => `<DT><H3>${esc(name)}</H3>\n<DL><p>\n${out(n.kids)}${n.items.join("\n")}\n</DL><p>\n`).join("");
  return "<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<DL><p>\n" + out(folders) + "</DL><p>\n";
}
