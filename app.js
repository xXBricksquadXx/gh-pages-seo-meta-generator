import base64url from "./lib/base64url.js";

const $ = (sel, root = document) => root.querySelector(sel);
const byId = (id) => document.getElementById(id);

const form = byId("seoForm");
const out = byId("output");
const robotsOut = byId("robotsOut");
const sitemapOut = byId("sitemapOut");
const statusEl = byId("status");

const btnCopy = byId("btnCopy");
const btnDownload = byId("btnDownload");
const btnShare = byId("btnShare");
const btnExample = byId("btnExample");
const btnReset = byId("btnReset");

if (!form || !out || !robotsOut || !sitemapOut || !statusEl) {
  throw new Error("Required DOM nodes missing. Check index.html ids.");
}

const FIELD_IDS = [
  "title",
  "description",
  "canonical",
  "siteName",
  "ogImage",
  "twitter",
  "themeColor",
  "lang",
];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function cleanTwitter(handle) {
  const h = String(handle ?? "").trim();
  if (!h) return "";
  return h.startsWith("@") ? h : `@${h}`;
}

function clampLang(lang) {
  const l = String(lang ?? "").trim();
  return l || "en";
}

function normalizeUrl(url) {
  const raw = String(url ?? "").trim();
  if (!raw) return "";
  try {
    return new URL(raw).toString();
  } catch {
    return raw;
  }
}

function setStatus(msg) {
  statusEl.textContent = msg || "";
}

function countHint(id) {
  const field = byId(id);
  const counter = $(`[data-count-for="${id}"]`);
  if (!field || !counter) return;
  counter.textContent = String(field.value.length);
}

function getData() {
  const fd = new FormData(form);

  return {
    title: String(fd.get("title") || "").trim(),
    description: String(fd.get("description") || "").trim(),
    canonical: normalizeUrl(fd.get("canonical")),
    siteName: String(fd.get("siteName") || "").trim(),
    ogImage: normalizeUrl(fd.get("ogImage")),
    twitter: cleanTwitter(fd.get("twitter")),
    themeColor: String(fd.get("themeColor") || "").trim(),
    lang: clampLang(fd.get("lang")),
  };
}

function toHeadSnippet(d) {
  const lines = [];

  lines.push(`<title>${escapeHtml(d.title)}</title>`);
  lines.push(`<meta name="description" content="${escapeHtml(d.description)}" />`);
  if (d.canonical) lines.push(`<link rel="canonical" href="${escapeHtml(d.canonical)}" />`);
  if (d.themeColor) lines.push(`<meta name="theme-color" content="${escapeHtml(d.themeColor)}" />`);

  lines.push(`<meta property="og:title" content="${escapeHtml(d.title)}" />`);
  lines.push(`<meta property="og:description" content="${escapeHtml(d.description)}" />`);
  if (d.canonical) lines.push(`<meta property="og:url" content="${escapeHtml(d.canonical)}" />`);
  if (d.siteName) lines.push(`<meta property="og:site_name" content="${escapeHtml(d.siteName)}" />`);
  lines.push(`<meta property="og:type" content="website" />`);
  if (d.ogImage) lines.push(`<meta property="og:image" content="${escapeHtml(d.ogImage)}" />`);

  const card = d.ogImage ? "summary_large_image" : "summary";
  lines.push(`<meta name="twitter:card" content="${card}" />`);
  if (d.twitter) lines.push(`<meta name="twitter:site" content="${escapeHtml(d.twitter)}" />`);
  lines.push(`<meta name="twitter:title" content="${escapeHtml(d.title)}" />`);
  lines.push(`<meta name="twitter:description" content="${escapeHtml(d.description)}" />`);
  if (d.ogImage) lines.push(`<meta name="twitter:image" content="${escapeHtml(d.ogImage)}" />`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", name: d.siteName || d.title, url: d.canonical || undefined },
      {
        "@type": "WebPage",
        name: d.title,
        description: d.description,
        url: d.canonical || undefined,
        inLanguage: d.lang,
      },
    ],
  };

  const cleaned = JSON.parse(JSON.stringify(jsonLd));
  let json = JSON.stringify(cleaned);
  json = json.replaceAll("</script", "<\\/script"); // avoid accidental tag close

  lines.push(`<script type="application/ld+json">${json}</script>`);
  return lines.join("\n");
}

function toRobotsTxt(d) {
  if (!d.canonical) return "User-agent: *\nAllow: /\n";
  const base = d.canonical.replace(/\/?$/, "/");
  return `User-agent: *\nAllow: /\n\nSitemap: ${base}sitemap.xml\n`;
}

function toSitemapXml(d) {
  if (!d.canonical) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>https://example.com/</loc>\n  </url>\n</urlset>\n`;
  }
  const loc = d.canonical.replace(/\/?$/, "/");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${escapeHtml(loc)}</loc>\n  </url>\n</urlset>\n`;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}

function applyData(d) {
  if (!d || typeof d !== "object") return;

  const set = (id, val) => {
    const el = byId(id);
    if (!el) return;
    if (typeof val === "string") el.value = val;
  };

  set("title", d.title);
  set("description", d.description);
  set("canonical", d.canonical);
  set("siteName", d.siteName);
  set("ogImage", d.ogImage);
  set("twitter", d.twitter);
  set("themeColor", d.themeColor);
  set("lang", d.lang);
}

function render() {
  const d = getData();

  out.textContent = toHeadSnippet(d);
  robotsOut.textContent = toRobotsTxt(d);
  sitemapOut.textContent = toSitemapXml(d);

  countHint("title");
  countHint("description");

  const warnings = [];
  if (d.title.length > 60) warnings.push("Title is over ~60 chars.");
  if (d.description.length > 160) warnings.push("Description is over ~160 chars.");
  setStatus(warnings.join(" "));
}

function loadExample() {
  applyData({
    title: "GitHub SEO Meta Generator — fast meta tags for Pages",
    description:
      "Generate SEO-friendly <head> tags (Open Graph, Twitter cards, JSON-LD) for GitHub Pages and copy them in one click.",
    canonical: "https://username.github.io/repo/",
    siteName: "username.github.io",
    ogImage: "https://username.github.io/repo/og.png",
    twitter: "@yourhandle",
    themeColor: "#0b1020",
    lang: "en",
  });
  render();
}

function toShareUrl() {
  const payload = { v: 1, d: getData() };
  const encoded = base64url.encode(JSON.stringify(payload));
  const url = new URL(window.location.href);
  url.hash = `config=${encoded}`;
  return url.toString();
}

function tryLoadFromHash() {
  const hash = String(window.location.hash || "").replace(/^#/, "");
  if (!hash.startsWith("config=")) return false;

  const encoded = hash.slice("config=".length);
  try {
    const raw = base64url.decode(encoded);
    const payload = JSON.parse(raw);
    if (!payload?.d) return false;

    applyData(payload.d);
    return true;
  } catch {
    return false;
  }
}

/* ---------------- events ---------------- */

form.addEventListener("input", render);

form.addEventListener("reset", () => {
  // after the browser resets form fields, re-render
  window.location.hash = "";
  setStatus("");
  requestAnimationFrame(render);
});

btnCopy?.addEventListener("click", async () => {
  const ok = await copyText(out.textContent || "");
  setStatus(ok ? "Copied to clipboard." : "Copy failed.");
});

btnDownload?.addEventListener("click", () => {
  const d = getData();
  const head = toHeadSnippet(d);

  const template = `<!doctype html>
<html lang="${escapeHtml(d.lang)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
${head.split("\n").map((l) => `    ${l}`).join("\n")}
  </head>
  <body>
    <main>
      <h1>${escapeHtml(d.title)}</h1>
      <p>${escapeHtml(d.description)}</p>
    </main>
  </body>
</html>
`;

  const blob = new Blob([template], { type: "text/html;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "template.html";
  a.click();
  URL.revokeObjectURL(a.href);
});

btnShare?.addEventListener("click", async () => {
  const url = toShareUrl();
  window.location.hash = new URL(url).hash;

  const ok = await copyText(url);
  setStatus(ok ? "Share URL copied." : "Share URL created (copy manually from address bar).");
});

btnExample?.addEventListener("click", loadExample);

// On load
if (!tryLoadFromHash()) loadExample();
render();
