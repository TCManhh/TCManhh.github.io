/**
 * StuShare Document Icon System
 * Tự động nhận diện và gán icon đẹp, đồng bộ cho tất cả loại file
 */

(function () {
  // Bảng mapping icon theo file extension
  const fileIcons = {
    // Documents
    pdf: {
      icon: "fa-solid fa-file-pdf",
      color: "#E74C3C", // Đỏ đặc trưng PDF
      title: "Xem tài liệu PDF",
    },
    pptx: {
      icon: "fa-solid fa-file-powerpoint",
      color: "#D35400", // Cam đậm cho PowerPoint
      title: "Xem slide PowerPoint",
    },
    ppt: {
      icon: "fa-solid fa-file-powerpoint",
      color: "#D35400",
      title: "Xem slide PowerPoint",
    },
    docx: {
      icon: "fa-solid fa-file-word",
      color: "#2980B9", // Xanh dương Word
      title: "Xem tài liệu Word",
    },
    doc: {
      icon: "fa-solid fa-file-word",
      color: "#2980B9",
      title: "Xem tài liệu Word",
    },
    xlsx: {
      icon: "fa-solid fa-file-excel",
      color: "#27AE60", // Xanh lá Excel
      title: "Xem bảng tính Excel",
    },
    xls: {
      icon: "fa-solid fa-file-excel",
      color: "#27AE60",
      title: "Xem bảng tính Excel",
    },

    // Compressed files
    zip: {
      icon: "fa-solid fa-file-zipper",
      color: "#7F8C8D", // Xám cho file nén
      title: "Tải xuống file nén",
    },
    rar: {
      icon: "fa-solid fa-file-zipper",
      color: "#7F8C8D",
      title: "Tải xuống file nén",
    },
    "7z": {
      icon: "fa-solid fa-file-zipper",
      color: "#7F8C8D",
      title: "Tải xuống file nén",
    },

    // Media files
    mp4: {
      icon: "fa-solid fa-file-video",
      color: "#8E44AD", // Tím cho video
      title: "Xem video",
    },
    avi: {
      icon: "fa-solid fa-file-video",
      color: "#8E44AD",
      title: "Xem video",
    },
    mkv: {
      icon: "fa-solid fa-file-video",
      color: "#8E44AD",
      title: "Xem video",
    },
    mp3: {
      icon: "fa-solid fa-file-audio",
      color: "#16A085", // Xanh ngọc cho audio
      title: "Nghe audio",
    },
    wav: {
      icon: "fa-solid fa-file-audio",
      color: "#16A085",
      title: "Nghe audio",
    },

    // Image files
    jpg: {
      icon: "fa-solid fa-file-image",
      color: "#E67E22", // Cam cho hình ảnh
      title: "Xem hình ảnh",
    },
    jpeg: {
      icon: "fa-solid fa-file-image",
      color: "#E67E22",
      title: "Xem hình ảnh",
    },
    png: {
      icon: "fa-solid fa-file-image",
      color: "#E67E22",
      title: "Xem hình ảnh",
    },
    gif: {
      icon: "fa-solid fa-file-image",
      color: "#E67E22",
      title: "Xem hình ảnh",
    },
    svg: {
      icon: "fa-solid fa-file-image",
      color: "#E67E22",
      title: "Xem hình ảnh",
    },

    // Code files
    js: {
      icon: "fa-brands fa-js",
      color: "#F39C12", // Vàng JavaScript
      title: "Xem mã JavaScript",
    },
    java: {
      icon: "fa-brands fa-java",
      color: "#E74C3C", // Đỏ Java
      title: "Xem mã Java",
    },
    py: {
      icon: "fa-brands fa-python",
      color: "#3498DB", // Xanh Python
      title: "Xem mã Python",
    },
    cpp: {
      icon: "fa-solid fa-file-code",
      color: "#9B59B6", // Tím cho C++
      title: "Xem mã C++",
    },
    c: {
      icon: "fa-solid fa-file-code",
      color: "#34495E",
      title: "Xem mã C",
    },
    html: {
      icon: "fa-brands fa-html5",
      color: "#E67E22", // Cam HTML5
      title: "Xem mã HTML",
    },
    css: {
      icon: "fa-brands fa-css3-alt",
      color: "#3498DB", // Xanh CSS3
      title: "Xem mã CSS",
    },

    // Text files
    txt: {
      icon: "fa-solid fa-file-lines",
      color: "#95A5A6", // Xám nhạt
      title: "Xem file text",
    },
    md: {
      icon: "fa-brands fa-markdown",
      color: "#34495E",
      title: "Xem Markdown",
    },
    csv: {
      icon: "fa-solid fa-file-csv",
      color: "#27AE60",
      title: "Xem file CSV",
    },

    // Special types
    link: {
      icon: "fa-solid fa-link",
      color: "#3498DB", // Xanh cho link
      title: "Mở liên kết",
    },
    website: {
      icon: "fa-solid fa-globe",
      color: "#16A085", // Xanh ngọc cho website
      title: "Truy cập website",
    },
    book: {
      icon: "fa-solid fa-book",
      color: "#8E44AD", // Tím cho sách
      title: "Xem sách",
    },
    notebook: {
      icon: "fa-solid fa-book-open",
      color: "#E67E22", // Cam cho notebook
      title: "Xem notebook",
    },
    exercise: {
      icon: "fa-solid fa-pen-to-square",
      color: "#E74C3C", // Đỏ cho bài tập
      title: "Làm bài tập",
    },
    homework: {
      icon: "fa-solid fa-file-pen",
      color: "#E74C3C",
      title: "Xem bài tập về nhà",
    },
    code: {
      icon: "fa-solid fa-laptop-code",
      color: "#2C3E50",
      title: "Xem mã lập trình",
    },
    atlas: {
      icon: "fa-solid fa-atlas",
      color: "#16A085",
      title: "Xem atlas/bản đồ",
    },
    journal: {
      icon: "fa-solid fa-book-journal-whills",
      color: "#8E44AD",
      title: "Xem tạp chí/journal",
    },
  };

  /**
   * Phát hiện loại file từ URL hoặc text
   */
  function detectFileType(href, text) {
    const lowerHref = (href || "").toLowerCase();
    const lowerText = (text || "").toLowerCase();

    // Check special keywords first - HIGH PRIORITY
    // Priority order: Most specific → Most general

    // Bài tập (HIGHEST PRIORITY - very specific)
    if (
      lowerText.includes("bài tập") ||
      lowerText.includes("bai tap") ||
      lowerText.includes("exercise")
    ) {
      if (
        lowerText.includes("về nhà") ||
        lowerText.includes("ve nha") ||
        lowerText.includes("homework")
      ) {
        return "homework";
      }
      return "exercise";
    }

    // Công cụ / Phần mềm / Tool (HIGH PRIORITY - specific tools/software)
    if (
      lowerText.includes("công cụ") ||
      lowerText.includes("cong cu") ||
      lowerText.includes("tool") ||
      lowerText.includes("phần mềm") ||
      lowerText.includes("phan mem") ||
      lowerText.includes("software") ||
      lowerText.includes("mô phỏng") ||
      lowerText.includes("mo phong")
    ) {
      return "code";
    }

    // Link / Website (HIGH PRIORITY - links to external resources)
    if (
      lowerHref.includes("link") ||
      lowerText.includes("link") ||
      lowerText.includes("liên kết") ||
      lowerText.includes("lien ket") ||
      lowerText.includes("trang web") ||
      lowerText.includes("website") ||
      lowerHref.includes("website") ||
      lowerText.includes("tải") ||
      lowerText.includes("tai") ||
      lowerText.includes("download")
    ) {
      return "link";
    }

    // Slide / Bài giảng (MEDIUM PRIORITY)
    if (
      lowerText.includes("slide") ||
      lowerText.includes("bài giảng") ||
      lowerText.includes("bai giang")
    ) {
      return "pptx";
    }

    // Giáo trình / Sách (MEDIUM PRIORITY)
    if (
      lowerText.includes("giáo trình") ||
      lowerText.includes("giao trinh") ||
      lowerText.includes("sách") ||
      lowerText.includes("sach") ||
      lowerText.includes("book")
    ) {
      return "book";
    }

    // Hướng dẫn (LOWER PRIORITY - can overlap with other types)
    // Only return "book" if no other specific keywords found
    if (
      lowerText.includes("hướng dẫn") ||
      lowerText.includes("huong dan") ||
      lowerText.includes("guide")
    ) {
      // If it's about software/tools, it was already caught above
      // This is for general guides/documentation
      return "book";
    }

    // Môi trường setup (LOWER PRIORITY)
    if (
      lowerText.includes("môi trường") ||
      lowerText.includes("moi truong") ||
      lowerText.includes("chuẩn bị") ||
      lowerText.includes("chuan bi") ||
      lowerText.includes("setup")
    ) {
      return "code";
    }

    // Check file extension in TEXT first (e.g., "C1.pptx", "document.pdf")
    const textExtMatch = lowerText.match(/\.([a-z0-9]+)$/i);
    if (textExtMatch) {
      const ext = textExtMatch[1];
      if (fileIcons[ext]) {
        return ext;
      }
    }

    // Check file extension in HREF
    const match = lowerHref.match(/\.([a-z0-9]+)(?:-viewer|-text)?\.html$/i);
    if (match) {
      const ext = match[1];
      if (fileIcons[ext]) {
        return ext;
      }
    }

    // Check for common patterns in HREF
    if (lowerHref.includes(".pdf")) return "pdf";
    if (lowerHref.includes(".pptx") || lowerHref.includes(".ppt"))
      return "pptx";
    if (lowerHref.includes(".docx") || lowerHref.includes(".doc"))
      return "docx";
    if (lowerHref.includes(".xlsx") || lowerHref.includes(".xls"))
      return "xlsx";
    if (lowerHref.includes(".zip")) return "zip";
    if (lowerHref.includes(".mp4")) return "mp4";

    // Check for common patterns in TEXT
    if (lowerText.includes(".pdf")) return "pdf";
    if (lowerText.includes(".pptx") || lowerText.includes(".ppt"))
      return "pptx";
    if (lowerText.includes(".docx") || lowerText.includes(".doc"))
      return "docx";
    if (lowerText.includes(".xlsx") || lowerText.includes(".xls"))
      return "xlsx";

    // Default for viewer pages
    if (lowerHref.includes("viewer")) {
      if (lowerText.includes("slide") || lowerText.includes("bài giảng")) {
        return "pptx";
      }
      return "pdf";
    }

    return null;
  }

  /**
   * Áp dụng icon cho một phần tử document-item
   */
  function applyIcon(element) {
    const href = element.getAttribute("href") || "";
    const span = element.querySelector("span");
    const text = span ? span.textContent : "";
    let iconElement = element.querySelector("i");

    // Detect file type
    const fileType = detectFileType(href, text);

    if (!fileType || !fileIcons[fileType]) {
      // Use default icon if not detected
      if (!iconElement) {
        iconElement = document.createElement("i");
        iconElement.className = "fa-solid fa-file";
        element.insertBefore(iconElement, element.firstChild);
      }
      iconElement.className = "fa-solid fa-file";
      iconElement.style.color = "#95A5A6";
      element.title = "Xem tài liệu";
      return;
    }

    const iconConfig = fileIcons[fileType];

    // Create or update icon
    if (!iconElement) {
      iconElement = document.createElement("i");
      element.insertBefore(iconElement, element.firstChild);
    }

    iconElement.className = iconConfig.icon;
    iconElement.style.color = iconConfig.color;
    iconElement.style.fontSize = "20px";
    iconElement.style.marginRight = "10px";
    iconElement.style.flexShrink = "0";

    // Set title/tooltip
    element.title = iconConfig.title;
  }

  /**
   * Khởi tạo - tự động áp dụng cho tất cả document-item
   */
  function initDocumentIcons() {
    const documentItems = document.querySelectorAll(".document-item");

    documentItems.forEach((item) => {
      applyIcon(item);
    });

    console.log(
      `✓ StuShare Document Icons: Đã áp dụng icon cho ${documentItems.length} tài liệu`
    );
  }

  // Auto-run when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDocumentIcons);
  } else {
    initDocumentIcons();
  }

  // Export for manual use
  window.StuShareIcons = {
    init: initDocumentIcons,
    applyIcon: applyIcon,
    fileIcons: fileIcons,
  };
})();
