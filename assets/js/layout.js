// File: assets/js/layout.js

/**
 * Tải và khởi tạo các thành phần layout chung (header, footer).
 */
async function initializeLayout() {
  const headerPlaceholder = document.getElementById("header-placeholder");
  const footerPlaceholder = document.getElementById("footer-placeholder");

  // Tải header và footer song song
  await Promise.all([
    (async () => {
      if (headerPlaceholder) {
        try {
          const response = await fetch("/header.html");
          const data = await response.text();
          headerPlaceholder.outerHTML = data;
          initializeHeaderFunctionality();
        } catch (error) {
          console.error("Lỗi khi tải header:", error);
        }
      }
    })(),
    (async () => {
      if (footerPlaceholder) {
        try {
          const response = await fetch("/footer.html");
          const data = await response.text();
          footerPlaceholder.innerHTML = data;
        } catch (error) {
          console.error("Lỗi khi tải footer:", error);
        }
      }
    })(),
  ]);
}

/**
 * Chạy các script cần thiết cho trang.
 */
function runPageSpecificScripts() {
  const breadcrumbPlaceholder = document.getElementById(
    "breadcrumb-placeholder"
  );
  if (breadcrumbPlaceholder) {
    fetch("/breadcrumb.html")
      .then((response) => response.text())
      .then((data) => {
        breadcrumbPlaceholder.innerHTML = data;
        const scriptTag = breadcrumbPlaceholder.querySelector("script");
        if (scriptTag) {
          const newScript = document.createElement("script");
          newScript.textContent = scriptTag.textContent;
          document.body.appendChild(newScript).remove();
        }
      });
  }

  loadSecondaryComponents();
  setActiveNavLink();
  initializeDocumentSections();
  updateBreadcrumb();
}

/**
 * Tải các thành phần phụ (bình luận, ghi chú tác giả).
 */
function loadSecondaryComponents() {
  const mainElement = document.querySelector("main");
  if (!mainElement) return;

  Promise.all([
    fetch("/assets/html/author-respect.html").then((res) =>
      res.ok ? res.text() : ""
    ),
    fetch("/assets/html/comments.html").then((res) =>
      res.ok ? res.text() : ""
    ),
  ])
    .then(([respectHTML, commentsHTML]) => {
      if (commentsHTML) {
        if (respectHTML) {
          mainElement.insertAdjacentHTML("beforeend", respectHTML);
        }
        mainElement.insertAdjacentHTML("beforeend", commentsHTML);
        const script = document.createElement("script");
        script.src = "/assets/js/comments.js";
        script.defer = true;
        document.body.appendChild(script);
      }
    })
    .catch((err) => console.warn("Lỗi khi tải các module phụ:", err));
}

/**
 * Khởi tạo chức năng cho header (scroll, mobile nav).
 */
function initializeHeaderFunctionality() {
  const header = document.querySelector(".header");
  if (!header) return;

  function toggleHeaderSize() {
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }

  toggleHeaderSize();
  window.addEventListener("scroll", toggleHeaderSize, { passive: true });

  const mobileNavToggle = document.querySelector(".mobile-nav-toggle");
  if (mobileNavToggle) {
    mobileNavToggle.addEventListener("click", function () {
      header.classList.toggle("mobile-nav-open");
    });
  }
}

/**
 * Khởi tạo chức năng đóng/mở cho các section tài liệu.
 */
function initializeDocumentSections() {
  const sectionHeaders = document.querySelectorAll(
    ".document-section .section-header"
  );
  if (sectionHeaders.length === 0) return;

  const sections = document.querySelectorAll(".document-section");
  sections.forEach((section) => {
    if (!section.classList.contains("active")) {
      section.classList.add("active");
    }
  });

  sectionHeaders.forEach((header) => {
    const newHeader = header.cloneNode(true);
    header.parentNode.replaceChild(newHeader, header);
    newHeader.addEventListener("click", () => {
      const section = newHeader.parentElement;
      section.classList.toggle("active");
    });
  });
}

/**
 * Đánh dấu link đang hoạt động trên thanh điều hướng.
 */
function setActiveNavLink() {
  const currentPath = window.location.pathname.replace(/\/$/, "");
  const navLinks = document.querySelectorAll(".header .main-nav a");

  navLinks.forEach((link) => {
    const linkPath = new URL(link.href).pathname
      .replace(/\/$/, "")
      .replace(/\.html$/, "");
    link.classList.remove("active");
    if (linkPath === "/index" || linkPath === "") {
      if (
        currentPath === "/index" ||
        currentPath === "" ||
        currentPath === "/index.html"
      ) {
        link.classList.add("active");
      }
    } else if (currentPath.startsWith(linkPath)) {
      link.classList.add("active");
    }
  });
}

/**
 * Xử lý hiệu ứng chuyển trang.
 */
function handlePageTransition(event) {
  const link = event.target.closest("a");

  if (
    !link ||
    link.target === "_blank" ||
    event.ctrlKey ||
    event.metaKey ||
    new URL(link.href).origin !== window.location.origin ||
    link.href.includes("#") ||
    link.hasAttribute("download") ||
    link.pathname === window.location.pathname
  ) {
    return;
  }

  event.preventDefault();

  const destination = link.href;
  const mainContent = document.querySelector("main");

  if (mainContent) {
    // THAY ĐỔI: Thêm class fade-out để kích hoạt transition mờ đi
    mainContent.classList.add("fade-out-content");
  }

  setTimeout(() => {
    window.location.href = destination;
  }, 250); // Thời gian này phải khớp với transition trong CSS
}

// === KHỞI TẠO ===
document.addEventListener("DOMContentLoaded", () => {
  initializeLayout().then(() => {
    runPageSpecificScripts();

    // [FIX] Kích hoạt hiệu ứng fade-in cho nội dung chính khi tải trang lần đầu
    const mainContent = document.querySelector("main");
    if (mainContent) {
      // Dùng một timeout nhỏ để đảm bảo trình duyệt có thời gian áp dụng
      // opacity: 0 ban đầu trước khi chuyển sang opacity: 1,
      // tạo ra hiệu ứng mượt mà.
      setTimeout(() => {
        mainContent.classList.add("fade-in-content");
      }, 50); // 50ms là đủ
    }
  });

  document.body.addEventListener("click", handlePageTransition);
});
