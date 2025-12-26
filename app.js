import base64url from "./lib/base64url.js";
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
function cleanTwitter(handle) {
  const h = String(handle || "").trim();
  if (!h) return "";
  return h.startsWith("@") ? h : `@${h}`;
}
function clampLang(lang) {
  const l = String(lang || "").trim();
  return l || "en";
}
function normalizeUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  try {
    return new URL(raw).toString();
  } catch {
    return raw;
  }
}
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
function countHint(id, value) {
  const el = document.querySelector(`[data-count-for="${id}"]`);
  if (!el) return;
  el.textContent = String(value.length);
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
  lines.push(
    `<meta name="description" content="${escapeHtml(d.description)}" />`
  );
  if (d.canonical)
    lines.push(`<link rel="canonical" href="${escapeHtml(d.canonical)}" />`);
  if (d.themeColor)
    lines.push(
      `<meta name="theme-color" content="${escapeHtml(d.themeColor)}" />`
    );
  lines.push(`<meta property="og:title" content="${escapeHtml(d.title)}" />`);
  lines.push(
    `<meta property="og:description" content="${escapeHtml(d.description)}" />`
  );
  if (d.canonical)
    lines.push(
      `<meta property="og:url" content="${escapeHtml(d.canonical)}" />`
    );
  if (d.siteName)
    lines.push(
      `<meta property="og:site_name" content="${escapeHtml(d.siteName)}" />`
    );
  lines.push(`<meta property="og:type" content="website" />`);
  if (d.ogImage)
    lines.push(
      `<meta property="og:image" content="${escapeHtml(d.ogImage)}" />`
    );
  const card = d.ogImage ? "summary_large_image" : "summary";
  lines.push(`<meta name="twitter:card" content="${card}" />`);
  if (d.twitter)
    lines.push(
      `<meta name="twitter:site" content="${escapeHtml(d.twitter)}" />`
    );
  lines.push(`<meta name="twitter:title" content="${escapeHtml(d.title)}" />`);
  lines.push(
    `<meta name="twitter:description" content="${escapeHtml(d.description)}" />`
  );
  if (d.ogImage)
    lines.push(
      `<meta name="twitter:image" content="${escapeHtml(d.ogImage)}" />`
    );
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: d.siteName || d.title,
        url: d.canonical || undefined,
      },
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
  lines.push(
    `<script type="application/ld+json">${JSON.stringify(cleaned)}</script>`
  );
  return lines.join("\n");
}
function toRobotsTxt(d) {
  if (!d.canonical) return "User-agent: *\nAllow: /\n";
  const base = d.canonical.replace(/\/?$/, "/");
  return `User-agent: *\nAllow: /\n\nSitemap: ${base}sitemap.xml\n`;
}
function toSitemapXml(d) {
  const loc = d.canonical
    ? d.canonical.replace(/\/?$/, "/")
    : "https://example.com/";
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeHtml(loc)}</loc>
  </url>
</urlset>
`;
}
function setStatus(msg) {
  statusEl.textContent = msg || "";
}
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}
function render() {
  const d = getData();
  out.textContent = toHeadSnippet(d);
  robotsOut.textContent = toRobotsTxt(d);
  sitemapOut.textContent = toSitemapXml(d);
  countHint("title", d.title);
  countHint("description", d.description);
  const warnings = [];
  if (d.title.length > 60) warnings.push("Title is over ~60 chars.");
  if (d.description.length > 160)
    warnings.push("Description is over ~160 chars.");
  setStatus(warnings.join(" "));
}
function loadExample() {
  byId("title").value = "GitHub SEO Meta Generator - generate meta tags fast";
  byId("description").value =
    "Generate SEO-friendly meta tags (Open Graph, Twitter cards, JSON-LD) for GitHub Pages and copy them in one click.";
  byId("canonical").value = "https://username.github.io/repo/";
  byId("siteName").value = "username.github.io";
  byId("ogImage").value = "https://username.github.io/repo/og.png";
  byId("twitter").value = "@yourhandle";
  byId("themeColor").value = "#0b1020";
  byId("lang").value = "en";
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
    if (!payload || !payload.d) return false;
    const d = payload.d;
    if (typeof d.title === "string") byId("title").value = d.title;
    if (typeof d.description === "string")
      byId("description").value = d.description;
    if (typeof d.canonical === "string") byId("canonical").value = d.canonical;
    if (typeof d.siteName === "string") byId("siteName").value = d.siteName;
    if (typeof d.ogImage === "string") byId("ogImage").value = d.ogImage;
    if (typeof d.twitter === "string") byId("twitter").value = d.twitter;
    if (typeof d.themeColor === "string")
      byId("themeColor").value = d.themeColor;
    if (typeof d.lang === "string") byId("lang").value = d.lang;
    return true;
  } catch {
    return false;
  }
}
form.addEventListener("input", render);
btnCopy.addEventListener("click", async () => {
  const ok = await copyText(out.textContent || "");
  setStatus(ok ? "Copied to clipboard." : "Copy failed.");
});
btnDownload.addEventListener("click", () => {
  const d = getData();
  const head = toHeadSnippet(d);
  const template = `<!doctype html>
<html lang="${escapeHtml(d.lang)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
${head
  .split("\n")
  .map((l) => "    " + l)
  .join("\n")}
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
btnShare.addEventListener("click", async () => {
  const url = toShareUrl();
  window.location.hash = new URL(url).hash;
  const ok = await copyText(url);
  setStatus(ok ? "Share URL copied." : "Share URL created.");
});
btnExample.addEventListener("click", loadExample);
btnReset.addEventListener("click", () => {
  window.location.hash = "";
  setStatus("");
  requestAnimationFrame(render);
});
if (!tryLoadFromHash()) loadExample();
render();
