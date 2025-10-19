# Performance Optimization Tracking Checklist

**Project:** tcmanhh.github.io (StuShare)  
**Start Date:** ******\_******  
**Target Completion:** ******\_******

---

## 🎯 BASELINE METRICS (Record Before Starting)

### Homepage (`/index.html`)

- [ ] Mobile Lighthouse Score: **\_\_**
- [ ] Desktop Lighthouse Score: **\_\_**
- [ ] Mobile LCP: **\_\_** ms
- [ ] Mobile TBT: **\_\_** ms
- [ ] Transfer Size: **\_\_** MB
- [ ] Total Requests: **\_\_**

### Document Listing (`/truong-dai-hoc/uet/cntt-csdl/slides/GVkhoaCNTT-documents.html`)

- [ ] Mobile Lighthouse Score: **\_\_**
- [ ] Mobile LCP: **\_\_** ms
- [ ] Transfer Size: **\_\_** MB

### PDF Viewer (`/truong-dai-hoc/uet/cntt-csdl/slides/GVkhoaCNTT-documents/c1-viewer.html`)

- [ ] Mobile Lighthouse Score: **\_\_**
- [ ] Mobile LCP: **\_\_** ms
- [ ] Mobile TBT: **\_\_** ms
- [ ] Transfer Size: **\_\_** MB

---

## 📋 WEEK 1 - P0 CRITICAL FIXES

### Day 1-2: Font Awesome → SVG Migration

**Preparation:**

- [ ] Read `QUICKSTART_SVG_MIGRATION.md`
- [ ] Verify `/assets/images/icons.svg` exists (already created)
- [ ] Backup project (or verify script does this)

**Execution:**

- [ ] Run `.\migrate-to-svg-icons.ps1 -WhatIf` (dry run)
- [ ] Review changes that will be made
- [ ] Run `.\migrate-to-svg-icons.ps1` (actual migration)
- [ ] Check script output for errors

**Testing:**

- [ ] Serve locally: `npx serve .` or `python -m http.server 8000`
- [ ] Test homepage - icons visible? ☐ Yes ☐ No
- [ ] Test document listing - icons visible? ☐ Yes ☐ No
- [ ] Test mobile menu - hamburger icon working? ☐ Yes ☐ No
- [ ] Check browser console - any errors? ☐ No ☐ Yes (fix: **\_\_\_**)
- [ ] Check Network tab - Font Awesome requests? ☐ No ☐ Yes (fix: **\_\_\_**)

**Measurement:**

- [ ] Run Lighthouse on homepage
  - Mobile Score: **\_\_** (expected: +8-12 points)
  - LCP: **\_\_** ms (expected: -400ms)
  - Transfer: **\_\_** KB (expected: -920KB)
- [ ] Run Lighthouse on viewer page
  - Mobile Score: **\_\_**
  - LCP: **\_\_** ms

**Deployment:**

- [ ] Git add: `git add .`
- [ ] Git commit: `git commit -m "perf: replace Font Awesome with SVG sprites (-920KB)"`
- [ ] Git push: `git push origin main`
- [ ] Wait for GitHub Pages deployment (2-5 minutes)
- [ ] Verify live site: https://tcmanhh.github.io

**Post-Deploy Verification:**

- [ ] Test live site - icons working?
- [ ] Run PageSpeed Insights: https://pagespeed.web.dev/
  - Mobile Score: **\_\_**
  - Desktop Score: **\_\_**
- [ ] Take screenshot for record

**Time Spent:** **\_\_** hours (budgeted: 4h)  
**Issues Encountered:** ****************\_****************

---

### Day 3: Resource Hints

**Files to Edit:**

- [ ] `header.html` (if has `<head>`)
- [ ] `index.html`
- [ ] All document listing pages
- [ ] All viewer pages

**Changes:**

```html
<!-- Add after <title> in each HTML file -->
<link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin />
<link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />
<link rel="preconnect" href="https://docs.google.com" crossorigin />
<link rel="dns-prefetch" href="https://drive.google.com" />
```

**Checklist:**

- [ ] Added to `/index.html`
- [ ] Added to `/search-results.html`
- [ ] Added to `/truong-dai-hoc/uet.html`
- [ ] Added to all course pages (5 files):
  - [ ] `cntt-csdl.html`
  - [ ] `cntt-ctdlgt.html`
  - [ ] `cntt-ktmt.html`
  - [ ] `cntt-lthdt.html`
  - [ ] `cntt-xstk.html`
- [ ] Added to all document listing pages (5 files)
- [ ] Added to sample viewer pages (test 3-5)

**Testing:**

- [ ] Run Lighthouse - TTFB improved? ☐ Yes ☐ No
- [ ] Check Network tab - connections established early? ☐ Yes

**Deployment:**

- [ ] Commit: `git commit -m "perf: add resource hints for external domains (-300ms TTFB)"`
- [ ] Push and verify

**Time Spent:** **\_\_** hours (budgeted: 1h)

---

### Day 4-5: Lazy-Load PDF.js

**Files to Create:**

- [ ] `/assets/js/pdf-lazy-loader.js` (see PERFORMANCE_AUDIT_FIXES.md)

**Files to Edit:**

- [ ] All `*-viewer.html` files (~50 files)

**Changes:**

1. **Remove synchronous PDF.js:**

```html
<!-- DELETE THESE LINES -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
<script>
  pdfjsLib.GlobalWorkerOptions.workerSrc = "...";
</script>
```

2. **Add lazy loader:**

```html
<!-- ADD THESE INSTEAD -->
<script src="/assets/js/pdf-lazy-loader.js" defer></script>
<script defer>
  window.addEventListener("pdfjsLoaded", function () {
    // Existing PDF initialization code here
  });
</script>
```

**Testing:**

- [ ] Test viewer page - PDF loads? ☐ Yes ☐ No
- [ ] Test without scrolling - PDF.js NOT loaded? ☐ Correct
- [ ] Scroll to viewer - PDF.js loads? ☐ Yes
- [ ] Check console for errors ☐ No errors
- [ ] Test on mobile device ☐ Works

**Measurement:**

- [ ] Lighthouse TBT before: **\_\_** ms
- [ ] Lighthouse TBT after: **\_\_** ms (expected: -1200ms)
- [ ] Network tab - PDF.js loads only when needed? ☐ Yes

**Deployment:**

- [ ] Commit: `git commit -m "perf: lazy-load PDF.js (-1200ms TBT)"`
- [ ] Push and verify

**Time Spent:** **\_\_** hours (budgeted: 3h)

---

### Day 6: Fix Layout Shifts

**Files to Edit:**

- [ ] `style.css`

**Changes to Add:**

```css
/* PDF Viewer - Reserve space to prevent CLS */
.presentation-wrapper,
.document-a4-page-wrapper {
  min-height: 600px;
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

/* Skeleton loader */
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

**Update viewer initialization:**

- [ ] Add `loaded` class when PDF renders:

```javascript
viewerElement.classList.add("loaded");
```

**Testing:**

- [ ] Load viewer page - skeleton appears? ☐ Yes
- [ ] PDF loads - skeleton disappears? ☐ Yes
- [ ] No page jump when PDF renders? ☐ Correct
- [ ] Lighthouse CLS before: **\_\_**
- [ ] Lighthouse CLS after: **\_\_** (expected: <0.05)

**Deployment:**

- [ ] Commit: `git commit -m "perf: fix layout shift on PDF viewers (CLS 0.18→0.02)"`
- [ ] Push and verify

**Time Spent:** **\_\_** hours (budgeted: 2h)

---

### Day 7: Week 1 Measurement & Documentation

**Final Testing:**

- [ ] Run full Lighthouse audit on all key pages
- [ ] Record results in table below

| Page     | Mobile Score | LCP      | TBT      | CLS      | Transfer |
| -------- | ------------ | -------- | -------- | -------- | -------- |
| Homepage | **\_\_**     | **\_\_** | **\_\_** | **\_\_** | **\_\_** |
| Listing  | **\_\_**     | **\_\_** | **\_\_** | **\_\_** | **\_\_** |
| Viewer   | **\_\_**     | **\_\_** | **\_\_** | **\_\_** | **\_\_** |

**Expected Improvements:**

- Mobile Score: +15-20 points
- LCP: -1800ms
- TBT: -1200ms
- Transfer: -1.1MB

**Did We Hit Targets?**

- [ ] Mobile Lighthouse > 80
- [ ] LCP < 2.5s
- [ ] TBT < 600ms
- [ ] CLS < 0.1

**Documentation:**

- [ ] Update `README.md` with performance wins
- [ ] Take before/after screenshots
- [ ] Document any issues encountered
- [ ] Share results with team/stakeholders

**Week 1 Total Time:** **\_\_** hours (budgeted: 10h)

---

## 📋 WEEK 2 - P1 HIGH-VALUE OPTIMIZATIONS

### Day 8-9: Code-Splitting

**Files to Create:**

- [ ] `/assets/js/app.js` (main entry point)

**Implementation:**

- [ ] Create dynamic import logic
- [ ] Update HTML to use `<script type="module">`
- [ ] Test on modern browsers
- [ ] Test fallback for older browsers

**Testing:**

- [ ] Homepage - only layout.js loads? ☐ Yes
- [ ] Document listing - document-icons.js loads? ☐ Yes
- [ ] Viewer - PDF loader loads? ☐ Yes
- [ ] TBT reduction: **\_\_** ms

**Deployment:**

- [ ] Commit: `git commit -m "perf: implement code-splitting (-600ms TBT)"`

**Time Spent:** **\_\_** hours (budgeted: 4h)

---

### Day 10: Generate AVIF Images

**Tools:**

- [ ] Install sharp-cli: `npm install -g sharp-cli`

**Execution:**

```powershell
Get-ChildItem -Path "assets\images" -Filter *.webp | ForEach-Object {
    $avifPath = $_.FullName -replace '\.webp$', '.avif'
    sharp -i $_.FullName -o $avifPath -f avif -q 80
}
```

**Update HTML:**

- [ ] Convert `<img>` to `<picture>` with AVIF fallback
- [ ] Add `width` and `height` attributes
- [ ] Add `loading="lazy"` for below-fold

**Testing:**

- [ ] AVIF images load in Chrome? ☐ Yes
- [ ] WebP fallback works in Safari? ☐ Yes
- [ ] PNG fallback works? ☐ Yes

**Deployment:**

- [ ] Commit: `git commit -m "perf: add AVIF images (-30% size)"`

**Time Spent:** **\_\_** hours (budgeted: 3h)

---

### Day 11: Inline Critical CSS

**Extraction:**

- [ ] Identify above-the-fold styles
- [ ] Extract to `/assets/css/critical.css`
- [ ] Inline in `<head>` of all pages
- [ ] Load full CSS async

**Testing:**

- [ ] FCP before: **\_\_** ms
- [ ] FCP after: **\_\_** ms (expected: -800ms)

**Deployment:**

- [ ] Commit: `git commit -m "perf: inline critical CSS (-800ms FCP)"`

**Time Spent:** **\_\_** hours (budgeted: 5h)

---

### Day 12: BFCache Support

**Files to Edit:**

- [ ] `/assets/js/layout.js`

**Add Listeners:**

```javascript
window.addEventListener("pageshow", function (event) {
  if (event.persisted) {
    // Restored from BFCache
    console.log("BFCache restore");
  }
});
```

**Testing:**

- [ ] Navigate to page, go back - instant? ☐ Yes
- [ ] Scroll position restored? ☐ Yes

**Deployment:**

- [ ] Commit: `git commit -m "perf: add BFCache support (instant back nav)"`

**Time Spent:** **\_\_** hours (budgeted: 2h)

---

### Day 13: Upgrade PDF.js

**Changes:**

- [ ] Update version in pdf-lazy-loader.js
- [ ] Change to v4.0.379
- [ ] Test PDF rendering

**Testing:**

- [ ] PDFs render correctly? ☐ Yes
- [ ] Text selection works? ☐ Yes
- [ ] Performance improved? ☐ Yes

**Deployment:**

- [ ] Commit: `git commit -m "perf: upgrade PDF.js to v4.0 (-200ms render)"`

**Time Spent:** **\_\_** hours (budgeted: 2h)

---

### Day 14: Week 2 Testing & Real Device Testing

**Device Testing:**

- [ ] Test on real Android device (4G)
- [ ] Test on iPhone (3G throttled)
- [ ] Test on tablet
- [ ] Test on slow laptop

**Results:**

- Mobile Lighthouse Score: **\_\_** (target: >90)
- Real device LCP (4G): **\_\_** ms (target: <2.5s)
- User feedback: ****************\_****************

**Week 2 Total Time:** **\_\_** hours (budgeted: 16h)

---

## 📋 WEEKS 3-4 - P2 POLISH

### Service Worker Implementation

- [ ] Create `/sw.js`
- [ ] Implement caching strategy
- [ ] Register in HTML
- [ ] Test offline functionality
- [ ] Commit: `git commit -m "feat: add Service Worker (offline support)"`

**Time Spent:** **\_\_** hours (budgeted: 6h)

---

### Search Debouncing

- [ ] Add debounce function
- [ ] Apply to search input
- [ ] Test responsiveness
- [ ] Commit: `git commit -m "perf: debounce search (-200ms INP)"`

**Time Spent:** **\_\_** hours (budgeted: 1h)

---

### Accessibility Improvements

- [ ] Add skip link
- [ ] Improve focus styles
- [ ] Better alt text
- [ ] Test with screen reader
- [ ] Commit: `git commit -m "a11y: improve keyboard navigation"`

**Time Spent:** **\_\_** hours (budgeted: 2h)

---

## 🎯 FINAL RESULTS

### Target Metrics

| Metric              | Target | Actual   | Status        |
| ------------------- | ------ | -------- | ------------- |
| Mobile Lighthouse   | >90    | **\_\_** | ☐ Pass ☐ Fail |
| Desktop Lighthouse  | >95    | **\_\_** | ☐ Pass ☐ Fail |
| Mobile LCP          | <2.5s  | **\_\_** | ☐ Pass ☐ Fail |
| Mobile TBT          | <300ms | **\_\_** | ☐ Pass ☐ Fail |
| CLS                 | <0.1   | **\_\_** | ☐ Pass ☐ Fail |
| Transfer (homepage) | <1.5MB | **\_\_** | ☐ Pass ☐ Fail |

### Improvements Achieved

- **LCP Reduction:** **\_\_** ms (**\_\_**%)
- **TBT Reduction:** **\_\_** ms (**\_\_**%)
- **Transfer Reduction:** **\_\_** KB (**\_\_**%)
- **Lighthouse Score Increase:** **\_\_** points

### ROI Calculation

**Time Invested:** **\_\_** hours  
**Performance Gains:**

- Page load time: **\_\_** seconds faster
- User engagement: **\_\_** % increase (if measurable)
- Bounce rate: **\_\_** % decrease (if measurable)

---

## 📝 LESSONS LEARNED

**What Worked Well:**

---

---

**What Was Challenging:**

---

---

**What Would We Do Differently:**

---

---

**Future Optimizations to Consider:**

---

---

---

## ✅ SIGN-OFF

- [ ] All P0 fixes completed and tested
- [ ] All P1 fixes completed and tested
- [ ] Documentation updated
- [ ] Team trained on new performance practices
- [ ] Monitoring set up (Search Console, Analytics)
- [ ] Success criteria met

**Completed By:** ********\_\_\_\_******** **Date:** ****\_\_****  
**Reviewed By:** ********\_\_\_\_******** **Date:** ****\_\_****

---

**🎉 Congratulations on completing the performance optimization!** 🎉
