// Suggests tags from where a link lives and what its title says. Plain rules, no AI, nothing sent anywhere.

const HOSTS = [
  [/(^|\.)(github\.com|gitlab\.com|bitbucket\.org|stackoverflow\.com|stackexchange\.com|codepen\.io|replit\.com|jsfiddle\.net)$/, "code"],
  [/(^|\.)(youtube\.com|youtu\.be|vimeo\.com|twitch\.tv)$/, "video"],
  [/(^|\.)(medium\.com|substack\.com|dev\.to|hashnode\.dev|blogspot\.com|wordpress\.com)$/, "reading"],
  [/(^|\.)(arxiv\.org|scholar\.google\.com|researchgate\.net|nature\.com|sciencedirect\.com|acm\.org|ieee\.org)$/, "research"],
  [/(^|\.)(developer\.mozilla\.org|docs\.[a-z0-9.-]+|readthedocs\.io|devdocs\.io|w3schools\.com)$/, "docs"],
  [/(^|\.)(amazon\.[a-z.]+|flipkart\.com|ebay\.com|etsy\.com|myntra\.com|aliexpress\.com)$/, "shopping"],
  [/(^|\.)(news\.ycombinator\.com|bbc\.com|nytimes\.com|theguardian\.com|reuters\.com|techcrunch\.com|theverge\.com)$/, "news"],
  [/(^|\.)(reddit\.com|twitter\.com|x\.com|linkedin\.com|facebook\.com|instagram\.com|discord\.com)$/, "social"],
  [/(^|\.)(figma\.com|dribbble\.com|behance\.net|canva\.com|awwwards\.com)$/, "design"],
  [/(^|\.)(npmjs\.com|pypi\.org|crates\.io|pkg\.go\.dev|packagist\.org)$/, "packages"],
  [/(^|\.)(wikipedia\.org|britannica\.com)$/, "reference"],
  [/(^|\.)(coursera\.org|udemy\.com|edx\.org|khanacademy\.org|freecodecamp\.org|leetcode\.com|hackerrank\.com)$/, "learning"],
  [/(^|\.)(spotify\.com|soundcloud\.com|music\.apple\.com)$/, "music"],
  [/(^|\.)(maps\.google\.com|booking\.com|airbnb\.com|tripadvisor\.com|makemytrip\.com)$/, "travel"],
  [/(^|\.)(docs\.google\.com|drive\.google\.com|notion\.so|dropbox\.com|onedrive\.live\.com)$/, "files"],
  [/(^|\.)(vercel\.com|netlify\.com|aws\.amazon\.com|cloud\.google\.com|azure\.microsoft\.com|heroku\.com)$/, "cloud"],
];

const WORDS = [
  [/\b(tutorial|course|learn|lesson|guide|how to|crash course|beginner)\b/i, "learning"],
  [/\b(recipe|cooking|baking|meal|dinner|breakfast)\b/i, "food"],
  [/\b(job|jobs|career|careers|hiring|resume|internship)\b/i, "jobs"],
  [/\b(api|sdk|cli|framework|library|documentation|docs)\b/i, "dev"],
  [/\b(template|templates|boilerplate|starter)\b/i, "templates"],
  [/\b(pricing|plans|buy|deal|discount|sale)\b/i, "shopping"],
  [/\b(travel|flight|flights|hotel|itinerary|trip)\b/i, "travel"],
  [/\b(workout|fitness|gym|exercise|nutrition|diet)\b/i, "health"],
  [/\b(movie|film|series|trailer|anime)\b/i, "watch"],
  [/\b(podcast|episode)\b/i, "listen"],
  [/\b(ai|llm|gpt|machine learning|neural|prompt)\b/i, "ai"],
  [/\b(design|ui|ux|typography|palette|icons?)\b/i, "design"],
  [/\b(security|vulnerability|cve|exploit|bug bounty)\b/i, "security"],
  [/\b(finance|invest|stock|mutual fund|tax|budget)\b/i, "money"],
];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Up to four tags that the bookmark does not have yet. */
export function suggestTags(b) {
  const out = [];
  const add = (t) => { if (t && t.length < 25 && !out.includes(t) && !b.tags.includes(t)) out.push(t); };
  for (const f of b.folder) {
    const s = slug(f);
    if (s && !/^(bookmarks?|bookmarks-bar|bookmarks-toolbar|other-bookmarks|mobile-bookmarks|favorites|unsorted)$/.test(s)) add(s);
  }
  for (const [re, tag] of HOSTS) if (re.test(b.host)) add(tag);
  const hay = b.title + " " + decodeURIComponent((() => { try { return new URL(b.url).pathname.replace(/[-_/]+/g, " "); } catch { return ""; } })());
  for (const [re, tag] of WORDS) if (re.test(hay)) add(tag);
  return out.slice(0, 4);
}
