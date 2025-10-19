const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const glob = require("glob");
const { XMLParser } = require("fast-xml-parser");

const rootDir = path.join(__dirname, "..");
const outputFilePath = path.join(rootDir, "assets", "js", "search-data.json");
const sitemapPath = path.join(rootDir, "sitemap.xml");
const synonymsPath = path.join(rootDir, "assets", "js", "synonyms.json");
const breadcrumbMapPath = path.join(rootDir, "templates", "breadcrumb.html");

console.log("Starting search index build...");

// --- Helper Functions ---

/**
 * Normalizes Vietnamese strings for searching.
 * @param {string} str The string to normalize.
 * @returns {string} Normalized string.
 */
function normalizeString(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

/**
 * Extracts course code from a string.
 * @param {string} text The text to search within.
 * @returns {string|null} The course code or null.
 */
function extractCourseCode(text) {
  const match = text.match(/\b([A-Z]{2,}\d{3,})\b/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Guesses document type from URL or title.
 * @param {string} url The URL of the document.
 * @param {string} title The title of the document.
 * @returns {string} The guessed document type.
 */
function guessDocType(url, title) {
  const lowerUrl = url.toLowerCase();
  const lowerTitle = title.toLowerCase();

  if (
    lowerUrl.includes("/slides/") ||
    lowerTitle.includes("slide") ||
    lowerTitle.includes("bài giảng")
  )
    return "powerpoint";
  if (lowerTitle.includes(".pdf") || lowerUrl.includes("-viewer.html"))
    return "pdf";
  if (lowerTitle.includes(".docx")) return "word";
  if (
    lowerTitle.includes("link") ||
    lowerTitle.includes("trang web") ||
    lowerTitle.includes("hackerrank")
  )
    return "link";
  if (lowerTitle.includes("video")) return "video";
  if (lowerUrl.match(/cntt-[a-z]+\.html$/)) return "subject";
  if (lowerUrl.match(/(ts_|pgs_ts_|gv)([a-z_]+)\.html$/i)) return "teacher";
  if (lowerTitle.startsWith("tuần")) return "powerpoint";
  if (lowerTitle.includes("đề thi")) return "exam";
  if (lowerTitle.includes("giáo trình")) return "textbook";

  return "page";
}

/**
 * Reads last modification dates from sitemap.xml if it exists.
 * @returns {Map<string, string>} A map of URL to lastmod date.
 */
function getLastModMap() {
  if (!fs.existsSync(sitemapPath)) {
    return new Map();
  }
  const sitemapContent = fs.readFileSync(sitemapPath, "utf-8");
  const parser = new XMLParser();
  const sitemapObj = parser.parse(sitemapContent);
  const urlMap = new Map();

  if (sitemapObj.urlset && sitemapObj.urlset.url) {
    for (const urlEntry of sitemapObj.urlset.url) {
      const relativeUrl = new URL(urlEntry.loc).pathname;
      urlMap.set(relativeUrl, urlEntry.lastmod);
    }
  }
  return urlMap;
}

/**
 * Scans all HTML files to build a map of URL -> Anchor Text.
 * @param {string} rootDir The root directory of the project.
 * @returns {Map<string, string>} A map of relative URL to its most descriptive anchor text.
 */
function buildAnchorTextMap(rootDir) {
  console.log("Pre-scanning for anchor texts...");
  const anchorTextMap = new Map();
  const allHtmlFiles = glob.sync("**/*.html", {
    cwd: rootDir,
    ignore: ["scripts/**"],
  });
  for (const file of allHtmlFiles) {
    const content = fs.readFileSync(path.join(rootDir, file), "utf-8");
    const dom = new JSDOM(content);
    dom.window.document.querySelectorAll("a[href]").forEach((a) => {
      try {
        const href = new URL(a.href, `file://${path.join(rootDir, file)}`)
          .pathname;
        if (href.endsWith(".html") && a.textContent.trim()) {
          const cleanHref = href.replace(/\\/g, "/");
          if (
            !anchorTextMap.has(cleanHref) ||
            a.textContent.trim().length >
              (anchorTextMap.get(cleanHref) || "").length
          ) {
            anchorTextMap.set(cleanHref, a.textContent.trim());
          }
        }
      } catch (e) {
        // Ignore invalid URLs
      }
    });
  }
  console.log(`Found anchor texts for ${anchorTextMap.size} unique URLs.`);
  return anchorTextMap;
}

async function main() {
  let existingIndex = [];
  const existingIndexMap = new Map();
  if (fs.existsSync(outputFilePath)) {
    try {
      existingIndex = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
      existingIndex.forEach((doc) => existingIndexMap.set(doc.url, doc));
      console.log(
        `Found existing index with ${existingIndex.length} documents.`
      );
    } catch (e) {
      console.warn(
        "Could not parse existing search index. Building from scratch."
      );
      existingIndex = [];
    }
  }

  const newSearchIndex = [];
  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  const lastModMap = getLastModMap();
  const synonymsContent = fs.readFileSync(synonymsPath, "utf-8");
  const synonyms = JSON.parse(synonymsContent);
  const labelMap = new Map();
  try {
    const breadcrumbContent = fs.readFileSync(breadcrumbMapPath, "utf-8");
    const regex = /"([^"]+)":\s*"([^"]+)"/g;
    let match;
    while ((match = regex.exec(breadcrumbContent)) !== null) {
      labelMap.set(match[1], match[2]);
    }
  } catch (e) {
    console.warn("Could not read or parse breadcrumb.html for labels.");
  }

  const anchorTextMap = buildAnchorTextMap(rootDir);

  // --- REVISED: Rely ONLY on glob to find files for accurate paths ---
  const allFilePaths = glob.sync("**/*.html", {
    cwd: rootDir,
    ignore: [
      "templates/header.html",
      "templates/footer.html",
      "templates/breadcrumb.html",
      "docs/search/search-results.html",
      "scripts/**",
      "assets/**",
      "vendor/**",
      ".vs/**",
    ],
  });

  const allUrls = allFilePaths.map((f) => `/${f.replace(/\\/g, "/")}`);
  console.log(`Found ${allUrls.length} unique URLs to process from file scan.`);

  for (const url of allUrls) {
    const file = url.substring(1);
    const filePath = path.join(rootDir, file);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      continue;
    }

    const stats = fs.statSync(filePath);
    const fileMtime = stats.mtime.toISOString().split("T")[0];
    const lastmod = lastModMap.get(url) || fileMtime;

    const existingDoc = existingIndexMap.get(url);
    if (existingDoc && existingDoc.lastmod === lastmod) {
      newSearchIndex.push(existingDoc);
      skippedCount++;
      continue;
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const dom = new JSDOM(fileContent);
    const document = dom.window.document;

    const h1Title = document.querySelector("h1")?.textContent.trim();
    const anchorTitle = anchorTextMap.get(url);
    const tagTitle = document.querySelector("title")?.textContent.trim() || "";

    let title = (anchorTitle || h1Title || tagTitle)
      .replace(/ - Stu(Share|Hub)$/, "")
      .trim();

    if (!title) {
      const fileName = path.basename(filePath);
      const baseName = fileName.replace(/\.html$/, "");
      title = labelMap.get(fileName) || labelMap.get(baseName) || "";
    }

    if (!title || /kết quả tìm kiếm/i.test(title)) continue;

    const metaDescription =
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content") || "";
    const breadcrumbItems = Array.from(
      document.querySelectorAll("#breadcrumb-list li")
    );
    const breadcrumbPath = breadcrumbItems
      .map((li) => li.textContent.trim())
      .join(" > ");
    const headings = Array.from(
      document.querySelectorAll("h1, h2, h3, .document-note span")
    )
      .map((h) => h.textContent.trim())
      .join(" ");
    const documentItemText = Array.from(
      document.querySelectorAll(".document-item span, .document-item h3")
    )
      .map((el) => el.textContent.trim())
      .join(" ");
    const metaKeywords =
      document
        .querySelector('meta[name="keywords"]')
        ?.getAttribute("content") || "";
    const pathSegments = file.split(path.sep);
    const university = pathSegments.includes("uet")
      ? "Đại học Công nghệ - ĐHQGHN"
      : "Khác";

    let courseName = "";
    let courseCode = extractCourseCode(title) || extractCourseCode(file);
    const courseMatch = file.match(/(cntt-[a-z]+)/);

    if (courseMatch && labelMap.has(courseMatch[1])) {
      courseName = labelMap.get(courseMatch[1]);
    }

    const lecturerMatch = file.match(/(TS_|PGS_TS_|GV)([A-Za-z_]+)/);
    const lecturer = lecturerMatch
      ? lecturerMatch[0].replace(/_/g, " ").replace(".html", "")
      : "";
    const docType = guessDocType(url, title);
    let entityType = "page";
    let parentEntityUrl = null;

    if (title.toLowerCase().includes("đề thi")) entityType = "exam";
    else if (title.toLowerCase().includes("giáo trình"))
      entityType = "textbook";
    else if (docType === "subject" || docType === "teacher")
      entityType = "courseLecturer";
    else if (
      docType === "powerpoint" ||
      title.toLowerCase().startsWith("tuần")
    ) {
      entityType = "slide";
      const pathParts = file.split(path.sep);
      if (pathParts.length > 3) {
        const parentDir = path.dirname(url);
        const lecturerPageName = pathParts.find((p) =>
          p.match(/(TS_|PGS_TS_|GV)/)
        );
        if (lecturerPageName) {
          parentEntityUrl = `${parentDir}/${lecturerPageName}`;
        } else {
          parentEntityUrl = `${path.dirname(parentDir)}/${path.basename(
            path.dirname(parentDir)
          )}.html`;
        }
      }
    }

    let tags = metaKeywords
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (docType) tags.push(docType);
    if (courseCode) tags.push(courseCode);
    tags = [...new Set(tags)];

    let keywords = [
      title,
      metaDescription,
      courseName,
      courseCode,
      lecturer,
      documentItemText,
      ...tags,
    ]
      .filter(Boolean)
      .join(" ");

    Object.entries(synonyms).forEach(([key, values]) => {
      if (normalizeString(keywords).includes(normalizeString(key))) {
        keywords += " " + values.join(" ");
      }
    });
    keywords = [...new Set(keywords.split(/\s+/).filter(Boolean))].join(" ");

    const newDoc = {
      id: url,
      url: url,
      title: title,
      description: metaDescription,
      path: breadcrumbPath,
      headings: headings,
      tags: tags,
      keywords: keywords,
      type: docType,
      university: university,
      courseName: courseName,
      courseCode: courseCode,
      lecturer: lecturer,
      lastmod: lastmod,
      ogImage: "",
      entityType: entityType,
      parentEntityUrl: parentEntityUrl,
    };
    newSearchIndex.push(newDoc);

    if (existingDoc) {
      updatedCount++;
    } else {
      addedCount++;
    }
  }

  console.log("\n--- Indexing Report ---");
  console.log(`- Total documents processed: ${allUrls.length}`);
  console.log(`- ✅ Added: ${addedCount}`);
  console.log(`- 🔄 Updated: ${updatedCount}`);
  console.log(`- ⏩ Skipped (unchanged): ${skippedCount}`);

  if (addedCount === 0 && updatedCount === 0) {
    console.log("\n✅ No changes detected. Index is already up-to-date.");
  } else {
    fs.writeFileSync(outputFilePath, JSON.stringify(newSearchIndex, null, 2));
    console.log(
      `\n✅ Successfully built and wrote new index with ${newSearchIndex.length} documents.`
    );
    console.log(`Index file saved to: ${outputFilePath}`);
  }
}

main().catch((error) => {
  console.error("Error building search index:", error);
  process.exit(1);
});
