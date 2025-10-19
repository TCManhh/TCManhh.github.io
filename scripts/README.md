# 🛠️ Scripts

Thư mục này chứa các scripts tự động hóa cho dự án.

---

## 📜 PowerShell Scripts

### `bulk_add_comments.ps1`

**Mục đích:** Thêm comments hàng loạt vào các file HTML  
**Sử dụng:**

```powershell
.\scripts\bulk_add_comments.ps1
```

### `migrate-to-svg-icons.ps1`

**Mục đích:** Migrate từ icon cũ sang SVG sprite system  
**Sử dụng:**

```powershell
.\scripts\migrate-to-svg-icons.ps1
```

---

## 🔧 JavaScript Scripts

### `build-search-index.js`

**Mục đích:** Build search index từ HTML files  
**Sử dụng:**

```bash
node scripts/build-search-index.js
```

**Output:** `assets/js/search-data.json`

---

## 📝 Lưu ý

- Chạy scripts từ root directory của project
- Backup files trước khi chạy migration scripts
- Kiểm tra logs sau khi chạy

---

**Cập nhật:** 2025-10-19
