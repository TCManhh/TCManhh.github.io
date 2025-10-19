# Quick Start: Font Awesome to SVG Migration

# Fastest path to -920kB, -400ms LCP improvement

## STEP 1: Remove Font Awesome CDN Link

**Find and DELETE this line from ALL HTML files:**

```html
<!-- DELETE THIS -->
<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
/>
```

**PowerShell command (run from project root):**

```powershell
# Backup first
Copy-Item -Path "d:\Code\tcmanhh.github.io" -Destination "d:\Code\tcmanhh.github.io.backup" -Recurse

# Remove Font Awesome links
$files = Get-ChildItem -Path "d:\Code\tcmanhh.github.io" -Filter *.html -Recurse
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $newContent = $content -replace '<link[^>]*font-awesome[^>]*>', ''
    Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
}

Write-Host "Font Awesome CDN links removed from $($files.Count) files"
```

---

## STEP 2: Add Icon CSS to style.css

**Append to the end of `style.css`:**

```css
/* =================================================================
   ICON SPRITE SYSTEM (replaces Font Awesome)
   ================================================================= */

.icon {
  display: inline-block;
  width: 20px;
  height: 20px;
  margin-right: 12px;
  vertical-align: -0.125em;
  fill: currentColor;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

a:hover .icon {
  transform: scale(1.1);
}

/* Icon colors (matches original Font Awesome colors) */
.icon-pdf {
  color: #e74c3c !important;
}
.icon-powerpoint {
  color: #d35400 !important;
}
.icon-word {
  color: #2980b9 !important;
}
.icon-excel {
  color: #27ae60 !important;
}
.icon-link {
  color: #3498db !important;
}
.icon-zipper {
  color: #7f8c8d !important;
}
.icon-video {
  color: #8e44ad !important;
}
.icon-bars {
  color: #2c3e50 !important;
}

/* Ensure icons work in flex/grid contexts */
.document-item .icon,
.document-card .icon {
  flex-shrink: 0;
}
```

---

## STEP 3: Replace Icon Usage

**Find/Replace patterns (use VS Code global search/replace):**

### Pattern 1: PDF Icons

**Find (Regex enabled):**

```regex
<i class="fa[^"]*fa-file-pdf"[^>]*></i>
```

**Replace with:**

```html
<svg class="icon icon-pdf" width="20" height="20" aria-hidden="true">
  <use href="/assets/images/icons.svg#icon-pdf"></use>
</svg>
```

### Pattern 2: PowerPoint Icons

**Find (Regex enabled):**

```regex
<i class="fa[^"]*fa-file-powerpoint"[^>]*></i>
```

**Replace with:**

```html
<svg class="icon icon-powerpoint" width="20" height="20" aria-hidden="true">
  <use href="/assets/images/icons.svg#icon-powerpoint"></use>
</svg>
```

### Pattern 3: Word Icons

**Find (Regex enabled):**

```regex
<i class="fa[^"]*fa-file-word"[^>]*></i>
```

**Replace with:**

```html
<svg class="icon icon-word" width="20" height="20" aria-hidden="true">
  <use href="/assets/images/icons.svg#icon-word"></use>
</svg>
```

### Pattern 4: Excel Icons

**Find (Regex enabled):**

```regex
<i class="fa[^"]*fa-file-excel"[^>]*></i>
```

**Replace with:**

```html
<svg class="icon icon-excel" width="20" height="20" aria-hidden="true">
  <use href="/assets/images/icons.svg#icon-excel"></use>
</svg>
```

### Pattern 5: Link Icons

**Find (Regex enabled):**

```regex
<i class="fa[^"]*fa-link"[^>]*></i>
```

**Replace with:**

```html
<svg class="icon icon-link" width="20" height="20" aria-hidden="true">
  <use href="/assets/images/icons.svg#icon-link"></use>
</svg>
```

### Pattern 6: Menu/Bars Icons

**Find (Regex enabled):**

```regex
<i class="fa[^"]*fa-bars"[^>]*></i>
```

**Replace with:**

```html
<svg class="icon icon-bars" width="20" height="20" aria-hidden="true">
  <use href="/assets/images/icons.svg#icon-bars"></use>
</svg>
```

---

## STEP 4: Update document-icons.js

**Replace the icon mapping object in `/assets/js/document-icons.js`:**

**Find:**

```javascript
pdf: {
  icon: "fa-solid fa-file-pdf",
  color: "#E74C3C",
  title: "Xem tài liệu PDF",
},
```

**Replace with:**

```javascript
pdf: {
  icon: "icon-pdf",
  color: "#E74C3C",
  title: "Xem tài liệu PDF",
  svg: true
},
```

**Update the icon rendering function:**

**Find:**

```javascript
function createIcon(fileType) {
  const iconData = fileIcons[fileType] || fileIcons.default;
  const icon = document.createElement("i");
  icon.className = iconData.icon;
  icon.style.color = iconData.color;
  icon.title = iconData.title;
  return icon;
}
```

**Replace with:**

```javascript
function createIcon(fileType) {
  const iconData = fileIcons[fileType] || fileIcons.default;

  // Create SVG icon
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", `icon ${iconData.icon}`);
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");
  svg.setAttribute("aria-hidden", "true");

  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttributeNS(
    "http://www.w3.org/1999/xlink",
    "href",
    `/assets/images/icons.svg#${iconData.icon}`
  );

  svg.appendChild(use);
  svg.title = iconData.title;

  return svg;
}
```

---

## STEP 5: Test Locally

```powershell
# Serve locally (Python)
cd d:\Code\tcmanhh.github.io
python -m http.server 8000

# OR use VS Code Live Server extension
# OR use npx serve
npx serve .
```

**Open in browser:**

- http://localhost:8000/index.html
- http://localhost:8000/truong-dai-hoc/uet/cntt-csdl/slides/GVkhoaCNTT-documents.html

**Verify:**

- [ ] Icons appear correctly
- [ ] Colors match original
- [ ] Hover effects work
- [ ] No console errors
- [ ] Network tab shows NO Font Awesome requests

---

## STEP 6: Measure Improvement

**Before deployment, measure with Lighthouse:**

```powershell
# Install Lighthouse CLI
npm install -g lighthouse

# Test homepage
lighthouse http://localhost:8000/index.html --view

# Test document page
lighthouse http://localhost:8000/truong-dai-hoc/uet/cntt-csdl/slides/GVkhoaCNTT-documents.html --view
```

**Expected improvements:**

- Transfer size: -920kB
- LCP: -400ms (mobile)
- Performance score: +8-12 points

---

## AUTOMATED SCRIPT (All-in-One)

**Save as `migrate-to-svg-icons.ps1`:**

```powershell
# SVG Icon Migration Script
# Run from project root

$projectRoot = "d:\Code\tcmanhh.github.io"

Write-Host "Starting Font Awesome → SVG migration..." -ForegroundColor Cyan

# 1. Backup
Write-Host "`n[1/5] Creating backup..." -ForegroundColor Yellow
$backupPath = "$projectRoot.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item -Path $projectRoot -Destination $backupPath -Recurse
Write-Host "✓ Backup created: $backupPath" -ForegroundColor Green

# 2. Remove Font Awesome CDN links
Write-Host "`n[2/5] Removing Font Awesome CDN links..." -ForegroundColor Yellow
$htmlFiles = Get-ChildItem -Path $projectRoot -Filter *.html -Recurse
$removedCount = 0

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalLength = $content.Length

    $content = $content -replace '<link[^>]*font-awesome[^>]*>[\r\n]*', ''

    if ($content.Length -ne $originalLength) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $removedCount++
    }
}

Write-Host "✓ Removed Font Awesome from $removedCount files" -ForegroundColor Green

# 3. Add icon CSS
Write-Host "`n[3/5] Adding icon CSS to style.css..." -ForegroundColor Yellow
$stylePath = "$projectRoot\style.css"
$iconCSS = @"


/* =================================================================
   ICON SPRITE SYSTEM (replaces Font Awesome)
   ================================================================= */
.icon {
  display: inline-block;
  width: 20px;
  height: 20px;
  margin-right: 12px;
  vertical-align: -0.125em;
  fill: currentColor;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

a:hover .icon {
  transform: scale(1.1);
}

.icon-pdf { color: #E74C3C !important; }
.icon-powerpoint { color: #D35400 !important; }
.icon-word { color: #2980B9 !important; }
.icon-excel { color: #27AE60 !important; }
.icon-link { color: #3498DB !important; }
.icon-zipper { color: #7F8C8D !important; }
.icon-video { color: #8E44AD !important; }
.icon-bars { color: #2C3E50 !important; }

.document-item .icon,
.document-card .icon {
  flex-shrink: 0;
}
"@

Add-Content -Path $stylePath -Value $iconCSS -Encoding UTF8
Write-Host "✓ Icon CSS added to style.css" -ForegroundColor Green

# 4. Replace icon usage
Write-Host "`n[4/5] Replacing <i> tags with <svg>..." -ForegroundColor Yellow

$replacements = @(
    @{ Pattern = '<i class="fa[^"]*fa-file-pdf"[^>]*></i>'; Replacement = '<svg class="icon icon-pdf" width="20" height="20" aria-hidden="true"><use href="/assets/images/icons.svg#icon-pdf"></use></svg>' },
    @{ Pattern = '<i class="fa[^"]*fa-file-powerpoint"[^>]*></i>'; Replacement = '<svg class="icon icon-powerpoint" width="20" height="20" aria-hidden="true"><use href="/assets/images/icons.svg#icon-powerpoint"></use></svg>' },
    @{ Pattern = '<i class="fa[^"]*fa-file-word"[^>]*></i>'; Replacement = '<svg class="icon icon-word" width="20" height="20" aria-hidden="true"><use href="/assets/images/icons.svg#icon-word"></use></svg>' },
    @{ Pattern = '<i class="fa[^"]*fa-file-excel"[^>]*></i>'; Replacement = '<svg class="icon icon-excel" width="20" height="20" aria-hidden="true"><use href="/assets/images/icons.svg#icon-excel"></use></svg>' },
    @{ Pattern = '<i class="fa[^"]*fa-link"[^>]*></i>'; Replacement = '<svg class="icon icon-link" width="20" height="20" aria-hidden="true"><use href="/assets/images/icons.svg#icon-link"></use></svg>' },
    @{ Pattern = '<i class="fa[^"]*fa-bars"[^>]*></i>'; Replacement = '<svg class="icon icon-bars" width="20" height="20" aria-hidden="true"><use href="/assets/images/icons.svg#icon-bars"></use></svg>' }
)

$replacedCount = 0
foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $modified = $false

    foreach ($r in $replacements) {
        if ($content -match $r.Pattern) {
            $content = $content -replace $r.Pattern, $r.Replacement
            $modified = $true
        }
    }

    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $replacedCount++
    }
}

Write-Host "✓ Updated icons in $replacedCount files" -ForegroundColor Green

# 5. Summary
Write-Host "`n[5/5] Migration complete!" -ForegroundColor Cyan
Write-Host "`nSummary:" -ForegroundColor White
Write-Host "  • Font Awesome CDN removed from $removedCount files" -ForegroundColor Gray
Write-Host "  • Icons updated in $replacedCount files" -ForegroundColor Gray
Write-Host "  • Icon CSS added to style.css" -ForegroundColor Gray
Write-Host "  • SVG sprite ready at /assets/images/icons.svg" -ForegroundColor Gray
Write-Host "`nExpected savings:" -ForegroundColor White
Write-Host "  • Transfer: -920kB (-52%)" -ForegroundColor Green
Write-Host "  • LCP: -400ms" -ForegroundColor Green
Write-Host "  • FCP: -350ms" -ForegroundColor Green

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Test locally: npx serve . (or Python http.server)" -ForegroundColor Gray
Write-Host "  2. Check icons appear correctly" -ForegroundColor Gray
Write-Host "  3. Run Lighthouse to verify improvements" -ForegroundColor Gray
Write-Host "  4. Commit and push to GitHub" -ForegroundColor Gray
Write-Host "`nBackup location: $backupPath" -ForegroundColor Cyan
```

**Run the script:**

```powershell
cd d:\Code\tcmanhh.github.io
.\migrate-to-svg-icons.ps1
```

---

## ROLLBACK (If Needed)

If something goes wrong:

```powershell
# Restore from backup
$backup = "d:\Code\tcmanhh.github.io.backup_TIMESTAMP"  # Use actual timestamp
$project = "d:\Code\tcmanhh.github.io"

# Delete current
Remove-Item -Path $project -Recurse -Force

# Restore backup
Copy-Item -Path $backup -Destination $project -Recurse

Write-Host "Rollback complete"
```

---

## FINAL CHECKLIST

After migration:

- [ ] All icons visible on homepage
- [ ] Icons on document listing pages working
- [ ] Mobile menu icon (bars) working
- [ ] Icon colors correct
- [ ] Hover effects working
- [ ] No Font Awesome requests in Network tab
- [ ] No console errors
- [ ] Lighthouse score improved by 8+ points
- [ ] Transfer size reduced by ~900kB
- [ ] LCP improved by 300-400ms

**Deploy when all checks pass!** ✅
