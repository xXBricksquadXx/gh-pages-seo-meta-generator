import base64url from "./lib/base64url.js";

const $ = (sel) => document.querySelector(sel);

const form = $("#seoForm");
const out = $("#output");
const robotsOut = $("#robotsOut");
const sitemapOut = $("#sitemapOut");
const status = $("#status");

const btnCopy = $("#btnCopy");
const btnDownload = $("#btnDownload");
const btnShare = $("#btnShare");
const btnExample = $("#btnExample");

function cleanTwitter(handle) {
  const h = String(handle || "").trim();
  if (!h) return "";
  return h.startsWith("@") ? h : ("@" + h);
}

function clampLang(lang) {
  const l = String(lang || "").trim();
  return l || "en";
}

function normalizeUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  try { return new URL(raw).toString(); } catch { return raw; }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("\u0027", "&#39;");
}

function countHint(id, target) {
  const el = document.querySelector("[data-count-for=\\"" + id + "\\"]");
  if (!el) return;
  el.textContent = String(target.value.length);
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
  lines.push("<title>" + escapeHtml(d.title) + "</title>");
  lines.push("<meta name=\\"description\\" content=\\"" + escapeHtml(d.description) + "\\" />");
  if (d.canonical) lines.push("<link rel=\\"canonical\\" href=\\"" + escapeHtml(d.canonical) + "\\" />");
  if (d.themeColor) lines.push("<meta name=\\"theme-color\\" content=\\"" + escapeHtml(d.themeColor) + "\\" />");

  lines.push("<meta property=\\"og:title\\" content=\\"" + escapeHtml(d.title) + "\\" />");
  lines.push("<meta property=\\"og:description\\" content=\\"" + escapeHtml(d.description) + "\\" />");
  if (d.canonical) lines.push("<meta property=\\"og:url\\" content=\\"" + escapeHtml(d.canonical) + "\\" />");
  if (d.siteName) lines.push("<meta property=\\"og:site_name\\" content=\\"" + escapeHtml(d.siteName) + "\\" />");
  lines.push("<meta property=\\"og:type\\" content=\\"website\\" />");
  if (d.ogImage) lines.push("<meta property=\\"og:image\\" content=\\"" + escapeHtml(d.ogImage) + "\\" />");

  const card = d.ogImage ? "summary_large_image" : "summary";
  lines.push("<meta name=\\"twitter:card\\" content=\\"" + card + "\\" />");
  if (d.twitter) lines.push("<meta name=\\"twitter:site\\" content=\\"" + escapeHtml(d.twitter) + "\\" />");
  lines.push("<meta name=\\"twitter:title\\" content=\\"" + escapeHtml(d.title) + "\\" />");
  lines.push("<meta name=\\"twitter:description\\" content=\\"" + escapeHtml(d.description) + "\\" />");
  if (d.ogImage) lines.push("<meta name=\\"twitter:image\\" content=\\"" + escapeHtml(d.ogImage) + "\\" />");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", name: d.siteName || d.title, url: d.canonical || undefined },
      { "@type": "WebPage", name: d.title, description: d.description, url: d.canonical || undefined, inLanguage: d.lang },
    ],
  };

  const cleaned = JSON.parse(JSON.stringify(jsonLd));
  lines.push("<script type=\\"application/ld+json\\">" + JSON.stringify(cleaned) + "</script>");
  return lines.join("\\n");
}

function toRobotsTxt(d) {
  if (!d.canonical) return "User-agent: *\\nAllow: /\\n";
  const base = d.canonical.replace(/\\/?$/, "/");
  return "User-agent: *\\nAllow: /\\n\\nSitemap: " + base + "sitemap.xml\\n";
}

function toSitemapXml(d) {
  if (!d.canonical) {
    return "<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>\\n<urlset xmlns=\\"http://www.sitemaps.org/schemas/sitemap/0.9\\">\\n  <url>\\n    <loc>https://example.com/</loc>\\n  </url>\\n</urlset>\\n";
  }
  const loc = d.canonical.replace(/\\/?$/, "/");
  return "<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>\\n<urlset xmlns=\\"http://www.sitemaps.org/schemas/sitemap/0.9\\">\\n  <url>\\n    <loc>" + escapeHtml(loc) + "</loc>\\n  </url>\\n</urlset>\\n";
}

function setStatus(msg) { status.textContent = msg; }

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
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
  countHint("title", $("#title"));
  countHint("description", $("#description"));
  const warnings = [];
  if (d.title.length > 60) warnings.push("Title is over about 60 chars.");
  if (d.description.length > 160) warnings.push("Description is over about 160 chars.");
  setStatus(warnings.join(" "));
}

function loadExample() {
  $("#title").value = "GitHub SEO Meta Generator - generate meta tags fast";
  $("#description").value = "Generate SEO-friendly meta tags (Open Graph, Twitter cards, JSON-LD) for GitHub Pages and copy them in one click.";
  $("#canonical").value = "https://username.github.io/repo/";
  $("#siteName").value = "username.github.io";
  $("#ogImage").value = "https://username.github.io/repo/og.png";
  $("#twitter").value = "@yourhandle";
  $("#themeColor").value = "#0b1020";
  $("#lang").value = "en";
  render();
}

function toShareUrl() {
  const payload = { v: 1, d: getData() };
  const encoded = base64url.encode(JSON.stringify(payload));
  const url = new URL(window.location.href);
  url.hash = "config=" + encoded;
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
    if (typeof d.title === "string") $("#title").value = d.title;
    if (typeof d.description === "string") $("#description").value = d.description;
    if (typeof d.canonical === "string") $("#canonical").value = d.canonical;
    if (typeof d.siteName === "string") $("#siteName").value = d.siteName;
    if (typeof d.ogImage === "string") $("#ogImage").value = d.ogImage;
    if (typeof d.twitter === "string") $("#twitter").value = d.twitter;
    if (typeof d.themeColor === "string") $("#themeColor").value = d.themeColor;
    if (typeof d.lang === "string") $("#lang").value = d.lang;
    return true;
  } catch { return false; }
}

form.addEventListener("input", render);
btnCopy.addEventListener("click", async () => {
  const ok = await copyText(out.textContent);
  setStatus(ok ? "Copied to clipboard." : "Copy failed.");
});

btnDownload.addEventListener("click", () => {
  const d = getData();
  const head = toHeadSnippet(d);
  const template = "<!doctype html>\\n<html lang=\\"" + escapeHtml(d.lang) + "\\">\\n  <head>\\n    <meta charset=\\"utf-8\\" />\\n    <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1\\" />\\n" +
    head.split("\\n").map((l) => "    " + l).join("\\n") +
    "\\n  </head>\\n  <body>\\n    <main>\\n      <h1>" + escapeHtml(d.title) + "</h1>\\n      <p>" + escapeHtml(d.description) + "</p>\\n    </main>\\n  </body>\\n</html>\\n";
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
$("#btnReset").addEventListener("click", () => {
  window.location.hash = "";
  setStatus("");
  requestAnimationFrame(render);
});

if (!tryLoadFromHash()) loadExample();
render();
