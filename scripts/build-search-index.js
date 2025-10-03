const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const glob = require('glob');
const { XMLParser } = require('fast-xml-parser');

const rootDir = path.join(__dirname, '..');
const outputFilePath = path.join(rootDir, 'assets', 'js', 'search-data.json');
const sitemapPath = path.join(rootDir, 'sitemap.xml');
const synonymsPath = path.join(rootDir, 'assets', 'js', 'synonyms.json');
const breadcrumbMapPath = path.join(rootDir, 'breadcrumb.html');

console.log('Starting search index build...');

// --- Helper Functions ---

/**
 * Normalizes Vietnamese strings for searching.
 * @param {string} str The string to normalize.
 * @returns {string} Normalized string.
 */
function normalizeString(str) {
    if (!str) return '';
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
    // This function is now for the visual type, not entityType
    const lowerUrl = url.toLowerCase();
    const lowerTitle = title.toLowerCase();

    if (lowerUrl.includes('/slides/') || lowerTitle.includes('slide') || lowerTitle.includes('bài giảng')) return 'powerpoint';
    if (lowerTitle.includes('.pdf') || lowerUrl.includes('-viewer.html')) return 'pdf';
    if (lowerTitle.includes('.docx')) return 'word';
    if (lowerTitle.includes('link') || lowerTitle.includes('trang web') || lowerTitle.includes('hackerrank')) return 'link';
    if (lowerTitle.includes('video')) return 'video';
    if (lowerUrl.match(/cntt-[a-z]+\.html$/)) return 'subject'; // Page for a subject
    if (lowerUrl.match(/(ts_|pgs_ts_|gv)([a-z_]+)\.html$/i)) return 'teacher';

    // Fallback for weekly materials
    if (lowerTitle.startsWith('tuần')) return 'powerpoint';
    if (lowerTitle.includes('đề thi')) return 'exam';
    if (lowerTitle.includes('giáo trình')) return 'textbook';

    return 'page';
}

/**
 * Reads last modification dates from sitemap.xml.
 * @returns {Map<string, string>} A map of URL to lastmod date.
 */
function getLastModMap() {
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');
    const parser = new XMLParser();
    const sitemapObj = parser.parse(sitemapContent);
    const urlMap = new Map();

    if (sitemapObj.urlset && sitemapObj.urlset.url) {
        for (const urlEntry of sitemapObj.urlset.url) {
            // Normalize URL to be relative
            const relativeUrl = new URL(urlEntry.loc).pathname;
            urlMap.set(relativeUrl, urlEntry.lastmod);
        }
    }
    return urlMap;
}

/**
 * Scans all HTML files to build a map of URL -> Anchor Text.
 * This helps in getting more relevant titles for documents.
 * @param {string} rootDir The root directory of the project.
 * @returns {Map<string, string>} A map of relative URL to its most descriptive anchor text.
 */
function buildAnchorTextMap(rootDir) {
    console.log('Pre-scanning for anchor texts...');
    const anchorTextMap = new Map();
    const allHtmlFiles = glob.sync('**/*.html', { cwd: rootDir, ignore: ['scripts/**'] });
    for (const file of allHtmlFiles) {
        const content = fs.readFileSync(path.join(rootDir, file), 'utf-8');
        const dom = new JSDOM(content);
        dom.window.document.querySelectorAll('a[href]').forEach(a => {
            const href = new URL(a.href, `file://${path.join(rootDir, file)}`).pathname;
            if (href.endsWith('.html') && a.textContent.trim()) {
                if (!anchorTextMap.has(href) || a.textContent.trim().length > (anchorTextMap.get(href) || '').length) {
                    anchorTextMap.set(href.replace(/\\/g, '/'), a.textContent.trim());
                }
            }
        });
    }
    console.log(`Found anchor texts for ${anchorTextMap.size} unique URLs.`);
    return anchorTextMap;
}

async function main() {
    // --- Idempotency: Load existing index to compare ---
    let existingIndex = [];
    const existingIndexMap = new Map();
    if (fs.existsSync(outputFilePath)) {
        try {
            existingIndex = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));
            existingIndex.forEach(doc => existingIndexMap.set(doc.url, doc));
            console.log(`Found existing index with ${existingIndex.length} documents.`);
        } catch (e) {
            console.warn('Could not parse existing search index. Building from scratch.');
            existingIndex = [];
        }
    }

    const newSearchIndex = [];
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const addedFiles = [];
    const updatedFiles = [];

    const lastModMap = getLastModMap();
    const synonymsContent = fs.readFileSync(synonymsPath, 'utf-8');
    const synonyms = JSON.parse(synonymsContent);
    // Create a reverse map for easy lookup
    const synonymReverseMap = new Map();
    Object.entries(synonyms).forEach(([key, values]) => { // Use normalized key for reverse map
        const normalizedKey = normalizeString(key);
        values.forEach(v => {
            const normalizedValue = normalizeString(v);
            if (!synonymReverseMap.has(normalizedValue)) {
                synonymReverseMap.set(normalizedValue, key);
            }
        });
    });

    // --- Build a map for labels from breadcrumb.html ---
    const labelMap = new Map();
    try {
        const breadcrumbContent = fs.readFileSync(breadcrumbMapPath, 'utf-8');
        // Use regex to find mappings like "cntt-xstk": "Xác suất thống kê"
        const regex = /"([^"]+)":\s*"([^"]+)"/g;
        let match;
        while ((match = regex.exec(breadcrumbContent)) !== null) {
            // key: cntt-xstk, value: Xác suất thống kê
            labelMap.set(match[1], match[2]);
        }
    } catch (e) {
        console.warn('Could not read or parse breadcrumb.html for labels. Fallback titles might be incomplete.');
    }

    const anchorTextMap = buildAnchorTextMap(rootDir);

    // --- A) Combine sources: sitemap and glob fallback ---
    const sitemapUrls = Array.from(lastModMap.keys());
    const globFiles = glob.sync('**/*.html', { // H) Use glob to find all html files
        cwd: rootDir,
        ignore: [
            'header.html', 
            'footer.html', 
            'breadcrumb.html', 
            'search-results.html', 
            'scripts/**',
            'assets/**',
            'vendor/**'
        ]
    }).map(f => `/${f.replace(/\\/g, '/')}`);

    const xstkGlob = glob.sync('**/xac-suat-thong-ke-week-*-viewer.html', { // 2.4) Đảm bảo có glob riêng cho XSTK
        cwd: rootDir,
        ignore: ['assets/**', 'vendor/**', 'scripts/**', 'header.html', 'footer.html', 'breadcrumb.html', 'search-results.html']
    }).map(f => `/${f.replace(/\\/g, '/')}`);

    console.log('[DEBUG] XSTK week viewer files found by glob:', xstkGlob.length, xstkGlob);

    // Hợp nhất tất cả các nguồn URL và loại bỏ trùng lặp
    const allUrls = [...new Set([...sitemapUrls, ...globFiles, ...xstkGlob])];

    console.log(`Found ${allUrls.length} unique URLs to process from sitemap and file scans.`);

    for (const url of allUrls) {
        const file = url.substring(1); // remove leading '/'
        const filePath = path.join(rootDir, file);

        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
            continue;
        }

        const stats = fs.statSync(filePath);
        const fileMtime = stats.mtime.toISOString().split('T')[0];
        const lastmod = lastModMap.get(url) || fileMtime;

        // --- Idempotency Check ---
        const existingDoc = existingIndexMap.get(url);
        if (existingDoc && existingDoc.lastmod === lastmod) {
            newSearchIndex.push(existingDoc); // Keep the old one
            skippedCount++;
            continue;
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const dom = new JSDOM(fileContent);
        const document = dom.window.document;
        
        // C) Prioritize title extraction: Anchor Text > H1 > <title> tag
        const h1Title = document.querySelector('h1')?.textContent.trim();
        const anchorTitle = anchorTextMap.get(url);
        const tagTitle = document.querySelector('title')?.textContent.trim() || '';

        let title = (anchorTitle || h1Title || tagTitle).replace(/ - StuShare$/, '').trim();
        
        // Fallback title from breadcrumb map if title is still empty
        if (!title) {
            const fileName = path.basename(filePath); // e.g., xac-suat-thong-ke-week-10-viewer.html
            const baseName = fileName.replace(/\.html$/, ''); // e.g., xac-suat-thong-ke-week-10-viewer
            title = labelMap.get(fileName) || labelMap.get(baseName) || '';
        }

        if (!title || /kết quả tìm kiếm/i.test(title)) continue;
 
        // --- Start Extraction ---
        const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        const excerpt = (metaDescription || title).substring(0, 160);
        const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
        
        // Extract breadcrumbs for context
        const breadcrumbItems = Array.from(document.querySelectorAll('#breadcrumb-list li'));
        const breadcrumbPath = breadcrumbItems.map(li => li.textContent.trim()).join(' > ');

        // Extract headings
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, .document-note span')).map(h => h.textContent.trim()).join(' ');

        // Extract content from document items for better keywords
        const documentItemText = Array.from(document.querySelectorAll('.document-item span, .document-item h3')).map(el => el.textContent.trim()).join(' ');

        // Extract tags from meta keywords or other sources
        const metaKeywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';

        // Infer metadata
        const pathSegments = file.split(path.sep);
        const university = pathSegments.includes('uet') ? 'Đại học Công nghệ - ĐHQGHN' : 'Khác';
        
        let courseName = '';
        let courseCode = extractCourseCode(title) || extractCourseCode(file);
        const courseMatch = file.match(/(cntt-[a-z]+)/);

        // Generate course code variants
        let courseCodeVariants = [];
        if (courseCode) {
            courseCodeVariants.push(courseCode); // e.g., INT2202
            courseCodeVariants.push(courseCode.replace(/(\D+)(\d+)/, '$1 $2')); // e.g., INT 2202
        }

        if (courseMatch) {
            // C) Use the full match (e.g., "cntt-xstk") as the key for the map.
            if (labelMap.has(courseMatch[1])) {
                courseName = labelMap.get(courseMatch[1]);
            }
        }

        const lecturerMatch = file.match(/(TS_|PGS_TS_|GV)([A-Za-z_]+)/);
        const lecturer = lecturerMatch ? lecturerMatch[0].replace(/_/g, ' ').replace('.html', '') : '';

        const docType = guessDocType(url, title);

        // Determine entityType and parent
        let entityType = 'page';
        let parentEntityUrl = null;

        if (title.toLowerCase().includes('đề thi')) entityType = 'exam';
        else if (title.toLowerCase().includes('giáo trình')) entityType = 'textbook';
        else if (docType === 'subject' || docType === 'teacher') {
            entityType = 'courseLecturer';
        } 
        else if (docType === 'powerpoint' || title.toLowerCase().startsWith('tuần')) {
            entityType = 'slide';
            // Find parent lecturer/course page from path
            const pathParts = file.split(path.sep);
            if (pathParts.length > 3) {
                // e.g., .../slides/TS_Nguyen_Duc_Anh.html
                const parentFileName = pathParts[pathParts.length - 2] + '.html';
                parentEntityUrl = path.dirname(url) + '/' + parentFileName;
            }
        }

        // Build tags array
        let tags = metaKeywords.split(',').map(t => t.trim()).filter(Boolean);
        if (docType) tags.push(docType);
        if (courseCode) tags.push(courseCode);
        tags = [...new Set(tags)];

        // C) Keywords are a mix of important fields
        let keywords = [
            title,
            metaDescription,
            courseName,
            ...courseCodeVariants,
            lecturer, 
            documentItemText,
            ...tags
        ].filter(Boolean).join(' ');

        // Expand keywords with synonyms
        const normalizedKeywords = normalizeString(keywords);
        Object.entries(synonyms).forEach(([key, values]) => {
            // key is from synonyms.json (e.g., "xác suất thống kê")
            const normalizedSynonymKey = normalizeString(key);
            if (normalizedKeywords.includes(normalizedSynonymKey)) {
                keywords += ' ' + values.join(' ');
            }
        });

        // Final dedupe of keywords string
        keywords = [...new Set(keywords.split(/\s+/).filter(Boolean))].join(' ');

        const newDoc = {
            id: url,
            url: url, // F) Ensure URL is valid for clicking
            title: title.replace(/ - Stu(Share|Hub)$/, ''), // Clean up title
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
            ogImage: ogImage,
            entityType: entityType,
            parentEntityUrl: parentEntityUrl
        };
        newSearchIndex.push(newDoc);

        if (existingDoc) {
            updatedCount++;
            updatedFiles.push(url);
        } else {
            addedCount++;
            addedFiles.push(url);
        }
    }

    // --- E) Logging and Reporting ---
    console.log('\n--- Indexing Report ---');
    console.log(`- Total documents processed: ${allUrls.length}`);
    console.log(`- ✅ Added: ${addedCount}`);
    console.log(`- 🔄 Updated: ${updatedCount}`);
    console.log(`- ⏩ Skipped (unchanged): ${skippedCount}`);

    // --- VERIFY XSTK WEEKS ---
    const norm = s => (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
    const xstk = newSearchIndex.filter(d => norm(d.title+d.keywords+d.path).includes('xac suat thong ke') || norm(d.path).includes('cntt-xstk'));
    const weeks = [...new Set(xstk.map(d => {
        const m = norm(d.title).match(/\btuan\s*(\d{1,2})\b/);
        return m ? +m[1] : null;
    }).filter(Boolean))].sort((a,b)=>a-b);
    console.log('[VERIFY] XSTK weeks:', weeks);
    // --- END VERIFY ---


    // D) & E) Specific check for "Xác suất thống kê"
    console.log('\n--- Course Specific Checks ---');
    const xstkDocs = newSearchIndex.filter(doc => normalizeString(doc.courseName || '').includes('xac suat thong ke'));
    const xstkWeeks = new Map();
    for (let i = 1; i <= 11; i++) {
        xstkWeeks.set(i, false);
    }
    xstkDocs.forEach(doc => {
        // 3) Dùng regex không phân biệt hoa/thường, có/không dấu để nhận diện tuần
        const weekMatch = (doc.title || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/\btuan\s*(\d{1,2})\b/i);
        if (weekMatch) {
            const weekNum = parseInt(weekMatch[1], 10);
            if (xstkWeeks.has(weekNum)) {
                console.log('[XSTK] Week', weekNum, '->', doc.url); // In URL của tuần đã tìm thấy
                xstkWeeks.set(weekNum, true);
            }
        }
    });

    console.log('Xác suất thống kê (XSTK) weekly documents:');
    let missingWeeks = [];
    xstkWeeks.forEach((found, week) => {
        console.log(`  - Tuần ${week}: ${found ? '✅ Found' : '❌ NOT FOUND'}`);
        if (!found) missingWeeks.push(week);
    });

    if (missingWeeks.length > 0) {
        console.warn(`\n⚠️ WARNING: Missing XSTK documents for weeks: ${missingWeeks.join(', ')}. The sitemap or file structure might be incomplete.`);
    } else {
        console.log('✅ All required XSTK weekly documents were found.');
    }

    // E) Top 10 courses by document count
    const courseCounts = newSearchIndex.reduce((acc, doc) => {
        if (doc.courseName) {
            acc[doc.courseName] = (acc[doc.courseName] || 0) + 1;
        }
        return acc;
    }, {});
    const sortedCourses = Object.entries(courseCounts).sort(([, a], [, b]) => b - a).slice(0, 10);
    console.log('\n--- Top 10 Courses by Document Count ---');
    sortedCourses.forEach(([name, count]) => {
        console.log(`  - ${name}: ${count} documents`);
    });

    // E) 5 example entries
    console.log('\n--- Example Indexed Entries ---');
    const exampleDocs = newSearchIndex.filter(doc => doc.courseName).slice(0, 5);
    if (exampleDocs.length > 0) {
        exampleDocs.forEach(doc => {
            console.log(`\nURL: ${doc.url}`);
            console.log(`  Title: ${doc.title}`);
            console.log(`  Keywords: ${doc.keywords.substring(0, 100)}...`);
        });
    } else {
        console.log('Could not find example documents for report.');
    }

    if (addedCount === 0 && updatedCount === 0) {
        console.log('\n✅ No changes detected. Index is already up-to-date.');
    } else {
        // F) Write to the final output file
        fs.writeFileSync(outputFilePath, JSON.stringify(newSearchIndex, null, 2));
        console.log(`\n✅ Successfully built and wrote new index with ${newSearchIndex.length} documents.`);
        console.log(`Index file saved to: ${outputFilePath}`);
    }
}

main().catch(error => {
    console.error('Error building search index:', error);
    process.exit(1);
});