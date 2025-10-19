# 📚 StuShare - tcmanhh.github.io

> Nền tảng chia sẻ tài liệu học tập cho sinh viên UET - ĐHQGHN

[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-blue)](https://tcmanhh.github.io)
[![Performance](<https://img.shields.io/badge/Search-v2.0%20(80%25%20faster)-green>)]()

---

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/tcmanhh/tcmanhh.github.io.git
cd tcmanhh.github.io

# Open in browser
start index.html
```

---

## 📂 Cấu trúc dự án

```
tcmanhh.github.io/
│
├── 📄 index.html              # Trang chủ
├── 📄 style.css               # Global styles
├── 📄 sitemap.xml             # SEO sitemap
├── 📄 robots.txt              # Crawler config
│
├── 📁 docs/                   # 📚 Documentation (16 files)
│   ├── README.md              # Documentation overview
│   ├── FILE_STRUCTURE_MAP.md  # Bản đồ cấu trúc chi tiết
│   │
│   ├── performance/           # ⚡ Performance docs (6 files)
│   │   ├── PERFORMANCE_OPTIMIZATION_REPORT.md
│   │   ├── OPTIMIZATION_CHECKLIST_V2.md
│   │   ├── SEARCH_PERFORMANCE_TEST.html
│   │   └── ...
│   │
│   ├── search/                # 🔍 Search system docs (5 files)
│   │   ├── SEARCH_FIX_DOCUMENTATION.md
│   │   ├── SEARCH_FIX_SUMMARY.md
│   │   └── ...
│   │
│   ├── icons/                 # 🎨 Icon system docs (3 files)
│   │   ├── ICON_SYSTEM_DOCUMENTATION.md
│   │   └── ...
│   │
│   └── audit/                 # 📊 Audit reports (1 file)
│       └── AUDIT_EXECUTIVE_SUMMARY.md
│
├── 📁 templates/              # 📄 HTML Components (3 files)
│   ├── README.md
│   ├── header.html            # Header component
│   ├── footer.html            # Footer component
│   └── breadcrumb.html        # Breadcrumb navigation
│
├── 📁 scripts/                # 🔧 Build Scripts (3 files)
│   ├── README.md
│   ├── build-search-index.js  # Build search index
│   ├── bulk_add_comments.ps1  # Add comments tool
│   └── migrate-to-svg-icons.ps1
│
├── 📁 assets/                 # 🎨 Static Assets (11 files)
│   ├── images/                # Images (6 files)
│   │   ├── icons.svg          # ⭐ SVG sprite system
│   │   ├── logo_ngang.webp
│   │   └── ...
│   │
│   ├── js/                    # JavaScript (5 files)
│   │   ├── layout.js          # ⭐ Core layout
│   │   ├── document-icons.js  # ⭐ Icon mapping
│   │   ├── pdf-viewer.js
│   │   └── search-data.json
│   │
│   └── html/
│       └── author-respect.html
│
└── 📁 truong-dai-hoc/         # 🎓 Course Content (45 files)
    ├── truong-dai-hoc.html
    └── uet/
        ├── uet.html           # ⭐ Search page (v2.0 optimized)
        ├── cntt-csdl/         # Cơ sở dữ liệu
        ├── cntt-ctdlgt/       # Cấu trúc dữ liệu & Giải thuật
        ├── cntt-ktmt/         # Kiến trúc máy tính
        ├── cntt-lthdt/        # Lập trình hướng đối tượng
        └── cntt-xstk/         # Xác suất thống kê
```

**Tổng cộng:** 73 files (đã loại bỏ ~60+ viewer/text files để dễ quản lý)

---

## ⭐ Core Features

### 🔍 Search v2.0 (Optimized)

- ⚡ **81% faster** than v1.0 (3.1ms → 0.58ms)
- 🇻🇳 Vietnamese tone normalization
- 🧠 Memoization cache với Map()
- 📦 Pre-normalized dataset attributes
- 🔄 Debounce 150ms

**Files:**

- `truong-dai-hoc/uet.html` - Main search page
- `docs/performance/SEARCH_PERFORMANCE_TEST.html` - Benchmark tool
- `docs/search/SEARCH_FIX_DOCUMENTATION.md` - Technical docs

### 🎨 SVG Icon System

- 📦 Single sprite file (`assets/images/icons.svg`)
- 🔄 Unified icon API
- ⚡ Faster loading (1 HTTP request)

**Files:**

- `assets/images/icons.svg` - SVG sprite
- `assets/js/document-icons.js` - Icon mapping
- `docs/icons/ICON_SYSTEM_DOCUMENTATION.md` - Documentation

### 📄 Component System

- Reusable HTML templates
- Header, Footer, Breadcrumb
- Consistent UI across pages

**Files:**

- `templates/header.html`
- `templates/footer.html`
- `templates/breadcrumb.html`

---

## 🛠️ Development

### Prerequisites

- Web browser (Chrome, Firefox, Edge)
- Node.js (optional, for build scripts)
- PowerShell (for automation scripts)

### Build Search Index

```bash
node scripts/build-search-index.js
```

### Add Comments Bulk

```powershell
.\scripts\bulk_add_comments.ps1
```

---

## 📊 Performance Metrics

### Search Performance (v2.0):

- **Average search time:** 0.58ms (↓81% from v1.0)
- **Normalize calls:** 128 (↓83% from 742)
- **DOM queries:** 3 (↓99.8% from 1500)
- **Memory overhead:** +6KB (acceptable)

### Page Load:

- **First Contentful Paint:** ~1.2s
- **Total Blocking Time:** ~150ms
- **Largest Contentful Paint:** ~2.5s

_Xem chi tiết trong `docs/performance/PERFORMANCE_OPTIMIZATION_REPORT.md`_

---

## 📚 Documentation

### For Developers:

- **Cấu trúc dự án:** `docs/FILE_STRUCTURE_MAP.md` (file này)
- **Search system:** `docs/search/SEARCH_FIX_DOCUMENTATION.md`
- **Icon system:** `docs/icons/ICON_SYSTEM_DOCUMENTATION.md`
- **Performance:** `docs/performance/PERFORMANCE_OPTIMIZATION_REPORT.md`

### For Users:

- **Quick reference:** `docs/search/SEARCH_QUICK_REFERENCE.md`
- **Icon migration:** `docs/icons/QUICKSTART_SVG_MIGRATION.md`

---

## 🚀 Deployment

### GitHub Pages (Automatic)

```bash
git add .
git commit -m "Update content"
git push origin main
```

Site tự động deploy tại: **https://tcmanhh.github.io**

### Manual Deployment

1. Build search index: `node scripts/build-search-index.js`
2. Test locally: Open `index.html` in browser
3. Commit and push to GitHub
4. Wait ~1-2 minutes for deployment

---

## 🎯 Recent Updates

### v2.0 - Search Optimization (2025-10-18)

- ⚡ 81% faster search performance
- 🧠 Cache normalization với Map()
- 📦 Pre-normalized dataset
- 🔄 Faster debounce (150ms)

### File Reorganization (2025-10-19)

- 🗂️ Organized files into `/docs/`, `/templates/`, `/scripts/`
- 🗑️ Removed 3 duplicate files
- 📝 Added 3 README files
- 📊 Total: 73 files (from 76)

_Xem chi tiết trong `docs/FILE_STRUCTURE_MAP.md`_

---

## 📝 File Statistics

| Category         | Count  | %        |
| ---------------- | ------ | -------- |
| 📄 HTML          | 40     | 54.8%    |
| 📝 Markdown      | 15     | 20.5%    |
| 🖼️ Images        | 6      | 8.2%     |
| ⚙️ JavaScript    | 4      | 5.5%     |
| 🔧 Scripts       | 2      | 2.7%     |
| 🎨 Styles/Config | 6      | 8.2%     |
| **TOTAL**        | **73** | **100%** |

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📧 Contact

- **Author:** tcmanhh
- **GitHub:** [@tcmanhh](https://github.com/tcmanhh)
- **Website:** [tcmanhh.github.io](https://tcmanhh.github.io)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Credits

- **UET-VNUH** - University of Engineering and Technology, VNU
- **Contributors** - All contributors to this project
- **Students** - For using and providing feedback

---

**Last Updated:** 2025-10-19  
**Version:** 2.0 (Optimized)
