# 📄 HTML Templates

Thư mục này chứa các HTML component templates được sử dụng chung.

---

## 🧩 Components

### `header.html`

**Mục đích:** Header template với logo và navigation  
**Được sử dụng trong:** Tất cả pages  
**Chứa:**

- Logo StuShare
- Main navigation menu
- Mobile responsive menu

### `footer.html`

**Mục đích:** Footer template  
**Được sử dụng trong:** Tất cả pages  
**Chứa:**

- Copyright information
- Social links
- Contact info

### `breadcrumb.html`

**Mục đích:** Breadcrumb navigation template  
**Được sử dụng trong:** Deep pages (courses, documents)  
**Chứa:**

- Home link
- Category links
- Current page

---

## 🔧 Cách sử dụng

Templates này được include vào các pages qua JavaScript hoặc build process:

```javascript
// Load header
fetch("/templates/header.html")
  .then((r) => r.text())
  .then((html) => (document.getElementById("header").innerHTML = html));
```

---

## 📝 Lưu ý

- Giữ templates đơn giản và reusable
- Không hard-code data, sử dụng placeholders
- Test responsive trên mobile và desktop
- Cập nhật version khi có thay đổi lớn

---

**Cập nhật:** 2025-10-19
