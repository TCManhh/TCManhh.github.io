# 🔄 CẬP NHẬT ĐƯỜNG DẪN SAU KHI TỔ CHỨC LẠI

**Ngày thực hiện:** 2025-10-19  
**Liên quan đến:** File reorganization

---

## 📋 BẢNG ÁNH XẠ ĐƯỜNG DẪN

### Documentation Files

| Đường dẫn CŨ                          | Đường dẫn MỚI                                          |
| ------------------------------------- | ------------------------------------------------------ |
| `/PERFORMANCE_OPTIMIZATION_REPORT.md` | `/docs/performance/PERFORMANCE_OPTIMIZATION_REPORT.md` |
| `/OPTIMIZATION_CHECKLIST_V2.md`       | `/docs/performance/OPTIMIZATION_CHECKLIST_V2.md`       |
| `/PERFORMANCE_AUDIT_FIXES.md`         | `/docs/performance/PERFORMANCE_AUDIT_FIXES.md`         |
| `/WATERFALL_ANALYSIS.md`              | `/docs/performance/WATERFALL_ANALYSIS.md`              |
| `/performance-audit-results.json`     | `/docs/performance/performance-audit-results.json`     |
| `/SEARCH_PERFORMANCE_TEST.html`       | `/docs/performance/SEARCH_PERFORMANCE_TEST.html`       |

### Search Files

| Đường dẫn CŨ                         | Đường dẫn MỚI                                    |
| ------------------------------------ | ------------------------------------------------ |
| `/SEARCH_FIX_DOCUMENTATION.md`       | `/docs/search/SEARCH_FIX_DOCUMENTATION.md`       |
| `/SEARCH_FIX_SUMMARY.md`             | `/docs/search/SEARCH_FIX_SUMMARY.md`             |
| `/SEARCH_QUICK_REFERENCE.md`         | `/docs/search/SEARCH_QUICK_REFERENCE.md`         |
| `/SEARCH_BEFORE_AFTER_COMPARISON.md` | `/docs/search/SEARCH_BEFORE_AFTER_COMPARISON.md` |
| `/search-results.html`               | `/docs/search/search-results.html`               |

### Icon Files

| Đường dẫn CŨ                    | Đường dẫn MỚI                              |
| ------------------------------- | ------------------------------------------ |
| `/ICON_SYSTEM_DOCUMENTATION.md` | `/docs/icons/ICON_SYSTEM_DOCUMENTATION.md` |
| `/ICON_OPTIMIZATION_SUMMARY.md` | `/docs/icons/ICON_OPTIMIZATION_SUMMARY.md` |
| `/QUICKSTART_SVG_MIGRATION.md`  | `/docs/icons/QUICKSTART_SVG_MIGRATION.md`  |

### Audit Files

| Đường dẫn CŨ                  | Đường dẫn MỚI                            |
| ----------------------------- | ---------------------------------------- |
| `/AUDIT_EXECUTIVE_SUMMARY.md` | `/docs/audit/AUDIT_EXECUTIVE_SUMMARY.md` |

### Template Files

| Đường dẫn CŨ       | Đường dẫn MỚI                |
| ------------------ | ---------------------------- |
| `/header.html`     | `/templates/header.html`     |
| `/footer.html`     | `/templates/footer.html`     |
| `/breadcrumb.html` | `/templates/breadcrumb.html` |

### Script Files

| Đường dẫn CŨ                | Đường dẫn MỚI                       |
| --------------------------- | ----------------------------------- |
| `/bulk_add_comments.ps1`    | `/scripts/bulk_add_comments.ps1`    |
| `/migrate-to-svg-icons.ps1` | `/scripts/migrate-to-svg-icons.ps1` |
| `/build-search-index.js`    | `/scripts/build-search-index.js`    |

---

## ✅ FILES ĐÃ CẬP NHẬT

### 1. `index.html` ✅

**Thay đổi:**

- `/search-results.html` → `/docs/search/search-results.html`

**Locations:**

- Line 73: Schema.org structured data
- Line 357: JavaScript search redirect

**Status:** ✅ UPDATED

### 2. `scripts/build-search-index.js` ✅

**Thay đổi:**

- Line 11: `breadcrumb.html` → `templates/breadcrumb.html`
- Line 158-160: Updated ignore list:
  - `header.html` → `templates/header.html`
  - `footer.html` → `templates/footer.html`
  - `breadcrumb.html` → `templates/breadcrumb.html`
  - `search-results.html` → `docs/search/search-results.html`

**Status:** ✅ UPDATED

### 3. Documentation Files

**Status:** ✅ NO UPDATE NEEDED

Các files sau **KHÔNG** cần update vì chúng sử dụng relative paths hoặc đã được di chuyển:

- ✅ `docs/README.md` - Đã sử dụng relative paths
- ✅ `scripts/README.md` - Đã sử dụng relative paths
- ✅ `templates/README.md` - Đã sử dụng relative paths
- ✅ `docs/FILE_STRUCTURE_MAP.md` - Đã cập nhật trong file
- ✅ `PROJECT_OVERVIEW.md` - Đã cập nhật trong file
- ✅ `REORGANIZATION_SUMMARY.md` - Đã cập nhật trong file

### 3. HTML Course Pages (Không cần update)

Các trang trong `/truong-dai-hoc/` **KHÔNG** có tham chiếu đến files đã di chuyển.

---

## 🔍 CÁCH TÌM VÀ THAY THẾ

### Nếu bạn cần update thủ công:

#### Trong HTML files:

```html
<!-- CŨ -->
<a href="/search-results.html">Kết quả tìm kiếm</a>

<!-- MỚI -->
<a href="/docs/search/search-results.html">Kết quả tìm kiếm</a>
```

#### Trong JavaScript:

```javascript
// CŨ
window.location.href = "/search-results.html?q=" + query;

// MỚI
window.location.href = "/docs/search/search-results.html?q=" + query;
```

#### Trong Markdown:

```markdown
<!-- CŨ -->

[Performance Report](PERFORMANCE_OPTIMIZATION_REPORT.md)

<!-- MỚI -->

[Performance Report](docs/performance/PERFORMANCE_OPTIMIZATION_REPORT.md)
```

### PowerShell Search & Replace:

```powershell
# Tìm tất cả files chứa đường dẫn cũ
Get-ChildItem -Recurse -Include *.html,*.md |
  Select-String "search-results\.html" |
  Select-Object Path -Unique

# Replace trong file cụ thể
$content = Get-Content "file.html" -Raw
$content = $content -replace '/search-results\.html', '/docs/search/search-results.html'
$content | Out-File "file.html" -Encoding UTF8
```

---

## 🛠️ SCRIPT TỰ ĐỘNG

Đã tạo script: `scripts/update-paths.ps1`

**Cách sử dụng:**

```powershell
cd d:\Code\tcmanhh.github.io
.\scripts\update-paths.ps1
```

**Script sẽ:**

1. Scan tất cả HTML và MD files
2. Tìm đường dẫn cũ
3. Thay thế bằng đường dẫn mới
4. Backup files trước khi update
5. Report kết quả

---

## ⚠️ LƯU Ý QUAN TRỌNG

### 1. Relative vs Absolute Paths

**Trong cùng folder:**

```markdown
<!-- Nếu file đang ở /docs/search/ -->

[Link đến file cùng folder](SEARCH_FIX_SUMMARY.md) ✅ OK
```

**Từ root:**

```markdown
<!-- Từ root hoặc bất kỳ đâu -->

[Link absolute](/docs/search/SEARCH_FIX_SUMMARY.md) ✅ OK
```

### 2. GitHub Pages URLs

GitHub Pages sẽ serve files từ root, nên:

- `/docs/search/search-results.html` → `https://tcmanhh.github.io/docs/search/search-results.html`
- Đường dẫn absolute bắt đầu bằng `/` sẽ work
- Relative paths chỉ work trong cùng folder

### 3. Template Loading (JavaScript)

Nếu có code load templates động:

```javascript
// CŨ
fetch('/header.html').then(...)

// MỚI
fetch('/templates/header.html').then(...)
```

---

## 📊 THỐNG KÊ

### Files cần update:

- ✅ **HTML files**: 1 file updated (index.html)
- ✅ **JavaScript files**: 1 file updated (scripts/build-search-index.js)
- ✅ **Markdown files**: 0 files (dùng relative paths)

### Replacements made:

- **Total**: 6 replacements
  - `index.html`: 2 locations (search-results.html paths)
  - `scripts/build-search-index.js`: 4 locations (ignore list + breadcrumbMapPath)

---

## ✅ CHECKLIST

### Pre-Update:

- [x] Backup files quan trọng
- [x] Tạo danh sách ánh xạ đường dẫn
- [x] Xác định files cần update

### Update Process:

- [x] Update `index.html` (search-results.html paths)
- [x] Verify documentation files (đã dùng relative paths)
- [x] Check course pages (không có refs đến moved files)

### Post-Update:

- [x] Test search functionality
- [x] Verify all links work
- [x] Update documentation
- [x] Update build-search-index.js
- [ ] Commit changes
- [ ] Test on GitHub Pages

---

## 🧪 TESTING

### Test search functionality:

1. Mở `index.html` trong browser
2. Nhập query vào search box
3. Click search hoặc Enter
4. Verify redirect đến `/docs/search/search-results.html?q=...`

### Test documentation links:

1. Mở `PROJECT_OVERVIEW.md`
2. Click links đến docs
3. Verify files mở đúng location

---

## 🚀 DEPLOYMENT

Sau khi update paths:

```bash
# 1. Test locally
start index.html

# 2. Verify search works
# Enter query, check redirect

# 3. Commit changes
git add .
git commit -m "fix: update file paths after reorganization"

# 4. Push to GitHub
git push origin main

# 5. Wait ~1-2 minutes for GitHub Pages deploy

# 6. Test on production
# Visit: https://tcmanhh.github.io
```

---

## 📝 NOTES

### Files KHÔNG cần update:

1. **Course HTML pages** (`/truong-dai-hoc/**/*.html`)

   - Không có tham chiếu đến moved files
   - Paths vẫn valid

2. **Asset files** (`/assets/**`)

   - Không bị di chuyển
   - Paths không đổi

3. **Config files** (`sitemap.xml`, `robots.txt`)
   - Không chứa refs đến moved files

### Lý do ít files cần update:

✅ **Project structure tốt từ đầu:**

- Các HTML pages không hard-code paths đến docs
- Documentation dùng relative paths
- Clear separation of concerns

✅ **Chỉ index.html search cần update:**

- Search là feature chính duy nhất link đến moved file
- 2 locations: Schema markup + JS redirect

---

## 🎯 SUMMARY

**Tổng files updated:** 2 (index.html, scripts/build-search-index.js)  
**Tổng replacements:** 6 locations  
**Breaking changes:** 0  
**Status:** ✅ COMPLETED

Việc update đường dẫn rất đơn giản vì:

1. ✅ Project structure tốt
2. ✅ Sử dụng relative paths trong docs
3. ✅ Ít coupling giữa files
4. ✅ Chỉ index.html và build script cần update

---

**Cập nhật:** 2025-10-19  
**Tác giả:** tcmanhh
