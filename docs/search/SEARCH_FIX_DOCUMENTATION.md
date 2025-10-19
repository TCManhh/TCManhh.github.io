# 🔍 Tài liệu: Sửa lỗi chức năng Tìm kiếm Môn học - uet.html

## 📋 TÓM TẮT VẤN ĐỀ

### ❌ Lỗi trước khi sửa:

1. **Không có mã JavaScript xử lý tìm kiếm** → Gõ từ khóa nhưng không có gì xảy ra
2. **Không có event listener** cho input `#subjectSearchInput`
3. **Không có hàm filter** để ẩn/hiện các `.subject-card`
4. **Không hỗ trợ tiếng Việt** có dấu/không dấu (ví dụ: "co so du lieu" không tìm thấy "Cơ sở dữ liệu")

### ✅ Đã sửa:

- ✅ Thêm hệ thống tìm kiếm hoàn chỉnh vào `uet.html`
- ✅ Hỗ trợ tiếng Việt có dấu + không dấu (normalize NFD)
- ✅ Không phân biệt hoa/thường
- ✅ Tìm theo tên môn học + mã môn học (INT2202, INT2210...)
- ✅ Debounce 300ms tránh lag khi gõ nhanh
- ✅ Hiển thị thông báo "Không tìm thấy kết quả"
- ✅ Ẩn/hiện title khoa khi không có môn học nào khớp

---

## 🛠️ CHI TIẾT MÃ ĐÃ THÊM

### 📍 Vị trí: `/truong-dai-hoc/uet.html` (dòng 145-185)

```javascript
/**
 * 🔍 HỆ THỐNG TÌM KIẾM MÔN HỌC
 * Tính năng:
 * - Không phân biệt hoa/thường
 * - Hỗ trợ tiếng Việt có dấu + không dấu
 * - Tìm theo tên môn học + mã môn (INT2202, INT2210...)
 * - Debounce 300ms tránh lag
 * - Hiển thị thông báo "Không tìm thấy"
 */

// 1️⃣ Hàm loại bỏ dấu tiếng Việt
function removeVietnameseTones(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

// 2️⃣ Hàm tìm kiếm môn học
function filterSubjects() {
  const searchInput = document
    .getElementById("subjectSearchInput")
    .value.trim();
  const searchKeyword = removeVietnameseTones(searchInput.toLowerCase());

  // Lấy tất cả các khoa (faculty sections)
  const facultySections = document.querySelectorAll(
    ".subjects-list .container > h2.faculty-title"
  );

  facultySections.forEach((facultyTitle) => {
    // Tìm subject-grid và no-results-message tương ứng với khoa này
    const subjectGrid = facultyTitle.nextElementSibling.classList.contains(
      "no-results-message"
    )
      ? facultyTitle.nextElementSibling.nextElementSibling
      : facultyTitle.nextElementSibling;

    const noResultsMsg = facultyTitle.nextElementSibling.classList.contains(
      "no-results-message"
    )
      ? facultyTitle.nextElementSibling
      : null;

    if (!subjectGrid || !subjectGrid.classList.contains("subject-grid")) {
      return; // Bỏ qua nếu không tìm thấy grid
    }

    const subjectCards = subjectGrid.querySelectorAll(".subject-card");
    let visibleCount = 0;

    subjectCards.forEach((card) => {
      // Lấy tên môn học và mã môn
      const subjectName = card.querySelector("h3")?.textContent || "";
      const subjectCode =
        card.querySelector(".subject-code")?.textContent || "";

      // Chuẩn hóa để so sánh
      const normalizedName = removeVietnameseTones(subjectName.toLowerCase());
      const normalizedCode = subjectCode.toLowerCase();

      // Kiểm tra khớp từ khóa
      if (
        searchKeyword === "" ||
        normalizedName.includes(searchKeyword) ||
        normalizedCode.includes(searchKeyword)
      ) {
        card.style.display = ""; // Hiện thẻ
        visibleCount++;
      } else {
        card.style.display = "none"; // Ẩn thẻ
      }
    });

    // Hiển thị thông báo "Không tìm thấy" nếu không có kết quả
    if (noResultsMsg) {
      if (visibleCount === 0 && searchKeyword !== "") {
        noResultsMsg.style.display = "block";
      } else {
        noResultsMsg.style.display = "none";
      }
    }

    // Ẩn/hiện title của khoa nếu không có môn học nào
    if (visibleCount === 0 && searchKeyword !== "") {
      facultyTitle.style.display = "none";
    } else {
      facultyTitle.style.display = "";
    }
  });
}

// 3️⃣ Debounce để tránh gọi hàm quá nhiều khi gõ nhanh
let searchTimeout;
function debounceSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(filterSubjects, 300);
}

// 4️⃣ Khởi tạo tìm kiếm khi DOM đã load
document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("subjectSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", debounceSearch);
    searchInput.addEventListener("keyup", function (event) {
      if (event.key === "Enter") {
        clearTimeout(searchTimeout);
        filterSubjects();
      }
    });
  }
});
```

---

## 🎯 CÁCH HOẠT ĐỘNG

### 1. **Loại bỏ dấu tiếng Việt** (`removeVietnameseTones`)

- Sử dụng `normalize("NFD")` để tách ký tự và dấu
- Xóa các dấu (á, à, ả, ã, ạ → a)
- Xử lý đặc biệt cho đ/Đ

**Ví dụ:**

```javascript
removeVietnameseTones("Cơ sở dữ liệu"); // → "Co so du lieu"
removeVietnameseTones("Lập trình đối tượng"); // → "Lap trinh doi tuong"
```

### 2. **Tìm kiếm thông minh** (`filterSubjects`)

- Lấy từ khóa từ input → chuẩn hóa (lowercase + loại dấu)
- Duyệt qua tất cả các khoa (CNTT, Điện tử...)
- Với mỗi môn học:
  - Lấy tên môn + mã môn (INT2202, INT2210...)
  - Chuẩn hóa để so sánh
  - Nếu khớp → hiện thẻ, không khớp → ẩn
- Đếm số môn học còn hiển thị:
  - Nếu = 0 → hiện thông báo "Không tìm thấy"
  - Ẩn luôn title khoa nếu không có môn nào

### 3. **Debounce** (`debounceSearch`)

- Chờ người dùng gõ xong 300ms mới tìm kiếm
- Tránh gọi hàm liên tục khi gõ nhanh → giảm lag

### 4. **Khởi tạo**

- Lắng nghe sự kiện `input` (gõ từng ký tự)
- Lắng nghe sự kiện `Enter` (tìm ngay lập tức)

---

## 🧪 KIỂM TRA HOẠT ĐỘNG

### Test Case 1: Tìm có dấu

```
Gõ: "Cơ sở dữ liệu"
Kết quả: ✅ Hiện "Cơ sở dữ liệu (INT2202)"
```

### Test Case 2: Tìm không dấu

```
Gõ: "co so du lieu"
Kết quả: ✅ Hiện "Cơ sở dữ liệu (INT2202)"
```

### Test Case 3: Tìm theo mã môn

```
Gõ: "INT2210"
Kết quả: ✅ Hiện "Cấu Trúc Dữ Liệu và Giải Thuật (INT2210)"
```

### Test Case 4: Tìm hoa/thường

```
Gõ: "LẬP TRÌNH"
Kết quả: ✅ Hiện "Lập trình hướng đối tượng (INT2204)"
```

### Test Case 5: Không tìm thấy

```
Gõ: "Machine Learning"
Kết quả: ✅ Hiện thông báo "Không tìm thấy môn học nào phù hợp với từ khóa của bạn."
```

### Test Case 6: Xóa từ khóa

```
Gõ: "csdl" → Xóa hết
Kết quả: ✅ Hiện lại tất cả môn học
```

---

## 🔧 CÁCH KIỂM TRA NHANH

1. Mở file trong trình duyệt:

   ```
   file:///d:/Code/tcmanhh.github.io/truong-dai-hoc/uet.html
   ```

2. Hoặc dùng Live Server (VS Code):

   ```
   Click chuột phải vào uet.html → "Open with Live Server"
   ```

3. Thử các test case trên

4. Mở Console (F12) để xem log lỗi (nếu có)

---

## 📁 CÁC FILE LIÊN QUAN

| File                      | Vai trò                                                             |
| ------------------------- | ------------------------------------------------------------------- |
| `truong-dai-hoc/uet.html` | ✅ **Đã sửa** - Chứa HTML + JS tìm kiếm                             |
| `style.css`               | Chứa CSS `.no-results-message`, `.subject-card`, `.filter-bar`      |
| `assets/js/layout.js`     | Xử lý layout chung (header, footer, breadcrumb) - **KHÔNG cần sửa** |

---

## 🚀 CẢI TIẾN TRONG TƯƠNG LAI (Tùy chọn)

### 1. Highlight từ khóa trong kết quả

```javascript
// Thêm vào hàm filterSubjects
const regex = new RegExp(`(${searchKeyword})`, "gi");
card.querySelector("h3").innerHTML = subjectName.replace(
  regex,
  "<mark>$1</mark>"
);
```

### 2. Tìm kiếm mờ (fuzzy search)

```javascript
// Thêm thư viện Fuse.js để tìm gần đúng
// Ví dụ: "cs du lieu" → tìm thấy "Cơ sở dữ liệu"
```

### 3. Lưu lịch sử tìm kiếm

```javascript
// Lưu vào localStorage
localStorage.setItem("recent_searches", JSON.stringify(searches));
```

### 4. Autocomplete/Suggest

```javascript
// Hiện danh sách gợi ý khi gõ
<datalist id="suggestions">
  <option value="Cơ sở dữ liệu">
  <option value="Kiến trúc máy tính">
</datalist>
```

---

## 📞 HỖ TRỢ

Nếu gặp lỗi, kiểm tra:

1. Console (F12) có lỗi JavaScript không?
2. Input `#subjectSearchInput` có tồn tại không? (dùng `document.getElementById("subjectSearchInput")`)
3. CSS `.no-results-message { display: none; }` có đúng không?
4. Cấu trúc HTML có thay đổi không? (khoa mới, môn học mới)

---

## ✅ CHECKLIST HOÀN THÀNH

- [x] Sửa lỗi không tìm được môn học
- [x] Hỗ trợ tiếng Việt có dấu/không dấu
- [x] Không phân biệt hoa/thường
- [x] Tìm theo tên + mã môn
- [x] Debounce tránh lag
- [x] Hiển thị "Không tìm thấy"
- [x] Ẩn title khoa khi không có kết quả
- [x] Viết tài liệu hướng dẫn

---

**Ngày tạo:** 2025-10-19  
**Tác giả:** GitHub Copilot  
**Phiên bản:** 1.0
