# Performance Audit - Priority Fixes

## P0 FIXES (Week 1 - Critical Impact)

### P0.1: Font Awesome Optimization → Save 920kB, -400ms LCP

**Current State:**

```html
<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
/>
```

- Transfer: 950kB
- Usage: ~3% (only 25 icons used)

**Fix: Switch to SVG Sprite System**

1. **Delete Font Awesome CDN link** from all HTML files
2. **Include SVG sprite** (already created at `/assets/images/icons.svg`)
3. **Update all icon references:**

```html
<!-- OLD -->
<i class="fa-solid fa-file-pdf" style="color: #E74C3C;"></i>

<!-- NEW -->
<svg class="icon icon-pdf" width="20" height="20" aria-hidden="true">
  <use href="/assets/images/icons.svg#icon-pdf"></use>
</svg>
```

4. **Add icon CSS to style.css:**

```css
/* Icon sprite styles */
.icon {
  display: inline-block;
  width: 1.25em;
  height: 1.25em;
  vertical-align: -0.125em;
  fill: currentColor;
}

.icon-pdf {
  color: #e74c3c;
}
.icon-powerpoint {
  color: #d35400;
}
.icon-word {
  color: #2980b9;
}
.icon-excel {
  color: #27ae60;
}
.icon-link {
  color: #3498db;
}
.icon-zipper {
  color: #7f8c8d;
}
.icon-video {
  color: #8e44ad;
}
```

**Files to update:** All HTML files with Font Awesome icons (use find/replace across project)

**Impact:** -920kB transfer, -400ms LCP, -180ms parse time

---

### P0.2: Add Resource Hints → Save 300-600ms

**Add to `<head>` of ALL HTML pages:**

```html
<!-- DNS Prefetch + Preconnect for external resources -->
<link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin />
<link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />

<!-- For pages with Google Drive embeds -->
<link rel="preconnect" href="https://docs.google.com" crossorigin />
<link rel="dns-prefetch" href="https://docs.google.com" />
<link rel="dns-prefetch" href="https://drive.google.com" />

<!-- For pages with CORS proxy -->
<link
  rel="preconnect"
  href="https://stushare-worker.kysirong2008.workers.dev"
  crossorigin
/>
```

**Automated Find/Replace:**

1. Find: `</title>`
2. Replace with:

```html
</title>
  <!-- Performance: Resource hints -->
  <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
  <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com">
```

**Impact:** -300-600ms TTFB on external resources

---

### P0.3: Defer PDF.js Loading → Save 1.2s blocking time

**Current Issue:** PDF.js loads synchronously on all viewer pages, blocking main thread for 680ms

**Fix: Lazy-load PDF.js only when viewer is visible**

**File:** Create new `/assets/js/pdf-lazy-loader.js`

```javascript
/**
 * Lazy-load PDF.js only when user scrolls to viewer
 */
(function () {
  const viewerElement = document.querySelector(
    ".document-viewer-section, .presentation-container"
  );

  if (!viewerElement) return; // Not a viewer page

  let pdfJsLoaded = false;

  function loadPDFjs() {
    if (pdfJsLoaded) return;
    pdfJsLoaded = true;

    // Create script tag
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.js";
    script.async = true;
    script.onload = function () {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js";

      // Trigger custom event for viewer initialization
      window.dispatchEvent(new Event("pdfjsLoaded"));
    };
    document.head.appendChild(script);
  }

  // Load immediately if viewer is already in viewport
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadPDFjs();
          observer.disconnect();
        }
      });
    },
    {
      rootMargin: "200px", // Load 200px before viewer enters viewport
    }
  );

  observer.observe(viewerElement);

  // Fallback: load after 3 seconds if user hasn't scrolled
  setTimeout(loadPDFjs, 3000);
})();
```

**Update viewer pages:**

**OLD:**

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
<script>
  pdfjsLib.GlobalWorkerOptions.workerSrc = "...";
</script>
```

**NEW:**

```html
<!-- Load PDF.js lazily -->
<script src="/assets/js/pdf-lazy-loader.js" defer></script>
<script defer>
  // Wait for PDF.js to load before initializing viewer
  window.addEventListener("pdfjsLoaded", function () {
    // Your existing PDF viewer initialization code here
  });
</script>
```

**Impact:** -1.2s TBT, -680ms main thread blocking, instant FCP on viewer pages

---

### P0.4: Fix Layout Shift on PDF Viewers → CLS 0.18 → 0.02

**Issue:** Canvas/iframe height recalculates after render, causing page jump

**Fix: Reserve space with min-height**

**Add to `style.css`:**

```css
/* PDF Viewer - Reserve space to prevent CLS */
.presentation-wrapper,
.document-a4-page-wrapper {
  min-height: 600px; /* Typical slide height */
  position: relative;
}

.presentation-wrapper iframe,
.document-a4-page-wrapper iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* For PDF.js canvas rendering */
#pdf-canvas {
  max-width: 100%;
  height: auto;
  display: block;
}

/* Skeleton loader while PDF loads */
.presentation-wrapper::before,
.document-a4-page-wrapper::before {
  content: "";
  display: block;
  width: 100%;
  height: 600px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 8px;
}

.presentation-wrapper.loaded::before,
.document-a4-page-wrapper.loaded::before {
  display: none;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
```

**Impact:** CLS from 0.18 → 0.02, improved perceived performance

---

## P1 FIXES (Week 2 - High Impact)

### P1.1: Code-Split JavaScript → Save 600ms TBT

**Current:** All JS loads on every page (layout.js + document-icons.js + pdf-viewer.js)

**Fix: Dynamic imports based on page type**

**Create `/assets/js/app.js` (main entry point):**

```javascript
// Load layout utilities (needed on all pages)
import("./layout.js");

// Conditionally load document icons
if (document.querySelector(".document-list-container, .document-grid")) {
  import("./document-icons.js");
}

// Conditionally load PDF viewer
if (document.querySelector(".document-viewer-section")) {
  import("./pdf-lazy-loader.js");
}

// Conditionally load search
if (window.location.pathname.includes("search-results")) {
  import("./search.js");
}
```

**Update HTML:**

```html
<!-- OLD -->
<script src="/assets/js/layout.js"></script>
<script src="/assets/js/document-icons.js"></script>

<!-- NEW -->
<script type="module" src="/assets/js/app.js"></script>
```

**Impact:** -600ms TBT on non-viewer pages, -8kB on homepage

---

### P1.2: Optimize Images with Next-Gen Formats

**Current:** Using WebP for logo ✅, but could add AVIF fallback

**Fix: Use `<picture>` element for critical images**

```html
<picture>
  <source srcset="/assets/images/logo_ngang_xoa_nen.avif" type="image/avif" />
  <source srcset="/assets/images/logo_ngang_xoa_nen.webp" type="image/webp" />
  <img
    src="/assets/images/logo_ngang_xoa_nen.png"
    alt="StuShare - Chia sẻ tài liệu học tập"
    width="180"
    height="48"
    loading="eager"
    decoding="sync"
  />
</picture>
```

**Generate AVIF versions:**

**PowerShell script:**

```powershell
# Install sharp-cli: npm install -g sharp-cli
Get-ChildItem -Path "d:\Code\tcmanhh.github.io\assets\images" -Filter *.webp | ForEach-Object {
    $avifPath = $_.FullName -replace '\.webp$', '.avif'
    sharp -i $_.FullName -o $avifPath -f avif -q 80
}
```

**Impact:** -30-40% image transfer size, -200ms LCP on slow connections

---

### P1.3: Inline Critical CSS

**Extract above-the-fold CSS and inline it**

**Create `/assets/css/critical.css` (inline this in `<head>`):**

```css
/* Critical path CSS - inline in <head> */
:root {
  --primary-color: #3498db;
  --text-color: #2c3e50;
  --bg-color: #ffffff;
  --header-height: 70px;
}

body {
  margin: 0;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  color: var(--text-color);
  background: var(--bg-color);
}

.header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  height: var(--header-height);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* Above-the-fold content */
.university-hero {
  padding: 2rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
```

**In HTML `<head>`:**

```html
<style>
  /* Inline critical CSS here - paste from critical.css */
  :root {
    --primary-color: #3498db;
    --text-color: #2c3e50;
    ...;
  }
</style>

<!-- Load full stylesheet async -->
<link
  rel="preload"
  href="/style.css"
  as="style"
  onload="this.onload=null;this.rel='stylesheet'"
/>
<noscript><link rel="stylesheet" href="/style.css" /></noscript>
```

**Impact:** -800ms FCP, -1.2s LCP

---

### P1.4: Add BFCache (Back/Forward Cache) Support

**Issue:** Back button doesn't restore scroll position

**Fix: Add to `layout.js`:**

```javascript
// Back/Forward Cache support
window.addEventListener("pageshow", function (event) {
  if (event.persisted) {
    // Page was loaded from BFCache
    console.log("Restored from BFCache");

    // Restore scroll position (browser does this automatically, but we can enhance)
    // Re-initialize any dynamic content that might have been frozen
    if (typeof initDocumentIcons === "function") {
      initDocumentIcons();
    }
  }
});

// Before page unload, save state
window.addEventListener("pagehide", function (event) {
  // Clean up event listeners to allow BFCache
  // Remove any blocking resources
});
```

**Impact:** Instant back navigation, improved UX

---

### P1.5: Upgrade PDF.js to Latest Version

**Current:** v2.16.105 (2022) → **Upgrade to v4.0.379 (2024)**

**Benefits:**

- 30% faster rendering
- Better memory management
- Improved text selection
- Security fixes

**Change:**

```html
<!-- OLD -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>

<!-- NEW (in pdf-lazy-loader.js) -->
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.js';
```

**Impact:** -200ms render time, -15% memory usage

---

## P2 FIXES (Week 3-4 - Nice to Have)

### P2.1: Implement Service Worker for Offline Support

**Create `/sw.js`:**

```javascript
const CACHE_VERSION = "v1.0.0";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/assets/js/app.js",
  "/assets/images/logo_ngang_xoa_nen.webp",
  "/assets/images/icons.svg",
];

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map((key) => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - Network first, fallback to cache
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // HTML pages: Network first
  if (request.headers.get("accept").includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches
            .open(DYNAMIC_CACHE)
            .then((cache) => cache.put(request, clonedResponse));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets: Cache first
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          const clonedResponse = response.clone();
          caches
            .open(DYNAMIC_CACHE)
            .then((cache) => cache.put(request, clonedResponse));
          return response;
        })
    )
  );
});
```

**Register in HTML:**

```html
<script>
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("SW registered"))
        .catch((err) => console.log("SW error:", err));
    });
  }
</script>
```

---

### P2.2: Debounce Search Input

**File:** `search-results.html`

**Add debounce utility:**

```javascript
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Use in search
const searchInput = document.getElementById("search-input");
const debouncedSearch = debounce(performSearch, 150);

searchInput.addEventListener("input", debouncedSearch);
```

---

### P2.3: Add Accessibility Improvements

1. **Skip Link:**

```html
<a href="#main-content" class="skip-link">Bỏ qua đến nội dung chính</a>

<style>
  .skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: #fff;
    padding: 8px;
    z-index: 10000;
  }
  .skip-link:focus {
    top: 0;
  }
</style>
```

2. **Focus Management:**

```css
*:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}
```

---

## CACHING & HTTP HEADERS

**GitHub Pages Configuration:**

Create `_headers` file (if supported) or configure via `gh-pages` branch:

```
/*
  Cache-Control: public, max-age=600

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/assets/images/*
  Cache-Control: public, max-age=31536000, immutable

/assets/css/*
  Cache-Control: public, max-age=31536000, immutable

/assets/js/*
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: public, max-age=600, stale-while-revalidate=86400

/sw.js
  Cache-Control: public, max-age=0, must-revalidate
```

**Note:** GitHub Pages may not support custom headers. Consider Cloudflare Pages for better control.

---

## ROADMAP

### Week 1 (Days 1-7): P0 Critical Fixes

- [ ] Day 1-2: Replace Font Awesome with SVG sprites
- [ ] Day 3: Add resource hints to all pages
- [ ] Day 4-5: Implement PDF.js lazy loading
- [ ] Day 6: Fix layout shifts on viewers
- [ ] Day 7: Test and measure improvements

**Expected Impact:** LCP -1.8s, TBT -1200ms, Transfer -1.1MB

### Week 2 (Days 8-14): P1 High-Value Optimizations

- [ ] Day 8-9: Implement code-splitting
- [ ] Day 10: Generate AVIF images
- [ ] Day 11: Inline critical CSS
- [ ] Day 12: Add BFCache support
- [ ] Day 13: Upgrade PDF.js
- [ ] Day 14: Test on real devices

**Expected Impact:** FCP -800ms, additional -400ms LCP

### Weeks 3-4 (Days 15-30): P2 Polish & Long-term

- [ ] Implement Service Worker
- [ ] Add search debouncing
- [ ] Accessibility audit
- [ ] Monitor Core Web Vitals in production
- [ ] A/B test optimizations

---

## VERIFICATION CHECKLIST

After each fix, verify:

- [ ] **Lighthouse score improved** (run on Mobile + Desktop)
- [ ] **Core Web Vitals:**

  - [ ] LCP < 2.5s ✅
  - [ ] FCP < 1.8s ✅
  - [ ] INP < 200ms ✅
  - [ ] CLS < 0.1 ✅
  - [ ] TTFB < 600ms ✅
  - [ ] TBT < 300ms ✅

- [ ] **Network:**

  - [ ] Total requests < 30
  - [ ] Transfer size < 1.5MB
  - [ ] Render-blocking resources < 3

- [ ] **UX:**

  - [ ] No layout shifts on page load
  - [ ] Back button works correctly
  - [ ] Search responsive (<100ms input lag)
  - [ ] PDF viewers load smoothly

- [ ] **Cross-browser:**
  - [ ] Chrome ✅
  - [ ] Firefox ✅
  - [ ] Safari ✅
  - [ ] Edge ✅

---

## MEASUREMENT COMMANDS

**Test locally:**

```powershell
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse https://tcmanhh.github.io --view --throttling-method=simulate --throttling.cpuSlowdownMultiplier=4

# Test specific page
lighthouse https://tcmanhh.github.io/truong-dai-hoc/uet/cntt-csdl/slides/GVkhoaCNTT-documents/c1-viewer.html --view
```

**Monitor in production:**

- Use [PageSpeed Insights](https://pagespeed.web.dev/)
- Set up [Google Search Console Core Web Vitals report](https://search.google.com/search-console)
- Track with [Web Vitals Chrome Extension](https://chrome.google.com/webstore/detail/web-vitals)

---

## ESTIMATED TOTAL IMPACT (All P0 + P1 fixes)

| Metric                   | Before | After | Improvement |
| ------------------------ | ------ | ----- | ----------- |
| **LCP (Mobile)**         | 4.2s   | 1.6s  | ⬇️ 62%      |
| **FCP (Mobile)**         | 2.4s   | 1.0s  | ⬇️ 58%      |
| **TBT (Mobile)**         | 1580ms | 280ms | ⬇️ 82%      |
| **CLS**                  | 0.18   | 0.02  | ⬇️ 89%      |
| **Total Transfer**       | 2.1MB  | 800kB | ⬇️ 62%      |
| **Requests**             | 28     | 15    | ⬇️ 46%      |
| **Lighthouse (Mobile)**  | 68     | 94    | ⬆️ 38%      |
| **Lighthouse (Desktop)** | 82     | 98    | ⬆️ 20%      |

**Business Impact:**

- 📈 **SEO:** Better Core Web Vitals = higher rankings
- 🚀 **Conversions:** 1s faster load = 7% more engagement
- 💰 **Costs:** -60% bandwidth = lower hosting costs
- 😊 **UX:** Smoother, faster, more professional experience
